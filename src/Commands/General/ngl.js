const fetch = require('node-fetch');

module.exports = {
    usage: ["ngl"],
    desc: "Send anonymous message via NGL",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📩",

    async execute(sock, m, args) {
        const input = args.join(' ');

        // Split input using the '|' separator
        const [username, message] = input.split('|').map(item => item.trim());

        // Ensure both username and message are provided
        if (!username || !message) {
            return await global.kord.reply(m, 'Please provide both a username and a message, separated by "|".\nExample: \`.ngl username | your message\`');
        }

        const apiUrl = `https://itzpire.com/tools/ngl?username=${encodeURIComponent(username)}&message=${encodeURIComponent(message)}`;

        // React with a symbol to indicate the command is processing
        await global.kord.react(m, '✨');

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                await global.kord.reply(m, '❌ Failed to send the message to the NGL API.');
                return;
            }

            const data = await response.json();
            if (data.status === "success") {
                const questionId = data.result.questionId;
                const userRegion = data.result.userRegion;
                await global.kord.reply(m, `✅ Message sent successfully!\nQuestion ID: ${questionId}\nUser Region: ${userRegion}`);
            } else {
                await global.kord.reply(m, '❌ Unable to process your request. Please try again later.');
            }
        } catch (error) {
            console.error('Error in NGL command:', error);
            await global.kord.reply(m, `❌ An error occurred while sending the message.\n ${error.message}`);
        }
    }
};
