const axios = require('axios');

module.exports = {
    usage: ["animeneko", "neko"],
    desc: "Fetch and send a random anime wallpaper.",
    commandType: "Anime",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🍁",

    async execute(sock, m, args) {
        try {
            // Notify user the image is being fetched
            kord.react(m, '🍁');
            
            const waifudd = await axios.get(`https://api.waifu.pics/sfw/neko`);

            if (!waifudd.data.url) {
                return await global.kord.reply(m, '❌ Failed to fetch the wallpaper.');
            }

            const imageUrl = waifudd.data.url;

            // Send the image
            await global.kord.sendImage(m, imageUrl, '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™');
        } catch (error) {
            console.error('Error fetching anime wallpaper:', error.message);
            await global.kord.reply(m, `❌ An error occurred while fetching the wallpaper. ${error.message}`);
        }
    }
};