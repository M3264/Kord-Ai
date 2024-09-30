const emojis = {
    info: 'ℹ️',
    cpu: '🖥️',
    ram: '🧠',
    storage: '💾',
    os: '🐧',
    error: '❌',
    clock: '🕒',
    load: '🏋️‍♂️'
};

const si = require('systeminformation');
const os = require('os');

module.exports = {
    usage: ["sys", "system"],
    desc: "Displays detailed bot system information.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.info,

    async execute(sock, m) {
        try {
            const [cpuInfo, memInfo, diskInfo] = await Promise.allSettled([
                si.cpu(),
                si.mem(),
                si.fsSize()
            ]);

            // Helper function to format bytes to GB and round to 2 decimal places
            const formatBytesToGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);

            const sysInfoMessage = `
${emojis.info} *System Information for ${settings.BOT_NAME}* ⚡

${emojis.cpu} *CPU:*
- Model: ${cpuInfo.status === 'fulfilled' ? `${cpuInfo.value?.manufacturer || ''} ${cpuInfo.value?.brand || ''} (${cpuInfo.value?.physicalCores || 'N/A'} cores)` : 'Not available'}
- ${emojis.clock} Speed: ${cpuInfo.status === 'fulfilled' ? `${cpuInfo.value?.speed || 'N/A'} GHz` : 'Not available'}
- ${emojis.load} Load: ${cpuInfo.status === 'fulfilled' ? `${(cpuInfo.value?.currentLoad || 0).toFixed(2)}%` : 'Not available'}

${emojis.ram} *Memory:*
- Used: ${memInfo.status === 'fulfilled' ? `${formatBytesToGB(memInfo.value?.active || 0)}GB / ${formatBytesToGB(memInfo.value?.total || 0)}GB` : 'Not available'}
- Free: ${memInfo.status === 'fulfilled' ? `${formatBytesToGB(memInfo.value?.free || 0)}GB` : 'Not available'}

${emojis.storage} *Disk:*
- Total: ${diskInfo.status === 'fulfilled' && diskInfo.value.length > 0 ? `${formatBytesToGB(diskInfo.value[0]?.size || 0)}GB` : 'Not available'}
- Used: ${diskInfo.status === 'fulfilled' && diskInfo.value.length > 0 ? `${formatBytesToGB(diskInfo.value[0]?.used || 0)}GB` : 'Not available'}
- Free: ${diskInfo.status === 'fulfilled' && diskInfo.value.length > 0 ? `${formatBytesToGB(diskInfo.value[0]?.available || 0)}GB` : 'Not available'}

${emojis.os} *OS:*
- ${os.type()} ${os.release()} (${os.arch()})
`;

            await kord.reply(m, sysInfoMessage);
        } catch (error) {
            await kord.react(m, emojis.error);
            await kord.reply(m, "❌ An error occurred while fetching system information.");
            console.error("Error in 'sys' command:", error); 
        }
    }
};