const fs = require('fs');
const path = require('path');
const banListPath = path.join(__dirname, 'banList.json');

// Load ban list from file
let bannedUsers = [];
if (fs.existsSync(banListPath)) {
    bannedUsers = JSON.parse(fs.readFileSync(banListPath, 'utf8'));
}

// Save the ban list to file
function saveBanList() {
    fs.writeFileSync(banListPath, JSON.stringify(bannedUsers, null, 2));
}

module.exports = {
    usage: ['ban'],
    description: 'Ban a user from using the bot.',
    isGroupOnly: true,
    isGroupAdminOnly: true,
    execute: async (sock, m, args) => {
        const target = m.message.extendedTextMessage
            ? m.message.extendedTextMessage.contextInfo.participant
            : args[0] ? `${args[0].replace(/[^\d]/g, '')}@s.whatsapp.net` : '';

        if (!target) {
            await kord.reply(m, 'Please specify a user to ban.');
            return;
        }

        if (bannedUsers.includes(target)) {
            await kord.reply(m, 'This user is already banned.');
            return;
        }

        bannedUsers.push(target);
        saveBanList();
        await kord.reply(m, `User @${target.split('@')[0]} has been banned from using the bot.`, {
            mentions: [target],
        });
    },
};