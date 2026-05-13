/**
 * Alexandria EDU – Setup completo do banco de dados
 *
 * Uso:
 *   node database/db-setup.js           → schema + migrations
 *   node database/db-setup.js --seed    → schema + migrations + seed
 *
 * Lê automaticamente as variáveis do backend/.env
 */

'use strict';

const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');

// ─── Carrega .env do backend ────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
}

const DB_CONFIG = {
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT, 10) || 3306,
  user    : process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const DATABASE   = process.env.DB_DATABASE || 'alexandria_edu';
const SCHEMA_FILE = path.resolve(__dirname, 'schema.sql');
const MIGRATIONS  = path.resolve(__dirname, 'migrations');
const WITH_SEED   = process.argv.includes('--seed');

// ─── Helpers ────────────────────────────────────────────────────────────────
function log(msg)  { console.log(`\x1b[36m[db-setup]\x1b[0m ${msg}`); }
function ok(msg)   { console.log(`\x1b[32m[db-setup] ✔\x1b[0m ${msg}`); }
function fail(msg) { console.error(`\x1b[31m[db-setup] ✘\x1b[0m ${msg}`); }

async function runFile(conn, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await conn.query(sql);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('Conectando ao MySQL...');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // 1. Schema (CREATE DATABASE IF NOT EXISTS + todas as tabelas base)
    log(`Aplicando schema: schema.sql`);
    await runFile(conn, SCHEMA_FILE);
    ok('Schema aplicado.');

    // 2. Selecionar o banco para as migrations
    await conn.query(`USE \`${DATABASE}\``);

    // 2b. Garantir que a tabela de controle de migrations existe
    await conn.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        status     VARCHAR(50)  NOT NULL DEFAULT 'applied',
        applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Migrations em ordem alfabética/numérica
    const migrations = fs.readdirSync(MIGRATIONS)
      .filter(f => f.endsWith('.sql'))
      .sort();

    log(`Encontradas ${migrations.length} migrations.`);
    for (const file of migrations) {
      log(`Aplicando migration: ${file}`);
      await runFile(conn, path.join(MIGRATIONS, file));
      ok(`${file} concluída.`);
    }

    ok(`Banco \`${DATABASE}\` pronto.`);
  } finally {
    await conn.end();
  }

  // 4. Seed (opcional, processo separado para herdar env)
  if (WITH_SEED) {
    log('Rodando seed...');
    const { execSync } = require('child_process');
    const seedPath = path.resolve(__dirname, 'seed.js');
    const backendDir = path.resolve(__dirname, '../backend');
    execSync(`node "${seedPath}"`, {
      stdio: 'inherit',
      cwd: backendDir,
      env: process.env,
    });
    ok('Seed concluído.');
  }

  log('Tudo pronto! 🚀');
}

main().catch(err => {
  fail(err.message);
  process.exit(1);
});
