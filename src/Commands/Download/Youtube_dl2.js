const ytdl = require('youtubedl-core');
const yts = require('yt-search');
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
    usage: ["video"],
    desc: "Search for YouTube videos and download them.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📺",

    async execute(sock, m, args) {
        try {
            const query = args.join(" ");
            await global.kord.react(m, emojis.search);

            if (!query) {
                return await global.kord.reply(m, "🔗 Please provide a YouTube search query.");
            }

            // Use yts to search for YouTube videos
            const results = await yts(query);
            if (results.videos.length === 0) {
                await global.kord.react(m, emojis.noResults);
                return await global.kord.reply(m, "😕 Oops! No videos found for that query.");
            }

            // Get the first video from search results
            const video = results.videos[0];
            const videoUrl = video.url;
            const videoTitle = video.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, ''); // Clean title for file name

            await global.kord.react(m, emojis.processing);

            // Get video info using youtubedl-core
            const info = await ytdl.getInfo(videoUrl);
            const videoDetails = info.videoDetails;

            if (!videoDetails) {
                await global.kord.react(m, emojis.error);
                console.log("Video Info Error: ", info);
                return await global.kord.reply(m, "❌ Unable to fetch the video information. Please try again later.");
            }

            // Choose the best quality format that doesn't exceed MAXDLSIZE
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // Convert MB to bytes
            const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });

            if (format.contentLength > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} The file size (${(format.contentLength / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size (${settings.MAX_DOWNLOAD_SIZE} MB).`);
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

            // Download the video
            await new Promise((resolve, reject) => {
                ytdl(videoUrl, { format: format })
                    .pipe(require('fs').createWriteStream(tempFilePath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            // Send the video with caption
            const captionLine = `🎥 *KORD-AI YOUTUBE-DOWNLOADER* 🎥\n\n🔗 Link: ${videoUrl}\n📽️ Title: ${videoDetails.title}\n🕒 Duration: ${video.duration}`;
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