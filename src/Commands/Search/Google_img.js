const gis = require('g-i-s');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const gisPromise = promisify(gis);

const emojis = {
    search: '🔍',
    found: '🖼️',
    noResults: '😕',
    error: '🚫',
    downloading: '⏬',
    done: '✅',
    warning: '⚠️'
};

module.exports = {
    usage: ["gimage", "googleimage", "imagesearch", "img"],
    desc: "Search for images using Google and download them.",
    commandType: "Search",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        try {
            const query = args.join(" ");
            await kord.react(m, emojis.search);

            if (!query) {
                return await kord.reply(m, `${emojis.warning} Please provide a search query.`);
            }

            const images = await googleImageSearch(query);

            if (images.length === 0) {
                await kord.react(m, emojis.noResults);
                return await kord.reply(m, `${emojis.noResults} No images found for "${query}".`);
            }

            await kord.react(m, emojis.found);

            const imagesToSend = images.slice(0, 3);
            const downloadPromises = imagesToSend.map(downloadImage);

            await kord.reply(m, `${emojis.downloading} Downloading and sending 3 images for "${query}"...`);

            for (const downloadPromise of downloadPromises) {
                const imageInfo = await downloadPromise;
                if (imageInfo) {
                    const succ = await kord.sendImage(m, imageInfo.path, `Image: ${imageInfo.filename} (${imageInfo.size} KB)`);
                    if (succ) {
                        await fs.unlink(imageInfo.path);
                    }
                }
            }

            await kord.react(m, emojis.done);

        } catch (error) {
            await kord.react(m, emojis.error);
            await kord.reply(m, `${emojis.error} An error occurred while searching for images. Please try again later.`);
        }
    }
};

async function googleImageSearch(query) {
    const options = {
        searchTerm: query,
        queryStringAddition: '&safe=false',
        filterOutDomains: ['pinterest.com', 'deviantart.com']
    };
    return await gisPromise(options);
}

async function downloadImage(imageInfo) {
    try {
        const response = await axios.get(imageInfo.url, {
            responseType: 'arraybuffer',
            timeout: 5000, // 5 seconds timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const buffer = Buffer.from(response.data, 'binary');
        const filename = `image_${uuidv4().slice(0, 8)}.jpg`;
        const pat = path.join('./temp');

        try {
            await fs.access(pat);
        //    console.log('Directory already exists');
        } catch (error) {
            // Directory does not exist
            if (error.code === 'ENOENT') {
                await fs.mkdir(pat);
              //  console.log('Directory created');
            } else {
                // Other error
                console.error('Error checking directory:', error);
            }
        }
        const tempPath = path.join('./temp', filename);
        await fs.writeFile(tempPath, buffer);
        const size = (buffer.length / 1024).toFixed(2); // Size in KB
        return { filename, path: tempPath, size };
    } catch (error) {
        console.error(`Failed to download image: ${imageInfo.url}`, error);
        return null;
    }
}