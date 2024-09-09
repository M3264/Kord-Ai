const number = settings.OWNER_NUMBERS;
const { logger } = require('../../Plugin/kordlogger')
module.exports = {
    usage: ["listonline"],
    desc: "List online users in a GC",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🧑‍💻",

    async execute(sock, m, args) {
        try {
            let id = args && /\d+-\d+@g.us/.test(args[0]) ? args[0] : m.key.remoteJid;
            // Ensure `store.presences` is initialized and has the data for the group.
            if (!store.presences[id]) {
                return await sock.sendMessage(m.key.remoteJid, { text: "No online data available for this group." }, { quoted: m });
            }

            // Get the online users
            let online = [...Object.keys(store.presences[id]), ...number]; // Spread operator for OWNER_NUMBERS
            
            // Send the list of online users
            await sock.sendMessage(m.key.remoteJid, {
                text: 'List Of Those Online:\n\n' + online.map(v => `@${v.replace(/@.+/, '')}`).join("\n"),
                mentions: online
            }, { quoted: m });
            
        } catch (error) {
            // Error handling
            logger.error('Error fetching online users:', error);
            await kord.reply(m, '❌ Failed to list online users.');
        }
    }
};