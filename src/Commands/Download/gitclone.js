const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const TEMP_DIR = './temp';
const waitMessage = "Downloading, please wait...";
const emojis = {
    processing: '⏳',
    done: '🚀'
};

async function getGitHubRepo(args, m, kord) {
    const url = args[0];

    // Check if URL starts with 'github.com'
    if (!url.includes('github.com')) {
        return await kord.reply(m, "Invalid URL. Please provide a URL starting with 'github.com'.");
    }

    // Extract repository details
    const parts = url.split('/');
    const user = parts[parts.indexOf('github.com') + 1];
    const repo = parts[parts.indexOf('github.com') + 2];
    const repoName = repo.replace(/.git$/, '');

    const downloadUrl = `https://api.github.com/repos/${user}/${repoName}/zipball`;

    try {
        // Fetch the filename from the GitHub API
        let response = await fetch(downloadUrl, { method: 'HEAD' });
        let contentDisposition = response.headers.get('content-disposition');
        let filename = contentDisposition ? contentDisposition.match(/attachment; filename=(.*)/)[1] : 'repo.zip';
        filename = filename.replace('.zip.zip', '.zip');

        // Create temporary file path
        const tempPath = path.join(TEMP_DIR, filename);

        // Ensure TEMP_DIR exists
        await fs.mkdir(TEMP_DIR, { recursive: true });

        // Reply with the initial wait message
        let sentMessage = await kord.reply(m, `${emojis.processing} ${waitMessage}`);

        // Download the file with progress
        await downloadWithProgress(downloadUrl, tempPath, sentMessage, kord, m);

        // Send the downloaded file
        await kord.sendDocument(m, tempPath, 'application/zip', filename, 'Here is your GitHub repository.');

        // Clean up temporary file
        await fs.unlink(tempPath);
    } catch (error) {
        console.error("Error downloading GitHub repo:", error);
        await kord.reply(m, "Error downloading GitHub repo.");
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
    usage: ["gitclone", "githubclone"],
    desc: "Download GitHub repositories with a progress bar.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "⬇️",
    async execute(args, m, kord) {
        await getGitHubRepo(args, m, kord);
    }
};