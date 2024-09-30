const axios = require('axios');

module.exports = {
    usage: ["lyrics"],
    desc: "Fetch lyrics for the specified song title.",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎵",

    async execute(sock, m, args) {
        if (!args[0]) {
            return await global.kord.reply(m, "❌ Please provide a song title.");
        }

        const songTitle = args.join(" ");
        const apiUrl = `https://some-random-api.com/others/lyrics?title=${encodeURIComponent(songTitle)}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (data.source === 0) {
                const lyricsMessage = `
*Title:* ${data.title}
*Author:* ${data.author}
*More Info:* ${data.links.genius}
\`\`\`
${data.lyrics}
\`\`\`
                `;
                
                // Send the thumbnail and lyrics as caption
                await global.kord.sendImage(m, data.thumbnail.genius, lyricsMessage);

            } else {
                await global.kord.reply(m, "❌ Lyrics not found for the specified song.");
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            await global.kord.reply(m, `❌ Failed to fetch lyrics. Error: ${error.message}`);
        }
    }
};