const fs = require('fs');
const path = require('path');

module.exports = {
    usage: ["gcevents"],
    desc: "Enable or disable group events notifications (welcome, goodbye, promote, demote messages).",
    commandType: "Group",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "📢",

    async execute(sock, m, args) {
        const mode = args[0];
        if (!mode || (mode !== 'on' && mode !== 'off')) {
            kord.freply(m, "Please provide a valid argument! Use `.gcevents on` or `.gcevents off`.");
            return;
        }

        const newMode = mode === 'on' ? 'true' : 'false';
        const configPath = path.join(__dirname, '../', '../', '../', 'Config.js');

        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading Config.js file:", err);
                kord.freply(m, "Failed to read Config.js.");
                return;
            }

            let updatedData;
            
            if (data.includes('GROUP_EVENTS:')) {
                updatedData = data.replace(/GROUP_EVENTS:\s*(true|false)/, `GROUP_EVENTS: ${newMode}`);
            } else {
                const lastPropertyIndex = data.lastIndexOf(',');
                if (lastPropertyIndex !== -1) {
                    updatedData = data.slice(0, lastPropertyIndex + 1) + 
                                `\n    GROUP_EVENTS: ${newMode}` +
                                data.slice(lastPropertyIndex + 1);
                } else {
                    const moduleExportsIndex = data.indexOf('module.exports');
                    if (moduleExportsIndex !== -1) {
                        updatedData = data.slice(0, moduleExportsIndex) +
                                    `module.exports = {\n    GROUP_EVENTS: ${newMode},\n` +
                                    data.slice(moduleExportsIndex + 15);
                    } else {
                        kord.freply(m, "Failed to update Config.js: Invalid file format.");
                        return;
                    }
                }
            }

            fs.writeFile(configPath, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error writing to Config.js file:", err);
                    kord.freply(m, "Failed to update Config.js.");
                    return;
                }

                kord.freply(m, `Group events notifications have been ${mode === 'on' ? 'enabled' : 'disabled'}.`);
            });
        });
    }
};