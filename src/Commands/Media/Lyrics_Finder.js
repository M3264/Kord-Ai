const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    usage: ["findlyrics"],
    desc: "Find lyrics for a given song",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "📜",

    async execute(sock, m, args) {
        try {
            if (args.length < 2) {
                return await kord.reply(m, "🎵 Usage: !lyrics <artist name> - <song name>");
            }

            const query = args.join(" ");
            const [artist, song] = query.split("-").map(item => item.trim());

            await kord.reply(m, `🔍 Searching for lyrics of "${song}" by ${artist}...`);

            const searchUrl = `https://www.azlyrics.com/search.php?q=${encodeURIComponent(query)}`;
            const searchResponse = await axios.get(searchUrl);
            const $ = cheerio.load(searchResponse.data);

            const lyricsLink = $('table.table-condensed td a').first().attr('href');

            if (!lyricsLink) {
                return await kord.reply(m, "❌ Lyrics not found. Please check the artist and song name.");
            }

            const lyricsResponse = await axios.get(`https://www.azlyrics.com${lyricsLink}`);
            const lyricsPage = cheerio.load(lyricsResponse.data);

            const lyrics = lyricsPage('div.col-xs-12.col-lg-8.text-center div:not([class])').text().trim();

            if (!lyrics) {
                return await kord.reply(m, "❌ Unable to extract lyrics. Please try again later.");
            }

            const formattedLyrics = `📜 Lyrics: ${song} by ${artist}\n\n${lyrics}`;

            if (formattedLyrics.length > 4096) {
                const chunks = formattedLyrics.match(/.{1,4096}/g);
                for (const chunk of chunks) {
                    await kord.reply(m, chunk);
                }
            } else {
                await kord.reply(m, formattedLyrics);
            }

            await kord.reply(m, "✅ Lyrics found and sent successfully!");
        } catch (error) {
            console.error(error);
            await kord.reply(m, "❌ An error occurred while fetching the lyrics.");
        }
    }
};