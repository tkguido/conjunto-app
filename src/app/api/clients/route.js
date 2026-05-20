import { db } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    
    // Fallback logo generation if not provided
    const client = {
      nome: data.nome,
      persona: data.persona || '',
      logo: data.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nome.substring(0, 2))}&background=random&color=fff&size=150&rounded=true`
    };

    const newClient = await db.addClient(client);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao criar cliente' }, { status: 500 });
  }
}
