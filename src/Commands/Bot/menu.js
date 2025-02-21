const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment-timezone');
const { getAllCommands } = require('../../Plugin/kordLoadCmd');

module.exports = {
  usage: ["menu", "help"],
  desc: "Display the bot's menu with categories and command details.",
  commandType: "Bot",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "🔅",
  async execute(sock, m, args, kord) {
    try {
      // Get commands with guaranteed reload
      const commands = await getAllCommands();

      const formatCommandsByType = (commands) => {
        const uniqueCommands = new Map();
        
        commands.forEach(cmd => {
          const type = cmd.commandType || "Uncategorized";
          const usages = Array.isArray(cmd.usage) ? cmd.usage : [cmd.usage];
          
          usages.forEach(usage => {
            if (!usage) return;
            
            const key = `${type}:${usage}`;
            
            if (!uniqueCommands.has(key)) {
              uniqueCommands.set(key, {
                type,
                usage,
                desc: cmd.desc || 'No description available'
              });
            }
          });
        });

        const commandsByType = {};
        uniqueCommands.forEach((cmd) => {
          if (!commandsByType[cmd.type]) {
            commandsByType[cmd.type] = [];
          }
          commandsByType[cmd.type].push(cmd);
        });

        return Object.entries(commandsByType)
          .map(([type, cmds]) => {
            const sortedCmds = cmds.sort((a, b) => a.usage.localeCompare(b.usage));
            
            const formattedCmds = sortedCmds
              .map(cmd => ` ➳ ${settings.PREFIX[0]}${cmd.usage}`)
              .join('\n');

            return ` · 𓆩 *${type.toUpperCase()}* 𓆪 ·
╭   ─┉─ • ─┉─    ╮
${formattedCmds}
╰    ─┉─ • ─┉─   ╯`;
          })
          .join('\n\n');
      };

      const getSystemInfo = () => {
        const packageInfo = require('../../../package.json');
        const used = process.memoryUsage();
        const totalMem = os.totalmem();
        const memoryUsage = `${(used.heapUsed / 1024 / 1024).toFixed(2)} GB/${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`;
        const runtime = formatSecondsToDHMS(process.uptime());
        
        return {
          version: packageInfo.version,
          memoryUsage,
          runtime,
          totalCommands: commands.length
        };
      };

      const getTimeInfo = () => {
        const timezone = settings.TIME_ZONE || 'UTC';
        return {
          currentTime: moment().tz(timezone).format('HH:mm:ss'),
          currentDate: moment().tz(timezone).format('DD/MM/YYYY')
        };
      };

      const { version, memoryUsage, runtime, totalCommands } = getSystemInfo();
      const { currentTime, currentDate } = getTimeInfo();
      const user = m.pushName || 'User';
      const more = String.fromCharCode(8206);
      const readmore = more.repeat(4001);
      const sender = m.sender || m.key.participant || '';

      const header = `
┌────═━┈ *${settings.BOT_NAME}* ┈━═────┐
 ❦ ▸ Owner:- ${settings.OWNER_NAME}
 ❦ ▸ Plugins:- ${totalCommands}
 ❦ ▸ Uptime:- ${runtime}
 ❦ ▸ Mem:- ${memoryUsage}
 ❦ ▸ Version: ${version}
 ❦ ▸ Prefix: ${settings.PREFIX[0]}
 ❦ ▸ User: ${user}
 ❦ ▸ Time:- ${currentTime}
 ❦ ▸ Date:- ${currentDate}
└──────═━┈┈━═──────┘
${readmore}`;

      const footer = `
─➳➳➳➳➳※➳➳➳➳➳`;

      try {
        const getRandomFont = () => {
          const fonts = [
            'smallItalicBoldScript',
            'mathBold',
            'sansBold',
            'sansItalic',
            'smallBoldScript',
            'boldSerif'
          ];
          return fonts[Math.floor(Math.random() * fonts.length)];
        };

        if (!kord || typeof kord.changeFont !== 'function') {
          throw new Error('kord object or changeFont method is not properly defined');
        }

        const [menuTextStyled, headerStyled, footerStyled] = await Promise.all([
          kord.changeFont(formatCommandsByType(commands), getRandomFont()),
          kord.changeFont(header, getRandomFont()),
          kord.changeFont(footer, getRandomFont())
        ]);

        const completeMenu = `${headerStyled}\n\n${menuTextStyled}\n\n${footerStyled}`;

        if (!settings.BOT_NAME) {
          throw new Error('BOT_NAME is not defined in settings');
        }

        await sock.sendMessage(m.key.remoteJid, {
          image: { url: "https://kord-cdn.vercel.app/serve/nqCgNgzzeflU.jpg" },
          caption: completeMenu,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            mentionedJid: [sender],
            forwardedNewsletterMessageInfo: {
              newsletterName: "𝙆𝙊𝙍𝘿-𝘼𝙄",
              newsletterJid: "120363321914137077@newsletter",
              externalAdReply: {
                title: `${settings.BOT_NAME} Complete Menu`,
                body: "Your WhatsApp Assistant",
                renderLargerThumbnail: false,
                showAdAttribution: true,
                thumbnail: { url: "https://files.catbox.moe/bteuhx.png" },
                mediaType: 1,
                previewType: "PHOTO",
                mediaUrl: ''
              }
            }
          }
        });

      } catch (error) {
        console.error("Error in formatting or sending menu:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error displaying menu:", error);
      if (kord && typeof kord.reply === 'function') {
        await kord.reply("An error occurred while displaying the menu. Please try again later.");
      } else {
        console.error("kord.reply is not properly defined");
      }
    }
  }
};

function formatSecondsToDHMS(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}