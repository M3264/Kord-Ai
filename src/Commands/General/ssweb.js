const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

module.exports = {
    usage: ["ss", "ssweb"],
    desc: "Web Screenshot",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
    if (!args[0]) return await global.kord.reply(m, 'Please provide a URL to take a screenshot.');

    if (args[0].match(/xnxx\.com|hamster\.com|nekopoi\.care/i)) {
        return await global.kord.reply(m, 'The link is prohibited.');
    }

    await global.kord.reply(m, '> *✨`Loading..`💨*');

    const url = args[0].startsWith('http') ? args[0] : 'https://' + args[0];

    try {
        let response = await fetch(`https://api.junn4.my.id/tools/ssweb?url=${encodeURIComponent(url)}`);

        if (!response.ok) {
            await global.kord.reply(m, '❌ Failed to fetch the screenshot.');
            return;
        }

        const imgBuffer = await response.buffer();
        const filePath = path.join(__dirname, '../tmp/', `${Date.now()}.jpeg`);

        try {
            await fs.access(path.dirname(filePath));
        } catch {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
        }

        await fs.writeFile(filePath, imgBuffer);

        await global.kord.sendImage(m, filePath, '> Here is the screenshot of the webpage.');

        await fs.unlink(filePath); // Clean up the file after sending

    } catch (error) {
        console.error('Error in screenshot command:', error);
        await global.kord.reply(m, '❌ An error occurred while trying to fetch the screenshot.');
    }}
}