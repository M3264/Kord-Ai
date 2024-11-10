const fetch = require('node-fetch');

module.exports = {
    usage: ['telegramstalk', 'stalktelegram'],
    desc: "Stalk a Telegram user, group, or channel and get their info",
    commandType: "stalk",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🗺️",
    
    async execute(sock, m, args) {
        if (!args[0]) return kord.freply(m, `Please provide a valid Telegram username and type (user/group/channel).\n\nExample: ${global.settings.PREFIX[0]}telegramstalk korretdesigns | user`);

        // Split the input into username and type
        const input = args.join(' ').split('|').map(item => item.trim());
        const username = input[0].startsWith('@') ? input[0].substring(1) : input[0];
        const type = input[1] ? input[1].toLowerCase() : 'user';

        // Validate type
        if (!['user', 'group', 'channel'].includes(type)) {
            return kord.freply(m, `Invalid type. Please specify 'user', 'group', or 'channel'.\n\nExample: ${global.settings.PREFIX[0]}telegramstalk korretdesigns | user`);
        }

        const url = `https://itzpire.com/stalk/telegram?username=${username}&type=${type}`;

        try {
            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success' && result.code === 200) {
                const data = result.data;
                const { photo, name, bio, username } = data;
                
                const message = `
*Telegram Stalk Result:*

📛 *Name:* ${name}
👤 *Username:* ${username}
📝 *Bio:* ${bio}
🖼️ *Profile Photo:* 🫧👆
                `.trim();

                await kord.sendImage(m, { url: photo }, message);
            } else {
                kord.freply(m, `❌ Failed to fetch details for the provided username and type.`);
            }
        } catch (error) {
            console.error(error);
            kord.freply(m, `❌ Failed to fetch Telegram details. Please try again later.`);
        }
    }
};