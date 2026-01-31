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
  
  // لێرە کلیلەکەمان داناوە ڕاستەوخۆ
  const API_KEY = "AIzaSyAGWigERpl0KsoEG-MrX_6eReVdLz3ol38";

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const faceBase64 = await fileToPart(faceFile);
  const clothBase64 = await fileToPart(clothFile);

  // Step 1: Analyze the cloth image
  onProgress("لێکدانەوەی جلوبەرگ..."); // Analyzing clothing...

  const clothAnalysisPrompt = `
    Analyze this image of a clothing item. Describe the clothing in high detail, including:
    - Type of clothing (e.g., t-shirt, dress, jacket)
    - Color and pattern
    - Fabric texture
    - Neckline, sleeve length, and fit
    - Any distinctive features.
    Output only the description.
  `;

  // Using gemini-1.5-flash for speed/analysis
  const clothResponse = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: clothFile.type, data: clothBase64 } },
        { text: clothAnalysisPrompt }
      ]
    }
  });

  let clothDescription = "A nice outfit";
  if (clothResponse.candidates && clothResponse.candidates.length > 0) {
     const parts = clothResponse.candidates[0].content.parts;
     if (parts && parts[0].text) {
        clothDescription = parts[0].text;
     }
  }

  // Step 2: Generate the try-on image
  onProgress("دروستکردنی وێنە..."); // Generating image...

  const finalPrompt = `
    Generate a high-quality, photorealistic full-body image of a ${gender === 'نێر' ? 'man' : 'woman'}.
    The person has the face provided in the first image (face image).
    The person is wearing the clothing described as: ${clothDescription}.
    The person's body proportions correspond to a height of ${height}cm and a weight of ${weight}kg.
    The pose should be natural, standing, showcasing the outfit clearly.
    Ensure the lighting is professional fashion studio lighting.
  `;

  // We pass the face image as a reference
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp', // Updated to latest model for best results
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
    throw new Error("نەتوانرا وێنە دروست بکرێت. تکایە دووبارە هەوڵبدەرەوە.");
  }

  return generatedImageUrl;
};
