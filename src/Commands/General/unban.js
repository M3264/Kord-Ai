const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, 'banList.json');

// Load the ban list from JSON file
function loadBanList() {
    if (!fs.existsSync(banListPath)) {
        fs.writeFileSync(banListPath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(banListPath, 'utf8'));
}

// Save the ban list to JSON file
function saveBanList(banList) {
    fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));
}

module.exports = {
    usage: ['unban'],
    description: 'Unban a user from using the bot.',
    emoji: '🔓',
    commandType: 'Admin',
    isGroupOnly: false,
    isAdminOnly: true,  // Assuming only admins can unban
    isPrivateOnly: true,

    async execute(sock, m, args) {
        try {
            if (args.length === 0) {
                await sock.sendMessage(m.key.remoteJid, {
                    text: 'Please provide the phone number to unban.',
                }, { quoted: m });
                return;
            }

            const phoneNumber = args[0].replace(/[^\d]/g, ''); // Remove any non-numeric characters
            const banList = loadBanList();

            // Check if user is in the ban list
            const index = banList.indexOf(phoneNumber);
            if (index === -1) {
                await sock.sendMessage(m.key.remoteJid, {
                    text: 'This number is not banned.',
                }, { quoted: m });
                return;
            }

            // Remove user from the ban list
            banList.splice(index, 1);
            saveBanList(banList);

            await sock.sendMessage(m.key.remoteJid, {
                text: `The number ${phoneNumber} has been unbanned.`,
            }, { quoted: m });
        } catch (error) {
            console.error('Error unbanning user:', error);
            await sock.sendMessage(m.key.remoteJid, {
                text: 'An error occurred while trying to unban the user. Please try again later.',
            }, { quoted: m });
        }
    }
};