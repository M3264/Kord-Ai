const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Function to scrape Pinterest for images
function pinterest(query) {
    return new Promise(async (resolve, reject) => {
        try {
            // Make a GET request to Pinterest search page with the query
            const { data } = await axios.get('https://id.pinterest.com/search/pins/?autologin=true&q=' + encodeURIComponent(query), {
                headers: {
                    "cookie": "_auth=1; _b=\"AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg=\"; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY5cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA4Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY4cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0=; _ir=0"
                }
            });

            // Load the response HTML into cheerio
            const $ = cheerio.load(data);
            const result = [];
            const hasil = [];

            // Extract image URLs
            $('div > a').each((index, element) => {
                const link = $(element).find('img').attr('src');
                if (link) {
                    result.push(link);
                }
            });

            // Replace '236' with '736' in image URLs for higher resolution
            result.forEach(v => {
                if (v !== undefined) {
                    hasil.push(v.replace(/236/g, '736'));
                }
            });

            // Remove the first element if necessary
            hasil.shift();

            // Resolve the promise with the final image URLs
            resolve(hasil);

        } catch (error) {
            // Handle and reject errors
            console.error('Error fetching Pinterest data:', error.message);
            reject(error);
        }
    });
}

// Function to download image and save it locally
async function downloadImage(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Command Export
module.exports = {
    usage: ["pint", "pinterest"],
    desc: "Pinterest Image Search",
    commandType: "search",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.reply(m, 'Please provide a search query for Pinterest.');

        const query = args.join(' ');
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        try {
            const imageUrls = await pinterest(query);

            if (imageUrls.length === 0) {
                return await global.kord.reply(m, 'No images found.');
            }

            // Download and send the first 5 images
            for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
                const imageUrl = imageUrls[i];
                const filePath = path.join(tempDir, `image${i + 1}.jpg`);
                
                try {
                    // Download image
                    await downloadImage(imageUrl, filePath);
                    
                    // Send image
                    await global.kord.sendImage(m, fs.readFileSync(filePath), `Image ${i + 1}`);
                    
                } catch (error) {
                    console.error(`Error downloading or sending image ${i + 1}:`, error);
                    await global.kord.reply(m, `❌ Failed to send Image ${i + 1}.`);
                } finally {
                    // Clean up
                    fs.unlinkSync(filePath);
                }
            }

        } catch (error) {
            console.error('Error in Pinterest command:', error);
            await global.kord.reply(m, '❌ An error occurred while searching for images.');
        }
    }
};