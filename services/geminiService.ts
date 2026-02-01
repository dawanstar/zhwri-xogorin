// OpenRouter Service - 100% Original Mechanism Replication
// Models: google/gemini-3-pro-preview & google/gemini-2.5-flash-image

const OPENROUTER_API_KEY = "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";
const SITE_URL = "https://vercel.com"; 
const SITE_NAME = "Kurdish Virtual Try-On";

// Helper to convert File to Base64 (Matches original logic)
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

  try {
    // 0. Prepare Files
    const faceBase64 = await fileToPart(faceFile);
    const clothBase64 = await fileToPart(clothFile);
    
    // Construct Data URLs for OpenRouter (Required format: data:image/png;base64,...)
    const faceDataUrl = `data:${faceFile.type};base64,${faceBase64}`;
    const clothDataUrl = `data:${clothFile.type};base64,${clothBase64}`;

    // ============================================================
    // STEP 1: Analyze the cloth image (EXACT ORIGINAL MECHANISM)
    // Model: google/gemini-3-pro-preview
    // ============================================================
    onProgress("لێکدانەوەی جلوبەرگ..."); 

    // Original Prompt preserved EXACTLY
    const clothAnalysisPrompt = `
    Analyze this image of clothing in extreme detail. 
    Describe the type of clothing, the fabric texture, the color, the pattern, the cut, and the fit.
    Do not include any intro or outro text, just the description.
    `;

    const analysisResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-3-pro-preview", // Requested Model
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": clothAnalysisPrompt
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": clothDataUrl
                }
              }
            ]
          }
        ]
      })
    });

    const analysisResult = await analysisResponse.json();
    
    // Error handling for Step 1
    if (analysisResult.error) {
        console.error("Step 1 Error:", analysisResult.error);
        throw new Error(`Analysis Error: ${analysisResult.error.message}`);
    }

    const clothDescription = analysisResult.choices?.[0]?.message?.content || "Modern clothing";
    console.log("Step 1 Output (Description):", clothDescription);


    // ============================================================
    // STEP 2: Generate the final image (EXACT ORIGINAL MECHANISM)
    // Model: google/gemini-2.5-flash-image
    // ============================================================
    onProgress("دروستکردنی وێنە...");

    // Original Prompt preserved EXACTLY
    const finalPrompt = `
    Generate a high-quality, photorealistic full-body image of a ${gender === 'نێر' ? 'man' : 'woman'}.
    The person has the face provided in the first image (face image).
    The person is wearing the clothing described as: ${clothDescription}.
    The person's body proportions correspond to a height of ${height}cm and a weight of ${weight}kg.
    The pose should be natural, standing, showcasing the outfit clearly.
    Ensure the lighting is professional fashion studio lighting.
    `;

    const imageResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-flash-image", // Requested Model
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": finalPrompt
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": faceDataUrl // Passing face as reference
                }
              }
            ]
          }
        ]
      })
    });

    const imageResult = await imageResponse.json();
    console.log("Step 2 Output (Raw):", imageResult);

    // ============================================================
    // EXTRACT IMAGE (Matches original goal: get the image data)
    // ============================================================
    if (imageResult.choices && imageResult.choices.length > 0) {
      const message = imageResult.choices[0].message;
      const content = message.content;

      // 1. Check for DALL-E style image array (Often used by image models)
      // @ts-ignore
      if (message.images && message.images.length > 0) {
         // @ts-ignore
         return message.images[0].image_url.url;
      }

      // 2. Check content string for URL or Base64
      if (content) {
        // Markdown format ![alt](url)
        const mdMatch = content.match(/\!\[.*?\]\((.*?)\)/);
        if (mdMatch) return mdMatch[1];

        // HTML format src="url"
        const htmlMatch = content.match(/src="(.*?)"/);
        if (htmlMatch) return htmlMatch[1];

        // Raw URL
        const urlMatch = content.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) return urlMatch[1].replace(/[\)\]"\.]+$/, "");

        // Base64 Data
        if (content.includes("data:image")) {
           const base64Match = content.match(/data:image\/[^;]+;base64,[^")\s]+/);
           if (base64Match) return base64Match[0];
        }
      }
    }

    if (imageResult.error) {
        throw new Error(`Generation Error: ${imageResult.error.message}`);
    }

    throw new Error("Failed to generate image. Please try again.");

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "An unknown error occurred.");
  }
};
