const fs = require('fs');
const path = require('path');
const os = require('os');
const { getAllCommands } = require('../../Plugin/kordLoadCmd');

module.exports = {
  usage: ["menu", "help"],
  desc: "Display the bot's menu with categories and command details.",
  commandType: "Bot",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "📖",
  async execute(sock, m, args) {
    try {
      const menuImagePath = path.join(__dirname, '../../Assets/Menu/Menu2.jpeg');
      const menuImageBuffer = fs.readFileSync(menuImagePath);
      const commands = getAllCommands();

      const formatCommandsByType = (commands) => {
        const commandsByType = {};
        const seenUsages = new Set(); // Track seen usages to avoid duplicates

        commands.forEach(cmd => {
          const type = cmd.commandType || "Uncategorized";
          if (!commandsByType[type]) commandsByType[type] = [];

          const usages = Array.isArray(cmd.usage) ? cmd.usage : [cmd.usage];
          usages.forEach(usage => {
            if (!seenUsages.has(usage)) { // Add only if not seen before
              seenUsages.add(usage);
              commandsByType[type].push({
                usage,
                desc: cmd.desc
              });
            }
          });
        });

      
        return Object.entries(commandsByType).map(([type, cmds]) => {
          const formattedCmds = cmds.map(cmd => {
            return `│ ◈ *${settings.PREFIX[0]}${cmd.usage}*`;
          }).join('\n');

          return `┌──「 *${type.toUpperCase()}* 」\n${formattedCmds}\n└────`;
        }).join('\n\n');
      };

      const uptimeHours = Math.floor(os.uptime() / 3600);
      const uptimeMinutes = Math.floor((os.uptime() % 3600) / 60);
      const uptimeSeconds = Math.floor(os.uptime() % 60);

      const header = `
╭─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╮
┊ ✧ *ɴᴀᴍᴇ:* ${settings.BOT_NAME}
┊ ✧ *ᴠᴇʀꜱɪᴏɴ:* 1.0
┊ ✧ *ᴜᴘᴛɪᴍᴇ:* ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s
╰─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╯

╭─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╮
┊ ✧ *ᴘʀᴇꜰɪx:* '/ . !'
┊ ✧ *ᴏᴡɴᴇʀ:* ${settings.OWNER_NAME}
┊ ✧ *ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ:* ${commands.length}
╰─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╯

╭┈─────── ೄྀ࿐ ˊˎ-
┊ *ɴᴇᴇᴅ ʜᴇʟᴘ?*
┊  ✨ 𝐇𝐄𝐑𝐄'𝐒 𝐖𝐇𝐀𝐓 𝐈 𝐂𝐀𝐍 𝐃𝐎: ✨
╰───────────────┈ ἤ
`;

      const footer = `
┏━━━━━━━━ NOTE ━━━━━━━━┓
┃ Use ${settings.PREFIX[0]}help <command> for details
┃ Example: ${settings.PREFIX[0]}help sticker
┗━━━━━━━━━━━━━━━━━━━━━┛
💡 Stay updated with our latest features!
🌟 Enjoy using ${settings.BOT_NAME}!
`;

      const [menuTextStyled, headerStyled, footerStyled] = await Promise.all([
        kord.changeFont(formatCommandsByType(commands), 'smallBoldScript'),
        kord.changeFont(header, 'boldSerif'),
        kord.changeFont(footer, 'smallItalicBoldScript')
      ]);

      const completeMenu = headerStyled + menuTextStyled + footerStyled;
      await kord.sendImage(m, menuImageBuffer, completeMenu, 'Menu');
      
    } catch (error) {
      console.error("Error displaying menu:", error);
      await kord.reply(m, "An error occurred while displaying the menu. Please try again later.");
    }
  }
};
