const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    usage: ["insta", "instadl"],
    desc: "Download Instagram media",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    emoji: "📥",

    async execute(sock, m, args) {
        if (!args[0]) {
            return await global.kord.reply(m, 'Please provide an Instagram post URL to download.');
        }

        const url = args[0];
        const apiUrl = `https://api.junn4.my.id/download/instagram?url=${url}`;

        await global.kord.reply(m, '> *✨`Loading..`💨*');

        try {
            // Fetch the download URL from the API
            const data = await response.json();

            // Check if the response contains a valid result URL
            if (!data.result || !data.result.url) {
                return await global.kord.reply(m, '❌ Could not retrieve a valid download URL. Please check the provided Instagram URL.');
            }

            const downloadUrl = data.result.url;

            // Fetch the media content from the download URL
            const mediaResponse = await fetch(downloadUrl);

            // Check if the media fetch request is successful
            if (!mediaResponse.ok) {
                return await global.kord.reply(m, '❌ Failed to download the media from Instagram.');
            }

            const mediaBuffer = await mediaResponse.buffer();
            const fileName = `instagram_${Date.now()}.mp4`; // Adjust the extension based on content type
            const filePath = path.join(__dirname, '../tmp/', fileName);

            // Ensure the directory exists
            try {
                await fs.access(path.dirname(filePath));
            } catch {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
            }

            // Write the file to the temporary directory
            await fs.writeFile(filePath, mediaBuffer);

            // Send the downloaded media
            await global.kord.sendImage(m, filePath, '> Here is your downloaded Instagram media!');

            // Clean up the file after sending
            await fs.unlink(filePath);

        } catch (error) {
            console.error('Error in Instagram downloader command:', error);
            await global.kord.reply(m, '❌ An error occurred while downloading the Instagram media.');
        }
    }
};