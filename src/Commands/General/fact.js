module.exports = {
    usage: ["fact"],
    desc: "Fetches Random Facts",
    commandType: "Fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: '',

    async execute(sock, m, args) {
        try {
            const response = await axios.get('https://nekos.life/api/v2/fact');
            const fact = response.data.fact;
            await kord.reply(m, `Here's a random fact for you! \n${fact}`);
        } catch (error) {
            console.error('Error fetching fact:', error.message);
            await global.kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};