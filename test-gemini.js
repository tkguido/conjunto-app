const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: 'Teste',
        config: { numberOfImages: 1, aspectRatio: '3:4', outputMimeType: 'image/jpeg' }
    });
    console.log("Sucesso!");
  } catch (e) {
    console.error(e);
  }
}
run();
