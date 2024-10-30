const axios = require('axios');

module.exports = [
    {
        usage: ["character", "char"],
        desc: "Fetch images of any anime character",
        commandType: "Anime",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "🎯",

        async execute(sock, m, args) {
            try {
                if (!args.length) {
                    return await global.kord.reply(m, '❌ Please provide a character name! Example: .char Naruto');
                }

                const characterName = args.join(' ');
                await global.kord.reply(m, `> Searching for ${characterName}...`);

                // Search for the character using Jikan API
                const searchResponse = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(characterName)}&limit=1`);

                if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
                    return await global.kord.reply(m, '❌ Character not found!');
                }

                const character = searchResponse.data.data[0];
                const imageUrl = character.images?.jpg?.image_url;

                if (!imageUrl) {
                    return await global.kord.reply(m, '❌ No image found for this character.');
                }

                const caption = `✨ *${character.name}*\n` +
                              `👍 Favorites: ${character.favorites}\n` +
                              `ℹ️ From: ${character.anime?.[0]?.anime?.title || 'Unknown anime'}`;

                await global.kord.sendImage(m, imageUrl, caption);

            } catch (error) {
                console.error('Error fetching character:', error.message);
                await global.kord.reply(m, '❌ An error occurred while fetching the character.');
            }
        }
    },
    {
        usage: ["animeimage", "aimg"],
        desc: "Search anime images from Zerochan",
        commandType: "Anime",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "🖼️",

        async execute(sock, m, args) {
            try {
                if (!args.length) {
                    return await global.kord.reply(m, '❌ Please provide a search term! Example: .aimg Naruto');
                }

                const searchTerm = args.join(' ');
                await global.kord.reply(m, `> Searching for ${searchTerm} images...`);

                // Using SauceNAO API (requires API key) or alternative image board API
                const response = await axios.get(`https://danbooru.donmai.us/posts.json`, {
                    params: {
                        tags: `${encodeURIComponent(searchTerm)} rating:safe`,
                        limit: 1,
                        random: true
                    }
                });

                if (!response.data || response.data.length === 0) {
                    return await global.kord.reply(m, '❌ No images found!');
                }

                const imageUrl = response.data[0].file_url || response.data[0].large_file_url;

                if (!imageUrl) {
                    return await global.kord.reply(m, '❌ No suitable image found.');
                }

                await global.kord.sendImage(m, imageUrl, `🎭 Here's your ${searchTerm} image!`);

            } catch (error) {
                console.error('Error fetching anime image:', error.message);
                await global.kord.reply(m, '❌ An error occurred while fetching the image.');
            }
        }
    }
];