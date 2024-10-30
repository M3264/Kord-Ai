const fetch = require('node-fetch');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');

const TEMP_DIR = path.join(__dirname, '../tmp/');

module.exports = {
    usage: ["gdrive", "googledrive"],
    desc: "Download files/folders from Google Drive",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "☁️",
    execute: handleDriveCommand
};

async function handleDriveCommand(sock, m, args) {
    if (!args[0]) {
        return await replyMessage(m, '❌ Please provide a Google Drive URL.');
    }

    const url = args[0];
    
    try {
        await replyMessage(m, '📝 Processing Google Drive link...');
        
        if (!isValidDriveUrl(url)) {
            return await replyMessage(m, '❌ Invalid Google Drive URL.');
        }

        if (url.includes('/folders/')) {
            await handleFolder(url, sock, m);
        } else {
            await handleFile(url, sock, m);
        }

    } catch (error) {
        console.error('Drive Download Error:', error);
        await replyMessage(m, `❌ Error: ${error.message || 'Unknown error occurred'}`);
    }
}

async function handleFolder(url, sock, m) {
    try {
        const files = await getFolderFiles(url);
        if (!files.length) {
            throw new Error('No accessible files found');
        }

        await replyMessage(m, `📂 Found ${files.length} files. Starting download...`);

        for (const fileId of files) {
            try {
                await downloadAndSendFile(fileId, sock, m);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between files
            } catch (err) {
                console.error(`Error with file ${fileId}:`, err);
            }
        }

        await replyMessage(m, '✅ Folder download completed!');
    } catch (error) {
        throw new Error(`Folder processing failed: ${error.message}`);
    }
}

async function getFolderFiles(url) {
    try {
        const folderId = url.match(/folders\/([^/?]+)/)?.[1];
        if (!folderId) throw new Error('Invalid folder URL');

        const response = await axios.get(`https://drive.google.com/drive/folders/${folderId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const fileIds = [];
        const matches = response.data.match(/\/file\/d\/([^/"\s]+)/g) || [];
        
        for (const match of matches) {
            const fileId = match.split('/')[3];
            if (fileId && !fileIds.includes(fileId)) {
                fileIds.push(fileId);
            }
        }

        return fileIds;
    } catch (error) {
        throw new Error(`Failed to get folder contents: ${error.message}`);
    }
}

async function handleFile(url, sock, m) {
    const fileId = extractFileId(url);
    if (!fileId) {
        throw new Error('Invalid file URL');
    }
    await downloadAndSendFile(fileId, sock, m);
}

async function downloadAndSendFile(fileId, sock, m) {
    try {
        const downloadInfo = await getDownloadInfo(fileId);
        await replyMessage(m, `⏳ Downloading: ${downloadInfo.fileName}`);

        const tempPath = path.join(TEMP_DIR, downloadInfo.fileName);
        await downloadFile(downloadInfo.downloadUrl, tempPath);

        await sock.sendMessage(
            m.key.remoteJid,
            {
                document: fsSync.createReadStream(tempPath),
                fileName: downloadInfo.fileName,
                mimetype: downloadInfo.mimeType || 'application/octet-stream'
            },
            { quoted: m }
        );

        await fs.unlink(tempPath);
        await replyMessage(m, `✅ Sent: ${downloadInfo.fileName}`);
    } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
}

async function getDownloadInfo(fileId) {
    try {
        // First request to get cookies and confirmation token if needed
        const firstResponse = await axios.get(`https://drive.google.com/uc?id=${fileId}&export=download`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });

        // Check if we need to handle confirmation for large files
        const confirmToken = firstResponse.data.match(/confirm=([^&]+)/)?.[1];
        const cookies = firstResponse.headers['set-cookie']?.map(cookie => cookie.split(';')[0]).join('; ');

        let downloadUrl;
        let fileName = fileId;
        let mimeType = 'application/octet-stream';

        if (confirmToken) {
            // Large file handling
            downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=${confirmToken}`;
        } else {
            // Direct download for small files
            downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        }

        // Try to get filename from content-disposition
        const contentDisposition = firstResponse.headers['content-disposition'];
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i);
            if (fileNameMatch) {
                fileName = decodeURIComponent(fileNameMatch[1]);
            }
        }

        // Try to get mimeType from content-type
        const contentType = firstResponse.headers['content-type'];
        if (contentType) {
            mimeType = contentType;
        }

        return {
            downloadUrl,
            fileName,
            mimeType,
            cookies
        };
    } catch (error) {
        throw new Error(`Failed to get download info: ${error.message}`);
    }
}

async function downloadFile(url, destPath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    const writer = fsSync.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function isValidDriveUrl(url) {
    return /drive\.google\.com\/(file\/d\/|drive\/folders\/)/i.test(url);
}

function extractFileId(url) {
    const match = url.match(/\/file\/d\/([^/]+)/);
    return match ? match[1] : null;
}

async function replyMessage(m, text) {
    return await global.kord.reply(m, text);
}

// Create temp directory if it doesn't exist
(async () => {
    try {
        await fs.access(TEMP_DIR);
    } catch {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    }
})();