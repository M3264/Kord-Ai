const emojis = {
    info: '✨',
    repo: '🥰',
    star: '🌟',
    fork: '🔱',
    contributors: '🤝',
    error: '🚨',
    language: '🔠',
    issues: '🔍',
    lastUpdate: '🕒',
    license: '📜',
    owner: '👑',
    allContributors: '👥'
};

const fetch = require('node-fetch');
const moment = require('moment');

module.exports = {
    usage: ["repo"],
    desc: "Displays detailed information about the bot's GitHub repository.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.repo,
    async execute(sock, m, args, kord) {
        try {
            const repoOwner = "M3264";
            const repoName = "Kord-Ai";
            const apiUrl = `https://api.github.com/repos/M3264/Kord-Ai`;
            const contributorsUrl = `${apiUrl}/contributors`;
            const languagesUrl = `${apiUrl}/languages`;

            const [repoResponse, contributorsResponse, languagesResponse] = await Promise.all([
                fetch(apiUrl),
                fetch(contributorsUrl),
                fetch(languagesUrl)
            ]);

            const [repoData, contributorsData, languagesData] = await Promise.all([
                repoResponse.json(),
                contributorsResponse.json(),
                languagesResponse.json()
            ]);

            const lastUpdateDate = moment(repoData.updated_at).format('MMMM Do YYYY, h:mm:ss a');

            const repoInfoMessage = `
╔═══ *ᴋᴏʀᴅ-ᴀɪ ʀᴇᴘᴏsɪᴛᴏʀʏ* ═══╗

${emojis.repo} *Link:* "https://gitHub.com/M3264/Kord-Ai"
${emojis.info} *Description:* "Introducing Kord-Ai, A WhatsApp bot that automates interactions on WhatsApp by executing predefined commands or responding to user inputs. It can handle tasks like sending messages, sharing media, and managing group activities, offering convenience and efficiency for users and businesses."

${emojis.lastUpdate} *Last Updated:* ${lastUpdateDate}

> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™

╚════════════════════╝
`;

            await kord.reply(repoInfoMessage);
        } catch (error) {
            await kord.react(emojis.error);
            await kord.reply("🚨 An error occurred while fetching repository information.");
            console.error("Error in 'repo' command:", error);
        }
    }
};