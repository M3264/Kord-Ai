const emojis = {
    intro: '📝',        // Emoji for intro command
    processing: '⏳',   // Emoji to show processing
    done: '✅',         // Emoji to indicate completion
    error: '❌'         // Emoji for errors
};

module.exports = {
    usage: ["intro"],
    desc: "Send a message letter by letter.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.intro, // Emoji metadata

    async execute(sock, m) {
        try {
            await kord.react(m, emojis.processing); // Initial reaction

            const message = "Hello👋, I'm Kord Ai💨";
            let fullMessage = '';

            // Send the initial message
            const sentMsg = await kord.reply(m, ""); // Send an initial empty message to get the message ID
            
            for (const letter of message) {
                fullMessage += letter;
                await kord.editMsg(m, sentMsg, fullMessage); // Update message content letter by letter
                await new Promise(resolve => setTimeout(resolve, 1)); // Delay between letters
            }

            await kord.react(m, emojis.done); // Reaction to indicate completion
        } catch (error) {
            await kord.react(m, emojis.error); // Reaction to indicate an error
            console.error('Error executing intro command:', error);
            await kord.reply(m, "❌ An error occurred while sending the message.");
        }
    }
};