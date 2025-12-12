import { GoogleGenAI, Type } from "@google/genai";
import { GraphData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateScenarioData = async (prompt: string): Promise<GraphData | null> => {
  try {
    const fullPrompt = `
      Génère un réseau JSON représentant l'écosystème financier des entreprises d'IA basé sur la demande suivante : "${prompt}".
      
      Si la demande n'est pas claire, crée un scénario réaliste impliquant des entreprises comme OpenAI, Google, Nvidia, etc.
      
      Tu dois retourner un objet JSON strict avec deux tableaux : 'nodes' et 'links'.
      
      Structure attendue pour 'nodes':
      {
        id: string (slug unique),
        name: string,
        type: string (choisir parmi: "Infrastructure", "Model Lab", "Cloud Provider", "Application", "VC / Holding"),
        valuation: number (en milliards),
        cashReserve: number (estimation de la résilience financière, en milliards),
        currentHealth: 100,
        status: "Healthy",
        description: string (court résumé en français)
      }

      Structure attendue pour 'links':
      {
        source: string (id du node source),
        target: string (id du node cible),
        value: number (importance du lien en milliards/intensité),
        type: "investment" | "partnership" | "dependency"
      }

      Règles :
      1. 'investment' : source investit dans target. Si source coule, target perd de l'argent. Si target coule, source perd son investissement.
      2. 'dependency' : source dépend de target (ex: OpenAI dépend de Nvidia). Si target coule, source est très impactée.
      3. Crée au moins 5 à 10 noeuds et des relations logiques.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  valuation: { type: Type.NUMBER },
                  cashReserve: { type: Type.NUMBER },
                  currentHealth: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["id", "name", "type", "valuation", "cashReserve", "currentHealth", "status"],
              },
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  type: { type: Type.STRING },
                },
                required: ["source", "target", "value", "type"],
              },
            },
          },
          required: ["nodes", "links"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as GraphData;
      return data;
    }
    return null;

  } catch (error) {
    console.error("Error generating scenario:", error);
    return null;
  }
};

export const analyzeConsequences = async (deadNodeName: string, impactedNodesNames: string[]): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `L'entreprise "${deadNodeName}" vient de faire faillite dans le secteur de l'IA.
            Les entreprises suivantes ont été impactées par effet de contagion financière ou technologique : ${impactedNodesNames.join(', ')}.
            
            Explique brièvement (max 3 phrases) pourquoi ces entreprises sont touchées et quelles sont les conséquences systémiques potentielles sur le marché de l'IA.`,
        });
        return response.text || "Analyse non disponible.";
    } catch (e) {
        return "Impossible de générer l'analyse.";
    }
}
