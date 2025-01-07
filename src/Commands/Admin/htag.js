const hidetag = async (sock, m, args) => {
    const groupMetadata = await sock.groupMetadata(m.key.remoteJid)
    const participants = groupMetadata.participants
    
    const message = args.join(' ')
    
    sock.sendMessage(m.key.remoteJid, {
        text: message,
        mentions: participants.map(a => a.id)
    }, {
        quoted: m
    })
}

module.exports = {
    usage: ['hidetag', 'htag'],
    description: 'Tags every person in the group without mentioning their numbers.',
    emoji: '🔖',
    commandType: 'Group',
    isGroupOnly: true,
    isAdminOnly: false,

    async execute(sock, m, args) {
        try {
            if ((!args || args.length === 0) && !m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                if (global.settings?.INVINCIBLE_MODE) {
                    await kord.react(m, "🚫");
                    return await kord.sendErr(m, args, {
                        context: "Hidetag Command",
                        info: "No message provided for hidetag"
                    });
                }
                return kord.reply(m, 'Please provide a message to hidetag.');
            }
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid)
            const participants = groupMetadata.participants

            let messageToSend = args.length > 0 ? args.join(' ') : '';
            if (args.length === 0 && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMsg.conversation) {
                    messageToSend = quotedMsg.conversation;
                } else if (quotedMsg.extendedTextMessage?.text) {
                    messageToSend = quotedMsg.extendedTextMessage.text;
                }
            }
            sock.sendMessage(m.key.remoteJid, {
                text: messageToSend,
                mentions: participants.map(a => a.id)
            }, {
                quoted: m
            })
        } catch (error) {
            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react(m, "🚫");
                return await kord.sendErr(m, error, {
                    context: "Hidetag Command",
                    info: "Failed to execute hidetag"
                });
            }
            console.error('Error in hidetag command:', error)
            kord.reply(m, 'An error occurred while executing the command. This might not be a group chat or there was an issue fetching group data.')
        }
    },
}