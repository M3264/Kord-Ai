const emojis = {
    info: '✨',
    repo: '📘',
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
    async execute(sock, m) {
        try {
            const repoOwner = "M3264";
            const repoName = "Kord-Ai";
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
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

            const topContributors = contributorsData
                .slice(0, 5)
                .map((c, index) => `${index + 1}. [${c.login}](${c.html_url}) (${c.contributions} commits)`)
                .join("\n");

            const allContributors = contributorsData
                .map(c => `[${c.login}](${c.html_url})`)
                .join(", ");

            const topLanguages = Object.entries(languagesData)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([lang, bytes]) => `${lang} (${(bytes / 1024).toFixed(2)} KB)`)
                .join(", ");

            const lastUpdateDate = moment(repoData.updated_at).format('MMMM Do YYYY, h:mm:ss a');

            const repoInfoMessage = `
╔══════════ *ᴋᴏʀᴅ-ᴀɪ ʀᴇᴘᴏsɪᴛᴏʀʏ* ══════════╗

${emojis.repo} *Name:* [${repoData.name}](${repoData.html_url})
${emojis.info} *Description:* ${repoData.description || "No description available."}

${emojis.owner} *Owner:* [${repoData.owner.login}](${repoData.owner.html_url})
${emojis.star} *Stars:* ${repoData.stargazers_count.toLocaleString()}
${emojis.fork} *Forks:* ${repoData.forks_count.toLocaleString()}
${emojis.issues} *Open Issues:* ${repoData.open_issues_count.toLocaleString()}

${emojis.language} *Top Languages:* ${topLanguages}
${emojis.license} *License:* ${repoData.license ? repoData.license.name : "Not specified"}
${emojis.lastUpdate} *Last Updated:* ${lastUpdateDate}

${emojis.contributors} *Top Contributors:*
${topContributors}

${emojis.allContributors} *All Contributors:*
${allContributors}

✨ *Made with 💖 by the MIRAGE community*

╚═══════════════════════════════════════╝
`;

            await kord.reply(m, repoInfoMessage);
        } catch (error) {
            await kord.react(m, emojis.error);
            await kord.reply(m, "🚨 An error occurred while fetching repository information.");
            console.error("Error in 'repo' command:", error);
        }
    }
};