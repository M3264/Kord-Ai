const emojis = {
    add: '➕',
    admin: '👑',
    error: '❌',
    success: '✅',
    warning: '⚠️'
};

module.exports = {
    usage: ["add", "invite"],
    desc: "Add a member to the group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    isPrivateOnly: false,
    emoji: emojis.add,
    async execute(sock, m, args, isGroupAdmin ) {
        try {
            if (!isGroupAdmin) {
                return kord.reply(m, `${emojis.error} This command can only be used by group admins.`);
            }

            let addUser;

            if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                addUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0]; // Get the first mentioned user
            }
            // Check if there's an argument (mention or JID)
            else if (args.length > 0) {
                addUser = args[0].replace('@', '') + '@s.whatsapp.net';
            }
            // If no user is specified
            else {
                return kord.reply(m, `${emojis.warning} Please mention a user or provide their phone number to add them.`);
            }

            // Ensure the bot has permission to add participants
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotAdmin = isGroupAdmin;

            if (!isBotAdmin) {
                return kord.reply(m, `${emojis.error} I need to be an admin to add members.`);
            }

            // Add the user
            await sock.groupParticipantsUpdate(m.key.remoteJid, [addUser], 'add');

            // Get user's name or use their number if name is not available
            const newUser = await sock.onWhatsApp(addUser);
            const userName = newUser.length > 0 ? newUser[0].notify || addUser.split('@')[0] : addUser.split('@')[0];

            kord.reply(m, `${emojis.success} Successfully added ${userName} to the group.`);

        } catch (error) {
            console.error("Error in add command:", error);
            kord.reply(m, `${emojis.error} An error occurred while trying to add the user. Please try again later.`);
        }
    }
};