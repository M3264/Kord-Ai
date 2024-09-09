const { TelegraPh, UploadFileUgu, webp2mp4File, floNime } = require('../../Plugin/uploader'); // Adjust the path as needed
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { fromBuffer } = require('file-type');
const fs = require('fs');

module.exports = {
    usage: ["tourl"],
    desc: "Upload media files and get URLs.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🔗",

    async execute(sock, m, args) {
        try {
            const { quoted, body } = m;

            // Check if the message has media attached or is quoting media
            const mediaMessage = quoted ? quoted.message : m.message;
            if (!mediaMessage || !mediaMessage.imageMessage && !mediaMessage.videoMessage && !mediaMessage.documentMessage) {
                return await global.kord.reply(m, "🔗 Please provide a media file to upload.");
            }

            // Download media from the message
            const mediaBuffer = await downloadMediaMessage(mediaMessage, 'buffer'); // Download as buffer
            if (!mediaBuffer) {
                return await global.kord.reply(m, "❌ Failed to download the media. Try again.");
            }

            // Determine file type
            const { ext } = await fromBuffer(mediaBuffer) || {};
            if (!ext) {
                return await global.kord.reply(m, "❌ Unable to determine the file type.");
            }

            let url;
            // Process the media based on file type
            if (ext === 'webp') {
                const result = await webp2mp4File(mediaBuffer);
                url = result.result;
            } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                // Upload images to Telegra.ph
                const tempPath = `./temp/image_${Date.now()}.${ext}`;
                fs.writeFileSync(tempPath, mediaBuffer);
                url = await TelegraPh(tempPath);
                fs.unlinkSync(tempPath); // Clean up temporary file
            } else if (['mp4', 'gif'].includes(ext)) {
                // Upload videos/gifs to Uguu
                const tempPath = `./temp/video_${Date.now()}.${ext}`;
                fs.writeFileSync(tempPath, mediaBuffer);
                url = await UploadFileUgu(tempPath);
                fs.unlinkSync(tempPath); // Clean up temporary file
            } else if (['mp4', 'webm'].includes(ext)) {
                // Upload to Flonime for video files
                const tempPath = `./temp/video_${Date.now()}.${ext}`;
                fs.writeFileSync(tempPath, mediaBuffer);
                const result = await floNime(mediaBuffer);
                url = result.result;
                fs.unlinkSync(tempPath); // Clean up temporary file
            } else {
                return await global.kord.reply(m, "❌ Unsupported file type.");
            }

            // Send the URL
            await global.kord.reply(m, `Here is your URL: ${url}`);

        } catch (error) {
            await global.kord.react(m, '❌');
            console.error("Error in tourl command:", error);
            await global.kord.reply(m, "🤖 Oops! Something went wrong. Please try again.");
        }
    }
};