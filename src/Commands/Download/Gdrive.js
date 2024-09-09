const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('url');
const TEMP_DIR = './temp';
const waitMessage = "Downloading from Google Drive, please wait...";
const emojis = {
    processing: '⏳',
    done: '🚀'
};

async function downloadGoogleDrive(args, m, kord) {
    const url = args[0];

    try {
        // Extract file ID from the URL
        const fileId = extractFileId(url);
        if (!fileId) {
            throw new Error("Unable to extract file ID from the URL.");
        }

        // Get download link and file info
        const { downloadLink, filename, fileSize } = await getDownloadLink(fileId);

        // Create temporary file path
        const tempPath = path.join(TEMP_DIR, filename);

        // Ensure TEMP_DIR exists
        await fs.mkdir(TEMP_DIR, { recursive: true });

        // Reply with the initial wait message
        let sentMessage = await kord.reply(m, `${emojis.processing} ${waitMessage}`);

        // Download the file with progress
        await downloadWithProgress(downloadLink, tempPath, fileSize, sentMessage, kord, m);

        // Send the downloaded file
        await kord.sendDocument(m, tempPath, 'application/octet-stream', filename, 'Here is your Google Drive file.');

        // Clean up temporary file
        await fs.unlink(tempPath);
    } catch (error) {
        console.error("Error downloading Google Drive file:", error);
        await kord.reply(m, "Error downloading Google Drive file: " + error.message);
    }
}

function extractFileId(url) {
    const parsedUrl = parse(url, true);
    if (parsedUrl.pathname.includes('/file/d/')) {
        return parsedUrl.pathname.split('/')[3];
    } else if (parsedUrl.pathname === '/open') {
        return parsedUrl.query.id;
    }
    return null;
}

async function getDownloadLink(fileId) {
    const response = await fetch(`https://drive.google.com/uc?id=${fileId}&export=download`);
    const text = await response.text();
    
    if (response.url.includes('accounts.google.com')) {
        throw new Error("This file is not publicly accessible.");
    }

    let downloadLink = response.url;
    let filename = getFilenameFromContentDisposition(response.headers.get('content-disposition')) || `gdrive_file_${fileId}`;
    let fileSize = parseInt(response.headers.get('content-length'), 10);

    // Check if it's a large file
    if (text.includes('uc-download-link')) {
        const confirmToken = text.match(/confirm=([^&]+)/)[1];
        downloadLink = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=${confirmToken}`;
        
        // For large files, we need to make another request to get the actual file size
        const headResponse = await fetch(downloadLink, { method: 'HEAD' });
        fileSize = parseInt(headResponse.headers.get('content-length'), 10);
    }

    return { downloadLink, filename, fileSize };
}

function getFilenameFromContentDisposition(contentDisposition) {
    if (!contentDisposition) return null;
    const matches = /filename="?(.+)"?/i.exec(contentDisposition);
    return matches && matches[1] ? decodeURIComponent(matches[1]) : null;
}

async function downloadWithProgress(url, filePath, fileSize, sentMessage, kord, m) {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(filePath);

    let downloadedSize = 0;

    response.body.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percentComplete = (downloadedSize / fileSize) * 100;

        // Update the message with the download progress
        const progressBar = createProgressBar(percentComplete);
        kord.editMsg(m, sentMessage.key, `${emojis.processing} Downloading: ${progressBar} ${percentComplete.toFixed(2)}%`);
    });

    response.body.pipe(fileStream);

    await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
    });

    // Notify download is complete
    kord.editMsg(m, sentMessage.key, `${emojis.done} Download complete!`);
}

function createProgressBar(percentage) {
    const length = 20;
    const filledLength = Math.round((length * percentage) / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(length - filledLength);
    return bar;
}

module.exports = {
    usage: ["gdrive", "googledrive"],
    desc: "Download files from Google Drive links.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "☁️",
    async execute(args, m, kord) {
        await downloadGoogleDrive(args, m, kord);
    }
};