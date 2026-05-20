import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { briefing, rede, produto, persona } = await request.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'sua_chave_aqui') {
      return NextResponse.json({ error: 'Chave de API do Gemini não configurada.' }, { status: 500 });
    }

    const prompt = `Você é o Diretor de Arte e Copywriter Senior da Agência Conjunto.
Sua missão é criar o conteúdo para as redes sociais de um cliente baseado nas informações abaixo.

### CONTEXTO DO CLIENTE
Persona e Tom de Voz da Marca: ${persona}

### BRIEFING DA PEÇA
Referência do Produto: ${produto}
Formato Principal: ${rede}
Orientações do Briefing: ${briefing}

### INSTRUÇÕES DE SAÍDA
Retorne APENAS um objeto JSON válido (sem blocos de código ou formatação Markdown) contendo exatamente as seguintes chaves:
- "texto_instagram": Legenda criativa, atrativa e formatada com emojis e hashtags adequadas à marca. Sempre inclua a referência do produto no final.
- "texto_facebook": Uma versão ligeiramente adaptada do texto acima para o Facebook (geralmente mais direta, sem limite rigoroso de caracteres, mas mantendo a essência).
- "acessibilidade": O texto para a hashtag #ParaTodosVerem descrevendo detalhadamente a foto proposta.
- "direcionamento": Instruções diretas e visuais para o Designer Gráfico (cores sugeridas, elementos, disposição da foto) que conversem perfeitamente com a persona do cliente e o briefing.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: "application/json",
        }
    });

    const textResponse = response.text;
    const jsonResult = JSON.parse(textResponse);

    return NextResponse.json(jsonResult);
    
  } catch (error) {
    console.error('Erro ao gerar com IA:', error);
    return NextResponse.json({ error: 'Falha ao conectar com a IA.' }, { status: 500 });
  }
}
