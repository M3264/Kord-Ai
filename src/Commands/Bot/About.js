// about.js
const emojis = {
    info: '🤖', // Robot emoji for a bot-centric feel
    heart: '💖', // Heart emoji to show the bot was made with love
    version: '🚀', // Rocket emoji to emphasize the bot's version
};

module.exports = {
    usage: ["about"],
    desc: "Provides information about the bot.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.info,

    async execute(sock, m) {
        try {
            const botName = "Kord-Ai"; // Replace with your bot's name
            const creatorName = "Mirage-Tech"; // Replace with your name
            const botVersion = "V1.0.0"; // Replace with the actual version
            const contactInfo = "miragetechie@outlook.com"; // Add your contact info

            const aboutMessage = `
*${emojis.info} About ${botName}:*

🤖 Hello! I'm ${botName}, your friendly WhatsApp assistant. I'm here to make your life easier by downloading, searching and more features.

${emojis.heart} *Crafted with love by:* ${creatorName}

${emojis.version} *Version:* ${botVersion}

*How Can I Help You?*
Just type */menu* to see a list of commands and discover all the amazing things I can do!

*Get in Touch!*
${contactInfo} 
`;
            await kord.reply(m, aboutMessage);
        } catch (error) {
            await kord.reply(m, "❌ An error occurred while fetching the about message.");
            console.error("Error in about command:", error); // Log the error for debugging
        }
    }
};
