const axios = require('axios');

const emojis = {
    pinterest: '📌',
    search: '🔍',
    image: '🖼️',
    error: '❌',
    success: '✅',
    loading: '⏳'
};

module.exports = {
    usage: ["pinterest"],
    desc: "Fetches 3 beautiful images from Pinterest based on your search query.",
    commandType: "Search",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.pinterest,
    async execute(sock, m, args) {
        if (args.length === 0) {
            return kord.reply(m, `${emojis.error} Please provide a search query. Usage: .pinterest <query>`);
        }
        const query = args.join(" ");
        await kord.react(m, emojis.loading);

        try {
            const images = await fetchPinterestImages(query);
            if (images.length === 0) {
                await kord.react(m, emojis.error);
                return kord.reply(m, `${emojis.error} No images found for "${query}". Try a different search term.`);
            }

            // Select 3 random images
            const selectedImages = getRandomImages(images, 3);

            const caption = `
╔═══════ *Pinterest Images* ═══════╗
${emojis.search} *Search Query:* ${query}
${emojis.pinterest} *Powered by Pinterest*
╚═════════════════════════════════╝`;

            await kord.react(m, emojis.success);

            // Send each image separately with the caption
            for (const image of selectedImages) {
                await kord.sendImage(m, image.images_url, caption);
            }
        } catch (error) {
            console.error("Error in Pinterest command:", error);
            await kord.react(m, emojis.error);
            await kord.reply(m, `${emojis.error} An error occurred while fetching Pinterest images. Please try again later.`);
        }
    }
};

async function fetchPinterestImages(query) {
    const apiUrl = `https://api.vihangayt.com/downloader/pinimage?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    return response.data.data;
}

function getRandomImages(images, count) {
    const shuffled = images.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
