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
      const menu2ImagePath = path.join(__dirname, '../../Assets/Menu/Menu2.jpeg');
      const menu2ImageBuffer = fs.readFileSync(menu2ImagePath); // Image buffer
      const menuImagePath = path.join(__dirname, '../../Assets/Menu/Menu.jpeg');
      const menuImageBuffer = fs.readFileSync(menuImagePath);
      const commands = getAllCommands();

      const formatCommandsByType = (commands) => {
        const commandsByType = {};
        const seenUsages = new Set();

        commands.forEach(cmd => {
          const type = cmd.commandType || "Uncategorized";
          if (!commandsByType[type]) commandsByType[type] = [];

          const usages = Array.isArray(cmd.usage) ? cmd.usage : [cmd.usage];
          usages.forEach(usage => {
            if (!seenUsages.has(usage)) {
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
            return `│ ◈ ${settings.PREFIX[0]}${cmd.usage}`;
          }).join('\n');

          return `┌──「 *${type.toUpperCase()}* 」\n${formattedCmds}\n└────`;
        }).join('\n\n');
      };

      const uptimeHours = Math.floor(os.uptime() / 3600);
      const uptimeMinutes = Math.floor((os.uptime() % 3600) / 60);
      const uptimeSeconds = Math.floor(os.uptime() % 60);
      const user = m.pushName

      const header = `
╭─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╮
┊ ✧ *ɴᴀᴍᴇ:* ${settings.BOT_NAME}
┊ ✧ *ᴜsᴇʀ:* ${user}
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
┊  ✨ ʜᴇʀᴇ's ᴍʏ ʟɪsᴛ ᴏꜰ ᴄᴏᴍᴍᴀɴᴅs: ✨
╰───────────────┈ ἤ ${user}
`;

      const footer = `
> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™
`;

      // Assuming kord.changeFont is a custom function for styling text
      const [menuTextStyled, headerStyled, footerStyled] = await Promise.all([
        kord.changeFont(formatCommandsByType(commands), 'smallBoldScript'),
        kord.changeFont(header, 'smallBoldScript'),
        kord.changeFont(footer, 'smallBoldScript')
      ]);

      const completeMenu = headerStyled + menuTextStyled + footerStyled;

      await sock.sendMessage(m.key.remoteJid, {
        image: menuImageBuffer, // Use the buffer directly for the image
        caption: completeMenu, // Text content
        contextInfo: {
          externalAdReply: {
            showAdAttribution: true,
            renderLargerThumbnail: false,
            title: "ᴋᴏʀᴅ-ᴀɪ ᴄᴏᴍᴘʟᴇᴛᴇ ᴍᴇɴᴜ",
            body: `ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ ᴛᴀsᴋ ᴀssɪsᴛᴀɴᴛ`,
            previewType: "IMAGE",
            mediaType: 1, // 1 indicates image media type
            thumbnail: menu2ImageBuffer,
            mediaUrl: '' // Optional: URL to media if required
          }
        }
      });

    } catch (error) {
      console.error("Error displaying menu:", error);
      await kord.reply(m, "An error occurred while displaying the menu. Please try again later.");
    }
  }
};