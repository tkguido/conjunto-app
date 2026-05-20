import { db } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.client_id || !data.periodo) {
      return NextResponse.json({ error: 'client_id e periodo são obrigatórios' }, { status: 400 });
    }
    
    const campaign = {
      client_id: data.client_id,
      periodo: data.periodo
    };

    const newCampaign = await db.addCampaign(campaign);
    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao criar campanha' }, { status: 500 });
  }
}
