const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { logger } = require('../../Plugin/kordlogger');
const settings = require('../../../Config');
const gifted = require('gifted-dls');
const axios = require('axios'); // Add axios for downloading

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

            await kord.react(m, emojis.found);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempPath = path.join(tempDir, `temp_${Date.now()}.mp3`);

            // Download the audio using gifted-dls
            await kord.freply(m, `${emojis.processing} Downloading audio...`);
            const data = await gifted.ytmp3(video.url);

            if (!data || !data.download_url) {
                throw new Error('Failed to get download URL');
            }

            // Download the file using axios
            const response = await axios({
                method: 'GET',
                url: data.download_url,
                responseType: 'stream'
            });

            // Create write stream
            const writer = fs.createWriteStream(tempPath);

            // Get content length for size check
            const contentLength = parseInt(response.headers['content-length'], 10);
            if (contentLength > MAXDLSIZE) {
                return await kord.reply(m, `${emojis.warning} The file size exceeds the maximum allowed size.`);
            }

            // Pipe the response to the file
            response.data.pipe(writer);

            // Wait for the download to complete
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Verify the downloaded file
            const fileSize = fs.statSync(tempPath).size;
            if (fileSize === 0) {
                fs.unlinkSync(tempPath);
                return await kord.reply(m, "❌ The file appears to be empty. Please try again later.");
            }

            // Send the audio
            await kord.sendAudio(m, fs.readFileSync(tempPath), 'audio/mpeg', `${video.title}.mp3`);
            
            let res = `
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

            const styledResponse = await kord.changeFont(res, 'smallBoldScript');
            await kord.freply(m, styledResponse);

            // Clean up
            fs.unlinkSync(tempPath);
        } catch (error) {
            await kord.react(m, emojis.error);
            await kord.reply(m, "🤖 Oops! Something unexpected happened.");
            logger.error(error);

            // Clean up in case of error
            const tempPath = path.join(__dirname, '../../temp', `temp_${Date.now()}.mp3`);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }
};