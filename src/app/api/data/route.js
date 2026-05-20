import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clients = await db.getClients();
  let campaigns = [];
  for (const c of clients) {
    const camps = await db.getCampaignsByClientId(c.id);
    campaigns = campaigns.concat(camps);
  }
  
  let posts = [];
  for (const c of campaigns) {
    const p = await db.getPostsByCampaignId(c.id);
    posts = posts.concat(p);
  }

  return NextResponse.json({
    clients,
    campaigns,
    posts
  });
}
