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
            kord.freply(m, "Please use `.antidelete on` or `.antidelete off`.");
            return;
        }

        const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading config.js:", err);
                kord.freply(m, "Failed to read configuration.");
                return;
            }

            const newValue = mode === 'on';
            const updatedData = data.replace(/ANTI_DELETE_ENABLED:\s*(true|false)/, `ANTI_DELETE_ENABLED: ${newValue}`);

            fs.writeFile(configPath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error updating config.js:", err);
                    kord.freply(m, "Failed to update configuration.");
                    return;
                }

                kord.freply(m, `Anti-delete functionality is now ${mode === 'on' ? 'enabled' : 'disabled'}.`);
            });
        });
    }
};