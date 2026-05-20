import { PrismaClient } from '@prisma/client';

// Evita múltiplas instâncias no desenvolvimento (Next.js hot reload)
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const db = {
  getClients: async () => {
    return prisma.client.findMany();
  },
  
  getClientById: async (id) => {
    return prisma.client.findUnique({ where: { id } });
  },

  getCampaignsByClientId: async (client_id) => {
    return prisma.campaign.findMany({ where: { client_id } });
  },

  getCampaignById: async (id) => {
    return prisma.campaign.findUnique({ where: { id } });
  },

  getPostsByCampaignId: async (campanha_id) => {
    return prisma.post.findMany({ where: { campanha_id } });
  },

  getPostById: async (id) => {
    return prisma.post.findUnique({ where: { id } });
  },

  updatePost: async (id, updates) => {
    return prisma.post.update({
      where: { id },
      data: updates
    });
  },

  addClient: async (data) => {
    return prisma.client.create({ data });
  },

  updateClient: async (id, updates) => {
    return prisma.client.update({
      where: { id },
      data: updates
    });
  },

  addCampaign: async (data) => {
    return prisma.campaign.create({ data });
  },

  addPost: async (data) => {
    return prisma.post.create({ data });
  }
};
