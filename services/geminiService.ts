import { GoogleGenAI, Type, Chat } from "@google/genai";
import { WeeklySummary, ShoppingItem } from "../types";

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
          },
          required: ["category"]
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

/**
 * Generates a summary of products bought per week.
 */
export const generateWeeklySummary = async (weeklyData: Record<string, string[]>): Promise<WeeklySummary[]> => {
  if (Object.keys(weeklyData).length === 0) return [];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze these grocery items grouped by week. For each week, write a short summary (max 15 words) describing the main types of products purchased (e.g., 'Mostly fresh produce and dairy', 'Heavy on snacks and drinks'). Data: ${JSON.stringify(weeklyData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.STRING },
              summary: { type: Type.STRING }
            },
            required: ["week", "summary"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as WeeklySummary[];
  } catch (error) {
    console.error("Gemini weekly summary generation failed:", error);
    return [];
  }
};

/**
 * Creates a chat session with a specific product persona.
 */
export const createProductChat = (item: ShoppingItem, storeName: string, context: 'cart' | 'history' = 'history'): Chat => {
  const statusText = context === 'cart' 
    ? `You are currently in the user's shopping cart at ${storeName}. You are hoping to be bought, or maybe you are warning them about the price!` 
    : `You were purchased at ${storeName} for $${item.price.toFixed(2)}. You are currently in the user's shopping history.`;

  const systemInstruction = `You are a sentient version of the product: ${item.name}.
  ${statusText}
  Price: $${item.price.toFixed(2)}.
  
  Your personality depends on your category (${item.category}):
  - Produce/Vegetables: Proud, healthy, judgmental of junk food.
  - Snacks/Junk Food: Fun, chaotic, tempting, encouraging bad habits.
  - Meat/Dairy: Robust, hearty, maybe a bit aggressive.
  - Beverages: Bubbly (if soda) or sophisticated (if wine/coffee).
  - Household/Cleaning: Neat freak, obsessive about dirt.
  - Electronics/General: Tech-savvy, precise, helpful.
  - Other: Mysterious, quirky.
  
  Guidelines:
  - Answer in the first person ("I").
  - Be funny, witty, and opinionated about being bought.
  - Keep responses short (under 50 words) and conversational.
  - If the user asks what you think about them buying you, give a personalized answer based on your price and nature.
  `;

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction,
    }
  });
};