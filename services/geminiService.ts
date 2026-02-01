// OpenRouter Service - High Fidelity Replication of Original Logic
// Step 1: Brain (Gemini 2.0 Pro) -> Step 2: Artist (Gemini 2.0 Flash)

const OPENROUTER_API_KEY = "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";
const SITE_URL = "https://vercel.com"; 
const SITE_NAME = "Kurdish Virtual Try-On";

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

    // ==========================================
    // STEP 1: Deep Analysis (The "Brain")
    // Model: google/gemini-2.0-pro-exp-02-05:free
    // ==========================================
    onProgress("شیکارکردنی وردی جلوبەرگ (Pro Model)..."); 

    const analysisResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-pro-exp-02-05:free", // بەهێزترین مۆدێلی بەلاش بۆ تێگەیشتن
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                // This prompt is copied from your ORIGINAL code for maximum detail
                "text": "Analyze this image of clothing in extreme detail. Describe the type of clothing, the fabric texture, the color, the pattern, the cut, and the fit. Do not include any intro or outro text, just the description."
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

    if (!analysisResponse.ok) throw new Error("Analysis failed: " + analysisResponse.statusText);
    const analysisData = await analysisResponse.json();
    const clothDescription = analysisData.choices?.[0]?.message?.content || "Modern fashion outfit";
    
    // ==========================================
    // STEP 2: Image Generation (The "Artist")
    // Model: google/gemini-2.0-flash-exp:free (Best Free Image Gen)
    // ==========================================
    onProgress("دروستکردنی وێنەی کۆتایی (High Quality)...");

    const generateResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-exp:free", // ئەم مۆدێلە لە ئێستادا باشترینە بۆ وێنە لە OpenRouter
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                // Exact prompt structure from your ORIGINAL code
                "text": `Generate a high-quality, photorealistic full-body image of a ${gender === 'نێر' ? 'man' : 'woman'}.
                The person has the face provided in the first image.
                The person is wearing the clothing described as: ${clothDescription}.
                The person's body proportions correspond to a height of ${height}cm and a weight of ${weight}kg.
                The pose should be natural, standing, showcasing the outfit clearly.
                Ensure the lighting is professional fashion studio lighting.
                Output ONLY the image.`
              },
              {
                "type": "image_url",
                "image_url": { "url": faceBase64 } // Face Reference
              }
            ]
          }
        ]
      })
    });

    if (!generateResponse.ok) throw new Error("Generation failed: " + generateResponse.statusText);
    const result = await generateResponse.json();
    console.log("Generation Result:", result);

    // ==========================================
    // EXTRACT IMAGE (Improved Safety Logic)
    // ==========================================
    if (result.choices && result.choices.length > 0) {
      const message = result.choices[0].message;
      
      // 1. Check for DALL-E style image array
      // @ts-ignore
      if (message.images && message.images.length > 0) {
         // @ts-ignore
         return message.images[0].image_url.url;
      }

      // 2. Check content string
      const content = message.content;
      if (content) {
        // Markdown image
        const mdMatch = content.match(/\!\[.*?\]\((.*?)\)/);
        if (mdMatch) return mdMatch[1];

        // HTML image
        const htmlMatch = content.match(/src="(.*?)"/);
        if (htmlMatch) return htmlMatch[1];

        // Raw URL (http/https)
        const urlMatch = content.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) return urlMatch[1].replace(/[\)\]"\.]+$/, "");

        // Base64
        if (content.includes("data:image")) {
           const base64Match = content.match(/data:image\/[^;]+;base64,[^")\s]+/);
           if (base64Match) return base64Match[0];
        }
      }
    }

    throw new Error("وێنە دروست نەکرا (No valid image found in response).");

  } catch (error: any) {
    console.error("Try-On Error:", error);
    throw new Error(error.message || "کێشەیەک ڕوویدا. تکایە دووبارە هەوڵبدەرەوە.");
  }
};
