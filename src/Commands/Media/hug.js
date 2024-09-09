const axios = require('axios');

module.exports = {
    usage: ["hug"],
    desc: "Fetch and send a random anime wallpaper.",
    commandType: "Anime",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎎",

    async execute(sock, m, args) {
        try {
            // Notify user the image is being fetched
            kord.reply(m, '> Fetching...');
            
            const waifudd = await axios.get(`https://nekos.life/api/v2/img/hug`);

            if (!waifudd.data.url) {
                return await global.kord.reply(m, '❌ Failed to fetch the wallpaper.');
            }

            const gifUrl = waifudd.data.url;

            // Send the image
            await global.kord.sendImage(m, gifUrl, 'Here');
        } catch (error) {
            console.error('Error fetching anime wallpaper:', error.message);
            await global.kord.reply(m, '❌ An error occurred while fetching the wallpaper.');
        }
    }
};