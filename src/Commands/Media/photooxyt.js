const { photoOxy } = require('../../Plugin/photooxy-client'); // Adjust the path as needed
const fetch = require('node-fetch');

module.exports = {
    usage: ["lovemsg"],
    desc: "Creates a love message effect using PhotoOxy",
    commandType: "fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "❤️",

    async execute(sock, m, args) {
        if (!args[0]) return await global.kord.freply(m, 'Please provide text for the love message effect');

        const text = args.join(' ');
        const url = 'https://photooxy.com/logo-and-text-effects/create-a-picture-of-love-message-377.html';

        try {
            console.log("Starting love message effect generation...");
            const imageUrl = await photoOxy(url, text);
            
            const response = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://photooxy.com/',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive'
                },
                redirect: 'follow'
            });

            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText} (Status Code: ${response.status})`);
            
            const buffer = await response.buffer();
            await sock.sendMessage(m.key.remoteJid, { 
                image: buffer,
                caption: '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™',
                mimetype: 'image/jpeg'
            }, { quoted: m });

        } catch (error) {
            console.error('Error in lovemsg command:', error);
            if (error.response) {
                console.error('Status Code:', error.response.status);
                console.error('Response Data:', error.response.data);
            }

            await global.kord.freply(m, `❌ An error occurred: ${error.message}\nPlease try again later or contact the bot administrator.`);
        }
    }
};