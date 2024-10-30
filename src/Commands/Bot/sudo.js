const fs = require('fs');
const path = require('path');
const sudoListPath = path.join(__dirname, '..', '..', 'Database', 'sudo.json');

// Load sudo list from file
let sudoUsers = [];

// Initialize sudo list
if (fs.existsSync(sudoListPath)) {
    sudoUsers = JSON.parse(fs.readFileSync(sudoListPath, 'utf8'));
} else {
    fs.writeFileSync(sudoListPath, JSON.stringify([], null, 2));
}

// Save function
function saveSudoList() {
    fs.writeFileSync(sudoListPath, JSON.stringify(sudoUsers, null, 2));
}

module.exports = [
    {
        usage: ['addsudo', 'setsudo'],
        description: 'Add a user to sudo list',
        isOwnerOnly: true,
        emoji: '👑',
        execute: async (sock, m, args) => {
            let target;

            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo.participant) {
                target = m.message.extendedTextMessage.contextInfo.participant;
            } else if (args[0]) {
                target = `${args[0].replace(/[^\d]/g, '')}@s.whatsapp.net`;
            }

            if (!target) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: '❌ Please specify a user to add as sudo or reply to their message.' 
                }, { quoted: m });
                return;
            }

            const targetNumber = target.split('@')[0];

            if (sudoUsers.includes(targetNumber)) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: '❌ This user is already a sudo user.' 
                }, { quoted: m });
                return;
            }

            sudoUsers.push(targetNumber);
            saveSudoList();
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ User @${targetNumber} has been added to sudo list.`,
                mentions: [target]
            }, { quoted: m });
        }
    },
    {
        usage: ['delsudo', 'rmsudo'],
        description: 'Remove a user from sudo list',
        isOwnerOnly: true,
        emoji: '👑',
        execute: async (sock, m, args) => {
            let target;

            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo.participant) {
                target = m.message.extendedTextMessage.contextInfo.participant;
            } else if (args[0]) {
                target = `${args[0].replace(/[^\d]/g, '')}@s.whatsapp.net`;
            }

            if (!target) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: '❌ Please specify a user to remove from sudo or reply to their message.' 
                }, { quoted: m });
                return;
            }

            const targetNumber = target.split('@')[0];

            if (!sudoUsers.includes(targetNumber)) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: '❌ This user is not a sudo user.' 
                }, { quoted: m });
                return;
            }

            sudoUsers = sudoUsers.filter(user => user !== targetNumber);
            saveSudoList();
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ User @${targetNumber} has been removed from sudo list.`,
                mentions: [target]
            }, { quoted: m });
        }
    },
    {
        usage: ['listsudo', 'allsudo'],
        description: 'List all sudo users',
        isOwnerOnly: true,
        emoji: '📋',
        execute: async (sock, m) => {
            if (sudoUsers.length === 0) {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: '📋 No sudo users found.' 
                }, { quoted: m });
                return;
            }

            let message = '📋 *SUDO USERS LIST*\n\n';
            for (const user of sudoUsers) {
                message += `• @${user}\n`;
            }

            await sock.sendMessage(m.key.remoteJid, { 
                text: message,
                mentions: sudoUsers.map(user => `${user}@s.whatsapp.net`)
            }, { quoted: m });
        }
    }
];