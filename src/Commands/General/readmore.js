module.exports = {
    usage: ['readmore'],
    description: 'Adds *readmore* in given text.',
    emoji: '👾',
    commandType: 'Misc',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,

    async execute(sock, m, args) {
        try {
            // Ensure there's text provided
            const text = args.join(' ');

            if (!text) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Please provide some text!" }, { quoted: m });
            }

            // Add readmore character
            const readmoreChar = String.fromCharCode(8206);
            const rtext = readmoreChar.repeat(4001) + text;

            // Send the message
            return await sock.sendMessage(m.key.remoteJid, { text: rtext }, { quoted: m });
        } catch (error) {
            console.error('Error in readmore command:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `Error: ${error.message}` }, { quoted: m });
        }
    }
};