import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Vous êtes un ingénieur expert en prompt engineering spécialisé dans la création d'applications logicielles. 
Votre mission est de transformer une brève description d'application en un prompt extrêmement détaillé, structuré et optimisé pour être utilisé par des IA de génération de code (comme Gemini, GPT-4 ou Claude).

Le prompt généré doit inclure :
1. Un nom d'application accrocheur.
2. Une vision claire du produit.
3. Une liste détaillée des fonctionnalités (MVP).
4. La stack technologique recommandée (Frontend, Backend, Base de données).
5. Des directives de design et d'expérience utilisateur (UX/UI).
6. Une structure de fichiers suggérée.
7. Des exemples de composants clés à implémenter.

Utilisez un ton professionnel, technique et inspirant. Formatez votre réponse en Markdown pour une lisibilité maximale.`;

export async function generateOptimizedPrompt(description: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La clé API Gemini est manquante.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-pro-preview";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Description de l'utilisateur : ${description}\n\nGénère un prompt d'application complet et optimisé basé sur cette description.` }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Erreur lors de la génération du prompt:", error);
    throw error;
  }
}
