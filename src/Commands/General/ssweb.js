const fetch = require('node-fetch');

module.exports = {
    usage: ["ss"],
    desc: "Take a screenshot of the given website URL",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📸",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.reply(m, 'Please provide a valid website URL.\nExample: .ss https://google.com');

        const url = args[0];
        const apiKey = 'PtOLkiDxFAUAZg'; // Provided access key for ScreenshotOne API
        const apiUrl = `https://api.screenshotone.com/take?access_key=${apiKey}&url=${encodeURIComponent(url)}&full_page=true&viewport_width=1920&viewport_height=1080&device_scale_factor=1&format=jpg&image_quality=100&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=false&block_trackers=true&delay=0&timeout=60`;

        await global.kord.react(m, '✨');

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                await global.kord.reply(m, '❌ Failed to take screenshot.');
                return;
            }

            // Convert the response to buffer (image format)
            const buffer = await response.buffer();

            // Send the screenshot as an image
            await global.kord.sendImage(m, buffer, `> Screenshot of ${url}\n > © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`);
        } catch (error) {
            console.error('Error in ss command:', error);
            await global.kord.reply(m, `❌ An error occurred while trying to take the screenshot.\n ${error.message}`);
        }
    }
};
