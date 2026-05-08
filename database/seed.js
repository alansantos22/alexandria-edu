/**
 * Alexandria EDU – Seed de dados fake para desenvolvimento
 *
 * Uso:
 *   node database/seed.js
 *
 * Requisitos:
 *   npm install argon2 mysql2   (dentro do projeto backend ou globalmente)
 *
 * Variáveis de ambiente (opcionais – usa defaults abaixo):
 *   DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
 */

'use strict';

const argon2 = require('argon2');
const mysql  = require('mysql2/promise');
const crypto = require('crypto');

// ─── Config ────────────────────────────────────────────────────────────────
const DB = {
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT, 10) || 3306,
  user    : process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'alan222al',
  database: process.env.DB_DATABASE || 'alexandria_edu',
  multipleStatements: true,
};

const HASH_OPTIONS = {
  type       : argon2.argon2id,
  memoryCost : 65536,
  timeCost   : 3,
  parallelism: 4,
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const uuid = () => crypto.randomUUID();

async function hash(plain) {
  return argon2.hash(plain, HASH_OPTIONS);
}

// ─── Dados ──────────────────────────────────────────────────────────────────

/** Usuários fake. Senhas visíveis aqui são apenas para dev/test. */
const USERS_RAW = [
  {
    username : 'alan_admin',
    email    : 'alan.santos01@outlook.com.br',
    password : 'Admin@1234',
    role     : 'admin',
    is_active: 1,
    is_verified: 1,
  },
  {
    username : 'demo_aluno',
    email    : 'demo@alexandria.edu',
    password : 'Demo@1234',
    role     : 'student',
    is_active: 1,
    is_verified: 1,
  },
  {
    username : 'maria_ia',
    email    : 'maria.ia@alexandria.edu',
    password : 'Maria@1234',
    role     : 'student',
    is_active: 1,
    is_verified: 1,
  },
  {
    username : 'joao_automacao',
    email    : 'joao.auto@alexandria.edu',
    password : 'Joao@1234',
    role     : 'student',
    is_active: 1,
    is_verified: 0,
  },
  {
    username : 'lucas_web3',
    email    : 'lucas.web3@alexandria.edu',
    password : 'Lucas@1234',
    role     : 'student',
    is_active: 0,   // sem acesso → redireciona para /checkout
    is_verified: 0,
  },
];

/** Aulas distribuídas pelas 4 trilhas */
const LESSONS = [
  // ── Trilha IA ──────────────────────────────────────────────────────────
  {
    title        : 'Introdução à Inteligência Artificial',
    description  : 'Entenda o que é IA, machine learning e deep learning. Conceitos fundamentais que todo profissional moderno precisa dominar.',
    video_url    : 'https://www.youtube.com/embed/aircAruvnKk',
    material_link: 'https://drive.google.com/drive/folders/fake-ia-01',
    order_index  : 1,
    is_published : 1,
  },
  {
    title        : 'Engenharia de Prompts na Prática',
    description  : 'Aprenda a estruturar prompts eficientes para GPT-4, Claude e Gemini. Técnicas de chain-of-thought, few-shot e system prompts.',
    video_url    : 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    material_link: 'https://drive.google.com/drive/folders/fake-ia-02',
    order_index  : 2,
    is_published : 1,
  },
  {
    title        : 'Construindo Agentes de IA com LangChain',
    description  : 'Passo a passo para criar agentes autônomos usando LangChain, ferramentas customizadas e memória de curto/longo prazo.',
    video_url    : 'https://www.youtube.com/embed/R9ezvMnFVvg',
    material_link: null,
    order_index  : 3,
    is_published : 1,
  },
  {
    title        : 'RAG — Retrieval-Augmented Generation',
    description  : 'Como conectar LLMs a bases de conhecimento privadas usando embeddings, vector stores (Pinecone, Chroma) e retrieval semântico.',
    video_url    : 'https://www.youtube.com/embed/T-D1OfcDW1M',
    material_link: 'https://drive.google.com/drive/folders/fake-ia-04',
    order_index  : 4,
    is_published : 1,
  },

  // ── Trilha Automação ───────────────────────────────────────────────────
  {
    title        : 'Automação No-Code com n8n',
    description  : 'Crie fluxos automáticos sem escrever código. Integre Gmail, Notion, Slack e mais de 400 serviços em minutos.',
    video_url    : 'https://www.youtube.com/embed/1MwSoB0gnM4',
    material_link: 'https://drive.google.com/drive/folders/fake-auto-01',
    order_index  : 5,
    is_published : 1,
  },
  {
    title        : 'Web Scraping com Python e Playwright',
    description  : 'Extraia dados de qualquer site com Python, Playwright e técnicas de evasão de bot-detection. Projetos reais incluídos.',
    video_url    : 'https://www.youtube.com/embed/mclmkHMNsG4',
    material_link: 'https://drive.google.com/drive/folders/fake-auto-02',
    order_index  : 6,
    is_published : 1,
  },
  {
    title        : 'Webhooks e Integrações REST',
    description  : 'Domine a comunicação entre sistemas via webhooks, eventos e APIs REST. Exemplos práticos com Stripe, GitHub e Twilio.',
    video_url    : 'https://www.youtube.com/embed/GZvSYJDk-us',
    material_link: null,
    order_index  : 7,
    is_published : 1,
  },

  // ── Trilha Gamificação ─────────────────────────────────────────────────
  {
    title        : 'Fundamentos de Gamificação',
    description  : 'Mecânicas de jogo, pontos, níveis, badges e leaderboards aplicados a produtos digitais, educação e marketing.',
    video_url    : 'https://www.youtube.com/embed/dTycnxWzHpc',
    material_link: 'https://drive.google.com/drive/folders/fake-game-01',
    order_index  : 8,
    is_published : 1,
  },
  {
    title        : 'Sistemas de XP e Progressão',
    description  : 'Como desenhar curvas de progressão balanceadas. Exemplos reais de jogos e plataformas educacionais de sucesso.',
    video_url    : 'https://www.youtube.com/embed/yiE5CX03n1s',
    material_link: null,
    order_index  : 9,
    is_published : 1,
  },

  // ── Trilha Web3 ────────────────────────────────────────────────────────
  {
    title        : 'Wallets, Chaves e Segurança On-Chain',
    description  : 'Seed phrases, hardware wallets, MetaMask e boas práticas para proteger seus ativos digitais no ecossistema Web3.',
    video_url    : 'https://www.youtube.com/embed/SSo_EIwHSd4',
    material_link: 'https://drive.google.com/drive/folders/fake-web3-01',
    order_index  : 10,
    is_published : 1,
  },
  {
    title        : 'Smart Contracts com Solidity',
    description  : 'Escreva, teste e faça deploy de contratos inteligentes na EVM. Do zero ao contrato ERC-20 funcional.',
    video_url    : 'https://www.youtube.com/embed/gyMwXuJrbJQ',
    material_link: 'https://drive.google.com/drive/folders/fake-web3-02',
    order_index  : 11,
    is_published : 1,
  },
  {
    title        : 'NFTs e Contratos ERC-721',
    description  : 'Crie uma coleção NFT completa: metadata, IPFS, mint contract e marketplace. Hands-on com OpenZeppelin.',
    video_url    : 'https://www.youtube.com/embed/4Wgi25wq7t0',
    material_link: null,
    order_index  : 12,
    is_published : 0, // rascunho – não aparece para alunos
  },
];

/** Configurações do sistema */
const SETTINGS = [
  { key_name: 'live_meeting_url', value: 'https://meet.google.com/fake-seed-link' },
];

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Alexandria EDU – iniciando seed…\n');

  const conn = await mysql.createConnection(DB);
  console.log('✅  Conectado ao MySQL\n');

  // ── Limpar tabelas (ordem respeitando FKs) ─────────────────────────────
  console.log('🗑️   Limpando dados anteriores…');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE lessons');
  await conn.execute('TRUNCATE TABLE users');
  await conn.execute('DELETE FROM settings');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

  // ── Usuários ───────────────────────────────────────────────────────────
  console.log('\n👤  Criando usuários…');
  for (const u of USERS_RAW) {
    const id   = uuid();
    const hash_ = await hash(u.password);
    await conn.execute(
      `INSERT INTO users (id, username, email, password_hash, role, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, u.username, u.email, hash_, u.role, u.is_active, u.is_verified],
    );
    const tag = u.role === 'admin' ? '👑' : u.is_active ? '✅' : '🔒';
    console.log(`  ${tag}  ${u.username.padEnd(18)} ${u.email}  (senha: ${u.password})`);
  }

  // ── Aulas ──────────────────────────────────────────────────────────────
  console.log('\n📚  Criando aulas…');
  for (const l of LESSONS) {
    const id = uuid();
    await conn.execute(
      `INSERT INTO lessons (id, title, description, video_url, material_link, order_index, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, l.title, l.description, l.video_url, l.material_link, l.order_index, l.is_published],
    );
    const pub = l.is_published ? '📗' : '📋';
    console.log(`  ${pub}  [${String(l.order_index).padStart(2, '0')}] ${l.title}`);
  }

  // ── Configurações ──────────────────────────────────────────────────────
  console.log('\n⚙️   Aplicando configurações…');
  for (const s of SETTINGS) {
    await conn.execute(
      `INSERT INTO settings (key_name, value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [s.key_name, s.value],
    );
    console.log(`  🔧  ${s.key_name} = ${s.value}`);
  }

  await conn.end();

  console.log('\n🎉  Seed concluído com sucesso!\n');
  console.log('─'.repeat(60));
  console.log('Usuários disponíveis para teste:\n');
  console.log('  👑  Admin       alan.santos01@outlook.com.br  /  Admin@1234');
  console.log('  ✅  Aluno ativo  demo@alexandria.edu           /  Demo@1234');
  console.log('  ✅  Aluno ativo  maria.ia@alexandria.edu       /  Maria@1234');
  console.log('  🔒  Sem acesso  lucas.web3@alexandria.edu     /  Lucas@1234  → /checkout');
  console.log('─'.repeat(60));
  console.log(`\n📺  ${LESSONS.filter(l => l.is_published).length} aulas publicadas  |  1 rascunho\n`);
}

seed().catch(err => {
  console.error('\n❌  Erro durante o seed:', err.message);
  process.exit(1);
});
