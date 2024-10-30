const fetch = require('node-fetch');

module.exports = {
    usage: ["photoleap"],
    desc: "Generate an image using Photoleap based on the provided prompt",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🖼️",

    async execute(sock, m, args) {
        // Check if a prompt is provided
        if (args.length === 0) {
            return await global.kord.reply(m, "❌ Please provide a prompt for the image.");
        }

        const prompt = args.join(' ');  // Combine the args to form the prompt
        const url = `https://tti.photoleapapp.com/api/v1/generate?prompt=${encodeURIComponent(prompt)}`;

        try {
            // Fetch the generated image URL from the Photoleap API
            const response = await fetch(url);
            const result = await response.json();

            // Check if the result contains a valid URL
            if (result.result_url) {
                const imageUrl = result.result_url;

                // Send the image back to the chat using Kord.sendImage
                await global.kord.sendImage(m, imageUrl, `🖼️ \n Prompt: ${prompt}\n  > © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`);
            } else {
                await global.kord.reply(m, "❌ Failed to generate the image. Please try again.");
            }
        } catch (error) {
            console.error('Error generating image:', error);
            await global.kord.reply(m, `❌ Error generating the image: ${error.message}`);
        }
    }
};