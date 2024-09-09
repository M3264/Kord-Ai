const lyricsFinder = require('lyrics-finder');
const emojis = {
    info: 'ℹ️',  // Define your emojis here
    search: '🔍',
    found: '🎵',
    notFound: '😕',
    error: '❌'
};

module.exports = {
    usage: ["lyrics"],
    desc: "Fetch lyrics for a given song and artist.",
    commandType: "Music",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.search,

    async execute(sock, m, args) {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(m.key.remoteJid, { text: `Please provide both the artist name and song title. Example: \`${settings.PREFIX[0]}lyrics Ed Sheeran Shape of You\`` });
            }

            const artist = args[0];
            const songTitle = args.slice(1).join(' ');

            await sock.sendMessage(m.key.remoteJid, { text: `${emojis.search} Searching for lyrics...` });

            const lyrics = await lyricsFinder(artist, songTitle);

            if (lyrics) {
                await sock.sendMessage(m.key.remoteJid, { text: `${emojis.found} *Lyrics for "${songTitle}" by ${artist}:*\n\n${lyrics}` });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: `${emojis.notFound} Could not find lyrics for "${songTitle}" by ${artist}.` });
            }

        } catch (error) {
            console.error("Error fetching lyrics:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `${emojis.error} An error occurred while fetching the lyrics. Please try again later.` });
        }
    }
};