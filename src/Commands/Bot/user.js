const fs = require('fs');
const path = require('path');
const axios = require('axios');
const fsPromises = require('fs').promises
const jimp = require('jimp');
const os = require('os');


module.exports = [
    {
        usage: ["archive"],
        desc: "Archive a chat",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "📥",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ archive: true }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been archived.");
            } catch (error) {
                console.error("Error archiving chat:", error);
                await global.kord.reply(m, "❌ Failed to archive the chat.");
            }
        }
    },
    {
        usage: ["block"],
        desc: "Block a user",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "🚫",
        execute: async (sock, m) => {
            const user = m.key.remoteJid || null;
            if (!user) {
                return await global.kord.reply(m, "❌ Please reply to a message or mention a user to block.");
            }
            try {
                await sock.updateBlockStatus(user, "block");
                await global.kord.reply(m, `✅ User ${user} has been blocked.`);
            } catch (error) {
                console.error("Error blocking user:", error);
                await global.kord.reply(m, "❌ Failed to block the user.");
            }
        }
    },
    {
        usage: ["unblock"],
        desc: "Unblock a user",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "✅",
        execute: async (sock, m) => {
            const user = m.key.remoteJid || null;
            if (!user) {
                return await global.kord.reply(m, "❌ Please reply to a message or mention a user to unblock.");
            }
            try {
                await sock.updateBlockStatus(user, "unblock");
                await global.kord.reply(m, `✅ User ${user} has been unblocked.`);
            } catch (error) {
                console.error("Error unblocking user:", error);
                await global.kord.reply(m, "❌ Failed to unblock the user.");
            }
        }
    },
    {
        usage: ["jid"],
        desc: "Get JID of a user",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "🆔",
        execute: async (sock, m) => {
            const jid = m.key.remoteJid || m.sender;
            await global.kord.reply(m, `JID: ${jid}`);
        }
    },
    {
        usage: ["clear"],
        desc: "Clear chat",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "🧹",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ delete: true, lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been cleared.");
            } catch (error) {
                console.error("Error clearing chat:", error);
                await global.kord.reply(m, "❌ Failed to clear the chat.");
            }
        }
    },
    {
        usage: ["forward"],
        desc: "Forward a message to a number",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "↪️",
        execute: async (sock, m, args) => {
            const quotedMessage = await global.kord.getQuotedMessage(m);
            if (!quotedMessage) {
                return await global.kord.reply(m, "❌ Please reply to a message to forward it.");
            }
            if (!args[0]) {
                return await global.kord.reply(m, "❌ Please provide a number to forward the message to.");
            }
            const jid = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
            try {
                await global.kord.forwardMessage(jid, { key: m.key, message: quotedMessage });
                await global.kord.reply(m, "✅ Message has been forwarded.");
            } catch (error) {
                console.error("Error forwarding message:", error);
                await global.kord.reply(m, "❌ Failed to forward the message.");
            }
        }
    },
    {
        usage: ["broadcastgc"],
        desc: "Broadcast a message to all groups",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: true,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "📢",
        execute: async (sock, m) => {
            const quotedMessage = await global.kord.getQuotedMessage(m);
            if (!quotedMessage) {
                return await global.kord.reply(m, "❌ Please reply to a message to broadcast.");
            }
            const groups = Object.keys(await sock.groupFetchAllParticipating());
            let successCount = 0;
            for (let jid of groups) {
                try {
                    await global.kord.forwardMessage(jid, { key: m.key, message: quotedMessage });
                    successCount++;
                } catch (error) {
                    console.error(`Error broadcasting to ${jid}:`, error);
                }
            }
            await global.kord.reply(m, `✅ Broadcast sent to ${successCount} groups.`);
        }
    },
    {
        usage: ["broadcastpm"],
        desc: "Broadcast a message to all private chats",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: true,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "📣",
        execute: async (sock, m) => {
            const quotedMessage = await global.kord.getQuotedMessage(m);
            if (!quotedMessage) {
                return await global.kord.reply(m, "❌ Please reply to a message to broadcast.");
            }
            const chats = Object.entries(await sock.chats).filter(([jid]) => !jid.endsWith('@g.us'));
            let successCount = 0;
            for (let [jid] of chats) {
                try {
                    await global.kord.forwardMessage(jid, { key: m.key, message: quotedMessage });
                    successCount++;
                } catch (error) {
                    console.error(`Error broadcasting to ${jid}:`, error);
                }
            }
            await global.kord.reply(m, `✅ Broadcast sent to ${successCount} private chats.`);
        }
    },
    {
        usage: ["leave"],
        desc: "Leave the group chat",
        commandType: "User",
        isGroupOnly: true,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "👋",
        execute: async (sock, m) => {
            try {
                await sock.groupLeave(m.key.remoteJid);
                await global.kord.reply(m, "👋 Leaving the group. Goodbye!");
            } catch (error) {
                console.error("Error leaving group:", error);
                await global.kord.reply(m, "❌ Failed to leave the group.");
            }
        }
    },
    {
        usage: ["join"],
        desc: "Join a group via invite link",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true, 
        emoji: "🚪",
        execute: async (sock, m, args) => {
            let inviteLink;
            if (args[0]) {
                inviteLink = args[0];
            } else {
                const quotedText = await global.kord.getQuotedText(m);
                if (!quotedText) {
                    return await global.kord.reply(m, "❌ Please provide a group invite link or reply to a message containing the link.");
                }
                inviteLink = quotedText;
            }

            const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            const [, code] = inviteLink.match(linkRegex) || [];
            if (!code) {
                return await global.kord.reply(m, "❌ Invalid invite link.");
            }

            try {
                await sock.groupAcceptInvite(code);
                await global.kord.reply(m, "✅ Successfully joined the group!");
            } catch (error) {
                console.error("Error joining group:", error);
                await global.kord.reply(m, "❌ Failed to join the group.");
            }
        }
    },
    {
        usage: ["whois"],
        desc: "Get info about a user",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "👤",
        execute: async (sock, m) => {
            const jid = m.key.remoteJid || m.sender;
            try {
                const pp = await sock.profilePictureUrl(jid, 'image').catch(() => 'https://i.ibb.co/Tq7d7TZ/age-hananta-495-photo.png');
                const { status, setAt } = await sock.fetchStatus(jid);
                const { username, pushname, vname } = (await sock.fetchContactsOfUser(jid))[0] || {};
                const bio = status || "No bio available";
                const response = `
🆔 ${global.kord.changeFont('JID:', 'smallBoldScript')} ${jid}
👤 ${global.kord.changeFont('Name:', 'smallBoldScript')} ${pushname || vname || username || "Unknown"}
📞 ${global.kord.changeFont('Number:', 'smallBoldScript')} ${jid.split('@')[0]}
🌟 ${global.kord.changeFont('Bio:', 'smallBoldScript')} ${bio}
🕰️ ${global.kord.changeFont('Bio set at:', 'smallBoldScript')} ${new Date(setAt * 1000).toLocaleString()}
                `;
                await sock.sendMessage(m.key.remoteJid, { image: { url: pp }, caption: response });
            } catch (error) {
                console.error("Error fetching user info:", error);
                await global.kord.reply(m, "❌ Failed to fetch user information.");
            }
        }
    },
    {
        usage: ["getpp"],
        desc: "Get the profile picture of a user",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: false,
        emoji: "📷",
        execute: async (sock, m) => {
            const jid = m.quoted?.key?.remoteJid || m.key.remoteJid;
            try {
                const pp = await sock.profilePictureUrl(jid, 'image');
                await sock.sendMessage(m.key.remoteJid, { image: { url: pp } });
            } catch (error) {
                console.error("Error fetching profile picture:", error);
                await global.kord.reply(m, "❌ Failed to fetch the profile picture.");
            }
        }
    },
    {
    usage: ["privatemode"],
    desc: "Set the bot's work mode to private.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "🔒",

    async execute(sock, m, args) {
        // Path to the Config.js file
        const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');

        // Read the config file
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading Config.js file:", err);
                kord.freply(m, "Failed to read Config.js.");
                return;
            }

            // Check current WORK_MODE
            const currentModeMatch = data.match(/WORK_MODE:\s*"(.*?)"/);
            if (!currentModeMatch) {
                kord.freply(m, "Failed to determine current work mode.");
                return;
            }

            const currentMode = currentModeMatch[1];
            if (currentMode === 'Private') {
                kord.freply(m, "Bot is already in Private mode.");
                return;
            }

            // Replace WORK_MODE with "Private"
            const updatedData = data.replace(/WORK_MODE:\s*"(.*?)"/, 'WORK_MODE: "Private"');

            // Write the updated config back to the file
            fs.writeFile(configPath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error writing to Config.js file:", err);
                    kord.freply(m, "Failed to update Config.js.");
                    return;
                }

                // Send confirmation message
                kord.freply(m, "Bot's work mode is now set to Private.");
            });
        });
    }
    },
    {
    usage: ["publicmode"],
    desc: "Switch the bot's work mode between public and private.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "🌐",

    async execute(sock, m, args) {
        // Check if the user provided an argument
        const mode = args[0];
        if (!mode || (mode !== 'on' && mode !== 'off')) {
            kord.freply(m, "Please provide a valid argument! Use `.publicmode on` or `.publicmode off`.");
            return;
        }

        // Path to the Config.js file
        const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');

        // Read the config file
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading Config.js file:", err);
                kord.freply(m, "Failed to read Config.js.");
                return;
            }

            // Check current WORK_MODE
            const currentModeMatch = data.match(/WORK_MODE:\s*"(.*?)"/);
            if (!currentModeMatch) {
                kord.freply(m, "Failed to determine current work mode.");
                return;
            }

            const currentMode = currentModeMatch[1];
            if (mode === 'on' && currentMode === 'Public') {
                kord.freply(m, "Bot is already in Public mode.");
                return;
            }

            if (mode === 'off' && currentMode === 'Private') {
                kord.freply(m, "Bot is already in Private mode.");
                return;
            }

            // Determine the new WORK_MODE value
            const newMode = mode === 'on' ? 'Public' : 'Private';

            // Replace WORK_MODE with the new mode
            const updatedData = data.replace(/WORK_MODE:\s*"(.*?)"/, `WORK_MODE: "${newMode}"`);

            // Write the updated config back to the file
            fs.writeFile(configPath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error writing to Config.js file:", err);
                    kord.freply(m, "Failed to update Config.js.");
                    return;
                }

                // Send confirmation message
                kord.freply(m, `Bot's work mode is now set to ${newMode}.`);
            });
        });
    }
    },
    {
    usage: ["setmultiprefix"],
    desc: "Set multiple command prefixes separated by spaces",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true, 
    emoji: "🔧",
    execute: async (sock, m, args) => {
        if (args.length === 0) {
            return await global.kord.reply(m, "❌ Please provide prefixes separated by spaces.");
        }

        // Join the arguments into a single string and split by space
        const newPrefixes = args.join(" ").split(" ").map(prefix => prefix.trim());

        // Filter out empty prefixes and limit each prefix to a single character
        const validPrefixes = newPrefixes.filter(prefix => prefix.length > 0 && prefix.length === 1);

        if (validPrefixes.length === 0) {
            return await global.kord.reply(m, "❌ All provided prefixes are invalid. Please provide single-character prefixes.");
        }

        // Update the PREFIX variable in the config.js
        global.settings.PREFIX = validPrefixes;

        // Optionally, save the updated settings to config.js file if necessary
        // const fs = require('fs');
        // fs.writeFileSync('./config.js', `PREFIX: [${validPrefixes.join(", ")}]`);

        await global.kord.reply(m, `✅ Command prefixes have been set to: ${validPrefixes.join(", ")}`);
    }
},
    {
    usage: ["setprefix"],
    desc: "Set a new command prefix",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true, 
    emoji: "🔧",
    execute: async (sock, m, args) => {
        if (args.length !== 1) {
            return await global.kord.reply(m, "❌ Please provide a single prefix to set.");
        }

        const newPrefix = args[0];
        if (newPrefix.length > 1) {
            return await global.kord.reply(m, "❌ Prefix must be a single character.");
        }

        // Update the PREFIX variable in the config.js
        global.settings.PREFIX = [newPrefix];

        // Optionally, save the updated settings to config.js file if necessary
        // const fs = require('fs');
        // fs.writeFileSync('./config.js', `PREFIX: [${newPrefix}]`);

        await global.kord.reply(m, `✅ Command prefix has been set to: ${newPrefix}`);
    }
},
    {
        usage: ["unarchive"],
        desc: "Unarchive a chat",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "📤",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ archive: false }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been unarchived.");
            } catch (error) {
                console.error("Error unarchiving chat:", error);
                await global.kord.reply(m, "❌ Failed to unarchive the chat.");
            }
        }
    },
    {
  usage: ["alwaysonline"],
  desc: "Toggle the always online status",
  commandType: "User",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  isOwnerOnly: true,
  emoji: "🔧",
  execute: async (sock, m, args) => {
    if (args[0] !== 'true' && args[0] !== 'false') {
      return await global.kord.reply(m, "❌ Please use either `alwaysonline true` or `alwaysonline false`");
    }

    const newmode = args[0] === 'true'; // Convert string to boolean

    // Update the ALWAYS_ONLINE variable in the global settings
    global.settings.ALWAYS_ONLINE = newmode;

    // Optionally, save the updated settings to config.js file if necessary
    // const fs = require('fs');
    // fs.writeFileSync('./config.js', `ALWAYS_ONLINE: ${newmode}`);

    const status = newmode ? "true" : "false";
    await global.kord.reply(m, `*_✅ Always Online Has Been Set to ${status}!*`);
    
  }
    },
    {
    usage: ["antivv"],
    desc: "Toggle the Anti View Once feature",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true, 
    emoji: "🛡️",
    execute: async (sock, m, args) => {
        if (typeof args[0] !== 'boolean') {
            return await global.kord.reply(m, "❌ Please use either `antivv true` or `antivv false`");
        }

        const newmode = args[0];  // Directly use the boolean value
        
        // Update the ANTI_VIEWONCE variable in the global settings
        global.settings.ANTI_VIEWONCE = newmode;

        // Optionally, save the updated settings to config.js file if necessary
        // const fs = require('fs');
        // fs.writeFileSync('./config.js', `ANTI_VIEWONCE: ${newmode}`);

        const status = newmode ? "Enabled" : "Disabled";
        await global.kord.reply(m, `*_✅ Anti View Once has been ${status}!*`);
    }
},
{
    usage: ["readstatus", "autoswview", "autoreadstatus"],
    desc: "Toggle the Auto Read Status feature",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true, 
    emoji: "🫧",
    execute: async (sock, m, args) => {
        if (typeof args[0] !== 'boolean') {
            return await global.kord.reply(m, "❌ Please use either `readstatus true`, `autoswview true`, or `autoreadstatus true` (or `false` to disable).");
        }

        const newmode = args[0];  // Directly use the boolean value
        
        // Update the AUTO_READ_STATUS variable in the global settings
        global.settings.AUTO_READ_STATUS = newmode;

        // Optionally, save the updated settings to config.js file if necessary
        // const fs = require('fs');
        // fs.writeFileSync('./config.js', `AUTO_READ_STATUS: ${newmode}`);

        const status = newmode ? "Enabled" : "Disabled";
        await global.kord.reply(m, `*_✅ Auto Read Status has been ${status}!*`);
    }
},
    {
        usage: ["chatpin"],
        desc: "Pin a chat",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "📌",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ pin: true }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been pinned.");
            } catch (error) {
                console.error("Error pinning chat:", error);
                await global.kord.reply(m, "❌ Failed to pin the chat.");
            }
        }
    },
    {
        usage: ["unpin"],
        desc: "Unpin a chat",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "📍",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ pin: false }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been unpinned.");
            } catch (error) {
                console.error("Error unpinning chat:", error);
                await global.kord.reply(m, "❌ Failed to unpin the chat.");
            }
        }
    },
    {
        usage: ["markread"],
        desc: "Mark chat as read",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "✓",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ markRead: true }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been marked as read.");
            } catch (error) {
                console.error("Error marking chat as read:", error);
                await global.kord.reply(m, "❌ Failed to mark chat as read.");
            }
        }
    },
    {
        usage: ["markunread"],
        desc: "Mark chat as unread",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "✗",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ markRead: false }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been marked as unread.");
            } catch (error) {
                console.error("Error marking chat as unread:", error);
                await global.kord.reply(m, "❌ Failed to mark chat as unread.");
            }
        }
    },
    {
        usage: ["unmutechat"],
        desc: "Unmute a chat",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "🔔",
        execute: async (sock, m) => {
            try {
                await sock.chatModify({ mute: null }, m.key.remoteJid);
                await global.kord.reply(m, "✅ Chat has been unmuted.");
            } catch (error) {
                console.error("Error unmuting chat:", error);
                await global.kord.reply(m, "❌ Failed to unmute the chat.");
            }
        }
    },
    {
    usage: ["newgc", "creategc"],
    desc: "Create a new group chat",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "👥",
    execute: async (sock, m, args) => {
        let groupName;
        let participants = [];

        // If no arguments provided, create group with just the bot
        if (args.length === 0) {
            groupName = "New Group";
            participants = [sock.user.id.split(':')[0] + "@s.whatsapp.net"];
        }
        // If only group name provided
        else if (args.length === 1) {
            groupName = args[0];
            participants = [sock.user.id.split(':')[0] + "@s.whatsapp.net"];
        }
        // If group name and participants provided
        else {
            groupName = args[0];
            participants = args.slice(1).map(num => num.includes('@') ? num : `${num}@s.whatsapp.net`);
        }

        try {
            const group = await sock.groupCreate(groupName, participants);
            await global.kord.reply(m, `✅ Group "${groupName}" has been created successfully!\nGroup Link:  https://chat.whatsapp.com/${group.id}`);
        } catch (error) {
            console.error("Error creating group:", error);
            await global.kord.reply(m, "❌ Failed to create the group.");
        }
    }
},
    {
        usage: ["save"],
        desc: "Save a message to starred messages",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "⭐",
        execute: async (sock, m) => {
            if (!m.quoted) {
                return await global.kord.reply(m, "❌ Please reply to a message to save it.");
            }
            try {
                await sock.starMessage(m.quoted.key, true);
                await global.kord.reply(m, "✅ Message has been saved to starred messages.");
            } catch (error) {
                console.error("Error saving message:", error);
                await global.kord.reply(m, "❌ Failed to save the message.");
            }
        }
    },
    {
        usage: ["privacy"],
        desc: "Configure privacy settings",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "🔒",
        execute: async (sock, m, args) => {
            if (args.length < 2) {
                return await global.kord.reply(m, "❌ Usage: .privacy [last_seen|profile|status|read_receipts|groups|online] [all|contacts|none]");
            }
            
            const setting = args[0].toLowerCase();
            const value = args[1].toLowerCase();
            
            try {
                await sock.updatePrivacySettings(setting, value);
                await global.kord.reply(m, `✅ Privacy setting "${setting}" has been updated to "${value}".`);
            } catch (error) {
                console.error("Error updating privacy settings:", error);
                await global.kord.reply(m, "❌ Failed to update privacy settings.");
            }
        }
    },
    {
    usage: ["fullpp"],
    desc: "Set full screen profile picture",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "🖼️",
    execute: async (sock, m, args) => {
        let mediaBuffer, fileExtension, tempFilePath;

        try {
            if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
                const quotedMedia = await global.kord.downloadQuotedMedia(m);

                if (quotedMedia) {
                    mediaBuffer = quotedMedia.buffer;
                    fileExtension = quotedMedia.extension;
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the quoted media.");
                }
            } else {
                // No quoted message, download media from the main message
                const mediaMsg = await global.kord.downloadMediaMsg(m);

                if (mediaMsg) {
                    mediaBuffer = mediaMsg.buffer;
                    fileExtension = mediaMsg.extension;
                } else {
                    return await global.kord.reply(m, "❌ Failed to download the media.");
                }
            }

            // Create a temporary file path
            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);

            // Save the media to the temp file
            await fsPromises.writeFile(tempFilePath, mediaBuffer);

            // Process and update profile picture
            await updateProfilePicture(sock.user.id.split(':')[0] + "@s.whatsapp.net", mediaBuffer, sock);
            
            await global.kord.reply(m, "✅ Full profile picture has been updated.");
        } catch (error) {
            console.error("Error in fullpp:", error);
            await global.kord.reply(m, "❌ Failed to update profile picture.");
        } finally {
            // Clean up: delete the temporary file
            if (tempFilePath) {
                try {
                    await fsPromises.unlink(tempFilePath);
                } catch (unlinkError) {
                    console.error("Error deleting temporary file:", unlinkError);
                }
            }
        }
    }
},
    {
        usage: ["blocklist"],
        desc: "View list of blocked users",
        commandType: "User",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        isOwnerOnly: true,
        emoji: "🚫",
        execute: async (sock, m) => {
            try {
                const blocked = await sock.fetchBlocklist();
                if (blocked.length === 0) {
                    return await global.kord.reply(m, "No blocked users.");
                }
                const list = blocked.map((jid, i) => `${i + 1}. ${jid}`).join('\n');
                await global.kord.reply(m, `📋 Blocked Users List:\n\n${list}`);
            } catch (error) {
                console.error("Error fetching blocklist:", error);
                await global.kord.reply(m, "❌ Failed to fetch the blocklist.");
            }
        }
    },
    {
    usage: ["location"],
    desc: "Get and send location of a place or timezone",
    commandType: "User",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: false,
    emoji: "📍",
    execute: async (sock, m, args) => {
        try {
            // If no args provided, use TIME_ZONE
            if (args.length === 0) {
                const timezone = global.settings.TIME_ZONE;
                // Convert timezone to location using geocoding API
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(timezone)}`
                );

                if (response.data && response.data[0]) {
                    const { lat, lon } = response.data[0];
                    await sock.sendMessage(m.key.remoteJid, { 
                        location: { 
                            degreesLatitude: parseFloat(lat), 
                            degreesLongitude: parseFloat(lon)
                        }
                    });
                } else {
                    await global.kord.reply(m, "❌ Could not find location for the timezone.");
                }
                return;
            }

            // If args provided, search for the place
            const place = args.join(" ");
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
            );

            if (response.data && response.data[0]) {
                const { lat, lon, display_name } = response.data[0];
                await sock.sendMessage(m.key.remoteJid, { 
                    location: { 
                        degreesLatitude: parseFloat(lat), 
                        degreesLongitude: parseFloat(lon),
                        name: display_name
                    }
                });
            } else {
                await global.kord.reply(m, "❌ Location not found.");
            }
        } catch (error) {
            console.error("Error sending location:", error);
            await global.kord.reply(m, "❌ Failed to send location.");
        }
    }
}
];

async function updateProfilePicture(jid, imageBuffer, sock) {
    const { preview } = await generateProfilePicture(imageBuffer);
    
    await sock.query({
        tag: 'iq',
        attrs: {
            to: jid,
            type: "set",
            xmlns: "w:profile:picture"
        },
        content: [{
            tag: "picture",
            attrs: { type: "image" },
            content: preview
        }]
    });
}

async function generateProfilePicture(imageBuffer) {
    const image = await jimp.read(imageBuffer);
    const width = image.getWidth();
    const height = image.getHeight();
    const processedImage = image.crop(0, 0, width, height);

    return {
        img: await processedImage
            .scaleToFit(324, 720)
            .getBufferAsync(jimp.MIME_JPEG),
        preview: await processedImage
            .normalize()
            .getBufferAsync(jimp.MIME_JPEG)
    };
}