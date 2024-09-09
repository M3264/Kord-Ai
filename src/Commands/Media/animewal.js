const axios = require('axios');

module.exports = {
    usage: ["animewlp", "waifu-wallpaper"],
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
            
            const waifudd = await axios.get(`https://nekos.life/api/v2/img/wallpaper`);

            if (!waifudd.data.url) {
                return await global.kord.reply(m, '❌ Failed to fetch the wallpaper.');
            }

            const imageUrl = waifudd.data.url;

            // Send the image
            await global.kord.sendImage(m, imageUrl, 'Here is your random anime wallpaper!');
        } catch (error) {
            console.error('Error fetching anime wallpaper:', error.message);
            await global.kord.reply(m, '❌ An error occurred while fetching the wallpaper.');
        }
    }
};