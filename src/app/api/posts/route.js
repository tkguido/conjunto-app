import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.campanha_id || !data.data_publicacao || !data.formato) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const post = {
      campanha_id: data.campanha_id,
      data_publicacao: data.data_publicacao,
      dia_semana: data.dia_semana,
      formato: data.formato,
      horario_agendamento: data.horario_agendamento,
      foto_produto_crua: data.foto_produto_crua || '',
    };

    const newPost = await db.addPost(post);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao criar post' }, { status: 500 });
  }
}
