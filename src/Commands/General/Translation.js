const translate = require('@iamtraction/google-translate');
const iso6391 = require('iso-639-1'); // For language name resolution

module.exports = {
    usage: ["trt", "translate"],
    desc: "Translates the quoted message. Detects source language if not specified.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🌐",

    async execute(sock, m, args) {
        try {
            const quotedMessage = await kord.getQuotedText(m);

            if (!quotedMessage) {
                return kord.reply(m, "❌ No quoted message to translate.");
            }

            // Language detection and handling
            let targetLangCode = args[0]?.toLowerCase();
            let sourceLangName = "";

            if (!targetLangCode) {
                // Use the translate function itself for detection
                const translationResult = await translate(quotedMessage); 
                sourceLangName = iso6391.getName(translationResult.from.language.iso);
                targetLangCode = 'en'; // Default target if not specified
            } else {
                if (!iso6391.validate(targetLangCode)) {
                    return kord.reply(m, "❌ Invalid language code. Use ISO 639-1 codes (e.g., 'en', 'es', 'fr').");
                }
            }

            const translationResult = await translate(quotedMessage, { to: targetLangCode });
            const targetLangName = iso6391.getName(targetLangCode);

            // Formatted response (same as before)
            const response = `
*Original (${sourceLangName || "auto-detected"}):* ${quotedMessage}

*Translation (${targetLangName}):* ${translationResult.text}
`;

            await kord.reply(m, response);
        } catch (error) {
            console.error("Translation error:", error);

            if (error.code === 429) { // Specifically handle rate limiting
                await kord.reply(m, "❌ Translation rate limit exceeded. Try again later.");
            } else {
                await kord.reply(m, "❌ An error occurred during translation. Please try again.");
            }
        }
    }
};
