const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const emojis = {
    search: '🔍',
    processing: '🔄',
    downloadChoice: '📥',
    option: '⚙️',
    warning: '⚠️',
    done: '✅',
    error: '❌'
};

function correctTikTokUrlCase(url) {
    console.log("Input URL:", url);
    try {
        const match = url.match(/https:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+/);
        if (match) {
            console.log("Matched URL:", match[0]);
            return match[0];
        } else {
            console.error("No valid TikTok URL found in input.");
            return url;
        }
    } catch (error) {
        console.error("Error correcting URL:", error);
        return url;
    }
}

module.exports = {
    usage: ["tiktok", "tt"],
    desc: "Download TikTok videos.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎵",

    async execute(sock, m, args) {
        try {
            console.log("Raw args:", args);
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024;
            let url = args.join(" ").trim();
            console.log("Initial URL:", url);
            
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a TikTok video URL.");
            }

            url = correctTikTokUrlCase(url);
            console.log("After case correction:", url);

            await global.kord.react(m, emojis.processing);

            const apiUrl = `https://api.abrotech.com.ng/api/ttdl?url=${encodeURIComponent(url)}&apikey=abrotech`;
            console.log("API URL:", apiUrl);
            
            const response = await fetch(apiUrl);
            const videoInfo = await response.json();

            console.log("Video Info Response:", JSON.stringify(videoInfo, null, 2));

            if (videoInfo.status !== 200 || !videoInfo.VideoInfo) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the video information. Try again.");
            }

            const downloadUrl = videoInfo.VideoInfo.video;
            if (!downloadUrl) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the download link. The video may not be available.");
            }

            console.log("Download URL:", downloadUrl);

            const caption = videoInfo.VideoInfo.title || "🎵 TikTok Video";

            const tempDir = path.join('./temp');
            await fs.mkdir(tempDir, { recursive: true });

            console.log("Fetching video file...");
            const fileResponse = await fetch(downloadUrl);
            if (!fileResponse.ok) {
                throw new Error(`HTTP error! status: ${fileResponse.status}`);
            }
            const fileBuffer = await fileResponse.buffer();

            const fileSize = fileBuffer.length;
            console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

            if (fileSize > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} The file size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size (${settings.MAX_DOWNLOAD_SIZE} MB).`);
            }

            const tempFilePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            console.log("Writing file to:", tempFilePath);
            await fs.writeFile(tempFilePath, fileBuffer);

            console.log("Sending video...");
            await global.kord.sendVideo(m, await fs.readFile(tempFilePath), caption);

            console.log("Cleaning up temporary file...");
            await fs.unlink(tempFilePath);

            console.log("Video sent successfully.");
            await global.kord.react(m, emojis.done);
        } catch (error) {
            await global.kord.react(m, emojis.error);
            console.error("Error in TikTok downloader:", error);
            if (error.message.includes('network')) {
                await global.kord.reply(m, "🌐 Hmm, having trouble connecting to the internet. Please try again later.");
            } else if (error.message.includes('404')) {
                await global.kord.reply(m, "🚫🔗 The video is no longer available. Please check the URL and try again.");
            } else {
                await global.kord.reply(m, `🤖 Oops! Something unexpected happened: ${error.message}`);
            }
        }
    }
};