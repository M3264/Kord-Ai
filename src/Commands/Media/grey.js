const fetch = require('node-fetch');

module.exports = {
    usage: ["grey", "grayscale"],
    desc: "Apply a grayscale effect to an image.",
    commandType: "Image Editing",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖤",

    async execute(sock, m, args) {
        try {
            // Get the image URL from a quoted message or from args
            let imageUrl = '';
            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                // Extract image from the quoted message
                imageUrl = await kord.getQuotedMedia(m);
            } else if (args.length > 0) {
                imageUrl = args[0]; // Image URL provided in the command
            } else {
                return kord.reply(m, "❌ Please provide an image URL or quote an image.");
            }

            // API call to apply grayscale
            const apiUrl = `https://api.popcat.xyz/greyscale?image=${encodeURIComponent(imageUrl)}`;
            await kord.sendImage(m, apiUrl, "> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™");

        } catch (error) {
            console.error('Error applying grayscale:', error.message);
            await kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};
