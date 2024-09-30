const ytdl = require('youtubedl-core');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { Client } = require('undici');

const emojis = {
    search: '🔍',
    processing: '🔄',
    done: '✅',
    error: '❌',
    warning: '⚠️'
};

module.exports = {
    usage: ["youtube", "yt", "ytmp4"],
    desc: "Download YouTube videos.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎥",

    async execute(sock, m, args) {
        try {
            const MAXDLSIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // Convert MB to bytes
            const url = args[0];
            await global.kord.react(m, emojis.search);

            if (!url) {
                return await global.kord.reply(m, "🔗 Please provide a YouTube video URL.");
            }

            // Check if it's a valid YouTube URL
            const validYouTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
            if (!validYouTubeRegex.test(url)) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "🚫 Please provide a valid YouTube URL.");
            }

            await global.kord.react(m, emojis.processing);

            const videoDetails = await ytddl(url);
            if (!videoDetails) {
                await global.kord.react(m, emojis.error);
                return await global.kord.reply(m, "❎ Error downloading video");
            }

            const { url: downloadUrl, title, author, description } = videoDetails;

            // Download the file
            const fileResponse = await fetch(downloadUrl);
            const fileBuffer = await fileResponse.buffer();

            const fileSize = fileBuffer.length;

            if (fileSize > MAXDLSIZE) {
                await global.kord.react(m, emojis.warning);
                return await global.kord.reply(m, `${emojis.warning} The file size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size (${settings.MAX_DOWNLOAD_SIZE} MB).`);
            }

            // Send the video file with caption
            const captionLine = `✼ ••๑⋯❀ Y O U T U B E ❀⋯⋅๑•• ✼
    
❏ Title: ${title || 'Unknown'}
❒ Author: ${author || 'Unknown'}
❒ Description: ${description || 'No description available'}
❒ Link: ${url}

> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™
⊱─━⊱༻●༺⊰━─⊰`;

            await global.kord.sendVideo(m, fileBuffer, captionLine);

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

async function getCookies() {
    const cookiesPath = path.resolve(__dirname, '../../Assets/cookies.json');
    try {
        await fs.access(cookiesPath);
        const cookiesData = await fs.readFile(cookiesPath, 'utf-8');
        return JSON.parse(cookiesData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('Cookies file not found');
        }
        throw error;
    }
}

async function createClient() {
    const cookies = await getCookies();
    return new Client("https://www.youtube.com", {
        headers: {
            "Cookie": cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        }
    });
}

async function ytddl(url) {
    try {
        const client = await createClient();
        const yt = await ytdl.getInfo(url, { requestOptions: { client: client } });
        const link = ytdl.chooseFormat(yt.formats, { quality: 'highest', filter: 'audioandvideo' });

        return {
            url: link.url,
            title: yt.videoDetails.title,
            author: yt.videoDetails.author.name,
            description: yt.videoDetails.description,
        };
    } catch (error) {
        console.error("An error occurred:", error);
        return null;  // Ensure a null is returned on error
    }
}