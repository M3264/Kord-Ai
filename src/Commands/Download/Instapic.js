const gifted = require('gifted-dls');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    usage: ["instapic", "igpic", "instadlpic"],
    desc: "Download Instagram pictures",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    emoji: "📥",

    async execute(sock, m, args) {
        if (!args[0]) {
            return await global.kord.reply(m, 'Please provide an Instagram post URL to download.');
        }

        const url = args[0];
        await global.kord.reply(m, '> *✨`Loading..`💨*');

        try {
            // Fetch media data using gifted-dls
            const data = await gifted.giftedigdl(url);
            
            if (!data || data.status !== 200) {
                return await global.kord.reply(m, '❌ Could not retrieve media data. Please check the provided Instagram URL.');
            }

            // Try thumbnail first since we want images only
            const downloadUrl = data.result.thumbnail;
            if (!downloadUrl) {
                return await global.kord.reply(m, '❌ No image URL found in the response.');
            }

            // Fetch the media content
            const mediaResponse = await fetch(downloadUrl);
            if (!mediaResponse.ok) {
                return await global.kord.reply(m, '❌ Failed to download the image from Instagram.');
            }

            const mediaBuffer = await mediaResponse.buffer();
            const fileName = `instagram_${Date.now()}.jpg`;
            const filePath = path.join(__dirname, '../tmp/', fileName);

            // Ensure the directory exists
            try {
                await fs.access(path.dirname(filePath));
            } catch {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
            }

            // Write the file to the temporary directory
            await fs.writeFile(filePath, mediaBuffer);

            // Send the image with the specific caption
            await global.kord.sendImage(m, filePath, '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™');

            // Clean up the file after sending
            await fs.unlink(filePath);

        } catch (error) {
            console.error('Error in Instagram downloader command:', error);
            await global.kord.reply(m, '❌ An error occurred while downloading the Instagram image.');
        }
    }
};