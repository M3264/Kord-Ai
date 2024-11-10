const emojis = {
    success: '✅',
    error: '❌',
    adminOnly: '👮‍♂️',
    groupOnly: '👥'
};

module.exports = {
    usage: ["delete", "del"],
    desc: "Deletes a specific message (including media) in groups (if bot is admin) or in private chats.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: true,
    isPrivateOnly: false,
    emoji: emojis.success,

    async execute(sock, m, args) {
        try {
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const cmd = this.usage[0];

            if (isGroup) {
                // Check if the bot is an admin in the group
                const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
                const botId = sock.user.id.split(':')[0] + "@s.whatsapp.net";
                const botIsAdmin = groupMetadata.participants.some(p => p.id === botId && p.admin);

                if (!botIsAdmin) {
                    await kord.react(m, emojis.adminOnly);
                    return await kord.reply(m, "I need to be an admin to delete messages in this group.");
                }
            }

            // Get the quoted message
            const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;

            if (quotedMsg) {
                const quotedMsgKey = {
                    remoteJid: m.key.remoteJid,
                    fromMe: m.message.extendedTextMessage.contextInfo.participant === sock.user.id,
                    id: m.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: m.message.extendedTextMessage.contextInfo.participant
                };

                // Delete the quoted message (works for all message types including media)
                await sock.sendMessage(m.key.remoteJid, { delete: quotedMsgKey });

                // Delete the command message
                await sock.sendMessage(m.key.remoteJid, { delete: m.key });

                // React with success emoji (this might fail if the message is already deleted)
                try {
                    await kord.react(m, emojis.success);
                } catch (reactError) {
                    console.log("Couldn't react to message, it might have been deleted already.");
                }
            } else {
                await kord.freply(m, "Please quote/reply to the message you want me to delete.", cmd);
            }
        } catch (error) {
            console.error("Error in delete command:", error);
            await kord.react(m, emojis.error);
            await kord.reply(m, "❌ An error occurred while trying to delete the message: " + error.message);
        }
    }
};