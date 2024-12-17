const fs = require('fs');
const path = require('path');

module.exports = {
  usage: ["antidelete"],
  desc: "Enable or disable anti-delete functionality.",
  commandType: "Settings",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  isOwnerOnly: true,
  emoji: "🛡️",

  async execute(sock, m, args) {
    const mode = args[0];
    if (!mode || (mode !== 'on' && mode !== 'off')) {
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react(m, "🚫");
        await kord.sendErr(m, mode, {
          context: "antidelete",
          info: "Invalid mode provided!"
        });
      } else {
        return await kord.freply(m, "Please use `.antidelete on` or `.antidelete off`.");
      }
      return;
    }

    const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');
    fs.readFile(configPath, 'utf8', (err, data) => {
      if (err) {
        console.error("Error reading config.js:", err);
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react(m, "🚫");
          await kord.sendErr(m, err, {
            context: "antidelete",
            info: "Failed to read configuration!"
          });
        } else {
          return await kord.freply(m, "Failed to read configuration.");
        }
        return;
      }

      const newValue = mode === 'on';
      const updatedData = data.replace(/ANTI_DELETE_ENABLED:\s*(true|false)/, `ANTI_DELETE_ENABLED: ${newValue}`);

      fs.writeFile(configPath, updatedData, 'utf8', (err) => {
        if (err) {
          console.error("Error updating config.js:", err);
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.react(m, "🚫");
            await kord.sendErr(m, err, {
              context: "antidelete",
              info: "Failed to update configuration!"
            });
          } else {
            return await kord.freply(m, "Failed to update configuration.");
          }
          return;
        }

        await kord.freply(m, `Anti-delete functionality is now ${mode === 'on' ? 'enabled' : 'disabled'}.`);
      });
    });
  }
};