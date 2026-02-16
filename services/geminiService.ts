import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Categorizes a grocery item based on its name.
 */
export const categorizeItem = async (itemName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Categorize this grocery item into one short, general category (e.g., "Produce", "Dairy", "Meat", "Snacks", "Household", "Beverages", "Bakery", "Other"). Return ONLY the category name. Item: ${itemName}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return "Other";
    
    const json = JSON.parse(text);
    return json.category || "Other";
  } catch (error) {
    console.error("Gemini categorization failed:", error);
    return "Other";
  }
};

/**
 * Generates a thumbnail image for a grocery item.
 */
export const generateItemImage = async (itemName: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: `A clean, colorful, icon-style illustration of ${itemName} on a solid white background. High quality, centered.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Gemini image generation failed:", error);
    return undefined;
  }
};

/**
 * Generates a spending insight based on recent trips.
 */
export const generateSpendingInsight = async (tripsJSON: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze these recent grocery shopping trips and provide a helpful, encouraging 2-sentence insight about the user's spending habits or a tip to save money. Data: ${tripsJSON}`,
    });
    return response.text || "Keep tracking your expenses to save more!";
  } catch (error) {
    return "Great job tracking your expenses!";
  }
};
