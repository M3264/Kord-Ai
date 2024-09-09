module.exports = {
    event: ['messages.upsert'],
    desc: 'Delete inappropriate messages (text)!',
    isEnabled: global.settings.BAD_WORD_FILTER,
    async execute(sock, data) {
        const ms = data.messages;
        const m = ms[0];
        if (m.key.fromMe) return;
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text;
        try {
            if (messageText && typeof messageText === 'string') {
                const badWords = global.settings.BAD_WORDS.map(word => word.toLowerCase());
               
                if (badWords.some(word => messageText.toLowerCase().includes(word))) {
                    if (m.key.remoteJid.endsWith('@g.us')) {
                        const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
                        const myID = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                       
                        const isBotAdmin = groupMetadata.participants.some(
                            (participant) => participant.id === myID && participant.admin !== null
                        );
   
                        if (isBotAdmin) {
                            await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                            console.log(`Deleted message with bad word in group ${m.key.remoteJid}`);
                        } else {
                            console.log(`Bot is not an admin in group ${m.key.remoteJid}. Message not deleted.`);
                        }
                    } else {
                        await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                        console.log(`Deleted message with bad word in chat ${m.key.remoteJid}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error in DeleteBadWord module:", error);
        }
    }
};