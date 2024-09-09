const yts = require('yt-search');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const emojis = {
    search: '🔍',
    processing: '🔄',
    done: '✅',
    error: '❌',
    warning: '⚠️',
    noResults: '😕'
};

module.exports = {
    usage: ["videodoc"],
    desc: "Search for YouTube videos and download them as documents.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📄",

    async execute(sock, m, args) {
        try {
            const url = args.join(" ");
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a YouTube search query.");
            }

            // Use yts to search for YouTube videos
            const results = await yts(url);
            if (results.videos.length === 0) {
                await global.kord.react(m, emojis.noResults);
                return await global.kord.reply(m, "😕 Oops! No videos found for that query.");
            }

            // Get the first video from search results
            const video = results.videos[0];
            const videoUrl = video.url;
            const videoTitle = video.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, ''); // Clean title for file name

            await global.kord.react(m, emojis.processing);

            // Use Gifted API to get video download URL
            const apiUrl = `https://api.giftedtechnexus.co.ke/api/download/ytdl?url=${encodeURIComponent(videoUrl)}&apikey=gifted`;
            const response = await fetch(apiUrl);
            const videoInfo = await response.json();

            if (!videoInfo || videoInfo.status !== 200 || !videoInfo.result || !videoInfo.result.video_url) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to fetch the video. Please try again later.");
            }

            const downloadUrl = videoInfo.result.video_url;

            // Download the video file
            const fileResponse = await fetch(downloadUrl);
            const fileBuffer = await fileResponse.buffer();

            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // Convert MB to bytes
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

            const tempFilePath = path.join(tempDir, `${videoTitle}.mp4`);
            await fs.writeFile(tempFilePath, fileBuffer);

            // Send the video as a document with the title as the file name
            const captionLine = `🎥 *KORD-AI YOUTUBE-DOWNLOADER* 🎥\n\n🔗 Link: ${video.url}\n📽️ Title: ${video.title}\n🕒 Duration: ${video.duration}`;
            await global.kord.sendDocument(m, await fs.readFile(tempFilePath), 'video/mp4', `${videoTitle}.mp4`, captionLine);

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