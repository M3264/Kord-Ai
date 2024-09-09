const fetch = require('node-fetch'); // Ensure you have node-fetch installed
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
                const response = await fetch(`https://api.betabotz.eu.org/api/download/fbdown?url=${url}&apikey=btzmouricedevs`);
                const js = await response.json();

                if (js.status === 200 && js.data) {
                    this.videoInfo = js.data;
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
        const options = [
            `\`[1] Standard Definition (SD)\``,
            `\`[2] High Definition (HD)\``
        ];

        const downloadOptions = `
📽️ *Kord-Ai FACEBOOK-DOWNLOADER* 📽️

🔗 Link: ${this.args[0]}

🔢 Select the download quality:

${options.join('\n')}`;

        const beautifulFont = await kord.changeFont(downloadOptions, 'smallBoldScript');
        const sentMessage = await kord.sendImage(this.m, this.videoInfo.image, beautifulFont);
        await kord.react(this.m, emojis.downloadChoice);

        const responseMessage = await kord.getResponseText(this.m, sentMessage, 30000);
        if (!responseMessage) {
            await kord.reply(this.m, `${emojis.warning} Timed out waiting for your choice.`);
            return null;
        }

        await kord.react(this.m, emojis.option);
        return responseMessage.response === '2' && this.videoInfo.hd ? 'hd' : 'sd';
    }

    async downloadAndSendVideo(format) {
        const downloadLink = format === 'hd' ? this.videoInfo.hd : this.videoInfo.sd;

        if (!downloadLink) {
            await kord.reply(this.m, `${emojis.error} No download link available for the selected quality.`);
            return;
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
            const caption = `Facebook Video (${format.toUpperCase()})\n\n👤 Author: ${this.videoInfo.owner || "Unknown"}\n📝 Description: ${(this.videoInfo.description || "").slice(0, 100)}...`;
            await kord.sendVideo(this.m, await fs.readFile(tempPath), caption);
        } finally {
            await fs.unlink(tempPath).catch(console.error);
        }
    }

    async getFileSize(url) {
        const response = await fetch(url, { method: 'HEAD' });
        return parseInt(response.headers.get('content-length'), 10);
    }

    async downloadWithProgress(url, tempPath, sentMessage) {
        const writer = createWriteStream(tempPath);
        const response = await fetch(url);
        const totalLength = parseInt(response.headers.get('content-length'), 10);
        let downloadedLength = 0;
        let lastUpdateTime = Date.now();

        response.body.on('data', (chunk) => {
            downloadedLength += chunk.length;
            const now = Date.now();
            if (now - lastUpdateTime > 5000) { // Changed to 5000 ms (5 seconds)
                this.updateProgressMessage(sentMessage, downloadedLength, totalLength);
                lastUpdateTime = now;
            }
        });

        await pipeline(response.body, writer);
    }

    async updateProgressMessage(sentMessage, downloadedLength, totalLength) {
        const progress = (downloadedLength / totalLength) * 100;
        const progressBar = this.getProgressBar(progress);
        let retryDelay = 1000; // Start with a 1 second delay
        const maxRetries = 3;
    
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await kord.editMsg(this.m, sentMessage, `${emojis.processing} Downloading... ${progress.toFixed(2)}%\n${progressBar}`);
                return; // If successful, exit the function
            } catch (error) {
                console.warn(`Failed to update progress message (attempt ${attempt + 1}):`, error.message);
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay *= 2; // Double the delay for the next attempt
                }
            }
        }
        console.error("Failed to update progress message after multiple attempts");
    }

    getProgressBar(progress) {
        const filledLength = Math.round(progress / 5);
        return '█'.repeat(filledLength) + '░'.repeat(20 - filledLength);
    }
}

module.exports = {
    usage: ["fb2", "facebook2"],
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