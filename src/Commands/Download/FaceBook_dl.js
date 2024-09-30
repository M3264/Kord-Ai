const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

const emojis = {
    search: '🔍', found: '🎉', noResults: '😕', error: '🤖', downloadChoice: '👇',
    option: '✅', processing: '⏳', done: '🚀', warning: '⚠️', info: 'ℹ️'
};

const MAX_DOWNLOAD_SIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024;
const TEMP_DIR = './temp';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

class FacebookDownloader {
    constructor(sock, m, args) {
        this.sock = sock;
        this.m = m;
        this.args = args;
        this.videoInfo = null;
    }

    async execute() {
        try {
            const url = this.args[0];
            if (!url) {
                return await kord.reply(this.m, `${emojis.search} Please provide a Facebook video URL.`);
            }

            await this.fetchVideoInfo(url);
            if (!this.videoInfo) return;

            const format = await this.promptQualitySelection();
            if (!format) return;

            await this.downloadAndSendVideo(format);
        } catch (error) {
            console.error("Error in Facebook downloader:", error);
            await kord.react(this.m, emojis.error);
            await kord.reply(this.m, `${emojis.error} An unexpected error occurred. Please try again later.`);
        }
    }

    async fetchVideoInfo(url) {
        for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
            try {
                const apiUrl = `https://api.abrotech.com.ng/api/fbdl?url=${encodeURIComponent(url)}&apikey=abrotech`;
                const response = await fetch(apiUrl);
                const js = await response.json();

                if (js.status === 200 && js.VideoInfo && js.VideoInfo.status && Array.isArray(js.VideoInfo.data)) {
                    this.videoInfo = js.VideoInfo.data;
                    return;
                } else {
                    await kord.reply(this.m, `${emojis.noResults} No downloadable links found for this video.`);
                    return null;
                }
            } catch (error) {
                if (attempt === RETRY_ATTEMPTS - 1) {
                    console.error("API request error:", error);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }

    async promptQualitySelection() {
        if (!Array.isArray(this.videoInfo) || this.videoInfo.length === 0) {
            await kord.reply(this.m, `${emojis.error} No video formats available to choose from.`);
            return null;
        }

        const options = this.videoInfo.map((res, index) => `\`[${index + 1}] ${res.resolution}\``).join('\n');
        
        const downloadOptions = `
📽️ *Kord-Ai FACEBOOK-DOWNLOADER* 📽️

🔗 Link: ${this.args[0]}

🔢 Select the download quality:

${options}`;

        const beautifulFont = await kord.changeFont(downloadOptions, 'smallBoldScript');
        const sentMessage = await kord.sendImage(this.m, `https://www.facebook.com/images/fb_icon_325x325.png`, beautifulFont);
        await kord.react(this.m, emojis.downloadChoice);

        const responseMessage = await kord.getResponseText(this.m, sentMessage, 30000);
        if (!responseMessage) {
            await kord.reply(this.m, `${emojis.warning} Timed out waiting for your choice.`);
            return null;
        }

        const choice = parseInt(responseMessage.response, 10) - 1;
        if (isNaN(choice) || choice < 0 || choice >= this.videoInfo.length) {
            await kord.reply(this.m, `${emojis.warning} Invalid choice. Please try again.`);
            return null;
        }

        await kord.react(this.m, emojis.option);
        return this.videoInfo[choice].url;
    }

    async downloadAndSendVideo(downloadLink) {
        if (!downloadLink) {
            await kord.reply(this.m, `${emojis.error} Invalid or missing download link provided.`);
            return;
        }

        // Handle special case for 1080p videos that need rendering
        if (downloadLink.startsWith('/render.php')) {
            downloadLink = `https://api.abrotech.com.ng${downloadLink}`;
        }

        const fileSize = await this.getFileSize(downloadLink);

        if (fileSize > MAX_DOWNLOAD_SIZE) {
            return await kord.reply(this.m, `${emojis.warning} File size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the limit of ${MAX_DOWNLOAD_SIZE / 1024 / 1024} MB.`);
        }

        const tempPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`);
        await fs.mkdir(TEMP_DIR, { recursive: true });

        const sentMessage = await kord.reply(this.m, `${emojis.processing} Downloading... 0%`);
        await this.downloadWithProgress(downloadLink, tempPath, sentMessage);

        try {
            await kord.editMsg(this.m, sentMessage, `${emojis.done} Download complete! Sending video...`);
            const caption = `> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`;
            await kord.sendVideo(this.m, await fs.readFile(tempPath), caption);
        } finally {
            await fs.unlink(tempPath).catch(console.error);
        }
    }

    // ... (rest of the methods remain the same)
}

module.exports = {
    usage: ["fb", "facebook"],
    desc: "Download Facebook videos with advanced features.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "⬇️",

    async execute(sock, m, args) {
        const downloader = new FacebookDownloader(sock, m, args);
        await downloader.execute();
    }
};