const emojis = {
    demote: '⬇️',
    admin: '👑',
    error: '❌',
    success: '✅',
    warning: '⚠️'
};

module.exports = {
    usage: ["demote"],
    desc: "Demote an admin to regular member in the group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    isPrivateOnly: false,
    emoji: emojis.demote,
    async execute(sock, m, args, isGroupAdmin ) {
        try {
            if (!isGroupAdmin) {
                return kord.reply(m, `${emojis.error} This command can only be used by group admins.`);
            }

            let targetUser;
            if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
                targetUser = m.message.extendedTextMessage.contextInfo.participant;
            } else if (args.length > 0) {
                targetUser = args[0].replace('@', '') + '@s.whatsapp.net';
            } else {
                return kord.reply(m, `${emojis.warning} Please mention a user or reply to their message to demote them.`);
            }

            const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            const participants = groupMetadata.participants;
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotAdmin = isGroupAdmin;

            if (!isBotAdmin) {
                return kord.reply(m, `${emojis.error} I need to be an admin to demote members.`);
            }

            const isUserInGroup = participants.some(p => p.id === targetUser);
            if (!isUserInGroup) {
                return kord.reply(m, `${emojis.error} This user is not in the group.`);
            }

            const targetParticipant = participants.find(p => p.id === targetUser);
            const isTargetAdmin = targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin';

            if (!isTargetAdmin) {
                return kord.reply(m, `${emojis.error} This user is not an admin.`);
            }

            await sock.groupParticipantsUpdate(m.key.remoteJid, [targetUser], 'demote');

            const userName = targetParticipant.pushName || targetUser.split('@')[0];
            kord.reply(m, `${emojis.demote} Successfully demoted ${userName} from admin.`);
        } catch (error) {
            console.error(`Error in demote command:`, error);
            kord.reply(m, `${emojis.error} An error occurred while trying to demote the user. Please try again later.`);
        }
    }
};