module.exports = {
    event: ['messages.upsert'],  // Listen for incoming messages
    desc: 'Deletes WhatsApp links if found in messages.',
    isEnabled: settings.DELETE_WA_LINKS,

    async execute(sock, ms) {
        const m = ms.messages[0];
        const messageText = m.message?.conversation || m.message?.extendedTextMessage?.text;
        if (!messageText || !isWhatsAppLink(messageText)) return;
        if (m.key.fromMe) return;

        try {
            if (m.key.remoteJid.endsWith('@g.us')) { // Check if it's a group chat
                const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
                const myID = sock.user.id.split(':')[0] + '@s.whatsapp.net'; // Extract the bot's ID without the resource part
                console.log(groupMetadata)
                const isBotAdmin = groupMetadata.participants.some(
                    (participant) => participant.id === myID && participant.admin !== null
                );

                if (isBotAdmin) {
                    await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                    console.log(`Deleted message with WhatsApp link in group ${m.key.remoteJid}`);
                } else {
                    console.log(`Bot is not an admin in group ${m.key.remoteJid}. Link not deleted.`);
                }
            } else { // If not a group, delete the link
                await sock.sendMessage(m.key.remoteJid, { delete: m.key });
                console.log(`Deleted message with WhatsApp link in chat ${m.key.remoteJid}`);
            }
        } catch (error) {
            console.error("Error checking admin status or deleting link:", error);
        }
    }
};

function isWhatsAppLink(text) {
    const waLinkPattern = /(?:https?:\/\/)?(?:www\.)?(chat\.whatsapp\.com\/[a-zA-Z0-9]+|wa\.me\/[0-9]+|api\.whatsapp\.com\/send\?phone=[0-9]+)/;
    return waLinkPattern.test(text);
}
