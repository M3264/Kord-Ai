const fetch = require('node-fetch');

module.exports = {
    usage: ["gpt"],
    desc: "Interact with the GPT API",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🤖",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.reply(m, 'Please provide a message for GPT.');

        const text = args.join(' ');
        const apiUrl = `https://itzpire.com/ai/gpt?model=gpt-4&q=${encodeURIComponent(text)}`;

        await global.kord.react(m, '✨');

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                await global.kord.reply(m, '❌ Failed to fetch response from API.');
                return;
            }

            const data = await response.json();
            const result = data.data.response; // Accessing the correct part of the response

            await global.kord.freply(m, result);
        } catch (error) {
            console.error('Error in GPT command:', error);
            await global.kord.reply(m, `❌ An error occurred while trying to fetch a response from GPT.\n ${error.message}`);
        }
    }
};
