const fs = require('fs');
const path = require('path');
const banListPath = path.join(__dirname, 'banList.json');

// Load ban list from file
let bannedUsers = [];
function loadBanList() {
    if (fs.existsSync(banListPath)) {
        try {
            bannedUsers = JSON.parse(fs.readFileSync(banListPath, 'utf8'));
        } catch (error) {
            console.error('Error loading ban list:', error);
            bannedUsers = [];
        }
    }
}

// Save the ban list to file
function saveBanList() {
    fs.writeFileSync(banListPath, JSON.stringify(bannedUsers, null, 2));
}

// Load the ban list initially
loadBanList();

module.exports = {
    usage: ['ban'],
    description: 'Ban a user from using the bot.',
    isGroupOnly: false,
    isGroupAdminOnly: false,
    isOwnerOnly: true,
    execute: async (sock, m, args) => {
        let target;

        // Check if the message is a reply
        if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        } 
        // If not a reply, check if a phone number was provided
        else if (args[0]) {
            target = `${args[0].replace(/[^\d]/g, '')}@s.whatsapp.net`;
        }

        if (!target) {
            await sock.sendMessage(m.key.remoteJid, { text: 'Please specify a user to ban or reply to their message.' }, { quoted: m });
            return;
        }

        // Reload the ban list to ensure we have the latest data
        loadBanList();

        // Check if the user is already banned
        if (bannedUsers.some(user => user === target)) {
            await sock.sendMessage(m.key.remoteJid, { text: `User @${target.split('@')[0]} is already banned.`, mentions: [target] }, { quoted: m });
            return;
        }

        // Ban the user
        bannedUsers.push(target);
        saveBanList();

        await sock.sendMessage(m.key.remoteJid, { 
            text: `*User @${target.split('@')[0]} has been banned from using the bot.📌*`,
            mentions: [target]
        }, { quoted: m });
    },
};