const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    usage: ["upload"],
    desc: "Upload quoted media to Catbox and return the link",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "⬆️",

    async execute(sock, m, args) {
        let tempFilePath;
        let mediaBuffer;
        let fileExtension;

        try {
            // Check if the message contains quoted media
            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                const quotedMedia = await global.kord.downloadQuotedMedia(m);

                if (quotedMedia) {
                    mediaBuffer = quotedMedia.buffer;
                    fileExtension = quotedMedia.extension; // Get the file extension
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the quoted media.");
                }
            } else {
                // If there's no quoted message, download media from the main message
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

            // Write the buffer to a temporary file
            fs.writeFileSync(tempFilePath, mediaBuffer);

            // Prepare form data for the upload request
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', fs.createReadStream(tempFilePath));

            // Make the POST request to Catbox using axios
            const uploadResponse = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            });

            // Log the full response for debugging
            console.log('Upload Response:', uploadResponse.data);

            const uploadResult = uploadResponse.data;

            if (uploadResult.startsWith('https://')) {
                await global.kord.reply(m, `✅ Uploaded to Catbox: ${uploadResult}`);
            } else {
                await global.kord.reply(m, "❌ Failed to upload to Catbox.");
            }

        } catch (error) {
            console.error('Error uploading to Catbox:', error);
            await global.kord.reply(m, `❌ An error occurred during upload: ${error.message}`);
        } finally {
            // Clean up the temporary file if it exists
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }
};
