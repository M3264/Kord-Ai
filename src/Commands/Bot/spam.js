module.exports = {
    usage: ["spam"],
    desc: "Send a message multiple times.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📨",

    async execute(sock, m, args) {
        try {
            // Get quoted text if present
            let message = await global.kord.getQuotedText(m);

            // Check if there's provided text (when there's no quoted message)
            if (!message) {
                // Split args based on the '|' separator
                const input = args.join(" ").split("|");
                
                if (input.length < 2) {
                    return await global.kord.reply(m, "❌ Please provide a message and the number of times to send it.\n\nExample: `.spam Hello | 30`");
                }

                // Assign message and count from input
                message = input[0].trim();
                count = parseInt(input[1].trim());
            } else {
                // If there is quoted text, use args as count
                count = parseInt(args[0]);
            }

            if (!count || isNaN(count) || count < 1) {
                return await global.kord.reply(m, "❌ Please provide a valid number of times to send the message.");
            }

            // Send the message the specified number of times
            for (let i = 0; i < count; i++) {
                await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });
            }

        } catch (error) {
            console.error("Error in spam command:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `🤖 Oops! Something went wrong.\n\nError: ${error.message}` }, { quoted: m });
        }
    }
};
