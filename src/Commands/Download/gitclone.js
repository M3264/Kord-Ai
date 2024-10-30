const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const TEMP_DIR = path.join(__dirname, '../tmp/');

module.exports = {
    usage: ["gitclone", "githubclone"],
    desc: "Download GitHub repositories",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "⬇️",

    async execute(sock, m, args) {
        if (!args[0]) {
            return await global.kord.reply(m, '❌ Please provide a GitHub repository URL.');
        }

        const url = args[0].toLowerCase();

        // Validate GitHub URL format
        if (!url.match(/^(https?:\/\/)?(www\.)?github\.com\/[^\/]+\/[^\/]+/)) {
            return await global.kord.reply(m, '❌ Invalid URL. Please provide a valid GitHub repository URL.');
        }

        try {
            // Extract repository details
            const parts = url.split('/');
            const githubIndex = parts.findIndex(part => part.includes('github.com'));
            
            if (githubIndex === -1 || parts.length < githubIndex + 3) {
                return await global.kord.reply(m, '❌ Invalid GitHub repository URL format.');
            }

            const user = parts[githubIndex + 1];
            const repo = parts[githubIndex + 2];
            const repoName = repo.replace(/.git$/, '');
            const downloadUrl = `https://api.github.com/repos/${user}/${repoName}/zipball`;

            // Initial loading message
            await global.kord.reply(m, '> *✨`Downloading Repository..`💨*');

            // Download the repository
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                return await global.kord.reply(m, '❌ Repository not found or access denied.');
            }

            const filename = `${user}-${repoName}-${Date.now()}.zip`;
            const filePath = path.join(TEMP_DIR, filename);

            // Ensure directory exists
            try {
                await fs.access(TEMP_DIR);
            } catch {
                await fs.mkdir(TEMP_DIR, { recursive: true });
            }

            // Save the file
            const buffer = await response.buffer();
            await fs.writeFile(filePath, buffer);

            // Send the file
            await global.kord.sendDocument(m, filePath, 'application/zip', filename, 
                '> Here is your GitHub repository! 🚀');

            // Clean up
            await fs.unlink(filePath);

        } catch (error) {
            console.error('Error in GitHub clone command:', error);
            await global.kord.reply(m, '❌ An error occurred while downloading the repository.');
        }
    }
};