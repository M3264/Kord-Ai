module.exports = {
    usage: ["pline", "pickupline"],
    desc: "Random pickup Line",
    commandType: "Fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: '🌚',

    async execute(sock, m, args) {
        try {
            const response = await fetch('https://api.popcat.xyz/pickuplines');

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const pickupLine = data.pickupline;

            await kord.reply(m, `*Here's a pickup line for you:*\n\n${pickupLine}`);
        } catch (error) {
            console.error('Error fetching pickup line:', error.message);
            await global.kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};