const { remini } = require('../../Plugin/remini');
const fs = require('fs'); // Regular fs for streams
const fsPromises = require('fs').promises; // Promise-based fs for async operations
const path = require('path');
const os = require('os');

module.exports = {
    usage: ["remini"],
    desc: "Enhance an image using Remini AI.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "✨",

    async execute(sock, m, args) {
        let tempFilePath;

        try {
            // Extract media from quoted message using kord.getQuotedMedia
            const mediaData = await global.kord.getQuotedMedia(m);

            // If no media found, return an error
            if (!mediaData) {
                return await global.kord.reply(m, '❌ Please reply to an image to enhance it.');
            }

            // Download the media
            const mediaBuffer = await global.kord.downloadMediaMsg(m);
            if (!mediaBuffer) {
                return await global.kord.reply(m, '❌ Failed to download the media. Try again.');
            }

            // Create a temporary file path
            const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.jpg`);

            // Save the media to a temporary file
            await fsPromises.writeFile(tempFilePath, mediaBuffer);
            console.log("Media saved to:", tempFilePath);

            // Inform the user that the enhancement process has started
            await global.kord.reply(m, '🛠️ Enhancing the image, please wait...');

            // Process the image using the Remini API
            const enhancedImage = await remini(tempFilePath, 'enhance');
            console.log(enhancedImage);
            if (!enhancedImage) {
                return await global.kord.reply(m, '❌ Failed to enhance the image. Please try again.');
            }

            // Send the enhanced image to the chat
            await sock.sendMessage(m.key.remoteJid, { image: enhancedImage, caption: 'Here’s your enhanced media!' }, { quoted: m });

        } catch (error) {
            console.error('Error in remini command:', error);

            // Notify the user about the error
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Oops! Something went wrong.\n\nError: ${error.message}` }, { quoted: m });
        } finally {
            // Clean up: delete the temporary file if it exists
            if (tempFilePath) {
                try {
                    await fsPromises.unlink(tempFilePath);
                    console.log("Temporary file deleted:", tempFilePath);
                } catch (unlinkError) {
                    console.error("Error deleting temporary file:", unlinkError);
                }
            }
        }
    }
};
