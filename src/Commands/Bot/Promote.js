const emojis = {
    promote: '⬆️',
    admin: '👑',
    error: '❌',
    success: '✅',
    warning: '⚠️'
};

module.exports = {
    usage: ["promote"],
    desc: "Promote a member to admin in the group",
    commandType: "Group",
    isGroupOnly: true,
    isAdminOnly: true,
    isPrivateOnly: false,
    emoji: emojis.promote,
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
                return kord.reply(m, `${emojis.warning} Please mention a user or reply to their message to promote them.`);
            }

            const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
            const participants = groupMetadata.participants;
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotAdmin = isGroupAdmin;

            if (!isBotAdmin) {
                return kord.reply(m, `${emojis.error} I need to be an admin to promote members.`);
            }

            const isUserInGroup = participants.some(p => p.id === targetUser);
            if (!isUserInGroup) {
                return kord.reply(m, `${emojis.error} This user is not in the group.`);
            }

            const targetParticipant = participants.find(p => p.id === targetUser);
            const isTargetAdmin = targetParticipant?.admin === 'admin' || targetParticipant?.admin === 'superadmin';

            if (isTargetAdmin) {
                return kord.reply(m, `${emojis.admin} This user is already an admin.`);
            }

            await sock.groupParticipantsUpdate(m.key.remoteJid, [targetUser], 'promote');

            const userName = targetParticipant.pushName || targetUser.split('@')[0];
            kord.reply(m, `${emojis.promote} Successfully promoted ${userName} to admin.`);
        } catch (error) {
            console.error(`Error in promote command:`, error);
            kord.reply(m, `${emojis.error} An error occurred while trying to promote the user. Please try again later.`);
        }
    }
};