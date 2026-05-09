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

/** Tópicos do fórum por categoria (category_id conforme seed do schema.sql) */
const FORUM_TOPICS = [
  // ── Categoria 1: Dúvidas Gerais ────────────────────────────────────────
  {
    category_id: 1,
    author: 'demo_aluno',
    title: 'Como funciona o certificado de conclusão?',
    content: 'Olá pessoal! Fiz 80% das aulas mas ainda não recebi nenhuma notificação sobre certificado. Existe algum critério além da % de conclusão? Preciso terminar todas as aulas ou só as publicadas?\n\nObrigado!',
    views: 142,
    is_pinned: false,
    replies: [
      { author: 'alan_admin',      content: 'Oi! O certificado é gerado automaticamente quando você completa 100% das aulas publicadas. As aulas em rascunho não contam. Assim que bater 100%, aparece na sua área de aluno. 🎓' },
      { author: 'maria_ia',        content: 'Aqui foi bem rápido, assim que terminei a última aula apareceu um botão de download. Boa sorte!' },
      { author: 'joao_automacao',  content: 'Valeu pela dica! Eu tava com a mesma dúvida.' },
    ],
  },
  {
    category_id: 1,
    author: 'joao_automacao',
    title: 'Vídeo da aula 3 não carrega — alguém mais está tendo esse problema?',
    content: 'Tentei assistir a aula "Construindo Agentes de IA com LangChain" mas o vídeo fica em buffer infinito. Já tentei em dois navegadores diferentes (Chrome e Firefox). O restante do site carrega normal.\n\nAlguém teve o mesmo problema?',
    views: 87,
    is_pinned: false,
    replies: [
      { author: 'alan_admin',      content: 'Obrigado por reportar! Já identificamos o problema — era uma restrição do embed do YouTube em certas regiões. Atualizamos o link, pode tentar agora!' },
      { author: 'joao_automacao',  content: 'Funcionou! Muito obrigado pela agilidade 🙏' },
    ],
  },
  {
    category_id: 1,
    author: 'maria_ia',
    title: 'É possível acelerar os vídeos?',
    content: 'Oi! Tentei usar as configurações do YouTube pra assistir em 1.5x ou 2x mas o player embutido não mostra essa opção. Tem alguma forma de fazer isso?\n\nSeria muito útil pra revisar conteúdo que já sei.',
    views: 210,
    is_pinned: false,
    replies: [
      { author: 'demo_aluno',  content: 'Clica no ícone de engrenagem no canto inferior direito do player — aparece "Velocidade de reprodução" normalmente!' },
      { author: 'maria_ia',    content: 'Caramba, tava tão na cara que eu não vi rsrs. Obrigada! 😅' },
    ],
  },

  // ── Categoria 2: Projetos e Portfólio ─────────────────────────────────
  {
    category_id: 2,
    author: 'alan_admin',
    title: '📌 [FIXADO] Como publicar seu projeto aqui no fórum',
    content: 'Bem-vindos à área de projetos! 🚀\n\nPara compartilhar seu projeto aqui, siga este modelo:\n\n**Nome do Projeto:** ...\n**Trilha:** IA / Automação / Gamificação / Web3\n**Descrição:** (2-3 linhas)\n**Link:** GitHub / Deploy / Demo\n**Aprendizados principais:** ...\n\nComente nos projetos dos colegas! Feedback construtivo é muito bem-vindo.',
    views: 389,
    is_pinned: true,
    replies: [
      { author: 'demo_aluno',  content: 'Vou postar o meu agente de triagem de e-mails essa semana!' },
      { author: 'maria_ia',    content: 'Amei a iniciativa! Já preparei meu post 💪' },
    ],
  },
  {
    category_id: 2,
    author: 'demo_aluno',
    title: 'Meu agente de triagem de e-mails com LangChain',
    content: '**Nome do Projeto:** EmailGuardian\n**Trilha:** IA\n**Descrição:** Um agente que classifica e-mails automaticamente em categorias (urgente, informativo, spam) e sugere respostas curtas usando GPT-4o.\n**Link:** https://github.com/demo/email-guardian\n**Aprendizados:** Aprendi muito sobre memória de curto prazo no LangChain e como usar tools customizadas. O maior desafio foi o prompt para não alucinar nas sugestões de resposta.',
    views: 167,
    is_pinned: false,
    replies: [
      { author: 'alan_admin',     content: 'Projeto incrível! Gostei especialmente do uso de tools customizadas. Vai virar case de sucesso da plataforma 🏆' },
      { author: 'joao_automacao', content: 'Cara, que ideia boa! Você fez deploy em algum lugar? Quero testar!' },
      { author: 'demo_aluno',     content: 'Ainda não, mas vou subir no Render essa semana. Te aviso aqui no tópico!' },
    ],
  },
  {
    category_id: 2,
    author: 'maria_ia',
    title: 'Dashboard de sentimentos com Python + n8n',
    content: '**Nome do Projeto:** SentimentFlow\n**Trilha:** IA + Automação\n**Descrição:** Conectei a API do Twitter/X ao n8n, processei os tweets com análise de sentimento (transformers) e exibi tudo num dashboard Streamlit em tempo real.\n**Link:** https://github.com/maria/sentimentflow\n**Aprendizados:** Integrar ferramentas no-code com Python não é tão difícil quanto parece! O n8n tem um node HTTP genérico que facilitou muito.',
    views: 93,
    is_pinned: false,
    replies: [
      { author: 'alan_admin',  content: 'Muito criativo combinar as duas trilhas assim! 👏' },
    ],
  },

  // ── Categoria 3: Recursos e Dicas ──────────────────────────────────────
  {
    category_id: 3,
    author: 'alan_admin',
    title: '📌 [FIXADO] Lista de recursos gratuitos para as trilhas',
    content: 'Compilei aqui os melhores recursos gratuitos para cada trilha:\n\n**🤖 IA:**\n- fast.ai — curso prático gratuito\n- Hugging Face — modelos e datasets\n- LangChain Docs — documentação oficial\n\n**⚙️ Automação:**\n- n8n Community — templates gratuitos\n- Playwright Docs — automação de browser\n\n**🎮 Gamificação:**\n- Yu-kai Chou — Octalysis Framework (livro gratuito online)\n\n**🌐 Web3:**\n- CryptoZombies — aprenda Solidity jogando\n- Ethers.js Docs\n\nAdicionem mais nos comentários!',
    views: 512,
    is_pinned: true,
    replies: [
      { author: 'demo_aluno',     content: 'Adicionando: Andrej Karpathy tem vídeos incríveis de IA no YouTube, completamente gratuitos!' },
      { author: 'maria_ia',       content: 'Para automação: Make (antigo Integromat) tem um plano grátis bem generoso. Ótimo para quem está começando.' },
      { author: 'joao_automacao', content: 'Para Web3: o roadmap.sh tem uma trilha de blockchain bem organizada.' },
    ],
  },
  {
    category_id: 3,
    author: 'joao_automacao',
    title: 'Dica: como usar o ChatGPT pra revisar seus prompts',
    content: 'Descobri uma técnica simples que melhorou muito meus prompts:\n\n1. Escreva seu prompt\n2. Peça pro ChatGPT: *"Critique este prompt e sugira 3 melhorias"*\n3. Aplique as melhorias e teste\n\nParece óbvio mas faz muita diferença! Especialmente para prompts de chain-of-thought.',
    views: 178,
    is_pinned: false,
    replies: [
      { author: 'maria_ia',   content: 'Melhor ainda: peça pra ele reescrever o prompt usando as próprias melhorias. Economiza tempo!' },
      { author: 'demo_aluno', content: 'Uso isso diariamente agora. Game changer mesmo 🔥' },
    ],
  },

  // ── Categoria 4: Off-topic ─────────────────────────────────────────────
  {
    category_id: 4,
    author: 'demo_aluno',
    title: 'Apresentação — quem são vocês? 👋',
    content: 'Oi pessoal! Que tal a gente se conhecer?\n\nMe chamo Alan (demo_aluno), trabalho com desenvolvimento web há 3 anos e entrei na Alexandria pra me aprofundar em IA. Meu objetivo é criar produtos que usem LLMs de forma prática.\n\nE vocês? De onde são, o que fazem e qual trilha mais interessa?',
    views: 274,
    is_pinned: false,
    replies: [
      { author: 'maria_ia',       content: 'Oi! Sou a Maria, cientista de dados em São Paulo. Me interesso muito pela trilha de IA + automação juntas. Adoro o conceito de agentes autônomos!' },
      { author: 'joao_automacao', content: 'João aqui! Analista de sistemas em BH. Comecei pela automação e to viciado em n8n. Quero migrar pra algo mais técnico envolvendo IA em breve.' },
      { author: 'alan_admin',     content: 'Que turma incrível! Bem-vindos a todos. Esse tipo de troca é exatamente o espírito da Alexandria 🏛️' },
    ],
  },
  {
    category_id: 4,
    author: 'maria_ia',
    title: 'Qual ferramenta de IA vocês mais usam no dia a dia?',
    content: 'Curiosidade aqui: além das ferramentas das aulas, o que vocês realmente usam no trabalho?\n\nEu uso:\n- ChatGPT 4o pra escrita e código\n- Perplexity pra pesquisa rápida\n- Midjourney pra criar thumbnails\n\nVocês?',
    views: 198,
    is_pinned: false,
    replies: [
      { author: 'demo_aluno',     content: 'Claude 3.5 Sonnet pra código — acho que ele supera o GPT-4 nesse quesito. E GitHub Copilot direto no VSCode!' },
      { author: 'joao_automacao', content: 'Gemini 1.5 Flash pra processar documentos longos (grátis e contexto enorme). Faz muita diferença pra análise de contratos.' },
      { author: 'alan_admin',     content: 'Time de LLMs: Claude pra raciocínio, GPT-4o pra visão, Gemini Flash pra velocidade/custo. Cada um tem seu nicho!' },
    ],
  },
];

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Alexandria EDU – iniciando seed…\n');

  const conn = await mysql.createConnection(DB);
  console.log('✅  Conectado ao MySQL\n');

  // ── Limpar tabelas (ordem respeitando FKs) ─────────────────────────────
  console.log('🗑️   Limpando dados anteriores…');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE forum_posts');
  await conn.execute('TRUNCATE TABLE forum_topics');
  await conn.execute('TRUNCATE TABLE forum_categories');
  await conn.execute('TRUNCATE TABLE lessons');
  await conn.execute('TRUNCATE TABLE users');
  await conn.execute('DELETE FROM settings');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

  // ── Usuários ───────────────────────────────────────────────────────────
  console.log('\n👤  Criando usuários…');
  const userIdMap = {}; // username → id
  for (const u of USERS_RAW) {
    const id   = uuid();
    const hash_ = await hash(u.password);
    await conn.execute(
      `INSERT INTO users (id, username, email, password_hash, role, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, u.username, u.email, hash_, u.role, u.is_active, u.is_verified],
    );
    userIdMap[u.username] = id;
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

  // ── Fórum: categorias ──────────────────────────────────────────────────
  console.log('\n💬  Criando categorias do fórum…');
  const CATEGORIES = [
    { name: 'Dúvidas Gerais',        description: 'Tire suas dúvidas sobre as aulas, plataforma e conteúdo.',         icon: '❓', order_index: 0 },
    { name: 'Projetos e Portfólio',   description: 'Compartilhe seus projetos e receba feedback da comunidade.',        icon: '🚀', order_index: 1 },
    { name: 'Recursos e Dicas',       description: 'Links úteis, ferramentas, artigos e dicas de produtividade.',       icon: '💡', order_index: 2 },
    { name: 'Off-topic',              description: 'Conversas fora do tema principal — networking e bate-papo.',        icon: '☕', order_index: 3 },
  ];
  const categoryIds = [];
  for (const cat of CATEGORIES) {
    const [res] = await conn.execute(
      `INSERT INTO forum_categories (name, description, icon, order_index) VALUES (?, ?, ?, ?)`,
      [cat.name, cat.description, cat.icon, cat.order_index],
    );
    categoryIds.push(res.insertId);
    console.log(`  📁  [${res.insertId}] ${cat.name}`);
  }

  // ── Fórum: tópicos e posts ─────────────────────────────────────────────
  console.log('\n📝  Criando tópicos e respostas do fórum…');
  let topicCount = 0;
  let postCount  = 0;

  for (const t of FORUM_TOPICS) {
    const authorId = userIdMap[t.author];
    if (!authorId) { console.warn(`  ⚠️  Autor "${t.author}" não encontrado`); continue; }

    // Datas com variação realista (últimos 30 dias)
    const daysAgo    = Math.floor(Math.random() * 30);
    const createdAt  = new Date(Date.now() - daysAgo * 86_400_000);

    const [topicRes] = await conn.execute(
      `INSERT INTO forum_topics (category_id, user_id, title, content, views, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.category_id, authorId, t.title, t.content, t.views, t.is_pinned ? 1 : 0, createdAt, createdAt],
    );
    const topicId = topicRes.insertId;
    topicCount++;

    // Replies
    for (let i = 0; i < t.replies.length; i++) {
      const r = t.replies[i];
      const replyAuthorId = userIdMap[r.author];
      if (!replyAuthorId) { console.warn(`  ⚠️  Autor reply "${r.author}" não encontrado`); continue; }
      const replyDate = new Date(createdAt.getTime() + (i + 1) * 3_600_000); // +1h por reply
      await conn.execute(
        `INSERT INTO forum_posts (topic_id, user_id, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [topicId, replyAuthorId, r.content, replyDate, replyDate],
      );
      postCount++;
    }

    const pin = t.is_pinned ? '📌 ' : '   ';
    console.log(`  ${pin}[T${topicId}] ${t.title.substring(0, 55)}…  (${t.replies.length} respostas)`);
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
  console.log(`\n�  ${LESSONS.filter(l => l.is_published).length} aulas publicadas  |  1 rascunho`);
  console.log(`💬  ${topicCount} tópicos no fórum  |  ${postCount} respostas\n`);
}

seed().catch(err => {
  console.error('\n❌  Erro durante o seed:', err.message);
  process.exit(1);
});
