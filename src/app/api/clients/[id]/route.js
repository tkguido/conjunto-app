import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const data = await request.json();
    
    // Na lib/db não temos um método "updateClient" genérico ainda, mas o Prisma tem!
    // Podemos acessar o prisma direto se db.js exportar algo ou adicionar updateClient lá.
    // Vamos adicionar um método updateClient em lib/db.js primeiro.
    const updated = await db.updateClient(params.id, data);
    
    if (!updated) {
       return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar cliente' }, { status: 500 });
  }
}
