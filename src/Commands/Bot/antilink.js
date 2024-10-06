const fs = require('fs').promises;
const path = require('path');

const emojis = {
    success: '✅',
    error: '❌',
    adminOnly: '👮‍♂️',
    groupOnly: '👥',
    link: '🔗'
};

const configPath = path.join(__dirname, 'antilink_config.json');

let isAntilinkActive = false;
let messageListener = null;
let activeGroups = new Set();

module.exports = {
    usage: ['antilink'],
    desc: "Enable or disable antilink feature in a group",
    commandType: "Admin",
    isGroupOnly: true,
    isAdminOnly: true,
    isPrivateOnly: false,

    async execute(sock, m, args, context) {
        const isGroup = m.key.remoteJid.endsWith('@g.us');
        const groupId = m.key.remoteJid;

        if (!isGroup) {
            await kord.react(m, emojis.groupOnly);
            return kord.reply(m, "This command can only be used in groups.");
        }

        // Check if the sender is an admin
        const groupMetadata = await sock.groupMetadata(groupId);
        const sender = m.key.participant || m.key.remoteJid;
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isAdmin) {
            await kord.react(m, emojis.adminOnly);
            return kord.reply(m, "This command can only be used by group admins.");
        }

        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            if (activeGroups.has(groupId)) {
                return kord.reply(m, 'Antilink is already active in this group.');
            }

            activeGroups.add(groupId);
            await this.updateConfig(groupId, true);

            if (!isAntilinkActive) {
                isAntilinkActive = true;
                this.startListening(sock);
            }

            await kord.react(m, emojis.success);
            return kord.reply(m, 'Antilink has been activated for this group.');

        } else if (action === 'off') {
            if (!activeGroups.has(groupId)) {
                return kord.reply(m, 'Antilink is already inactive in this group.');
            }

            activeGroups.delete(groupId);
            await this.updateConfig(groupId, false);

            if (activeGroups.size === 0) {
                isAntilinkActive = false;
                this.stopListening(sock);
            }

            await kord.react(m, emojis.success);
            return kord.reply(m, 'Antilink has been deactivated for this group.');

        } else {
            return kord.reply(m, 'Usage: !antilink on/off');
        }
    },

    async updateConfig(groupId, isEnabled) {
        let config;
        try {
            const data = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(data);
        } catch (error) {
            config = {};
        }

        config[groupId] = isEnabled;
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    },

    startListening(sock) {
    messageListener = async ({ messages }) => {
        for (const m of messages) {
            // console.log('Received message:', m);

            if (m.key.fromMe || !m.message || !activeGroups.has(m.key.remoteJid)) {
                // console.log('Skipping message:', m.key.remoteJid);
                continue;
            }

            const groupId = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;
            console.log(`Processing message from ${sender} in group ${groupId}`);

            // Check if sender is admin
            const groupMetadata = await sock.groupMetadata(groupId);
            const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
            if (isAdmin) {
                console.log('Sender is admin, skipping message');
                continue;
            }

            const messageTypes = ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage'];
            let messageContent = '';

            for (const type of messageTypes) {
                if (m.message[type]) {
                    messageContent = m.message[type].text || m.message[type].caption || '';
                    // console.log('Message content:', messageContent);
                    break;
                }
            }

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(messageContent)) {
                console.log('Detected link in message, deleting message');
                await sock.sendMessage(groupId, { delete: m.key });
                await sock.sendMessage(groupId, { text: `@${sender.split('@')[0]}, sending links is not allowed in this group.`, mentions: [sender] });
            }
        }
    };

    sock.ev.on('messages.upsert', messageListener);
},

    stopListening(sock) {
        if (messageListener) {
            sock.ev.off('messages.upsert', messageListener);
            messageListener = null;
        }
    },

    async init(sock) {
        try {
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            activeGroups = new Set(Object.keys(config).filter(groupId => config[groupId]));
            if (activeGroups.size > 0) {
                isAntilinkActive = true;
                this.startListening(sock);
            }
        } catch (error) {
            console.error('Error initializing antilink:', error);
            // If the file doesn't exist or is empty, create it with an empty object
            await fs.writeFile(configPath, '{}', 'utf8');
        }
    }
};