const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { logger } = require('../../Plugin/kordlogger');
const settings = require('../../../Config');

const emojis = {
    search: '🔍',
    found: '🎉',
    noResults: '😕',
    error: '🤖',
    processing: '⏳',
    done: '🚀',
    warning: '⚠️'
};

module.exports = {
    usage: ["audio", "song", "play", "mp3"],
    desc: "Search for YouTube videos and download their audio.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎵",

    async execute(sock, m, args) {
        try {
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // Convert MB to bytes
            const query = args.join(" ");
            await kord.react(m, emojis.search);

            if (!query) {
                return await kord.reply(m, "🔍 Please provide a search query or YouTube link.");
            }

            // Search for the video using yt-search
            const results = await yts(query);
            if (results.videos.length === 0) {
                await kord.react(m, emojis.noResults);
                return await kord.reply(m, "😕 Oops! No videos found for that query.");
            }
            const video = results.videos[0]; 
            console.log(video);

            await kord.react(m, emojis.found);

            // Fetch the download link from Junn API
            const apiUrl = `https://api.shannmoderz.xyz/downloader/yt-audio?key=SRA-OHOKAI&url=${video.url}`;
            const apiResponse = await fetch(apiUrl);
            const data = await apiResponse.json();
            console.log(data);

            if (!data || data.status !== true || !data.result.download_url) {
                return await kord.reply(m, "❌ An error occurred while fetching the download link. Please try again later.");
            }

            const downloadUrl = data.result.download_url;

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const tempPath = path.join(tempDir, `temp_${Date.now()}.mp3`);
            const writeStream = fs.createWriteStream(tempPath);

            // Download the file
            const downloadStream = await fetch(downloadUrl);
            downloadStream.body.pipe(writeStream);

            writeStream.on('finish', async () => {
                writeStream.close(); 
                const fileSize = fs.statSync(tempPath).size;

                if (fileSize === 0) {
                    fs.unlinkSync(tempPath);
                    return await kord.reply(m, "❌ The file appears to be empty. Please try again later.");
                }

                // Send the audio normally
                await kord.sendAudio(m, fs.readFileSync(tempPath), 'audio/mpeg', `${video.title}.mp3`);
                
                // Create and change the font for the response
                let response = `
🎵 *KORD-AI AUDIO-DOWNLOADER* 🎵

┌───────────────────
├  ℹ️ *Title:* ${video.title}
├  👤 *Channel:* ${video.author.name}
├  📆 *Published:* ${video.ago}
├  🕘 *Duration:* ${video.timestamp}
├  ⚠️ Use *.playdoc | .mp3doc* to get the audio as a file!
└───────────────────

${emojis.done} Audio file has been sent.

> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™
                `;

                const styledResponse = await kord.changeFont(response, 'smallBoldScript'); // Apply font style
                await kord.reply(m, styledResponse);

                // Delete the temp file after sending
                fs.unlinkSync(tempPath); 
            });

        } catch (error) {
            await kord.react(m, emojis.error);
            await kord.reply(m, "🤖 Oops! Something unexpected happened.");
            logger.error(error);
        }
    }
};