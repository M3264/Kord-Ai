const moment = require('moment-timezone');

module.exports = {
    usage: ['searchno', 'searchnumber', 'nowa'],
    desc: "Search for WhatsApp accounts in a number range",
    commandType: "Search",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🫧",
    async execute(sock, m, args) {
    const command = this.usage;
        if (!args[0]) {
            return kord.freply(m, `*Please provide a number with 'xx' indicating the range.*\n\n\`Example: ${global.settings.PREFIX[0]}${command} 234801234567xx\``);
        }

        const inputnumber = args[0].split(" ")[0];
        const numberPrefix = inputnumber.split('x')[0]; // Extract the base number before 'x'
        const numberSuffix = inputnumber.split('x')[1] || ''; // Extract suffix after 'x' if available
        const xCount = (inputnumber.match(/x/g) || []).length; // Count the number of 'x'
        const range = Math.pow(10, xCount); // Set range based on number of 'x'

        let results = `*==[ List of WhatsApp Numbers ]==*\n\n`;
        let noBioList = `\n*Bio:* || \nHey there! I am using WhatsApp.\n`;
        let noWhatsAppList = `\n*Numbers with no WhatsApp account within the provided range.*\n`;

        // Notify the user that the search is starting
        await kord.freply(m, `Searching for WhatsApp accounts in the given range...`);

        // Loop through the range of possible numbers
        for (let i = 0; i < range; i++) {
            const randomDigits = i.toString().padStart(xCount, '0'); // Generate the next number in the range
            const fullNumber = `${numberPrefix}${randomDigits}${numberSuffix}`; // Construct the full number

            try {
                // Check if the number has a WhatsApp account
                const waInfo = await sock.onWhatsApp(`${fullNumber}@s.whatsapp.net`);
                if (waInfo.length > 0) {
                    let status;
                    try {
                        status = await sock.fetchStatus(waInfo[0].jid);
                    } catch {
                        status = { status: '401' }; // Default if no status is found
                    }

                    if (status.status === '401' || !status.status.length) {
                        noBioList += `wa.me/${waInfo[0].jid.split("@")[0]}\n`;
                    } else {
                        results += `🪀 *Number:* wa.me/${waInfo[0].jid.split("@")[0]}\n 🎗️ *Bio:* ${status.status}\n🕑 *Last update:* ${moment(status.setAt).tz('Africa/Lagos').format('HH:mm:ss DD/MM/YYYY')}\n\n`;
                    }
                } else {
                    noWhatsAppList += `${fullNumber}\n`;
                }
            } catch (err) {
                noWhatsAppList += `${fullNumber}\n`;
            }
        }

        // Send the result back to the user
        await kord.freply(m, `${results}${noBioList}${noWhatsAppList}`);
    }
};