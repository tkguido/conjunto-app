import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    const { post_id, prompt, image_url, formato } = data;

    if (!post_id) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 });
    }

    // Como estamos usando o Gemini AI Studio (Nano Banana real), 
    // verificamos se a chave Gemini existe no .env
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'sua_chave_aqui' || apiKey === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'NANO_BANANA_NOT_CONFIGURED',
        warning: 'Adicione GEMINI_API_KEY no .env para ativar a geração.'
      });
    }

    // Se tiver a chave, ele instrui o frontend a fazer o pipeline avançado
    // de gerar cenário + desenhar sapato via Canvas
    return NextResponse.json({ 
      success: false, // Forçamos o fallback para o frontend rodar o `/api/generate-image` + Canvas
      message: 'USE_ADVANCED_CANVAS_PIPELINE'
    });

    // Atualiza o banco de dados com a arte gerada - agora feito pelo Canvas!
    // const updatedPost = await db.updatePost(post_id, { arte_final: finalImageUrl });
    // return NextResponse.json({ success: true, post: updatedPost });

  } catch (error) {
    console.error("Erro na integração com Nano Banana:", error);
    return NextResponse.json({ error: 'Falha na geração de imagem' }, { status: 500 });
  }
}
