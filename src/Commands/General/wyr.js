const fetch = require('node-fetch');

module.exports = {
    usage: ["wyr", "wouldyourather"],
    desc: "Get a random 'Would You Rather' question.",
    commandType: "Fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🤔",

    async execute(sock, m, args) {
        try {
            // Fetch the 'Would You Rather' options from the API
            const response = await fetch('https://api.popcat.xyz/wyr');

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const ops1 = data.ops1;
            const ops2 = data.ops2;

            // Send the options as a reply message
            const question = `🤔 *Would You Rather*\n\nOption 1: ${ops1}\n\nOption 2: ${ops2}`;

            await kord.reply(m, question);
        } catch (error) {
            console.error('Error fetching Would You Rather:', error.message);
            await kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};