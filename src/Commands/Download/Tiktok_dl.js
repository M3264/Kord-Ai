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
    const match = url.match(/https:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+/);
    return match ? match[0] : url;
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
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024;
            let url = args.join(" ").trim();
            
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a TikTok video URL.");
            }

            url = correctTikTokUrlCase(url);
            await global.kord.react(m, emojis.processing);

            const apiUrl = `https://api.kordai.us.kg/tiktok?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const videoInfo = await response.json();

            if (!videoInfo.success || !videoInfo.data) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the video information. Try again.");
            }

            const downloadUrl = videoInfo.data.downloadLinks[0].link;
            if (!downloadUrl) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the download link. The video may not be available.");
            }

            const caption = `🎵 *TikTok Video*\n Info: ${videoInfo.data.title}\n\n\n > © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`;
            const tempDir = path.join('./temp');
            await fs.mkdir(tempDir, { recursive: true });

            const fileResponse = await fetch(downloadUrl);
            if (!fileResponse.ok) {
                throw new Error(`HTTP error! status: ${fileResponse.status}`);
            }
            const fileBuffer = await fileResponse.buffer();

            const fileSize = fileBuffer.length;
            if (fileSize > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} The file size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size (${settings.MAX_DOWNLOAD_SIZE} MB).`);
            }

            const tempFilePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            await fs.writeFile(tempFilePath, fileBuffer);
            await global.kord.sendVideo(m, await fs.readFile(tempFilePath), caption);
            await fs.unlink(tempFilePath);
            await global.kord.react(m, emojis.done);

        } catch (error) {
            await global.kord.react(m, emojis.error);
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