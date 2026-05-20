
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No data.json found, skipping migration.');
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);

  console.log('Migrating clients...');
  for (const client of data.clients || []) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {},
      create: {
        id: client.id,
        nome: client.nome,
        persona: client.persona || '',
        logo: client.logo || '',
      }
    });
  }

  console.log('Migrating campaigns...');
  for (const campaign of data.campaigns || []) {
    await prisma.campaign.upsert({
      where: { id: campaign.id },
      update: {},
      create: {
        id: campaign.id,
        client_id: campaign.client_id || campaign.client?.id || '1',
        periodo: campaign.periodo || campaign.periodo_conteudo,
      }
    });
  }

  console.log('Migrating posts...');
  for (const post of data.posts || []) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {},
      create: {
        id: post.id,
        campanha_id: post.campanha_id,
        data_publicacao: post.data_publicacao,
        dia_semana: post.dia_semana,
        formato: post.formato,
        horario_agendamento: post.horario_agendamento,
        foto_produto_crua: post.foto_produto_crua || '',
        orientacoes_briefing: post.orientacoes_briefing || '',
        referencia_produto: post.referencia_produto || '',
        texto_instagram: post.texto_instagram || '',
        texto_facebook: post.texto_facebook || '',
        acessibilidade_para_todos_verem: post.acessibilidade_para_todos_verem || '',
        direcionamento_designer: post.direcionamento_designer || '',
        arte_final: post.arte_final || '',
        status_interno: post.status_interno || 'Em Criação',
        obs_revisao_interna: post.obs_revisao_interna || '',
        status_cliente: post.status_cliente || 'Pendente',
        obs_cliente: post.obs_cliente || '',
      }
    });
  }

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
