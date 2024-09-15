module.exports = {
    usage: 'fakereply',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,

    async execute(sock, m, args, context) {
        try {
            // Define the fake message
            const fakeMessage = {
                key: {
                    fromMe: false, // Set to false to mimic an external user
                    participant: "2348160247341@s.whatsapp.net", // Fake sender's JID
                    remoteJid: m.key.remoteJid // The chat ID to send in
                },
                message: {
                    conversation: "This is a fake message" // The content of the fake message
                }
            };

            // Define the actual message the bot will send as a reply
            const fakeReplyMessage = {
                text: args.join(' ') || 'This is the fake reply!', // Message the bot sends
                contextInfo: { 
                    quotedMessage: fakeMessage.message, // Quoting the fake message
                    participant: fakeMessage.key.participant // Fake participant
                }
            };

            // Send the fake reply message
            await sock.sendMessage(m.key.remoteJid, fakeReplyMessage, { quoted: fakeMessage });

            // Notify that the fake reply was sent
            await sock.sendMessage(m.key.remoteJid, { text: '*Fake reply sent!*' });

        } catch (error) {
            console.error('Error sending fake reply:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `An error occurred while sending the fake reply ${error.mesaage}` });
        }
    }
}