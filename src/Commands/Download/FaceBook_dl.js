const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

const emojis = {
    search: '🔍', found: '🎉', error: '🤖', processing: '⏳', 
    done: '🚀', warning: '⚠️'
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

            await this.downloadAndSendVideo();
        } catch (error) {
            console.error("Error in Facebook downloader:", error);
            await kord.react(this.m, emojis.error);
            await kord.reply(this.m, `${emojis.error} An unexpected error occurred. Please try again later.`);
        }
    }

    async fetchVideoInfo(url) {
        for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
            try {
                const apiUrl = `https://itzpire.com/download/facebook?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`API response not OK: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === "success" && data.data) {
                    this.videoInfo = {
                        video_url: data.data.video_sd || data.data.video_hd
                    };
                    return;
                }

                if (attempt === RETRY_ATTEMPTS - 1) {
                    await kord.reply(this.m, `${emojis.warning} Unable to fetch video information. Please check the URL and try again.`);
                    return null;
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                if (attempt === RETRY_ATTEMPTS - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
    }

    async downloadAndSendVideo() {
        const downloadLink = this.videoInfo.video_url;

        if (!downloadLink) {
            await kord.reply(this.m, `${emojis.error} No valid download link available.`);
            return;
        }

        const fileSize = await this.getFileSize(downloadLink);

        if (fileSize > MAX_DOWNLOAD_SIZE) {
            return await kord.reply(this.m, `${emojis.warning} File size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the limit of ${MAX_DOWNLOAD_SIZE / 1024 / 1024} MB.`);
        }

        const tempPath = path.join(TEMP_DIR, `fb_${Date.now()}.mp4`);
        await fs.mkdir(TEMP_DIR, { recursive: true });

        try {
            await kord.react(this.m, emojis.processing);
            const response = await fetch(downloadLink);
            
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.statusText}`);
            }

            const fileStream = createWriteStream(tempPath);
            await pipeline(response.body, fileStream);

            const caption = `> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`;
            await kord.sendVideo(this.m, await fs.readFile(tempPath), caption);
            await kord.react(this.m, emojis.done);
        } catch (error) {
            console.error("Download error:", error);
            await kord.reply(this.m, `${emojis.error} Failed to download video. Please try again later.`);
        } finally {
            await fs.unlink(tempPath).catch(console.error);
        }
    }

    async getFileSize(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return parseInt(response.headers.get('content-length') || '0', 10);
        } catch (error) {
            console.error('Error getting file size:', error);
            return 0;
        }
    }
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