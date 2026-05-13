/**
 * Alexandria EDU – Cria apenas o usuário admin
 *
 * Uso:
 *   node database/create-admin.js
 *
 * Lê automaticamente as variáveis do backend/.env
 */

'use strict';

const argon2 = require('argon2');
const mysql  = require('mysql2/promise');
const crypto = require('crypto');
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

const DB = {
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT, 10) || 3306,
  user    : process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'alexandria_edu',
};

const HASH_OPTIONS = {
  type       : argon2.argon2id,
  memoryCost : 65536,
  timeCost   : 3,
  parallelism: 4,
};

const ADMIN = {
  username   : 'alan_admin',
  email      : 'alan.santos01@outlook.com.br',
  password   : 'Admin@1234',
  role       : 'admin',
  is_active  : 1,
  is_verified: 1,
};

async function main() {
  const conn = await mysql.createConnection(DB);

  try {
    const passwordHash = await argon2.hash(ADMIN.password, HASH_OPTIONS);
    const id = crypto.randomUUID();

    await conn.execute(
      `INSERT INTO users (id, username, email, password_hash, role, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         is_active     = VALUES(is_active),
         is_verified   = VALUES(is_verified),
         role          = VALUES(role)`,
      [id, ADMIN.username, ADMIN.email, passwordHash, ADMIN.role, ADMIN.is_active, ADMIN.is_verified],
    );

    console.log(`\x1b[32m[create-admin] ✔\x1b[0m Admin criado/atualizado com sucesso.`);
    console.log(`  username : ${ADMIN.username}`);
    console.log(`  email    : ${ADMIN.email}`);
    console.log(`  password : ${ADMIN.password}`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(`\x1b[31m[create-admin] ✘\x1b[0m ${err.message}`);
  process.exit(1);
});
