const fs = require('fs');
const path = require('path');


module.exports = {
    usage: ["antivv"],
    desc: "Enable or disable anti-view-once functionality.",
    commandType: "Settings",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "👁️‍🗨️",

    async execute(sock, m, args) {
        const mode = args[0];
        if (!mode || (mode !== 'on' && mode !== 'off')) {
            kord.freply(m, "Please use `.antivv on` or `.antivv off`.");
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
            const updatedData = data.replace(/ANTI_VIEWONCE:\s*(true|false)/, `ANTI_VIEWONCE: ${newValue}`);

            fs.writeFile(configPath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error updating config.js:", err);
                    kord.freply(m, "Failed to update configuration.");
                    return;
                }

                kord.freply(m, `Anti-view-once functionality is now ${mode === 'on' ? 'enabled' : 'disabled'}.`);
            });
        });
    }
};