require('dotenv').config();

async function listMyModels() {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY; // Checks both common names

    if (!apiKey) {
        console.error("❌ No API Key found in .env");
        return;
    }

    console.log("📡 Asking Google for available models...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
        } else if (data.models) {
            console.log("\n✅ SUCCESS! You can use these model names in your code:");
            console.log("------------------------------------------------");
            // Filter only for models that generate text
            const textModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            textModels.forEach(model => {
                console.log(`"${model.name.replace('models/', '')}"`);
            });
            console.log("------------------------------------------------");
        }
    } catch (error) {
        console.error("❌ Connection Error:", error);
    }
}

listMyModels();