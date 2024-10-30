const ytdl = require('youtubedl-core');
const yts = require('yt-search');
const fs = require('fs')
const path = require('path');
const gifted = require('gifted-dls');
const axios = require('axios');

const emojis = {
    search: '🔍',
    processing: '🔄',
    done: '✅',
    error: '❌',
    warning: '⚠️',
    noResults: '😕'
};

module.exports = {
    usage: ["videoo"],
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
            await global.kord.react(m, emojis.processing);
            const data = await gifted.ytmp4(videoUrl);
            if (!data || !data.download_url) throw new Error('Download URL not found');

            // Create temp directory if it doesn't exist
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempPath = path.join(tempDir, `video_${Date.now()}.mp4`);

            // Download video using axios
            const response = await axios({
                method: 'GET',
                url: data.download_url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(tempPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            const captionLine = "\n> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™";

            // Send video with caption
            await global.kord.sendDocument(m, await fs.readFile(tempPath), 'video/mp4', `video_${Date.now()}.mp4`, captionLine);
            // Clean up
            await fs.unlink(tempPath);

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