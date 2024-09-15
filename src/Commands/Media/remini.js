const { remini } = require('../../Plugin/remini');

module.exports = {
    usage: ["remini"],
    desc: "Enhance an image using Remini AI.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        try {
            // Extract media from quoted message
            const quotedMedia = await global.kord.getQuotedMedia(m);
            const media = quotedMedia ? await quotedMedia.download() : null;

            // If no media found in quoted message, check if the command was used with an image caption
            const { mime } = m.message;
            if (!media && /image/.test(mime)) {
                media = await m.download();
            }

            // If still no media found, return an error message
            if (!media) {
                return await global.kord.reply(m, 'Where is the picture? Please reply to an image or send an image with the command.');
            }

            // Inform the user that the process has started
            await global.kord.reply(m, '🛠️ Processing the image, please wait...');
            const enhancedImage = await remini(media, 'enhance');
            if (!enhancedImage) {
                return await global.kord.reply(m, '❌ Failed to enhance the image. Please try again.');
            }

            // Send the enhanced image to the chat
            await sock.sendMessage(m.key.remoteJid, { image: enhancedImage, caption: 'Here’s your enhanced media!' }, { quoted: m });

        } catch (error) {
            console.error('Error in remini command:', error);

            // Notify the user
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Oops! Something went wrong.\n\nError: ${error.message}` }, { quoted: m });
        }
    }
};