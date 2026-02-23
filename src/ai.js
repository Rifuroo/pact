import dotenv from "dotenv";
dotenv.config();

export async function generateAIResponse(messages) {
    const groqKey = process.env.GROQ_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!groqKey && !openAiKey) {
        console.error("Error: Please set either GROQ_API_KEY (for free AI) or OPENAI_API_KEY in your environment variables.");
        process.exit(1);
    }

    const isGroq = !!groqKey;
    const apiKey = isGroq ? groqKey : openAiKey;

    // Groq API is 100% compatible with OpenAI's format! Just changing URL & Model.
    const apiUrl = isGroq
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    // llama-3.1-8b-instant: 14,400 TPM (6x higher than llama-3.3-70b-versatile)
    // Still very capable for commit messages and PR summaries
    const model = isGroq
        ? "llama-3.1-8b-instant"
        : "gpt-4o-mini";

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.5,
                })
            });

            if (response.status === 429) {
                // Rate limited — parse retry-after header or use exponential backoff
                const retryAfter = parseInt(response.headers.get("retry-after") || "15", 10);
                const waitMs = (retryAfter + 1) * 1000;
                console.warn(`\x1b[33m⚠ Rate limit hit. Waiting ${retryAfter + 1}s before retry (${attempt}/${MAX_RETRIES})...\x1b[0m`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || "API request failed");
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (e) {
            if (attempt === MAX_RETRIES) {
                console.error("AI Generation failed:", e.message);
                process.exit(1);
            }
        }
    }
}
