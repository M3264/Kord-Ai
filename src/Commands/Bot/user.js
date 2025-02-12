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
      execute: async (sock, m, args, kord)  => {
        try {
          await sock.chatModify({ archive: true }, m.key.remoteJid);
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("✅");
          } else {
            await kord.reply("✅ Chat has been archived.");
          }
        } catch (error) {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            await kord.sendErr(error, {
              context: "Archive Chat",
              info: "Failed to archive chat"
            });
          } else {
            console.error("Error archiving chat:", error);
            await kord.reply("❌ Failed to archive the chat.");
          }
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
      execute: async (sock, m, args, kord)  => {
        const user = m.key.remoteJid || null;
        if (!user) {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            await kord.sendErr(user, {
              context: "Block User",
              info: "No user specified to block"
            });
          } else {
            return await kord.reply("❌ Please reply to a message or mention a user to block.");
          }
          return;
        }
        try {
          await sock.updateBlockStatus(user, "block");
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("✅");
          } else {
            await kord.reply(`✅ User ${user} has been blocked.`);
          }
        } catch (error) {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            await kord.sendErr(error, {
              context: "Block User",
              info: "Failed to block user"
            });
          } else {
            console.error("Error blocking user:", error);
            await kord.reply("❌ Failed to block the user.");
          }
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
      execute: async (sock, m, args, kord)  => {
        const user = m.key.remoteJid || null;
        if (!user) {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            await kord.sendErr(user, {
              context: "Unblock User",
              info: "No user specified to unblock"
            });
          } else {
            return await kord.reply("❌ Please reply to a message or mention a user to unblock.");
          }
          return;
        }
        try {
          await sock.updateBlockStatus(user, "unblock");
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("✅");
          } else {
            await kord.reply(`✅ User ${user} has been unblocked.`);
          }
        } catch (error) {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            await kord.sendErr(error, {
              context: "Unblock User",
              info: "Failed to unblock user"
            });
          } else {
            console.error("Error unblocking user:", error);
            await kord.reply("❌ Failed to unblock the user.");
          }
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
        execute: async (sock, m, args, kord)  => {
            const jid = m.key.remoteJid || m.sender;
            await kord.reply(`${jid}`);
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ delete: true, lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been cleared.");
                }
            } catch (error) {
                console.error("Error clearing chat:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("❌")
                  await kord.sendErr(error, {
                    context: "Error in clearing chat"
                  });
                } else {
                await kord.reply("❌ Failed to clear the chat.");
                }
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
        execute: async (sock, m, args, kord) => {
            const quotedMessage = await kord.getQuotedMessage() || "No quoted text";
            if (!quotedMessage) {
              if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("❌")
                  await kord.sendErr(quotedMessage, {
                    context: "Error in forward command"
                  });
                } else {
                return await kord.reply("❌ Please reply to a message to forward it.");
            }
            return;
            }
            if (!args[0]) {
              if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("❌")
                  await kord.sendErr("no number provided", {
                    context: "Error in forward command"
                  });
                } else {
                return await kord.reply("❌ Please provide a number to forward the message to.");
            }
            return;
            }
            const jid = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
            try {
                await kord.forwardMessage(jid, { key: m.key, message: quotedMessage });
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Message has been forwarded.");
                }
            } catch (error) {
                console.error("Error forwarding message:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("❌")
                  await kord.sendErr(error, {
                    context: "Error in forward command"
                  });
                } else {
                await kord.reply("❌ Failed to forward the message.");
                }
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
        execute: async (sock, m, args, kord)  => {
            const quotedMessage = await kord.getQuotedMessage() || "No quoted text";
            if (!quotedMessage) {
              if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("❌")
                  await kord.sendErr(quotedMessage, {
                    context: "Error in broadcastgc command"
                  });
                } else {
                return await kord.reply("❌ Please reply to a message to broadcast.");
            }
            return;
            }
            const groups = Object.keys(await sock.groupFetchAllParticipating());
            let successCount = 0;
            for (let jid of groups) {
                try {
                    await kord.forwardMessage(jid, { key: m.key, message: quotedMessage });
                    successCount++;
                } catch (error) {
                    console.error(`Error broadcasting to ${jid}:`, error);
                    if (global.settings?.INVINCIBLE_MODE) {
                      await kord.react("❌")
                      await kord.sendErr(error, {
                        context: "Error in broadcastgc command"
                      });
                }
            }
            }
            if (global.settings?.INVINCIBLE_MODE) {
              await kord.react("✅")
            } else {
            await kord.reply(`✅ Broadcast sent to ${successCount} groups.`);
            }
        }
    },
{
    usage: ["broadcastpm"],
    desc: "Broadcast a message to all private chats",
    commandType: "User",
    isGroupOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "📣",
    execute: async (sock, m, args, kord)  => {
        const quotedMessage = await kord.getQuotedMessage();
        if (!quotedMessage) {
            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react("❌");
                await kord.sendErr("No quoted message found", {
                    context: "Error in broadcastpm command"
                });
            } else {
                return await kord.reply("❌ Please reply to a message to broadcast.");
            }
            return;
        }

        try {
            // Get all chats that are not groups
            let privateChats = [];
            const allChats = await sock.chats || [];
            
            // Debug log to see what we're getting
            console.log("All chats:", allChats);
            
            for (let [id, chat] of Object.entries(allChats)) {
                if (!id.endsWith('@g.us') && !id.startsWith('status@')) {
                    privateChats.push(id);
                }
            }

            // Debug log for private chats
            console.log("Found private chats:", privateChats);

            let successCount = 0;
            
            for (let jid of privateChats) {
                try {
                    await kord.forwardMessage(jid, { 
                        key: m.key, 
                        message: quotedMessage 
                    });
                    successCount++;
                    // Add a small delay between messages to prevent flooding
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error broadcasting to ${jid}:`, error);
                    if (global.settings?.INVINCIBLE_MODE) {
                        await kord.react("❌");
                        await kord.sendErr(error, {
                            context: "Error in broadcastpm command"
                        });
                    }
                }
            }

            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react("✅");
            } else {
                await kord.reply(`✅ Broadcast sent to ${successCount} private chats.`);
            }
        } catch (error) {
            console.error("Error accessing chats:", error);
            if (global.settings?.INVINCIBLE_MODE) {
                await kord.react("❌");
                await kord.sendErr(error, {
                    context: "Error accessing chats in broadcastpm command"
                });
            } else {
                await kord.reply("❌ Error accessing chats for broadcast.");
            }
        }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.groupLeave(m.key.remoteJid);
            } catch (error) {
                console.error("Error leaving group:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("❌")
                  await kord.sendErr(error, {
                    context: "Error in leave command"
                  });
                } else {
                await kord.reply("❌ Failed to leave the group.");
                }
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
  execute: async (sock, m, args, kord) => {
    let inviteLink;
    if (args[0]) {
      inviteLink = args[0];
    } else {
      const quotedText = await kord.getQuotedText() || null;
      if (!quotedText) {
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react("❌");
          await kord.sendErr(quotedText, {
            context: "Join Command",
            info: "No link provided or replied message was empty.",
          });
        } else {
          return await kord.reply(
            m,
            "❌ Please provide a group invite link or reply to a message containing the link."
          );
        }
        return;
      }
      inviteLink = quotedText;
    }

    const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
    const [, code] = inviteLink.match(linkRegex) || [];
    if (!code) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("❌");
        await kord.sendErr(inviteLink, {
          context: "Join Command",
          info: "Invalid invite link format.",
        });
      } else {
        return await kord.reply("❌ Invalid invite link.");
      }
      return;
    }

    try {
      await sock.groupAcceptInvite(code);
      if (!global.settings?.INVINCIBLE_MODE) {
        await kord.reply("✅ Successfully joined the group!");
      }
    } catch (error) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Join Command",
          info: "Failed to join the group.",
        });
      } else {
        console.error("Error joining group:", error);
        await kord.reply("❌ Failed to join the group.");
      }
    }
  },
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
  execute: async (sock, m, args, kord)  => {

    const jid = m.quoted?.key?.remoteJid || m.key.remoteJid;
    try {
      const pp = await sock.profilePictureUrl(jid, 'image');
      await sock.sendMessage(m.key.remoteJid, { image: { url: pp } });
    } catch (error) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Get Profile Picture",
          info: "Error fetching profile picture"
        });
      } else {
        console.error("Error fetching profile picture:", error);
        await kord.reply("❌ Failed to fetch the profile picture.");
      }
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

  async execute(sock, m, args, kord) {
    const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');

    try {
      // Read the config file
      const data = await fs.promises.readFile(configPath, 'utf8');
      
      // Updated regex to match any case variation
      const workModePattern = /WORK_MODE\s*[:=]\s*['"]?(public|private)['"]?/i;
      const currentModeMatch = data.match(workModePattern);

      if (!currentModeMatch) {
        throw new Error('WORK_MODE setting not found in Config.js');
      }

      const currentMode = currentModeMatch[1].toLowerCase();
      
      // Check if already in private mode
      if (currentMode === 'private') {
        if (global.settings?.INVINCIBLE_MODE) {
          return kord.react("🚫");
        }
        return kord.freply("Bot is already in private mode.");
      }

      // Preserve the original case from the config file
      const originalCase = data.match(/WORK_MODE\s*[:=]\s*['"]?([a-zA-Z]+)['"]?/i)[1];
      const isLowerCase = originalCase.toLowerCase() === originalCase;
      const newMode = isLowerCase ? 'private' : 'Private';

      // Update the config with new mode while preserving case
      const updatedData = data.replace(
        workModePattern,
        `WORK_MODE: "${newMode}"`
      );

      await fs.promises.writeFile(configPath, updatedData, 'utf8');
      
      if (global.settings?.INVINCIBLE_MODE) {
        return kord.react("✅");
      }
      return kord.freply("Bot's work mode is now set to private.");

    } catch (err) {
      if (global.settings?.INVINCIBLE_MODE) {
        kord.react("🚫");
        kord.sendErr(err, {
          context: "Private Mode",
          info: err.message || "Error updating work mode"
        });
      } else {
        console.error("Error updating work mode:", err);
        kord.freply("Failed to update work mode: " + err.message);
      }
    }
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

  async execute(sock, m, args, kord) {
    const mode = args[0]?.toLowerCase();
    
    if (!mode || !['on', 'off'].includes(mode)) {
      if (global.settings?.INVINCIBLE_MODE) {
        return kord.react("🚫");
      }
      return kord.freply("Please provide a valid argument! Use `.publicmode on` or `.publicmode off`.");
    }

    const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');

    try {
      // Read the config file
      const data = await fs.promises.readFile(configPath, 'utf8');
      
      // Updated regex to match any case variation
      const workModePattern = /WORK_MODE\s*[:=]\s*['"]?(public|private)['"]?/i;
      const currentModeMatch = data.match(workModePattern);

      if (!currentModeMatch) {
        throw new Error('WORK_MODE setting not found in Config.js');
      }

      const currentMode = currentModeMatch[1].toLowerCase();
      
      // Detect original case from config file
      const originalCase = data.match(/WORK_MODE\s*[:=]\s*['"]?([a-zA-Z]+)['"]?/i)[1];
      const isLowerCase = originalCase.toLowerCase() === originalCase;
      const newMode = mode === 'on' 
        ? (isLowerCase ? 'public' : 'Public')
        : (isLowerCase ? 'private' : 'Private');

      // Check if mode is already set
      if (currentMode === newMode.toLowerCase()) {
        if (global.settings?.INVINCIBLE_MODE) {
          return kord.react("🚫");
        }
        return kord.freply(`Bot is already in ${newMode.toLowerCase()} mode.`);
      }

      // Update the config with new mode while preserving case
      const updatedData = data.replace(
        workModePattern,
        `WORK_MODE: "${newMode}"`
      );

      await fs.promises.writeFile(configPath, updatedData, 'utf8');
      
      if (global.settings?.INVINCIBLE_MODE) {
        return kord.react("✅");
      }
      return kord.freply(`Bot's work mode is now set to ${newMode.toLowerCase()}.`);

    } catch (err) {
      if (global.settings?.INVINCIBLE_MODE) {
        kord.react("🚫");
        kord.sendErr(err, {
          context: "Public Mode",
          info: err.message || "Error updating work mode"
        });
      } else {
        console.error("Error updating work mode:", err);
        kord.freply("Failed to update work mode: " + err.message);
      }
    }
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
    execute: async (sock, m, args, kord) => {
        if (args.length === 0) {
          if (global.settings?.INVINCIBLE_MODE) {
            kord.react("❌")
            kord.sendErr("No Prefix provided", {
              context: "multiprefix command"
            });
          } else {
            return await kord.reply("❌ Please provide prefixes separated by spaces.");
        }
        return;
        }

        // Join the arguments into a single string and split by space
        const newPrefixes = args.join(" ").split(" ").map(prefix => prefix.trim());

        // Filter out empty prefixes and limit each prefix to a single character
        const validPrefixes = newPrefixes.filter(prefix => prefix.length > 0 && prefix.length === 1);

        if (validPrefixes.length === 0) {
          if (global.settings?.INVINCIBLE_MODE) {
            kord.react("❌")
            kord.sendErr("Invalid Prefix", {
              context: "multiprefix command"
            });
          } else {
            return await kord.reply("❌ All provided prefixes are invalid. Please provide single-character prefixes.");
          } 
          return;
        }

        // Update the PREFIX variable in the config.js
        global.settings.PREFIX = validPrefixes;

        // Optionally, save the updated settings to config.js file if necessary
        // const fs = require('fs');
        // fs.writeFileSync('./config.js', `PREFIX: [${validPrefixes.join(", ")}]`);
        
        if (global.settings?.INVINCIBLE_MODE) {
          kord.react("✅")
        } else {
        await kord.reply(`✅ Command prefixes have been set to: ${validPrefixes.join(", ")}`);
        }
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
    execute: async (sock, m, args, kord) => {
        if (args.length !== 1) {
          if (global.settings?.INVINCIBLE_MODE) {
            kord.react("❌")
            kord.sendErr("No Prefix provided", {
              context: "setprefix command"
            });
          } else {
            return await kord.reply("❌ Please provide a single prefix to set.");
        }
        return;
        }

        const newPrefix = args[0];
        if (newPrefix.length > 1) {
          if (global.settings?.INVINCIBLE_MODE) {
            kord.react("❌")
            kord.sendErr("Prefix must me A single character brr", {
              context: "setprefix command"
            });
          } else {
            return await kord.reply("❌ Prefix must be a single character.");
        }
        return;
        }

        // Update the PREFIX variable in the config.js
        global.settings.PREFIX = [newPrefix];

        // Optionally, save the updated settings to config.js file if necessary
        // const fs = require('fs');
        // fs.writeFileSync('./config.js', `PREFIX: [${newPrefix}]`);
        
        if (global.settings?.INVINCIBLE_MODE) {
          kord.react("✅")
        } else {
        await kord.reply(`✅ Command prefix has been set to: ${newPrefix}`);
        }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ archive: false }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been unarchived.");
                }
            } catch (error) {
                console.error("Error unarchiving chat:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("🚫");
                  await kord.sendErr(error, {
                    context: "Unarchive Chat",
                    info: "Failed to unarchive chat"
                  });
                } else {
                  await kord.reply("❌ Failed to unarchive the chat.");
                }
            }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ pin: true }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been pinned.");
                }
            } catch (error) {
                console.error("Error pinning chat:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("🚫");
                  await kord.sendErr(error, {
                    context: "Pin Chat",
                    info: "Failed to Pin chat"
                  });
                } else {
                await kord.reply("❌ Failed to pin the chat.");
                }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ pin: false }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been unpinned.");
                }
            } catch (error) {
                console.error("Error unpinning chat:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("🚫");
                  await kord.sendErr(error, {
                    context: "unpin Chat",
                    info: "Failed to unpin chat"
                  });
                } else {
                await kord.reply("❌ Failed to unpin the chat.");
                }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ markRead: true }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been marked as read.");
                }
            } catch (error) {
                console.error("Error marking chat as read:", error);
                 if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("🚫");
                  await kord.sendErr(error, {
                    context: "read Chat",
                    info: "Failed to read chat"
                  });
                } else {
                await kord.reply("❌ Failed to mark chat as read.");
                }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ markRead: false }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been marked as unread.");
                }
            } catch (error) {
                console.error("Error marking chat as unread:", error);
                 if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("🚫");
                  await kord.sendErr(error, {
                    context: "unread Chat",
                    info: "Failed to unread chat"
                  });
                } else {
                await kord.reply("❌ Failed to mark chat as unread.");
                }
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
        execute: async (sock, m, args, kord)  => {
            try {
                await sock.chatModify({ mute: null }, m.key.remoteJid);
                if (global.settings?.INVINCIBLE_MODE) {
                  kord.react("✅")
                } else {
                await kord.reply("✅ Chat has been unmuted.");
                }
            } catch (error) {
                console.error("Error unmuting chat:", error);
                if (global.settings?.INVINCIBLE_MODE) {
                  await kord.react("🚫");
                  await kord.sendErr(error, {
                    context: "unmute Chat",
                    info: "Failed to unmute chat"
                  });
                } else {
                await kord.reply("❌ Failed to unmute the chat.");
                }
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
  execute: async (sock, m, args, kord) => {

    let groupName;
    let participants = [];

    // 
    if (args.length === 0) {
      groupName = "New Group";
      participants = [sock.user.id.split(':')[0] + "@s.whatsapp.net"];
    }
    
    else if (args.length === 1) {
      groupName = args[0];
      participants = [sock.user.id.split(':')[0] + "@s.whatsapp.net"];
    }
    else {
      groupName = args[0];
      participants = args.slice(1).map(num => num.includes('@') ? num : `${num}@s.whatsapp.net`);
    }

    try {
      const group = await sock.groupCreate(groupName, participants);

      const inviteCode = await sock.groupInviteCode(group.id);
      const groupLink = `https://chat.whatsapp.com/${inviteCode}`;

      await kord.reply(`✅ Group "${groupName}" has been created successfully!\nGroup Link: ${groupLink}`);
    } catch (error) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Create Group",
          info: "Failed to create group"
        });
      } else {
        console.error("Error creating group:", error);
        await kord.reply("❌ Failed to create the group.");
      }
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
  execute: async (sock, m, args, kord)  => {
    
    const quotedMessage =
      m.quoted ||
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      m.message?.contextInfo?.quotedMessage;

    
    if (!quotedMessage) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("❌");
        await kord.sendErr("No Message to star", {
          context: "star command"
        });
      } else {
        await kord.reply("❌ Please reply to a message to save it.");
      }
      return;
    }

    try {
      
      
      const messageId =
        quotedMessage.key?.id ||
        m.message?.extendedTextMessage?.contextInfo?.stanzaId ||
        m.message?.contextInfo?.stanzaId;

      const chatId =
        quotedMessage.key?.remoteJid ||
        m.message?.extendedTextMessage?.contextInfo?.remoteJid ||
        m.chat;

     
      const fromMe =
        quotedMessage.key?.fromMe ||
        m.message?.extendedTextMessage?.contextInfo?.participant === sock.user.id;

      if (!messageId || !chatId) {
        throw new Error('Could not determine message ID or chat');
      }

      await sock.chatModify({
        star: {
          messages: [{
            id: messageId,
            fromMe: fromMe || false
          }],
          star: true
        }
      }, chatId);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("✅");
      } else {
        await kord.reply("✅ Message has been saved to starred messages.");
      }
    } catch (error) {
      console.error("Error saving message:", error);
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "star Chat",
          info: "Failed to star chat"
        });
      } else {
        await kord.reply("❌ Failed to save the message.");
      }
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
  execute: async (sock, m, args, kord) => {
    if (args.length < 2) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        return await kord.sendErr(args, {
          context: "Privacy Settings",
          info: "Insufficient arguments for privacy command"
        });
      } else {
        return await kord.reply("❌ Usage: .privacy [last_seen|profile|status|read_receipts|groups|online] [all|contacts|none]");
      }
    }

    const setting = args[0].toLowerCase();
    const value = args[1].toLowerCase();

    const validSettings = [
            'last_seen', 'profile', 'status',
            'read_receipts', 'groups', 'online',
            'fetch', 'disappearing'
        ];

    if (!validSettings.includes(setting)) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        return await kord.sendErr(setting, {
          context: "Privacy Settings",
          info: "Invalid privacy setting specified"
        });
      } else {
        return await kord.reply("❌ Invalid privacy setting. Choose from: last_seen, profile, status, read_receipts, groups, online, fetch, disappearing");
      }
    }

    try {
      switch (setting) {
        case 'last_seen':
          if (!['all', 'contacts', 'none'].includes(value)) {
            throw new Error("Invalid last_seen value");
          }
          await sock.updateLastSeenPrivacy(value);
          break;

        case 'online':
          if (!['all', 'match_last_seen'].includes(value)) {
            throw new Error("Invalid online value");
          }
          await sock.updateOnlinePrivacy(value);
          break;

        case 'profile':
          if (!['all', 'contacts', 'none'].includes(value)) {
            throw new Error("Invalid profile value");
          }
          await sock.updateProfilePicturePrivacy(value);
          break;

        case 'status':
          if (!['all', 'contacts', 'none'].includes(value)) {
            throw new Error("Invalid status value");
          }
          await sock.updateStatusPrivacy(value);
          break;

        case 'read_receipts':
          if (!['all', 'none'].includes(value)) {
            throw new Error("Invalid read_receipts value");
          }
          await sock.updateReadReceiptsPrivacy(value);
          break;

        case 'groups':
          if (!['all', 'contacts'].includes(value)) {
            throw new Error("Invalid groups value");
          }
          await sock.updateGroupsAddPrivacy(value);
          break;

        case 'fetch':
          const privacySettings = await sock.fetchPrivacySettings(true);
          await kord.reply(`📋 Current Privacy Settings:\n${JSON.stringify(privacySettings, null, 2)}`);
          return;

        case 'disappearing':
          const validDurations = {
            '24h': 86400,
            '7d': 604800,
            '90d': 7776000,
            'off': 0
          };
          if (!validDurations.hasOwnProperty(value)) {
            throw new Error("Invalid disappearing mode duration");
          }
          await sock.updateDefaultDisappearingMode(validDurations[value]);
          break;
      }

      await kord.reply(`✅ Privacy setting "${setting}" has been updated to "${value}".`);
    } catch (error) {
      console.error("Error updating privacy settings:", error);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Privacy Settings Update",
          info: "Failed to update privacy settings"
        });
      } else {
        await kord.reply("❌ Failed to update privacy settings.");
      }
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
  execute: async (sock, m, args, kord) => {
    let mediaBuffer, fileExtension, tempFilePath;

    try {
      let quotedMedia, mediaMsg;
      if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
        quotedMedia = await kord.downloadQuotedMedia();

        if (quotedMedia) {
          mediaBuffer = quotedMedia.buffer;
          fileExtension = quotedMedia.extension;
        } else {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            return await kord.sendErr(null, {
              context: "Full Profile Picture",
              info: "Failed to download quoted media"
            });
          } else {
            return await kord.reply("❌ Failed to download the quoted media.");
          }
        }
      } else {
        // No quoted message, download media from the main message
        mediaMsg = await kord.downloadMediaMsg();

        if (mediaMsg) {
          mediaBuffer = mediaMsg.buffer;
          fileExtension = mediaMsg.extension;
        } else {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            return await kord.sendErr(null, {
              context: "Full Profile Picture",
              info: "Failed to download media message"
            });
          } else {
            return await kord.reply("❌ Failed to download the media.");
          }
        }
      }

      // Create a temporary file path
      tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);

      // Save the media to the temp file
      await fsPromises.writeFile(tempFilePath, mediaBuffer);

      // Process and update profile picture
      await updateProfilePicture(sock.user.id.split(':')[0] + "@s.whatsapp.net", mediaBuffer, sock);

      await kord.reply("✅ Full profile picture has been updated.");
    } catch (error) {
      console.error("Error in fullpp:", error);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Full Profile Picture",
          info: "Failed to update profile picture"
        });
      } else {
        await kord.reply("❌ Failed to update profile picture.");
      }
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
  execute: async (sock, m, args, kord)  => {
    try {
      const blocked = await sock.fetchBlocklist();

      if (blocked.length === 0) {
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react("🚫");
          return await kord.sendErr(null, {
            context: "Blocklist",
            info: "No blocked users found"
          });
        } else {
          return await kord.reply("No blocked users.");
        }
      }

      const list = blocked.map((jid, i) => `${i + 1}. ${jid}`).join('\n');
      await kord.reply(`📋 Blocked Users List:\n\n${list}`);
    } catch (error) {
      console.error("Error fetching blocklist:", error);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Blocklist Fetch",
          info: "Failed to fetch blocklist"
        });
      } else {
        await kord.reply("❌ Failed to fetch the blocklist.");
      }
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
  execute: async (sock, m, args, kord) => {
    try {
      // If no args provided, use TIME_ZONE
      if (args.length === 0) {
        const timezone = global.settings.TIME_ZONE;

        if (!timezone) {
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            return await kord.sendErr(null, {
              context: "Location",
              info: "No timezone configured"
            });
          } else {
            return await kord.reply("❌ No timezone configured.");
          }
        }

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
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react("🚫");
            return await kord.sendErr(null, {
              context: "Location",
              info: "Could not find location for the timezone"
            });
          } else {
            await kord.reply("❌ Could not find location for the timezone.");
          }
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
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react("🚫");
          return await kord.sendErr(null, {
            context: "Location",
            info: "Location not found"
          });
        } else {
          await kord.reply("❌ Location not found.");
        }
      }
    } catch (error) {
      console.error("Error sending location:", error);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, {
          context: "Location",
          info: "Failed to send location"
        });
      } else {
        await kord.reply("❌ Failed to send location.");
      }
    }
  }
},
{
  usage: ["owner"],
  description: "Get the owner's contact information as a vCard.",
  async execute(sock, message, args) {
    try {
      const settings = global.settings;
      const ownerNumber = settings.OWNER_NUMBERS;
      const ownerName = settings.OWNER_NAME;

      if (!ownerNumber || !ownerName) {
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react(message, "🚫");
          return await kord.sendErr(message, null, {
            context: "Owner Contact",
            info: "Owner details not configured"
          });
        } else {
          return await sock.sendMessage(message.key.remoteJid, { text: "❌ Owner details not configured" }, { quoted: message });
        }
      }

      const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD
            `;

      const vcardMessage = {
        contacts: {
          displayName: ownerName,
          contacts: [{ vcard }]
        }
      };
      await sock.sendMessage(message.key.remoteJid, vcardMessage, { quoted: message });

    } catch (error) {
      console.error('Error executing owner command:', error);

      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react(message, "🚫");
        await kord.sendErr(message, error, {
          context: "Owner Contact",
          info: "Failed to retrieve owner contact"
        });
      } else {
        await sock.sendMessage(message.key.remoteJid, { text: `❌ An error occurred: ${error.message}` }, { quoted: message });
      }
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
};