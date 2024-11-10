const axios = require('axios');
const fs = require('fs').promises; // Use promises for file operations
const path = require('path');

module.exports = {
    usage: ["ssearch18", "stickersearch18"],
    desc: "Searches for stickers and provides a link to the sticker pack.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🔍",

    async execute(sock, m) {
        try {
            if (!settings.SAFE_SEARCH) {
                const response = await axios.get('https://hacxkmd.vercel.app/api/gifsearch18/gif');
                const stickers = response.data;

                if (!stickers || stickers.length === 0) {
                    console.error('Error: No stickers found in response data.');
                    await kord.reply(m, "❌ No stickers found.");
                    return;
                }

                const randomIndex = Math.floor(Math.random() * stickers.length);
                const stickerPack = stickers[randomIndex];

                if (!stickerPack || !stickerPack.stickerImages || stickerPack.stickerImages.length === 0) {
                    console.error('Error: Sticker pack or sticker images not found in response.');
                    await kord.reply(m, "❌ Sticker pack or sticker images not found.");
                    return;
                }

                let message = `🎉 Sticker Pack: *${stickerPack.title}*`;
                await kord.reply(m, message);

                // Ensure temp directory exists
                const tempDir = path.join('./temp');
                await fs.mkdir(tempDir, { recursive: true }); // Create directory if not exists

                // Limit the number of stickers to send
                const numberOfStickersToSend = Math.min(3, stickerPack.stickerImages.length);

                // Enhanced loop for sending stickers:
                for (let i = 0; i < numberOfStickersToSend; i++) {
                    try {
                        const imgSrc = stickerPack.stickerImages[i];
                        const imagePath = path.join(tempDir, `sticker_${Date.now()}_${i}.png`); // Unique filename
                        const response = await axios.get(imgSrc, { responseType: 'arraybuffer' });
                        await fs.writeFile(imagePath, response.data); // Write to file

                        // Read file as buffer
                        const buffer = await fs.readFile(imagePath);

                        // Send sticker using buffer
                        await kord.sendSticker(m, buffer);

                        // Delete file after sending
                        await fs.unlink(imagePath);
                    } catch (imageError) {
                        console.error(`Error sending sticker image ${stickerPack.stickerImages[i]}:`, imageError);
                        // Continue to the next image instead of stopping the entire process
                    }
                }
            } else {
                await kord.reply(m, "Safe Search Enabled! Disable it First!?");
                return;
            }
        } catch (error) {
            console.error('Error fetching sticker search results:', error);
            await kord.reply(m, "❌ An error occurred while searching for stickers.");
        }
    }
};
