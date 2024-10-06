const fs = require('fs');
const path = require('path');
const { getCommand } = require('./kordLoadCmd');

// Constants
const COOLDOWNS = new Map();
const RATE_LIMITS = new Map();
const BAN_LIST_PATH = path.join(__dirname, '..', 'Commands', 'General', 'banList.json');


// Ban list management
let bannedUsers = [];

function loadBanList() {
    try {
        return JSON.parse(fs.readFileSync(BAN_LIST_PATH, 'utf8'));
    } catch (error) {
        console.error('Error loading ban list:', error);
        return [];
    }
}

function saveBanList() {
    try {
        fs.writeFileSync(BAN_LIST_PATH, JSON.stringify(bannedUsers, null, 2));
    } catch (error) {
        console.error('Error saving ban list:', error);
    }
}

// Watch for changes in the ban list file
fs.watch(BAN_LIST_PATH, (eventType) => {
    if (eventType === 'change') {
        console.log('Ban list file changed. Reloading...');
        bannedUsers = loadBanList();
    }
});

// Initial load of the ban list
bannedUsers = loadBanList();

// Helper functions
function extractTextFromMessage(message) {
    const messageTypes = ['extendedTextMessage', 'conversation', 'imageMessage', 'videoMessage'];
    return messageTypes.reduce((acc, type) => 
        acc || (message[type] && (message[type].text || message[type].caption || message[type])) || '', '').toString();
}

async function buildContext(sock, m, sender) {
    const isOwner = settings.OWNER_NUMBERS.includes(sender.split('@')[0]);
    const isGroupAdmin = m.key.remoteJid.endsWith('@g.us')
        ? (await sock.groupMetadata(m.key.remoteJid)).participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(sender)
        : false;
    return { isOwner, isGroupAdmin };
}

async function checkPermissions(sock, m, command, context) {
    const { isOwner, isGroupAdmin } = context;
    const errorMessages = {
        isAdminOnly: '⛔ *This command can only be used by bot Owners.*',
        isGroupOnly: '⛔ *This command can only be used in groups.*',
        isPrivateOnly: '⛔ *This command can only be used in private chats.*',
        isGroupAdminOnly: '⛔ *This command can only be used by group admins.*'
    };

    for (const [permission, message] of Object.entries(errorMessages)) {
        if (command[permission] && !((permission === 'isAdminOnly' && isOwner) || 
                                     (permission === 'isGroupAdminOnly' && (isGroupAdmin || isOwner)) ||
                                     (permission === 'isGroupOnly' && m.key.remoteJid.endsWith('@g.us')) ||
                                     (permission === 'isPrivateOnly' && m.key.remoteJid.endsWith('@s.whatsapp.net')))) {
            await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });
            return false;
        }
    }
    return true;
}

async function checkCooldown(sock, m, command, sender) {
    const cooldownTime = command.cooldown || settings.COMMAND_COOLDOWN_TIME_IN_MS || 2000;
    const now = Date.now();
    const timestamps = COOLDOWNS.get(sender) || new Map();
    COOLDOWNS.set(sender, timestamps);

    if (timestamps.has(command.usage)) {
        const expirationTime = timestamps.get(command.usage) + cooldownTime;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            await sock.sendMessage(m.key.remoteJid, { text: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.usage}\` command.` }, { quoted: m });
            return false;
        }
    }

    timestamps.set(command.usage, now);
    setTimeout(() => timestamps.delete(command.usage), cooldownTime);
    return true;
}

async function checkRateLimit(sock, m, sender) {
    const maxCommandsPerMinute = settings.MAX_COMMANDS_PER_MINUTE || 10;
    const now = Date.now();
    const userRateLimit = RATE_LIMITS.get(sender) || { count: 0, resetTime: now + 60000 };

    if (now > userRateLimit.resetTime) {
        userRateLimit.count = 1;
        userRateLimit.resetTime = now + 60000;
    } else {
        userRateLimit.count++;
    }

    RATE_LIMITS.set(sender, userRateLimit);

    if (userRateLimit.count > maxCommandsPerMinute) {
        await sock.sendMessage(m.key.remoteJid, { text: `You've reached the maximum number of commands per minute. Please wait before trying again.` }, { quoted: m });
        return false;
    }

    return true;
}

// Main command handler
async function kordCmdUpsert(sock, m) {
    try {
        if (!m || !m.message) return;

        const text = extractTextFromMessage(m.message);
        const prefix = settings.PREFIX.find(p => text.toLowerCase().startsWith(p.toLowerCase()));
        
        if (!prefix) return;
        if (settings.WORK_MODE.toLowerCase() === "private" && m.key.remoteJid.endsWith('@g.us')) return;

        const [commandName, ...args] = text.slice(prefix.length).trim().split(/\s+/);
        const command = getCommand(commandName.toLowerCase());
        if (!command) return;

        const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;

        const context = await buildContext(sock, m, sender);

        // Check if user is banned, but allow the owner to use the bot regardless
        if (bannedUsers.includes(sender) && !context.isOwner) {
            await sock.sendMessage(m.key.remoteJid, { text: '⛔ *You are banned from using this bot.*' }, { quoted: m });
            return;
        }

        if (!await checkPermissions(sock, m, command, context)) return;
        if (!await checkCooldown(sock, m, command, sender)) return;
        if (!await checkRateLimit(sock, m, sender)) return;

        try {
            if (command.emoji) await sock.sendMessage(m.key.remoteJid, { react: { text: command.emoji, key: m.key } });
            if (settings.READ_ALL_MESSAGES) await sock.readMessages([m.key]);

            await command.execute(sock, m, args, context);
        } catch (err) {
            console.error(`Error executing command ${commandName}:`, err);
            await sock.sendMessage(m.key.remoteJid, { text: 'An error occurred while processing your command. Please try again later.' }, { quoted: m });
        }
    } catch (error) {
        console.error('Error in Command Execute:', error);
    }
}

module.exports = { kordCmdUpsert };