const emojis = {
    intro: '📝',        // Emoji for intro command
    processing: '⏳',
    process: '👾',      // Emoji to show processing
    done: '✅',         // Emoji to indicate completion
    error: '❌'         // Emoji for errors
};

module.exports = {
    usage: ["test"],
    desc: "Send a message word by word.",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.intro, // Emoji metadata

    async execute(sock, m) {
        try {
            await kord.react(m, emojis.processing);
            
            const startTime = Date.now();
            await kord.react(m, emojis.process);
            const latency = Date.now() - startTime;

            const message = `ʜᴇʟʟᴏ👋, ɪ'ᴍ ᴋᴏʀᴅ ᴀɪ💨\nʏᴏᴜʀ ᴀʟʟ ɪɴ ᴏɴᴇ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ ᴜsɪɴɢ ᴡʜɪsᴋᴇʏsᴏᴄᴋᴇᴛs ʙᴀɪʟᴇʏs!\nʟᴀᴛᴇɴᴄʏ => *${latency}ms* \nᴜsᴇ _.ᴍᴇɴᴜ_ ᴛᴏ sᴇᴇ ᴡʜᴀᴛ ɪ ᴄᴀɴ ᴅᴏ!🚀`;
            const words = message.split(/\s+/);
            let fullMessage = '';

            // Send the initial message
            const sentMsg = await kord.reply(m, ""); // Send an initial empty message to get the message ID
            
            for (const word of words) {
                fullMessage += word + ' ';
                await kord.editMsg(m, sentMsg, fullMessage.trim()); // Update message content word by word
                await new Promise(resolve => setTimeout(resolve, 100)); // Delay between words (100ms)
            }

            await kord.react(m, emojis.done); // Reaction to indicate completion
        } catch (error) {
            await kord.react(m, emojis.error); // Reaction to indicate an error
            console.error('Error executing intro command:', error);
            await kord.reply(m, "❌ An error occurred while sending the message.");
        }
    }
};
