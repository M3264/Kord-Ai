const fs = require('fs');
const path = require('path');

module.exports = {
    usage: ["readstatus"],
    desc: "Enable or disable automatic message read status.",
    commandType: "Settings",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "✅",

    async execute(sock, m, args) {
        const mode = args[0]; // Argument to enable or disable
        if (!mode || (mode !== 'on' && mode !== 'off')) {
            kord.freply(m, "Please use `.readstatus on` or `.readstatus off`.");
            return;
        }

        const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading config.js:", err);
                kord.freply(m, "Failed to read the configuration file.");
                return;
            }

            const newValue = mode === 'on'; // Set to true if 'on', false if 'off'
            const updatedData = data.replace(/AUTO_READ_STATUS:\s*(true|false)/, `AUTO_READ_STATUS: ${newValue}`);

            fs.writeFile(configPath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error updating config.js:", err);
                    kord.freply(m, "Failed to update the configuration file.");
                    return;
                }

                kord.freply(m, `Auto-read status is now ${mode === 'on' ? 'enabled' : 'disabled'}.`);
            });
        });
    }
};