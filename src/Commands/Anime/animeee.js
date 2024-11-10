const malScraper = require('mal-scraper');

module.exports = {
    usage: ["anime", "animeinfo"],
    desc: "Gets Info about an anime series",
    commandType: "Anime",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: '🍁',

    async execute(sock, m, args) {
        try {
            const text = args.join(" ");

            if (!text) return kord.reply(m, `Which anime are you looking for?`);

            await kord.react(m, '✨');

            const anime = await malScraper.getInfoFromName(text).catch(() => null);

            if (!anime) return kord.reply(`Could not find results 🙁`);

            let animetxt = `
            🎀 *Title: ${anime.title}*
            🎋 *Type: ${anime.type}*
            🎐 *Premiered on: ${anime.premiered}*
            💠 *Total Episodes: ${anime.episodes}*
            📈 *Status: ${anime.status}*
            💮 *Genres: ${anime.genres}*
            📍 *Studio: ${anime.studios}*
            🌟 *Score: ${anime.score}*
            💎 *Rating: ${anime.rating}*
            🏅 *Rank: ${anime.ranked}*
            💫 *Popularity: ${anime.popularity}*
            ♦️ *Trailer: ${anime.trailer}*
            🌐 *URL: ${anime.url}*
            ❄ *Description:* ${anime.synopsis}*`;

            await kord.reply(m, `Here are the results!\n${animetxt}`);
        } catch (error) {
            console.error('Error fetching results:', error.message);
            await global.kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};