const { delay } = require('@whiskeysockets/baileys');

// Emojis for more expressive messages
const emojis = {
    alive: '⚡',
    heart: '💖',
    party: '🎉',
    wave: '👋',
    thumbsup: '👍',
    flexing: '💪',
    fire: '🔥',
    error: '❌', // New emoji for errors
};

module.exports = {
    usage: ["alive"],
    desc: "Confirms the bot's active status with style and flair.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.alive, 

    async execute(sock, m) {
        try {
            const botName = settings.BOT_NAME;
            const botVersion = settings.VERSION;
            const runtime = formatSecondsToDHMS(process.uptime());

            // Create a visually appealing alive message using Unicode characters 
            const aliveMessage = `
╔══════════════════════╗
    ⚡  *${botName}* is ALIVE! 💖
╚══════════════════════╝
${emojis.wave} Status: Online and Ready!
${emojis.flexing} Version: ${botVersion}
${emojis.thumbsup} Uptime: ${runtime}
${emojis.party} Created by: MIRACLE

${emojis.fire} Let's get this party started! ${emojis.fire}
`;

            // Send the message and add a random reaction
            const sentMsg = await kord.reply(m, aliveMessage);
            const randomEmoji = [emojis.party, emojis.thumbsup, emojis.fire][Math.floor(Math.random() * 3)];
            await kord.react(m, randomEmoji);

            // Delay and then edit the message for a dramatic reveal
            await delay(1500); 
            await kord.editMsg(m, sentMsg, aliveMessage + `\n\nP.S. Did you catch that awesome reaction? ${emojis.party}`);

        } catch (error) {
            // Basic error logging in the console (no color)
            console.error(`[ERROR] Alive Command:`, error); 

            // Inform the user about the error
            await kord.react(m, emojis.error);
            await kord.reply(m, `${emojis.error} Uh oh! Something's not right. I might need a reboot.`);
        }
    }
};


// Helper function to format uptime
function formatSecondsToDHMS(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}
