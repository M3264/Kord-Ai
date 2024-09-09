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
        // Manually correct the TikTok URL by preserving the original case
        const match = url.match(/https:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+/);
        if (match) {
            console.log("Matched URL:", match[0]);
            return match[0]; // Return the matched URL without altering case
        } else {
            console.error("No valid TikTok URL found in input.");
            return url; // Return the original if no match is found
        }
    } catch (error) {
        console.error("Error correcting URL:", error);
        return url; // Return original URL if correction fails
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
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // Convert MB to bytes
            let url = args.join(" ").trim(); // Join all arguments to preserve spaces
            console.log("Initial URL:", url);
            
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a TikTok video URL.");
            }

            // Attempt to correct the URL case
            url = correctTikTokUrlCase(url);
            console.log("After case correction:", url);

            await global.kord.react(m, emojis.processing);

            // Use the Junn API for the download
            const apiUrl = `https://api.junn4.my.id/download/tiktok?url=${url}`;  // Pass URL directly without encodeURIComponent
            console.log("API URL:", apiUrl);
            
            const response = await fetch(apiUrl);
            const videoInfo = await response.json();

            // Log the entire response for debugging
            console.log("Video Info Response:", JSON.stringify(videoInfo, null, 2));

            if (videoInfo.status !== 200 || !videoInfo.result) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the download link. Try again.");
            }

            // Ensure the result contains the HD or Medium URL
            const downloadUrl = videoInfo.result.HD?.url || videoInfo.result.Medium?.url;
            if (!downloadUrl) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the download link. The video may not be available in the requested quality.");
            }

            console.log("Download URL:", downloadUrl);

            const caption = videoInfo.result.caption || "🎵 TikTok Video";

            const tempDir = path.join('./temp');
            await fs.mkdir(tempDir, { recursive: true });

            // Fetch the video file
            const fileResponse = await fetch(downloadUrl);
            const fileBuffer = await fileResponse.buffer();

            const fileSize = fileBuffer.length;
            console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

            if (fileSize > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} The file size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size (${settings.MAX_DOWNLOAD_SIZE} MB).`);
            }

            const tempFilePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            await fs.writeFile(tempFilePath, fileBuffer);

            // Send the file with caption
            await global.kord.sendVideo(m, await fs.readFile(tempFilePath), caption);

            // Clean up
            await fs.unlink(tempFilePath);

            await global.kord.react(m, emojis.done);
        } catch (error) {
            await global.kord.react(m, emojis.error);
            console.error("Error in TikTok downloader:", error);
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