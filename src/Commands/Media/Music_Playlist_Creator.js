const yts = require('yt-search');

module.exports = {
    usage: ["createplaylist", "playlist"],
    desc: "Create a music playlist from YouTube searches",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎶",

    async execute(sock, m, args) {
        try {
            if (args.length < 2) {
                return await kord.reply(m, "🎵 Usage: !createplaylist <playlist name> <song1>, <song2>, ...");
            }

            const playlistName = args[0];
            const songs = args.slice(1).join(" ").split(",").map(song => song.trim());

            if (songs.length === 0) {
                return await kord.reply(m, "🎵 Please provide at least one song for the playlist.");
            }

            await kord.reply(m, `🎶 Creating playlist "${playlistName}" with ${songs.length} songs...`);

            const playlist = [];
            for (const song of songs) {
                const results = await yts(song);
                if (results.videos.length > 0) {
                    playlist.push({
                        title: results.videos[0].title,
                        url: results.videos[0].url,
                        duration: results.videos[0].duration.timestamp
                    });
                }
            }

            let playlistText = `🎵 Playlist: ${playlistName}\n\n`;
            playlist.forEach((song, index) => {
                playlistText += `${index + 1}. ${song.title} (${song.duration})\n${song.url}\n\n`;
            });

            await kord.reply(m, playlistText);
            await kord.reply(m, `✅ Playlist "${playlistName}" created with ${playlist.length} songs!`);
        } catch (error) {
            console.error(error);
            await kord.reply(m, "❌ An error occurred while creating the playlist.");
        }
    }
};