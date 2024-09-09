const emojis = {
    success: '✅',
    error: '❌',
    promote: '⏫',
    demote: '⏬',
    kick: '🚪',
    link: '🔗',
};

module.exports = {
    usage: ["group"],
    desc: "Group management commands for admins. Usage:\n" +
          "- `group promote <@user>`: Promote a member to admin.\n" +
          "- `group demote <@user>`: Demote an admin to member.\n" +
          "- `group kick <@user>`: Remove a member from the group.\n" +
          "- `group link`: Get the group invite link.",
    commandType: "Admin",
    isGroupOnly: true,
    isAdminOnly: true, // Only admins can use this command
    emoji: emojis.promote,
    async execute(sock, m, args) {
        try {
            const subcommand = args[0]?.toLowerCase();
            const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!mentionedJid) {
                return await kord.reply(m, `${emojis.error} Please mention a user to perform the action on.`);
            }

            switch (subcommand) {
                case 'promote':
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [mentionedJid], "promote");
                    await kord.reply(m, `${emojis.promote} User promoted to admin.`);
                    break;

                case 'demote':
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [mentionedJid], "demote");
                    await kord.reply(m, `${emojis.demote} User demoted to member.`);
                    break;

                case 'kick':
                    await sock.groupParticipantsUpdate(m.key.remoteJid, [mentionedJid], "remove");
                    await kord.reply(m, `${emojis.kick} User removed from the group.`);
                    break;

                case 'link':
                    const code = await sock.groupInviteCode(m.key.remoteJid);
                    const inviteLink = `https://chat.whatsapp.com/${code}`;
                    await kord.reply(m, `${emojis.link} Group Invite Link: ${inviteLink}`);
                    break;

                default:
                    await kord.reply(m, `${emojis.error} Invalid subcommand. Use promote, demote, kick, or link.`);
            }
        } catch (error) {
            console.error('Error in group command:', error);
            await kord.reply(m, `${emojis.error} Error performing the action.`);
        }
    }
};
