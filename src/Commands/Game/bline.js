module.exports = {
    usage: ["bline", "breakupline"],
    desc: "Random breakup Line",
    commandType: "Fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: '💔',

    async execute(sock, m, args) {
        try {
            const response = await fetch('https://api.jcwyt.com/breakup');

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.text();  // Using .text() since the response seems to be plain text

            await kord.reply(m, `*Here's a breakup line for you:*\n\n${data}`);
        } catch (error) {
            console.error('Error fetching breakup line:', error.message);
            await global.kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};