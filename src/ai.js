import { getConfig } from "./config.js";
import { getProviderConfig } from "./provider.js";

export async function generateAIResponse(messages, overrideConfig = null) {
    const config = overrideConfig || getConfig();

    if (!config || !config.apiKey) {
        throw new Error("API Key not found. Please run 'ryte config' or follow the setup flow.");
    }

    const providerName = config.provider || "openai";
    const pConfig = getProviderConfig(providerName, config.baseUrl);

    const apiUrl = pConfig.url;
    const apiKey = config.apiKey;
    const model = config.model || pConfig.model;

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
                const retryAfter = parseInt(response.headers.get("retry-after") || "15", 10);
                const waitSeconds = retryAfter + 1;

                for (let i = waitSeconds; i > 0; i--) {
                    process.stdout.write(`\r\x1b[33m⚠ Rate limit hit. Waiting ${i}s before retry (${attempt}/${MAX_RETRIES})...\x1b[0m`);
                    await new Promise(r => setTimeout(r, 1000));
                }
                process.stdout.write("\r" + " ".repeat(80) + "\r");
                continue;
            }

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error("Invalid response format from AI provider.");
            }

            const content = data.choices[0].message.content;
            if (!content) {
                throw new Error("AI provider returned an empty response.");
            }

            const trimmed = content.trim();

            // Deterministic Internal Contract Prep
            // Currently returns { text: string, structured: Object }
            return parseAICommitMessage(trimmed);
        } catch (e) {
            // Check for network errors (Offline)
            if (e.code === 'ENOTFOUND' || e.code === 'EAI_AGAIN') {
                throw new Error("Network unreachable. Please check your internet connection.");
            }

            if (attempt === MAX_RETRIES) {
                throw e;
            }
        }
    }
}

/**
 * Parses a conventional commit message into a structured object.
 * This is the 'Deterministic Contract' for the engine.
 */
function parseAICommitMessage(text) {
    const lines = text.split("\n");
    const header = lines[0].trim();

    // Simple regex for conventional commit: type(scope): subject
    const match = header.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);

    return {
        text: text.replace(/\\n/g, '\n'), // The full raw text for legacy compatibility
        structured: {
            header: header,
            type: match ? match[1] : "other",
            scope: match ? match[2] : null,
            subject: match ? match[3] : header,
            body: lines.slice(1).filter(l => l.trim().length > 0).join("\n").trim() || null
        }
    };
}
