import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationRunnerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.runPendingMigrations();
    } catch (err) {
      this.logger.error(`Falha crítica no runner de migrations: ${(err as Error).message}`);
      throw err;
    }
  }

  private async runPendingMigrations(): Promise<void> {
    await this.ensureMigrationsTable();

    // __dirname funciona tanto em ts-node (src/core/database/) quanto em dist (dist/core/database/)
    const migrationsDir = path.resolve(__dirname, '../../../../database/migrations');

    if (!fs.existsSync(migrationsDir)) {
      this.logger.warn(`Diretório de migrations não encontrado: ${migrationsDir}`);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      this.logger.log('Nenhuma migration SQL encontrada.');
      return;
    }

    const applied = await this.getAppliedMigrations();

    for (const file of files) {
      if (applied.has(file)) {
        this.logger.log(`  ✓ ${file}`);
        continue;
      }

      this.logger.log(`  ⏳ Aplicando: ${file}`);
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await this.executeSqlFile(sql);
        // Registra a migration após execução (INSERT IGNORE = seguro mesmo se o SQL já registrou)
        await this.registerMigration(file);
        this.logger.log(`  ✅ ${file} aplicada com sucesso`);
      } catch (err) {
        this.logger.error(`  ❌ Falha ao aplicar ${file}: ${(err as Error).message}`);
        throw err;
      }
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id          INT          NOT NULL AUTO_INCREMENT,
        filename    VARCHAR(255) NOT NULL,
        applied_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status      VARCHAR(50)  NOT NULL DEFAULT 'applied',
        PRIMARY KEY (id),
        UNIQUE KEY UK_MIGRATIONS_FILENAME (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  private async getAppliedMigrations(): Promise<Set<string>> {
    const rows: Array<{ filename: string }> = await this.dataSource.query(
      `SELECT filename FROM migrations WHERE status = 'applied'`,
    );
    return new Set(rows.map((r) => r.filename));
  }

  private async registerMigration(filename: string): Promise<void> {
    await this.dataSource.query(
      `INSERT IGNORE INTO migrations (filename, applied_at, status) VALUES (?, NOW(), 'applied')`,
      [filename],
    );
  }

  private async executeSqlFile(sql: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const statements = this.splitSqlStatements(sql);
      for (const stmt of statements) {
        await queryRunner.query(stmt);
      }
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Divide um arquivo SQL em statements individuais, respeitando blocos BEGIN...END
   * de stored procedures. O separador normal é ';', mas dentro de um bloco
   * BEGIN...END os ';' são preservados como parte do statement.
   */
  private splitSqlStatements(sql: string): string[] {
    // Remove comentários de linha (-- ...) preservando a estrutura de linhas
    const cleaned = sql
      .split('\n')
      .map((line) => line.replace(/--.*$/, ''))
      .join('\n');

    const stmts: string[] = [];
    let buf = '';
    let depth = 0; // profundidade de aninhamento BEGIN...END
    let i = 0;

    while (i < cleaned.length) {
      const slice = cleaned.slice(i);

      // END IF / END LOOP / END WHILE / END CASE / END REPEAT
      // Fecham estruturas de controle mas NÃO afetam a profundidade BEGIN...END
      const endControlMatch = slice.match(/^(END\s+(?:IF|LOOP|WHILE|CASE|REPEAT))\b/i);
      if (endControlMatch) {
        buf += endControlMatch[0];
        i += endControlMatch[0].length;
        continue;
      }

      // BEGIN — abre um bloco composto (corpo de procedure/function)
      const beginMatch = slice.match(/^(BEGIN)\b/i);
      if (beginMatch) {
        depth++;
        buf += beginMatch[0];
        i += beginMatch[0].length;
        continue;
      }

      // END — fecha um bloco BEGIN
      const endMatch = slice.match(/^(END)\b/i);
      if (endMatch) {
        if (depth > 0) depth--;
        buf += endMatch[0];
        i += endMatch[0].length;
        continue;
      }

      // Ponto-e-vírgula: separador de statement apenas fora de BEGIN...END
      if (cleaned[i] === ';') {
        if (depth === 0) {
          const stmt = buf.trim();
          if (stmt.length > 0) stmts.push(stmt);
          buf = '';
        } else {
          buf += ';';
        }
        i++;
        continue;
      }

      buf += cleaned[i];
      i++;
    }

    // Captura eventual statement sem ';' no final do arquivo
    const lastStmt = buf.trim();
    if (lastStmt.length > 0) stmts.push(lastStmt);

    return stmts;
  }
}
