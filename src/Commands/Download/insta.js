const gifted = require('gifted-dls');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    usage: ["instavid", "igvid", "instadlvid"],
    desc: "Download Instagram media",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    emoji: "📥",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.reply(m, 'Please provide an Instagram post URL to download.');

        const url = args[0];
        await global.kord.reply(m, '> *✨`Loading..`💨*');

        try {
            const data = await gifted.giftedigdl(url);
            
            if (!data || data.status !== 200) return await global.kord.reply(m, '❌ Could not retrieve media data. Please check the provided Instagram URL.');

            const downloadUrl = data.result.download_url;
            if (!downloadUrl) return await global.kord.reply(m, '❌ No video URL found in the response.');

            const mediaResponse = await fetch(downloadUrl);
            if (!mediaResponse.ok) return await global.kord.reply(m, '❌ Failed to download the video from Instagram.');

            const mediaBuffer = await mediaResponse.buffer();
            const fileName = `instagram_${Date.now()}.mp4`;
            const filePath = path.join(__dirname, '../tmp/', fileName);

            try {
                await fs.access(path.dirname(filePath));
            } catch {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
            }

            await fs.writeFile(filePath, mediaBuffer);
            await global.kord.sendVideo(m, filePath, '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™');
            await fs.unlink(filePath);

        } catch (error) {
            console.error('Error in Instagram downloader command:', error);
            await global.kord.reply(m, '❌ An error occurred while downloading the Instagram video.');
        }
    }
};