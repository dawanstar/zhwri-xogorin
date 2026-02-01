// OpenRouter Service - Advanced Hybrid Model Approach
// Step 1: Analysis using google/gemini-2.5-pro (The Brain)
// Step 2: Generation using google/gemini-2.5-flash-image (The Artist)

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
    onProgress("ئامادەکردنی فایلەکان...");
    const faceBase64 = await fileToBase64(faceFile);
    const clothBase64 = await fileToBase64(clothFile);

    // ============================================================
    // STEP 1: ENHANCED PROMPT ANALYSIS (Gemini 2.5 Pro)
    // شیکارکردنی هەردوو وێنەکە (ڕووخسار و جل) بۆ دەرهێنانی وردەکارییەکان
    // ============================================================
    onProgress("شیکارکردنی زیرەک (Gemini 2.5 Pro)..."); 

    const analysisResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-pro", // مۆدێلی ژمارە ١: بۆ تێگەیشتن
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": `You are an expert fashion photographer and AI prompt engineer. 
                I will provide two images:
                1. A reference face image.
                2. A reference clothing image.
                
                YOUR TASK:
                Analyze BOTH images in extreme detail. 
                - Describe the person's key facial features, skin tone, hair style, and lighting in the first image.
                - Describe the clothing's fabric, texture, folds, logo, zipper/buttons, and fit in the second image.
                - Combine these into a single, highly descriptive prompt that an image generator can use to reconstruct this person wearing this cloth.
                
                Return ONLY the enhanced prompt description.`
              },
              {
                "type": "image_url",
                "image_url": { "url": faceBase64 } // وێنەی یەکەم: فەیس
              },
              {
                "type": "image_url",
                "image_url": { "url": clothBase64 } // وێنەی دووەم: جل
              }
            ]
          }
        ]
      })
    });

    const analysisData = await analysisResponse.json();
    
    // پشکنین بۆ هەڵە لە مۆدێلی یەکەم
    if (analysisData.error) {
         console.error("Pro Analysis Error:", analysisData.error);
         // ئەگەر 2.5 Pro کێشەی هەبوو، بەردەوام دەبین بە وەسفێکی گشتی تا پڕۆسەکە نەوەستێت
    }
    
    const detailedPrompt = analysisData.choices?.[0]?.message?.content || "A person wearing this outfit";
    console.log("Analysis Result:", detailedPrompt);

    // ============================================================
    // STEP 2: IMAGE GENERATION (Gemini 2.5 Flash Image)
    // دروستکردنی وێنەی کۆتایی بە بەکارهێنانی شیکارەکە + وێنەکان
    // ============================================================
    onProgress("دروستکردنی وێنە (Gemini 2.5 Flash Image)...");

    const generateResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image", // مۆدێلی ژمارە ٢: بۆ وێنەکێشان
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": `Generate a photorealistic 4K fashion shot based on this description: ${detailedPrompt}.
                
                REQUIREMENTS:
                - Subject: A ${gender === 'نێر' ? 'man' : 'woman'} with the EXACT face from the first image provided.
                - Attire: Wearing the EXACT clothing from the second image provided.
                - Body Stats: Height ${height}cm, Weight ${weight}kg.
                - Style: Professional full-body shot, natural pose, highly detailed texture.
                - IMPORTANT: The output must be the image only.`
              },
              {
                "type": "image_url",
                "image_url": { "url": faceBase64 } // ناردنەوەی وێنەی فەیس بۆ دیقەتی زیاتر
              },
              {
                "type": "image_url",
                "image_url": { "url": clothBase64 } // ناردنەوەی وێنەی جل بۆ دیقەتی زیاتر
              }
            ]
          }
        ]
      })
    });

    const result = await generateResponse.json();
    console.log("Generation Result:", result);

    // ============================================================
    // EXTRACTION LOGIC (هەمان لۆژیکی زیرەک بۆ دەرهێنانی وێنە)
    // ============================================================
    if (result.choices && result.choices.length > 0) {
      const message = result.choices[0].message;
      
      // 1. Check for DALL-E style image array (هەندێک جار وایە)
      // @ts-ignore
      if (message.images && message.images.length > 0) {
         // @ts-ignore
         return message.images[0].image_url.url;
      }

      // 2. Check content string (زۆربەی کات وایە)
      const content = message.content;
      if (content) {
        // Markdown Match
        const mdMatch = content.match(/\!\[.*?\]\((.*?)\)/);
        if (mdMatch) return mdMatch[1];

        // HTML Match
        const htmlMatch = content.match(/src="(.*?)"/);
        if (htmlMatch) return htmlMatch[1];

        // Raw URL Match
        const urlMatch = content.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) return urlMatch[1].replace(/[\)\]"\.]+$/, "");

        // Base64 Match
        if (content.includes("data:image")) {
           const base64Match = content.match(/data:image\/[^;]+;base64,[^")\s]+/);
           if (base64Match) return base64Match[0];
        }
      }
    }

    if (result.error) {
        throw new Error(`Generation Error: ${result.error.message}`);
    }

    throw new Error("وێنە دروست نەکرا. تکایە دووبارە هەوڵبدەرەوە.");

  } catch (error: any) {
    console.error("Try-On Process Error:", error);
    throw new Error(error.message || "کێشەیەک ڕوویدا لە کاتی پەیوەندی کردن بە سێرڤەر.");
  }
};
