const fetch = require('node-fetch'); // Ensure you have node-fetch installed
let intervalId;

module.exports = {
    usage: ["autobio"],
    desc: "Starts or stops the auto bio updates.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: "🤖",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.reply(m, 'Use either `.autobio start | .autobio stop`');

        if (args[0] === 'start') {
            if (intervalId) {
                return await sock.sendMessage(m.key.remoteJid, { text: 'Auto bio update is already running.' }, { quoted: m });
            }

            intervalId = setInterval(async () => {
                const time = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
                const quote = await fetchQuote();
                const newBio = `Time: ${time}\nQuote: "${quote}"`;

                try {
                    await sock.updateProfileStatus(newBio);
                } catch (error) {
                    console.error(error);
                    await sock.sendMessage(m.key.remoteJid, { text: 'Failed to update your bio.' }, { quoted: m });
                }
            }, 60000); // Update every minute

            await sock.sendMessage(m.key.remoteJid, { text: 'Auto bio update started.' }, { quoted: m });

        } else if (args[0] === 'stop') {
            if (!intervalId) {
                return await sock.sendMessage(m.key.remoteJid, { text: 'Auto bio update is not running.' }, { quoted: m });
            }

            clearInterval(intervalId);
            intervalId = null;
            await sock.sendMessage(m.key.remoteJid, { text: 'Auto bio update stopped.' }, { quoted: m });
        } else {
            await sock.sendMessage(m.key.remoteJid, { text: 'Invalid command. Use "start" to begin auto bio update or "stop" to end it.' }, { quoted: m });
        }
    }
};

async function fetchQuote() {
    try {
        const response = await fetch('https://zenquotes.io/api/random');
        const data = await response.json();
        return data[0].q; // ZenQuotes API returns an array with a single object
    } catch (error) {
        console.error('Error fetching quote:', error);
        return 'No quote available'; // Fallback message
    }
}