const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const TEMP_DIR = './temp';
const waitMessage = "Downloading from MediaFire, please wait...";
const emojis = {
    processing: '⏳',
    done: '🚀'
};

async function downloadMediaFire(args, m, kord) {
    const url = args[0];

    if (!url.includes('mediafire.com')) {
        return await kord.reply(m, "Invalid URL. Please provide a valid MediaFire link.");
    }

    try {
        // Fetch the MediaFire page
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract the download link and filename
        const downloadLink = $('a#downloadButton').attr('href');
        const filename = $('div.filename').text().trim();

        if (!downloadLink || !filename) {
            throw new Error("Download link or filename not found");
        }

        // Create temporary file path
        const tempPath = path.join(TEMP_DIR, filename);

        // Ensure TEMP_DIR exists
        await fs.mkdir(TEMP_DIR, { recursive: true });

        // Reply with the initial wait message
        let sentMessage = await kord.reply(m, `${emojis.processing} ${waitMessage}`);

        // Download the file with progress
        await downloadWithProgress(downloadLink, tempPath, sentMessage, kord, m);

        // Send the downloaded file
        await kord.sendDocument(m, tempPath, 'application/octet-stream', filename, 'Here is your MediaFire file.');

        // Clean up temporary file
        await fs.unlink(tempPath);
    } catch (error) {
        console.error("Error downloading MediaFire file:", error);
        await kord.reply(m, "Error downloading MediaFire file: " + error.message);
    }
}

async function downloadWithProgress(url, filePath, sentMessage, kord, m) {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(filePath);

    const totalSize = parseInt(response.headers.get('content-length'), 10);
    let downloadedSize = 0;

    response.body.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percentComplete = (downloadedSize / totalSize) * 100;

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
    usage: ["mediafire", "mf"],
    desc: "Download files from MediaFire links.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📥",
    async execute(args, m, kord) {
        await downloadMediaFire(args, m, kord);
    }
};