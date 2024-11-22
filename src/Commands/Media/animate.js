const fetch = require('node-fetch');

module.exports = {
    usage: ["animate"],
    desc: "Generate an animated image based on the provided prompt",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎨",

    async execute(sock, m, args) {
        let prompt;

        if (args.length > 0) {
            prompt = args.join(' ');
        } else {
            prompt = await global.kord.getQuotedText(m);
        }

        if (!prompt) {
            return await global.kord.reply(m, "❌ Please provide or quote a prompt for the animation.");
        }

        const url = `https://api.gurusensei.workers.dev/dream?prompt=${encodeURIComponent(prompt)}`;

        try {
            const response = await fetch(url);
            const imageBuffer = await response.buffer();

            await global.kord.sendImage(m, imageBuffer, `🎨 \n Prompt: ${prompt} \n > © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`);
        } catch (error) {
            await global.kord.reply(m, `❌ Error generating the animation: ${error.message}`);
        }
    }
};