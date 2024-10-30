const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const gifted = require('gifted-dls');

const emojis = {
    search: '🔍',
    processing: '🔄',
    warning: '⚠️',
    done: '✅',
    error: '❌'
};

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
            const url = args[0];
            
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a TikTok video URL.");
            }

            await global.kord.react(m, emojis.processing);

            const videoInfo = await gifted.tiktok(url);

            if (!videoInfo || !videoInfo.video) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the video information. Try again.");
            }

            const downloadUrl = videoInfo.video;
            if (!downloadUrl) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❌ Unable to retrieve the download link. The video may not be available.");
            }

            const caption = "> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™";
            const tempDir = path.join('./temp');
            await fs.mkdir(tempDir, { recursive: true });

            const fileResponse = await fetch(downloadUrl);
            if (!fileResponse.ok) {
                throw new Error(`HTTP error! status: ${fileResponse.status}`);
            }
            const fileBuffer = await fileResponse.buffer();

            if (fileBuffer.length > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} File size exceeds the maximum allowed size of ${settings.MAX_DOWNLOAD_SIZE} MB.`);
            }

            const tempFilePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            await fs.writeFile(tempFilePath, fileBuffer);
            
            await global.kord.sendVideo(m, await fs.readFile(tempFilePath), caption);
            await fs.unlink(tempFilePath);
            await global.kord.react(m, emojis.done);

        } catch (error) {
            await global.kord.react(m, emojis.error);
            if (error.message.includes('network')) {
                await global.kord.reply(m, "🌐 Network error. Please try again later.");
            } else if (error.message.includes('404')) {
                await global.kord.reply(m, "🚫 Video not available. Please check the URL.");
            } else {
                await global.kord.reply(m, `❌ Error: ${error.message}`);
            }
        }
    }
};