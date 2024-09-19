const axios = require('axios');
const fs = require('fs');
const path = require('path');

const emojis = {
    download: '📥',
    file: '📄',
    size: '💾',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    progress: '🔄'
};

const MAX_DOWNLOAD_SIZE = settings.MAX_DOWNLOAD_SIZE * 1024 * 1024; // 100 MB limit

module.exports = {
    usage: ["mediafire", "mediaf"],
    desc: "Download files from MediaFire links",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.download,
    async execute(sock, m, args) {
        if (!args[0]) {
            return kord.reply(m, `${emojis.error} Please provide a MediaFire link. Usage: .mediafire <url>`);
        }

        const url = args[0];
        await kord.react(m, emojis.download);

        try {
            const apiUrl = `https://api.vihangayt.com/downloader/mediafire?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);

            if (!response.data.status) {
                return kord.reply(m, `${emojis.error} Failed to fetch file information. Please check your link and try again.`);
            }

            const fileData = response.data.data[0];
            const fileName = decodeURIComponent(fileData.nama);
            const fileSize = parseFloat(fileData.size);
            const fileSizeInBytes = convertToBytes(fileSize, fileData.size);

            if (fileSizeInBytes > MAX_DOWNLOAD_SIZE) {
                return kord.reply(m, `${emojis.warning} File size (${fileData.size}) exceeds the maximum limit of 100 MB.`);
            }

            const infoMessage = await kord.reply(m, `${emojis.file} File: ${fileName}\n${emojis.size} Size: ${fileData.size}\n\n${emojis.progress} Starting download...`);
            
            const downloadPath = path.join('./temp', fileName);
            await downloadFile(fileData.link, downloadPath, m, infoMessage);

            await kord.sendFile(m, downloadPath, fileName, `${emojis.success} Here's your file!`, null);
            fs.unlinkSync(downloadPath); // Clean up the downloaded file

        } catch (error) {
            console.error("Error in MediaFire download:", error);
            await kord.reply(m, `${emojis.error} An error occurred while processing your request. Please try again later.\n ${error.message}`);
        }
    }
};

async function downloadFile(url, filePath, m, infoMessage) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;
    let lastUpdateTime = Date.now();

    response.data.on('data', (chunk) => {
        writer.write(chunk);
        downloadedLength += chunk.length;

        const now = Date.now();
        if (now - lastUpdateTime >= 4000) { // Update every 4 seconds
            updateProgressMessage(m, infoMessage, downloadedLength, totalLength);
            lastUpdateTime = now;
        }
    });

    await new Promise((resolve, reject) => {
        response.data.on('end', () => {
            writer.end();
            resolve();
        });
        writer.on('error', reject);
    });
}

async function updateProgressMessage(m, infoMessage, downloaded, total) {
    const progress = Math.min(Math.floor((downloaded / total) * 20), 20);
    const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
    const percentage = Math.floor((downloaded / total) * 100);

    const updatedMessage = `${emojis.progress} Downloading...\n[${progressBar}] ${percentage}%\n${formatBytes(downloaded)} / ${formatBytes(total)}`;
    
    await kord.editMsg(m, infoMessage, updatedMessage);
}

function convertToBytes(size, sizeString) {
    const units = {
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };
    const unit = sizeString.slice(-2);
    return size * (units[unit] || 1);
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
}