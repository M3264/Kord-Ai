const emojis = {
    kick: '🚫',
    admin: '👑',
    error: '❌',
    success: '✅',
    warning: '⚠️'
};

module.exports = {
    usage: ["kick", "remove"],
    desc: "Kick a member from the group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    isPrivateOnly: false,
    emoji: emojis.kick,
    async execute(sock, m, args, { isGroupAdmin }) {
        try {
            if (!isGroupAdmin) {
                return kord.reply(m, `${emojis.error} This command can only be used by group admins.`);
            }

            const quoted = await kord.getQuotedMessage(m);
           
            let kickUser;

            if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                kickUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0]; // Get the first mentioned user
            } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
                kickUser = m.message.extendedTextMessage.contextInfo.participant; // Get from quoted message
            }
            // Check if there's an argument (mention or JID)
            else if (args.length > 0) {
                kickUser = args[0].replace('@', '') + '@s.whatsapp.net';
            }
            // If no user is specified
            else {
                return kord.reply(m, `${emojis.warning} Please mention a user or reply to their message to kick them.`);
            }
            
            const isOwner = settings.OWNER_NUMBERS.includes(kickUser.split('@'));
            if (isOwner) {
                return kord.reply(m, `${emojis.error} _You cannot kick the owner. Fool!_`);
            }

            // Ensure the bot has permission to remove participants
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            const participants = groupMetadata.participants;
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotAdmin = isGroupAdmin;

            if (!isBotAdmin) {
                return kord.reply(m, `${emojis.error} I need to be an admin to kick members.`);
            }

            // Check if the user to be kicked is in the group
            const isUserInGroup = participants.some(p => p.id === kickUser);
            if (!isUserInGroup) {
                return kord.reply(m, `${emojis.error} This user is not in the group.`);
            }

            // Check if the user to be kicked is an admin
            const isKickUserAdmin = participants.find(p => p.id === kickUser)?.admin === 'admin' || participants.find(p => p.id === kickUser)?.admin === 'superadmin';
            if (isKickUserAdmin) {
                return kord.reply(m, `${emojis.admin} You can't kick another admin.`);
            }

            // Kick the user
            await sock.groupParticipantsUpdate(m.key.remoteJid, [kickUser], 'remove');

            // Get user's name or use their number if name is not available
            const kickedUser = participants.find(p => p.id === kickUser);
            const userName = kickedUser.pushName || kickUser.split('@')[0];

            kord.reply(m, `${emojis.success} Successfully kicked ${userName} from the group.`);

        } catch (error) {
            console.error("Error in kick command:", error);
            kord.reply(m, `${emojis.error} An error occurred while trying to kick the user. Please try again later.`);
        }
    }
};