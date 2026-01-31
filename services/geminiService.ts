// OpenRouter Service - Cost Effective & Fast
// Model: google/gemini-2.5-flash-image

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
    // 1. ئامادەکردنی وێنەکان بۆ Base64
    onProgress("ئامادەکردنی وێنەکان...");
    const faceBase64 = await fileToBase64(faceFile);
    const clothBase64 = await fileToBase64(clothFile);

    // 2. ناردنی داواکاری بۆ OpenRouter
    onProgress("دروستکردنی وێنە (Gemini 2.5 Flash)...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image", // مۆدێلە هەرزان و خێراکە
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": `Generate a photorealistic image of a ${gender === 'نێر' ? 'man' : 'woman'} wearing the clothing shown in the second image.
                - Use the face from the first image.
                - Body metrics: Height ${height}cm, Weight ${weight}kg.
                - The output must be a high-quality fashion photo.
                - Return only the image.`
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": faceBase64 // وێنەی دەموچاو
                }
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": clothBase64 // وێنەی جلەکە
                }
              }
            ]
          }
        ]
      })
    });

    // 3. وەرگرتنەوەی وەڵام
    const result = await response.json();
    console.log("Gemini 2.5 Flash Response:", result);

    if (result.error) {
       throw new Error(`OpenRouter Error: ${result.error.message}`);
    }

    if (result.choices && result.choices.length > 0) {
      const message = result.choices[0].message;
      const content = message.content;

      // پشکنین بۆ لینک لەناو وەڵامەکەدا
      if (content) {
        // ئەگەر وێنەکە وەک لینک هات
        const urlMatch = content.match(/\((https?:\/\/.*?)\)/) || content.match(/src="(.*?)"/) || content.match(/(https?:\/\/.*?\.(?:png|jpg|jpeg|webp))/);
        if (urlMatch) return urlMatch[1];
        
        // ئەگەر وێنەکە وەک Base64 هات
        if (content.includes("data:image")) {
            const base64Match = content.match(/data:image\/[^;]+;base64,[^")\s]+/);
            if (base64Match) return base64Match[0];
        }

        // ئەگەر تەواوی ناوەڕۆکەکە تەنها لینک بوو
        if (content.startsWith("http")) return content;
      }
    }

    throw new Error("وێنە دروست نەکرا (No image returned).");

  } catch (error:
