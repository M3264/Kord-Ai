const fs = require('fs');
const path = require('path');
const { getCommand, getAllCommands } = require('./kordLoadCmd');
const cooldowns = new Map();
const rateLimit = new Map();
const banListPath = path.join(__dirname, 'banList.json');

// Load ban list from file
let bannedUsers = [];
if (fs.existsSync(banListPath)) {
    bannedUsers = JSON.parse(fs.readFileSync(banListPath, 'utf8'));
}

async function kordCmdUpsert(sock, m) {
    try {
        if (!m || !m.message) return;

        const { message } = m;
        const messageTypes = ['extendedTextMessage', 'conversation', 'imageMessage', 'videoMessage'];
        let text = messageTypes.reduce((acc, type) =>
            acc || (message[type] && (message[type].text || message[type].caption || message[type])) || '', '');

        if (typeof text !== 'string') {
            text = '';
        }

        const response = text.toString();  // No .toLowerCase() here
        const prefix = settings.PREFIX.find(p => response.toLowerCase().startsWith(p.toLowerCase())); // Prefix match in lowercase
        
        if (!prefix) return;
        if (settings.WORK_MODE.toLowerCase() === "private" && m.key.remoteJid.endsWith('@g.us')) {
    return;
}

const [commandName, ...args] = response.slice(prefix.length).trim().split(/\s+/);

// Only convert the command name to lowercase, not the entire response
const command = getCommand(commandName.toLowerCase());

        const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;

        // Check if user is banned
       /*  if (bannedUsers.includes(sender)) {
            await kord.reply(m, '⛔ *You are banned from using this bot.*');
            return;
        }
        */

        const context = await buildContext(sock, m, sender);

        if (!await checkPermissions(sock, m, command, context)) return;
        if (!await checkCooldown(sock, m, command, sender)) return;
        if (!await checkRateLimit(sock, m, sender)) return;

        try {
            if (command.emoji) await kord.react(m, command.emoji);
            if (settings.READ_ALL_MESSAGES) await sock.readMessages([m.key]);

            await command.execute(sock, m, args, context);
        } catch (err) {
            console.error(`Error executing command ${commandName}:`, err);
            await kord.reply(m, 'An error occurred while processing your command. Please try again later.');
        }
    } catch (error) {
        console.error('Error in Command Execute:', error);
    }
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
    if (command.isAdminOnly && !m.key.fromMe && !isOwner) {
        await kord.reply(m, '⛔ *This command can only be used by bot Owners.*');
        return false;
    } else if (command.isGroupOnly && !m.key.remoteJid.endsWith('@g.us')) {
        await kord.reply(m, '⛔ *This command can only be used in groups.*');
        return false;
    } else if (command.isPrivateOnly && !m.key.remoteJid.endsWith('@s.whatsapp.net')) {
        await kord.reply(m, '⛔ *This command can only be used in private chats.*');
        return false;
    } else if (command.isGroupAdminOnly && !isGroupAdmin && !isOwner) {
        await kord.reply(m, '⛔ *This command can only be used by group admins.*');
        return false;
    }
    return true;
}

async function checkCooldown(sock, m, command, sender) {
    const cooldownTime = command.cooldown || settings.COMMAND_COOLDOWN_TIME_IN_MS || 2000;
    const now = Date.now();
    const timestamps = cooldowns.get(sender) || cooldowns.set(sender, new Map()).get(sender);

    if (timestamps.has(command.usage)) {
        const expirationTime = timestamps.get(command.usage) + cooldownTime;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            await kord.reply(m, `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.usage}\` command.`);
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
    const userRateLimit = rateLimit.get(sender) || { count: 0, resetTime: now + 60000 };

    if (now > userRateLimit.resetTime) {
        userRateLimit.count = 1;
        userRateLimit.resetTime = now + 60000;
    } else {
        userRateLimit.count++;
    }

    rateLimit.set(sender, userRateLimit);

    if (userRateLimit.count > maxCommandsPerMinute) {
        await kord.reply(m, `You've reached the maximum number of commands per minute. Please wait before trying again.`);
        return false;
    }

    return true;
}

module.exports = { kordCmdUpsert };