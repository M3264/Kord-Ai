const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

const TEMP_DIR = './temp';

async function downloadFacebookVideo(sock, m, args) {
    try {
        // Check if URL is provided
        const url = args[0];
        if (!url) {
            return await kord.reply(m, '🔍 Please provide a Facebook video URL.');
        }

        // Show processing state
        await kord.react(m, '⏳');

        // Fetch video info from API
        const apiUrl = `https://api.kordai.us.kg/facebook?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success || !data.data?.video) {
            await kord.react(m, '⚠️');
            return await kord.reply(m, '⚠️ Failed to get video information. Please check the URL.');
        }

        // Download and send video
        const tempPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`);
        await fs.mkdir(TEMP_DIR, { recursive: true });

        const videoResponse = await fetch(data.data.video);
        const fileStream = createWriteStream(tempPath);
        await pipeline(videoResponse.body, fileStream);

        // Send video with caption
        const caption = '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™';
        await kord.sendVideo(m, await fs.readFile(tempPath), caption);
        await kord.react(m, '🚀');

        // Clean up temp file
        await fs.unlink(tempPath).catch(console.error);

    } catch (error) {
        console.error('Facebook downloader error:', error);
        await kord.react(m, '🤖');
        await kord.reply(m, '🤖 An error occurred while processing your request.');
    }
}

module.exports = {
    usage: ['fb', 'facebook'],
    desc: 'Download Facebook videos',
    commandType: 'Download',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: '⬇️',
    execute: downloadFacebookVideo
};