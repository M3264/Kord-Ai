const fs = require('fs');
const path = require('path');

const IGNORE_LIST_PATH = path.join(__dirname, '..', '..', 'Database', 'ignoreList.json');

module.exports = [
    {
        usage: ['ignorejid', 'ignore'],
        description: 'Add a JID to the ignore list.',
        isOwnerOnly: true,
        execute: async (sock, m, args) => {
            // Ensure the ignore list file exists, create if not
            if (!fs.existsSync(IGNORE_LIST_PATH)) {
                fs.writeFileSync(IGNORE_LIST_PATH, JSON.stringify([], null, 2));
            }

            // Load current ignore list
            let ignoreList = JSON.parse(fs.readFileSync(IGNORE_LIST_PATH, 'utf8'));

            let target;

            // Determine target JID
            if (m.message.extendedTextMessage?.contextInfo?.participant) {
                target = m.message.extendedTextMessage.contextInfo.participant;
            } else if (args[0]) {
                const cleanedJID = args[0].replace(/[^\d]/g, '');
                target = cleanedJID.includes('@') ? cleanedJID : `${cleanedJID}@s.whatsapp.net`;
            } else {
                target = m.key.remoteJid; // Default to sender's JID
            }

            // Check if already ignored
            if (ignoreList.includes(target)) {
                await sock.sendMessage(m.key.remoteJid, { text: 'This JID is already in the ignore list.' }, { quoted: m });
                return;
            }

            // Add to ignore list
            ignoreList.push(target);
            fs.writeFileSync(IGNORE_LIST_PATH, JSON.stringify(ignoreList, null, 2));

            await sock.sendMessage(m.key.remoteJid, { text: `JID ${target} has been added to the ignore list.` }, { quoted: m });
        },
    },
    {
        usage: ['allowjid', 'allow'],
        description: 'Remove a JID from the ignore list.',
        isOwnerOnly: true,
        execute: async (sock, m, args) => {
            if (!fs.existsSync(IGNORE_LIST_PATH)) {
                await sock.sendMessage(m.key.remoteJid, { text: 'No ignore list found.' }, { quoted: m });
                return;
            }

            let ignoreList = JSON.parse(fs.readFileSync(IGNORE_LIST_PATH, 'utf8'));

            let target;

            // Determine target JID
            if (m.message.extendedTextMessage?.contextInfo?.participant) {
                target = m.message.extendedTextMessage.contextInfo.participant;
            } else if (args[0]) {
                const cleanedJID = args[0].replace(/[^\d]/g, '');
                target = cleanedJID.includes('@') ? cleanedJID : `${cleanedJID}@s.whatsapp.net`;
            } else {
                target = m.key.remoteJid; // Default to sender's JID
            }

            // Remove from ignore list
            const updatedIgnoreList = ignoreList.filter(jid => jid !== target);

            if (updatedIgnoreList.length === ignoreList.length) {
                await sock.sendMessage(m.key.remoteJid, { text: 'This JID was not in the ignore list.' }, { quoted: m });
                return;
            }

            fs.writeFileSync(IGNORE_LIST_PATH, JSON.stringify(updatedIgnoreList, null, 2));

            await sock.sendMessage(m.key.remoteJid, { text: `JID ${target} has been removed from the ignore list.` }, { quoted: m });
        },
    },
    {
        usage: ['listignored', 'ignoredlist'],
        description: 'List all JIDs in the ignore list.',
        isOwnerOnly: true,
        execute: async (sock, m) => {
            if (!fs.existsSync(IGNORE_LIST_PATH)) {
                await sock.sendMessage(m.key.remoteJid, { text: 'No ignore list found.' }, { quoted: m });
                return;
            }

            let ignoreList = JSON.parse(fs.readFileSync(IGNORE_LIST_PATH, 'utf8'));

            if (ignoreList.length === 0) {
                await sock.sendMessage(m.key.remoteJid, { text: 'The ignore list is empty.' }, { quoted: m });
                return;
            }

            const formattedList = ignoreList.map((jid, index) => `${index + 1}. ${jid}`).join('\n');

            await sock.sendMessage(m.key.remoteJid, { text: `Ignored JIDs:\n${formattedList}` }, { quoted: m });
        },
    }
];