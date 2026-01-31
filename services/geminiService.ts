// OpenRouter Service - Strict Implementation based on User Request
// Model: google/gemini-3-pro-image-preview

const OPENROUTER_API_KEY = "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";
const SITE_URL = "https://vercel.com"; 
const SITE_NAME = "Kurdish Virtual Try-On";

// Helper to convert File to Base64 Data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
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

  try {
    // 1. Convert images to Base64
    onProgress("ئامادەکردنی وێنەکان...");
    const faceBase64 = await fileToBase64(faceFile);
    const clothBase64 = await fileToBase64(clothFile);

    // 2. Call OpenRouter with the specific Model and Body you requested
    onProgress("ناردن بۆ OpenRouter (Gemini 3 Pro)...");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME
      },
      // This body structure is exactly what you provided
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview', // The model you requested
        messages: [
            {
              "role": "user",
              "content": [
                {
                    "type": "text",
                    "text": `Generate a high-quality photorealistic image of a ${gender === 'نێر' ? 'man' : 'woman'} wearing the clothing from the second image. 
                    The person uses the face from the first image.
                    Body: ${height}cm, ${weight}kg.
                    Output a beautiful fashion shot.`
                },
                {
                    "type": "image_url",
                    "image_url": { "url": faceBase64 }
                },
                {
                    "type": "image_url",
                    "image_url": { "url": clothBase64 }
                }
              ]
            }
          ],
        modalities: ['image', 'text'] // The specific parameter you asked for
      }),
    });

    // 3. Handle Response using your specific logic
    const result = await response.json();
    console.log("Full Response:", result);

    if (result.error) {
        throw new Error(`OpenRouter Error: ${result.error.message}`);
    }

    if (result.choices) {
      const message = result.choices[0].message;
      
      // Your specific check for message.images
      // @ts-ignore
      if (message.images) {
        // @ts-ignore
        const imageObj = message.images[0];
        if (imageObj && imageObj.image_url && imageObj.image_url.url) {
            return imageObj.image_url.url;
        }
      }
      
      // Fallback: Check standard content just in case the format varies slightly
      if (message.content) {
          const content = message.content;
          // Check for Base64 or URL in content
          if (content.includes("data:image")) return content;
          const urlMatch = content.match(/\((https?:\/\/.*?)\)/) || content.match(/src="(.*?)"/);
          if (urlMatch) return urlMatch[1];
          if (content.startsWith("http")) return content;
      }
    }

    throw new Error("وێنە لە وەڵامەکەدا نەدۆزرایەوە (No image in response).");

  } catch (error: any) {
    console.error("Gemini 3 Service Error:", error);
    throw new Error(error.message || "کێشەیەک ڕوویدا. تکایە دڵنیابەرەوە مۆدێلەکە لە OpenRouter بەردەستە.");
  }
};
