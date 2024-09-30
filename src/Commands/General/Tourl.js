const axios = require('axios');
const fs = require('fs'); // Regular fs for streams
const fsPromises = require('fs').promises; // Promise-based fs for async operations
const path = require('path');
const os = require('os');
const FormData = require('form-data');

module.exports = {
    usage: ["tourl"],
    desc: "Upload media files and get URLs.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🔗",

    async execute(sock, m, args) {
        let tempFilePath;
        let mediaBuffer;
        let fileExtension;

        try {
            // Check if the message is quoted
            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                const quotedMedia = await global.kord.downloadQuotedMedia(m);

                if (quotedMedia) {
                    mediaBuffer = quotedMedia.buffer;
                    fileExtension = quotedMedia.extension; // Get the file extension
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the quoted media.");
                }
            } else {
                // No quoted message, download media from the main message
                const mediaMsg = await global.kord.downloadMediaMsg(m);

                if (mediaMsg) {
                    mediaBuffer = mediaMsg.buffer;
                    fileExtension = mediaMsg.extension; // Get the file extension
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the media.");
                }
            }

            // Create a temporary file path
            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);

            // Save the media to the temp file
            await fsPromises.writeFile(tempFilePath, mediaBuffer);
            console.log("File downloaded to:", tempFilePath);

            // Upload to the API
            const formData = new FormData();
            formData.append('file', fs.createReadStream(tempFilePath)); // Use regular fs for streams

            const response = await axios.post('https://itzpire.com/tools/upload', formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            });

            const result = response.data;

            if (result.status === 'success') {
                const { url, downloadUrl, deleteUrl } = result.fileInfo;
                // Send the URLs back in the message
                const message = `🔗 *Upload Successful!*\n\n` +
                                `🌐 *File URL:* ${url}\n` +
                                `⬇️ *Download URL:* ${downloadUrl}\n` +
                                `🗑️ *Delete URL:* ${deleteUrl}`;
                await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });
            } else {
                throw new Error('Upload failed: ' + (result.message || 'Unknown error'));
            }

        } catch (error) {
            console.error("Error in tourl command:", error.response ? error.response.data : error.message);

            // Send error message
            if (error.response) {
                await sock.sendMessage(m.key.remoteJid, { text: `🤖 Oops! Something went wrong.\n\nError: ${error.response.data.message || error.message}` }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: `🤖 Oops! Something went wrong.\n\nError: ${error.message}` }, { quoted: m });
            }
        } finally {
            // Clean up: delete the temporary file
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
