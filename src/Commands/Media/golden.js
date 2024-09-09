const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

module.exports = {
    usage: ["golden"],
    desc: "Generates a image from the provided text using the Ephoto360 API.",
    commandType: "ephoto360",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        try {
            // Check if the text is provided
            if (!args.length) {
                return kord.reply(m, "❌ Please provide text to generate a neon image.");
            }

            // Join the arguments to form the text
            const text = args.join(" ");
            if (typeof text !== 'string' || !text.trim()) {
                return kord.reply(m, "❌ Invalid text input.");
            }

            // Construct the query URL with user input
            const encodedText = encodeURIComponent(text);
            const apiKey = "gifted"; // Provided API key
            const apiUrl = `https://api.giftedtechnexus.co.ke/api/ephoto360/luxurygold?text=${encodedText}&apikey=${apiKey}`;

            // Fetch the results from the API
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API returned an error
            if (response.status !== 200 || !data.success) {
                return kord.reply(m, `❌ Error fetching the image: ${data.message || 'Unknown error'}`);
            }

            // Extract the image URL
            const imageUrl = data.result.gifted.image_url;

            // Ensure the 'temp' folder exists
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                await mkdir(tempDir);
            }

            // Download the image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                return kord.reply(m, `❌ Error downloading the image.`);
            }

            // Save the image to a temporary folder
            const tempFilePath = path.join(tempDir, 'neon_image.jpg');
            const imageBuffer = await imageResponse.buffer();
            await writeFile(tempFilePath, imageBuffer);

            // Send the image to the user
            const caption = "> Here is your image!";
            await kord.sendImage(m, await fs.promises.readFile(tempFilePath), caption);

            // Delete the image from the temporary folder
            await unlink(tempFilePath);

        } catch (error) {
            console.error("Error executing .neon command:", error);
            await kord.reply(m, "❌ An error occurred while processing your request. Please try again.");
        }
    }
};