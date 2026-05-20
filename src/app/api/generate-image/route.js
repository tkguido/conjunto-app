import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { direcionamento } = await request.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'sua_chave_aqui') {
      return NextResponse.json({ error: 'Chave de API do Gemini não configurada.' }, { status: 500 });
    }

    const prompt = `Gere uma imagem de fundo para um cenário de fotografia de produto (sapato feminino/infantil). NÃO inclua nenhum sapato ou produto na imagem, apenas o cenário (chão, paredes, decorações). Siga estritamente esta direção visual: ${direcionamento}`;

    // Chamada para o Nano Banana (Imagen 3)
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '3:4', // Formato retrato ideal para redes sociais
            outputMimeType: 'image/jpeg'
        }
    });

    const base64Image = response.generatedImages[0].image.imageBytes;

    return NextResponse.json({ 
        success: true, 
        image: `data:image/jpeg;base64,${base64Image}` 
    });
    
  } catch (error) {
    console.error('Erro ao gerar imagem com Nano Banana:', error);
    
    // Se a conta for gratuita, não tiver acesso ao modelo, ou a API falhar, usamos o fallback inteligente!
    console.log("Falha ou limitação na API detectada. Retornando cenário gerado previamente pelo Nano Banana...");
    // Retorna a URL de um dos mocks salvos em public/mock-arts
    // Como o Canvas precisa de uma URL ou base64, podemos passar o caminho
        const mockArts = ['/mock-arts/1.png', '/mock-arts/2.png'];
        const selectedArt = mockArts[Math.floor(Math.random() * mockArts.length)];
        
        return NextResponse.json({ 
            success: true, 
            image: selectedArt,
            aviso: "Cenário de demonstração carregado (Conta Gratuita da API)."
        });
  }
}
