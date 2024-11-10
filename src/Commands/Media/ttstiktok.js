const fetch = require('node-fetch');

module.exports = {
    usage: ['ttstiktok'],
    desc: "Convert text to TikTok TTS audio",
    commandType: "media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎤",

    async execute(sock, m, args) {
        if (!args.join(' ')) {
            return kord.freply(m, `Please provide text for TTS.\n\nExample: ${global.settings.PREFIX[0]}ttstiktok Hello there!`);
        }

        const text = args.join(' ');
        const url = `https://itzpire.com/tools/tts-tiktok?text=${encodeURIComponent(text)}&id=en_us_006`;

        try {
            // Fetch the audio file directly
            const response = await fetch(url);

            if (!response.ok) {
                return kord.freply(m, `Failed to fetch audio. Status: ${response.status}`);
            }

            // Send the audio file directly
            await sock.sendMessage(m.key.remoteJid, {
                audio: { url: response.url }, // Use the URL directly
                mimetype: 'audio/mpeg',
                ptt: true,
            }, { quoted: m });
        } catch (error) {
            console.error(error);
            return kord.freply(m, `Error fetching audio: ${error.message}`);
        }
    }
};