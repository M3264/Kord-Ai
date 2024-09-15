const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const mime = require('mime-types');

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

        try {
            // Get the quoted media using Kord.getQuotedMedia
            const mediaData = await global.kord.getQuotedMedia(m);
            
            // If no media found
            if (!mediaData) {
                return await global.kord.reply(m, "🔗 Please provide a media file to upload.");
            }

            // Download media from the message
            const mediaBuffer = await downloadMediaMessage(mediaData.message, 'buffer');
            if (!mediaBuffer) {
                return await global.kord.reply(m, "❌ Failed to download the media. Try again.");
            }

            // Determine file extension
            const mediaType = Object.keys(mediaData.message)[0];
            const ext = getFileExtension(mediaType);
            if (!ext) {
                return await global.kord.reply(m, "❌ Unable to determine the file type.");
            }

            // Create a temporary file path
            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${ext}`);

            // Save the media to the temp file
            await fs.writeFile(tempFilePath, mediaBuffer);
            console.log("File downloaded to:", tempFilePath);

            // Upload to the API
            const formData = new FormData();
            formData.append('file', fs.createReadStream(tempFilePath));

            const response = await axios.post('https://api.giftedtechnexus.co.ke/api/tools/upload', formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            });

            const result = response.data;

            if (result.success) {
                const fileUrl = result.result;
                // Send the URL
                await sock.sendMessage(m.key.remoteJid, { text: 'Url: ' + fileUrl }, { quoted: m });
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
                    await fs.unlink(tempFilePath);
                    console.log("Temporary file deleted:", tempFilePath);
                } catch (unlinkError) {
                    console.error("Error deleting temporary file:", unlinkError);
                }
            }
        }
    }
};

// Helper function to determine the file extension based on media type
function getFileExtension(mediaType) {
    switch (mediaType) {
        case 'imageMessage': return 'jpg';
        case 'videoMessage': return 'mp4';
        case 'audioMessage': return 'mp3';
        case 'documentMessage': return 'pdf';
        default: return 'bin';
    }
}