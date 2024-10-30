const anime = require('@kazesolo/toanime');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    usage: ["toanime"],
    desc: "Transform an image to anime style using AI and upload to Litterbox",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        let tempFilePath;
        let mediaBuffer;
        let fileExtension;

        try {
            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                const quotedMedia = await global.kord.downloadQuotedMedia(m);

                if (quotedMedia) {
                    mediaBuffer = quotedMedia.buffer;
                    fileExtension = quotedMedia.extension; 
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the quoted media.");
                }
            } else {
                return await global.kord.reply(m, "❌ Please quote an image to transform.");
            }

            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);
            fs.writeFileSync(tempFilePath, mediaBuffer);

            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('time', '24h');
            formData.append('fileToUpload', fs.createReadStream(tempFilePath));

            const uploadResponse = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            });

            const uploadResult = uploadResponse.data;

            if (uploadResult.startsWith('https://')) {
                const data = await anime.transform({
                    photo: uploadResult
                });

                if (data && data.url) {
                    await global.kord.reply(m, `✅ Here's your anime-style image: ${data.url}`);
                } else {
                    await global.kord.reply(m, "❌ Failed to transform the image.");
                }

            } else {
                await global.kord.reply(m, "❌ Failed to upload to Litterbox.");
            }

        } catch (error) {
            console.error('Error in toanime command:', error);
            await global.kord.reply(m, `❌ An error occurred: ${error.message}`);
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }
};