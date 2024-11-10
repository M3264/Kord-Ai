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
    isAdminOnly: true, // This command can only be used in group chats

    async execute(sock, m, args) {
        try {
            // Check if the user is an admin
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid)
            const participants = groupMetadata.participants
            
            await hidetag(sock, m, args)
        } catch (error) {
            console.error('Error in hidetag command:', error)
            kord.reply(m,'An error occurred while executing the command. This might not be a group chat or there was an issue fetching group data.')
        }
    },
}