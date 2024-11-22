const textMaker = require('../../Plugin/textmaker');

module.exports = {
    usage: ["burntext"],
    desc: "Creates a burned paper text effect using PhotoOxy",
    commandType: "fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🔥",
    async execute(sock, m, args) {
        // Check if text is provided
        if (!args[0]) {
            return await global.kord.freply(
                m, 
                '❌ Please provide text for the burn paper effect\n' +
                'Example: !burntext Hello World'
            );
        }

        const text = args.join(' ');
        const effect_url = 'https://photooxy.com/logo-and-text-effects/write-text-on-burn-paper-388.html';

        try {
            // Show processing message
            await global.kord.freply(m, '⌛ Creating your burned paper text...');

            // Generate image using textMaker
            const result = await textMaker(effect_url, [text]);
            
            if (!result.status || !result.url) {
                throw new Error('Failed to generate burned paper effect');
            }

            // Fetch the generated image
            const response = await fetch(result.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://photooxy.com/',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive'
                },
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText} (Status Code: ${response.status})`);
            }

            const buffer = await response.buffer();
            
            // Send the image with caption
            await sock.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™',
                mimetype: 'image/jpeg'
            }, { quoted: m });

        } catch (error) {
            console.error('Error in burntext command:', error);
            if (error.response) {
                console.error('Status Code:', error.response.status);
                console.error('Response Data:', error.response.data);
            }

            await global.kord.freply(
                m, 
                `❌ An error occurred: ${error.message}\n` +
                'Please try again later or contact the bot administrator.'
            );
        }
    }
};