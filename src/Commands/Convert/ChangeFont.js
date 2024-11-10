const fancyScriptFonts = require('../../Plugin/kordFonts'); // Adjust the path if needed


for (const [fontName, fontMap] of Object.entries(fancyScriptFonts)) {
    module.exports = {
        usage: [fontName],
        desc: `Converts text to ${fontName} style.`,
        commandType: "Font", // or any suitable category
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "✍️",

        async execute(sock, m, args) {
            try {
                const text = args.join(' ');
                if (!text) {
                    return await kord.reply(m, 'Please provide text to convert.');
                }

                const convertedText = [...text].reduce((acc, char) => acc + (fontMap[char] || char), '');
                await kord.reply(m, convertedText); // Send converted text using kord.reply
            } catch (error) {
                console.error(`Error executing ${fontName} command:`, error.message);
                await kord.reply(m, 'An error occurred while converting the text. Please try again later.');
            }
        }
    };
}

