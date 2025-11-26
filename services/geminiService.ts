import { GoogleGenAI } from "@google/genai";
import { PROMPT_VARIATIONS } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateColoringPage = async (
  item: string,
  variationIndex: number
): Promise<string> => {
  const ai = getClient();
  const variation = PROMPT_VARIATIONS[variationIndex % PROMPT_VARIATIONS.length];
  
  // Highly specific prompt for coloring book style
  const prompt = `
    Create a professional children's coloring book page of a ${item}. 
    The ${item} should be ${variation}.
    Style requirements:
    - Pure black and white line art ONLY.
    - White background.
    - Thick, clean, distinct outlines suitable for crayons.
    - No shading, no grayscale, no fill colors.
    - Cute, friendly, cartoon style appropriate for toddlers and young kids.
    - Surround the main character with a simple decorative border (like stars, bubbles, or simple leaves) also in outline style.
    - Center the subject on the page.
    - Aspect ratio should fit well on A4 paper.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        // While we can't force aspect ratio in flash-image as easily as pro-image, 
        // the prompt helps. For serious production, we might use crop/pad.
        // We'll trust the model to produce a square-ish or portrait image 
        // and handle fit in CSS/PDF.
      }
    });

    // Check parts for the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data received from Gemini.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
