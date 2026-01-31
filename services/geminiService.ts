// OpenRouter Service - Robust Version (Fixed Image Extraction)
// Model: google/gemini-2.5-flash-image

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

    onProgress("دروستکردنی وێنە (چاوەڕێ بە)...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image",
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": `Create a photorealistic fashion image. 
                Person: ${gender === 'نێر' ? 'man' : 'woman'} with the provided face.
                Clothing: Wear the provided clothing item.
                Body: ${height}cm, ${weight}kg.
                Output ONLY the image.`
              },
              { "type": "image_url", "image_url": { "url": faceBase64 } },
              { "type": "image_url", "image_url": { "url": clothBase64 } }
            ]
          }
        ]
      })
    });

    const result = await response.json();
    console.log("FULL API RESPONSE:", JSON.stringify(result, null, 2)); // سەیری کۆنسۆڵ بکە بۆ دیتنی وەڵامەکە

    // پشکنینی هەڵە لەلایەن OpenRouter
    if (result.error) {
       // ئەگەر پارە نەما یان کێشە هەبوو، لێرە پێت دەڵێت
       throw new Error(`هەڵەی مۆدێل: ${result.error.message}`);
    }

    // گەڕان بەدوای وێنەکەدا بە هەموو شێوازێک
    if (result.choices && result.choices.length > 0) {
      const message = result.choices[0].message;
      const content = message.content;

      // 1. ئەگەر ڕاستەوخۆ وێنە بێت (DALL-E Style)
      // @ts-ignore
      if (message.images && message.images.length > 0) {
         // @ts-ignore
         return message.images[0].image_url.url;
      }

      if (content) {
        // 2. ئەگەر لینک بێت لە شێوەی Markdown: ![text](url)
        const mdMatch = content.match(/\!\[.*?\]\((.*?)\)/);
        if (mdMatch) return mdMatch[1];

        // 3. ئەگەر لینک بێت لە شێوەی HTML: src="url"
        const htmlMatch = content.match(/src="(.*?)"/);
        if (htmlMatch) return htmlMatch[1];

        // 4. ئەگەر تەنها لینکێکی سادە بێت (http...)
        const urlMatch = content.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) {
            // پاککردنەوەی لینکەکە لە خاڵ و کەوانە
            return urlMatch[1].replace(/[\)\]"\.]+$/, "");
        }
        
        // 5. ئەگەر Base64 بێت
        if (content.includes("data:image")) {
            const base64Match = content.match(/data:image\/[^;]+;base64,[^")\s]+/);
            if (base64Match) return base64Match[0];
        }

        // ئەگەر تێکست هاتەوە بەڵام وێنەی تێدا نەبوو (Refusal)
        console.warn("تێکست هاتەوە بەڵام وێنە نەبوو:", content);
        throw new Error("مۆدێلەکە تەنها نووسینی نارد. تکایە دووبارە هەوڵبدەرەوە.");
      }
    }

    throw new Error("هیچ وێنەیەک لە وەڵامەکەدا نەدۆزرایەوە.");

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "کێشەیەک ڕوویدا.");
  }
};
