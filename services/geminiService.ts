// OpenRouter Service - Smart Two-Step Process (High Quality)
// Step 1: Analyze Cloth with Pro Model
// Step 2: Generate Image with Flash Model

const OPENROUTER_API_KEY = "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";
const SITE_URL = "https://vercel.com"; 
const SITE_NAME = "Kurdish Virtual Try-On";

// Helper to convert File to Base64
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
    onProgress("ئامادەکردنی وێنەکان...");
    const faceBase64 = await fileToBase64(faceFile);
    const clothBase64 = await fileToBase64(clothFile);

    // ============================================================
    // STEP 1: THE BRAIN (Analyze the cloth using a PRO model)
    // ============================================================
    onProgress("قۆناغی یەکەم: شیکارکردنی وردی جلوبەرگ..."); 

    const analysisResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-pro-exp-02-05:free", // مۆدێلی زیرەک بۆ وەسفکردن
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Analyze this clothing image in EXTREME detail. Describe the fabric texture, pattern, specific colors, collar style, sleeve length, and fit. Be technical like a fashion designer. Return ONLY the description."
              },
              {
                "type": "image_url",
                "image_url": { "url": clothBase64 }
              }
            ]
          }
        ]
      })
    });

    const analysisData = await analysisResponse.json();
    const clothDescription = analysisData.choices?.[0]?.message?.content || "A stylish outfit";
    console.log("Cloth Analysis:", clothDescription); // بۆ ئەوەی بزانیت چۆن وەسفی کردووە

    // ============================================================
    // STEP 2: THE ARTIST (Generate Image using the Description)
    // ============================================================
    onProgress("قۆناغی دووەم: دروستکردنی وێنەکە...");

    const generateResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-exp:free", // مۆدێلی وێنە (نوێترین ڤێرژن)
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": `Generate a high-quality, photorealistic fashion photo of a ${gender === 'نێر' ? 'man' : 'woman'}.
                
                FACE REQUIREMENT:
                - You MUST use the face from the first image provided.
                
                CLOTHING REQUIREMENT:
                - The person is wearing the clothing described here: ${clothDescription}.
                
                BODY METRICS:
                - Height: ${height}cm, Weight: ${weight}kg.
                
                STYLE:
                - Professional studio lighting, 4K resolution, highly detailed texture.
                - Natural standing pose.
                
                Output ONLY the image.`
              },
              {
                "type": "image_url",
                "image_url": { "url": faceBase64 } // Face Reference
              }
              // Note: We rely on the description now, but we can also send the cloth image again as reference if needed
            ]
          }
        ]
      })
    });

    const result = await generateResponse.json();
    
    // ============================================================
    // EXTRACT IMAGE (Robust Method)
    // ============================================================
    if (result.choices && result.choices.length > 0) {
      const message = result.choices[0].message;
      const content = message.content;

      // 1. Check for Direct Image (DALL-E style)
      // @ts-ignore
      if (message.images && message.images.length > 0) {
         // @ts-ignore
         return message.images[0].image_url.url;
      }

      if (content) {
        // 2. Check for Markdown Image
        const mdMatch = content.match(/\!\[.*?\]\((.*?)\)/);
        if (mdMatch) return mdMatch[1];

        // 3. Check for HTML Image
        const htmlMatch = content.match(/src="(.*?)"/);
        if (htmlMatch) return htmlMatch[1];

        // 4. Check for Raw URL
        const urlMatch = content.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) return urlMatch[1].replace(/[\)\]"\.]+$/, "");
        
        // 5. Check for Base64
        if (content.includes("data:image")) {
            const base64Match = content.match(/data:image\/[^;]+;base64,[^")\s]+/);
            if (base64Match) return base64Match[0];
        }
      }
    }

    throw new Error("وێنە دروست نەکرا. تکایە دووبارە هەوڵبدەرەوە.");

  } catch (error: any) {
    console.error("Smart Gen Error:", error);
    throw new Error("کێشەیەک ڕوویدا. تکایە دڵنیابەرەوە ئینتەرنێتەکەت باشە.");
  }
};
