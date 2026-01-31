import { GoogleGenAI } from "@google/genai";

// Helper to convert File to Base64
const fileToPart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateTryOn = async (
  faceFile: File, 
  clothFile: File, 
  height: string, 
  weight: string, 
  gender: string,
  onProgress: (msg: string) => void
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const faceBase64 = await fileToPart(faceFile);
  const clothBase64 = await fileToPart(clothFile);

  // Step 1: Analyze the cloth image to create a highly detailed text description
  // Using gemini-3-pro-preview (mapped from gemini-2.5 pro request) for advanced reasoning
  onProgress("لێکدانەوەی جلوبەرگ..."); // Analyzing clothing...

  const clothAnalysisPrompt = `
    Analyze this image of clothing in extreme detail. 
    Describe the type of clothing, the fabric texture, the color, the pattern, the cut, and the fit.
    Do not include any intro or outro text, just the description.
  `;

  const analysisResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: clothFile.type, data: clothBase64 } },
        { text: clothAnalysisPrompt }
      ]
    }
  });

  const clothDescription = analysisResponse.text || "Modern clothing";

  // Step 2: Generate the final image
  // Using gemini-2.5-flash-image (Nano Banana) for generation
  onProgress("دروستکردنی وێنە..."); // Generating image...

  const finalPrompt = `
    Generate a high-quality, photorealistic full-body image of a ${gender === 'نێر' ? 'man' : 'woman'}.
    The person has the face provided in the first image (face image).
    The person is wearing the clothing described as: ${clothDescription}.
    The person's body proportions correspond to a height of ${height}cm and a weight of ${weight}kg.
    The pose should be natural, standing, showcasing the outfit clearly.
    Ensure the lighting is professional fashion studio lighting.
  `;

  // We pass the face image as a reference for the person's identity
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: faceFile.type, data: faceBase64 } }, // The face reference
        { text: finalPrompt }
      ]
    }
  });

  // Extract image
  let generatedImageUrl = '';
  const candidates = imageResponse.candidates;
  if (candidates && candidates.length > 0) {
    const parts = candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!generatedImageUrl) {
    throw new Error("Failed to generate image. Please try again.");
  }

  return generatedImageUrl;
};