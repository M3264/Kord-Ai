const Genius = require("genius-lyrics");
const Client = new Genius.Client(V0oeid4uq3WJovgQvRG69hWG35E4uu4d6VeVcB3EMvl-4-FSGGdX9Sm3n8cEdOJn);

const emojis = {
    info: 'ℹ️',
    search: '🔍',
    found: '🎵',
    notFound: '😕',
    error: '❌'
};

module.exports = {
    usage: ["lyrics"],
    desc: "Fetch lyrics for a given song and artist.",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.search,

    async execute(sock, m, args) {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(m.key.remoteJid, { text: `${emojis.info} Please provide both the artist name and song title. Example: \`${settings.PREFIX[0]}lyrics Ed Sheeran Shape of You\`` });
            }

            const artist = args[0];
            const songTitle = args.slice(1).join(' ');

            await sock.sendMessage(m.key.remoteJid, { text: `${emojis.search} Searching for lyrics...` });

            const searches = await Client.songs.search(songTitle + " " + artist);
            
            if (searches.length === 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: `${emojis.notFound} Could not find lyrics for "${songTitle}" by ${artist}.` });
            }

            const song = searches[0];
            const lyrics = await song.lyrics();

            if (lyrics) {
                await sock.sendMessage(m.key.remoteJid, { text: `${emojis.found} *Lyrics for "${song.title}" by ${song.artist.name}:*\n\n${lyrics}` });
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: `${emojis.notFound} Could not fetch lyrics for "${songTitle}" by ${artist}.` });
            }

        } catch (error) {
            console.error("Error fetching lyrics:", error);
            await sock.sendMessage(m.key.remoteJid, { text: `${emojis.error} An error occurred while fetching the lyrics. Please try again later.` });
        }
    }
};