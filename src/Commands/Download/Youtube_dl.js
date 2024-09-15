
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const emojis = {
    search: '🔍',
    processing: '🔄',
    done: '✅',
    error: '❌',
    warning: '⚠️'
};

module.exports = {
    usage: ["youtube", "yt", "ytmp4"],
    desc: "Download YouTube videos.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎥",

    async execute(sock, m, args) {
        try {
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // Convert MB to bytes
            const url = args[0];
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a YouTube video URL.");
            }

            // Check if it's a valid YouTube URL
            const validYouTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
            if (!validYouTubeRegex.test(url)) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "🚫 Please provide a valid YouTube URL.");
            }

            await global.kord.react(m, emojis.processing);

            // Use Gifted API to get video info
            const apiUrl = `https://bk9.fun/download/youtube?url=${url}`;
            const apiResponse = await fetch(apiUrl);
            const data = await apiResponse.json();
            console.log(data);

            if (!data || data.status !== true || !data.BK9 || !data.BK9.video.url) {
                await global.kord.react(m, emojis.error);
                console.log("API Response Error: ", videoInfo);
                return await global.kord.reply(m, "❌ Unable to fetch the video. Please try again later.");
            }

            const downloadUrl = data.BK9.video.url;;
            const fileExtension = 'mp4';

            // Download the file
            const fileResponse = await fetch(downloadUrl);
            const fileBuffer = await fileResponse.buffer();
            console.log(fileResponse);

            const fileSize = fileBuffer.length;

            if (fileSize > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} The file size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size (${settings.MAX_DOWNLOAD_SIZE} MB).`);
            }

            const tempDir = path.join('./temp');
            try {
                await fs.access(tempDir); // Check if directory exists
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // Directory doesn't exist, create it
                    await fs.mkdir(tempDir);
                } else {
                    throw error; // Propagate other errors
                }
            }

            const tempFilePath = path.join(tempDir, `youtube_${Date.now()}.${fileExtension}`);
            await fs.writeFile(tempFilePath, fileBuffer);

            // Send the video file with caption
            const captionLine = `🎥 *KORD-AI YOUTUBE-DOWNLOADER* 🎥\n\n🔗 Link: ${url}\n📽️ Title: ${data.BK9.title}`;
            await global.kord.sendVideo(m, await fs.readFile(tempFilePath), captionLine);

            // Clean up
            await fs.unlink(tempFilePath);

            await global.kord.react(m, emojis.done);

        } catch (error) {
            await global.kord.react(m, emojis.error);
            console.log("Error during execution:", error);
            if (error.message.includes('network')) {
                await global.kord.reply(m, "🌐 Hmm, having trouble connecting to the internet. Please try again later.");
            } else if (error.message.includes('404')) {
                await global.kord.reply(m, "🚫🔗 The video is no longer available. Please check the URL and try again.");
            } else {
                await global.kord.reply(m, "🤖 Oops! Something unexpected happened. We'll look into it.");
            }
        }
    }
};