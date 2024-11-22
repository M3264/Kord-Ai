
const { textMaker } = require('../../Plugin/textmaker');
const fetch = require('node-fetch');

const createTextEffectCommand = (name, effectUrl, emoji, description) => ({
    usage: [name.toLowerCase()],
    desc: `Creates ${description} using EpPhoto360`,
    commandType: "fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emoji,

    async execute(sock, m, args) {
        if (!args[0]) {
            return await global.kord.freply(
                m, 
                `❌ Please provide text for the ${name} effect\n` +
                `Example: !${name} Hello World`
            );
        }

        const text = args.join(' ');

        try {
            await global.kord.freply(m, `⌛ Creating your ${name} text...`);
            const result = await textMaker(effectUrl, [text]);
            
            if (!result.status || !result.url) {
                throw new Error('Failed to generate effect');
            }

            const response = await fetch(result.url);
            const buffer = await response.buffer();
            
            await sock.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: '> © ɪɴᴛᴇʟʟɪɢᴇɴᴛ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™',
                mimetype: 'image/jpeg'
            }, { quoted: m });

        } catch (error) {
            console.error(`Error in ${name} command:`, error);
            await global.kord.freply(m, `❌ An error occurred: ${error.message}`);
        }
    }
});

module.exports = [
    // Neon Effects
    createTextEffectCommand("neonlight", "https://en.ephoto360.com/create-light-effects-green-neon-online-429.html", "💡", "neon light text effect"),

    // Additional Text Effects
    createTextEffectCommand("typography", "https://en.ephoto360.com/create-online-typography-art-effects-with-multiple-layers-811.html", "✨", "typography text effect"),
    createTextEffectCommand("wetglass", "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", "💧", "wet glass text effect"),
    createTextEffectCommand("glitch", "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html", "🤖", "digital glitch text effect"),
    createTextEffectCommand("pavement", "https://en.ephoto360.com/create-typography-text-effect-on-pavement-online-774.html", "🛤️", "pavement text effect"),
    createTextEffectCommand("colorfulneon", "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html", "💡", "colorful neon light text effect"),
    createTextEffectCommand("futuristiclight", "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html", "🤖", "futuristic technology text effect"),
    createTextEffectCommand("pubgmascot", "https://en.ephoto360.com/pubg-mascot-logo-maker-for-an-esports-team-612.html", "🎮", "PUBG mascot logo"),
    createTextEffectCommand("pubglogo", "https://en.ephoto360.com/pubg-logo-maker-cute-character-online-617.html", "🎮", "PUBG logo with cute character"),
    createTextEffectCommand("valorantbanner", "https://en.ephoto360.com/create-valorant-banner-youtube-online-588.html", "🎮", "Valorant YouTube banner"),
    createTextEffectCommand("codwarzonebanner", "https://en.ephoto360.com/create-call-of-duty-warzone-youtube-banner-online-548.html", "🎮", "Call of Duty Warzone YouTube banner"),
    createTextEffectCommand("lolwallpaper", "https://en.ephoto360.com/make-your-own-league-of-legends-wallpaper-full-hd-442.html", "🎮", "League of Legends wallpaper"),
    createTextEffectCommand("amongusavatar", "https://en.ephoto360.com/create-a-banner-game-among-us-with-your-name-763.html", "🎮", "Among Us avatar banner"),
    createTextEffectCommand("angel", "https://en.ephoto360.com/create-colorful-angel-wing-avatars-731.html", "👼", "angel wing avatar"),
    createTextEffectCommand("greenbrush", "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html", "🖌️", "green brush text effect"),
    createTextEffectCommand("neon", "https://en.ephoto360.com/neon-text-effect-online-78.html", "💡", "neon text effect"),
    createTextEffectCommand("neonlightsignature", "https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html", "✨", "multicolored neon light signature"),
    createTextEffectCommand("lightbulb", "https://en.ephoto360.com/create-realistic-vintage-3d-light-bulb-608.html", "💡", "realistic 3D light bulb"),
    createTextEffectCommand("glitter", "https://en.ephoto360.com/free-glitter-text-effect-maker-online-656.html", "✨", "glitter text effect"),
    createTextEffectCommand("watercolor", "https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html", "🎨", "watercolor text effect"),
    createTextEffectCommand("papercut", "https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html", "✂️", "3D paper cut text effect"),
    createTextEffectCommand("tiktok", "https://en.ephoto360.com/tik-tok-text-effects-online-generator-485.html", "📹", "TikTok text effect"),
    createTextEffectCommand("metallogo", "https://en.ephoto360.com/metal-mascots-logo-maker-486.html", "🏆", "metal mascot logo"),
    createTextEffectCommand("galaxyneon", "https://en.ephoto360.com/making-neon-light-text-effect-with-galaxy-style-521.html", "🌌", "galaxy neon light text effect"),
    createTextEffectCommand("blueneon", "https://en.ephoto360.com/create-blue-neon-logo-online-507.html", "💙", "blue neon logo"),
    createTextEffectCommand("galaxywallpaper", "https://en.ephoto360.com/create-galaxy-wallpaper-mobile-online-528.html", "🌌", "galaxy wallpaper"),
    createTextEffectCommand("glossychrome", "https://en.ephoto360.com/glossy-chrome-text-effect-online-424.html", "🤖", "glossy chrome text effect"),
    createTextEffectCommand("wetglass2", "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", "💧", "wet glass text effect"),
    createTextEffectCommand("gloweffect", "https://en.ephoto360.com/advanced-glow-effects-74.html", "✨", "advanced glow text effect"),
    createTextEffectCommand("wood3d", "https://en.ephoto360.com/wooden-3d-text-effect-59.html", "🌳", "3D wooden text effect"),
    createTextEffectCommand("sunsetlight", "https://en.ephoto360.com/create-sunset-light-text-effects-online-807.html", "🌆", "sunset light text effect"),
    createTextEffectCommand("pencilsketch", "https://en.ephoto360.com/create-a-pencil-sketch-logo-online-719.html", "✏️", "pencil sketch logo"),
    createTextEffectCommand("starzodiac", "https://en.ephoto360.com/create-star-zodiac-wallpaper-mobile-604.html", "🌟", "star zodiac wallpaper"),
    createTextEffectCommand("floralluxury", "https://en.ephoto360.com/floral-luxury-logo-collection-for-branding-616.html", "🌺", "floral luxury logo"),
    createTextEffectCommand("hackerneon", "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html", "🕵️", "hacker neon avatar"),
    createTextEffectCommand("neondevil", "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html", "😈", "neon devil wings text effect"),
    createTextEffectCommand("crack3d", "https://en.ephoto360.com/create-3d-crack-text-effect-online-704.html", "💥", "3D crack text effect"),
    createTextEffectCommand("scifilogo", "https://en.ephoto360.com/create-a-awesome-logo-sci-fi-effects-492.html", "🤖", "sci-fi logo"),
    createTextEffectCommand("sandwriting", "https://en.ephoto360.com/create-a-summery-sand-writing-text-effect-577.html", "🏖️", "sand writing text effect"),
    createTextEffectCommand("letterlogo", "https://en.ephoto360.com/create-letter-logos-online-for-free-545.html", "🔤", "letter logo"),
    createTextEffectCommand("gamingmascot", "https://en.ephoto360.com/create-a-gaming-mascot-logo-free-560.html", "🎮", "gaming mascot logo")
];