const axios = require('axios');
const fs = require('fs');
const path = require('path');
module.exports = {
  usage: ["apk", "app"],
  desc: "Search and download APKs from Aptoide.",
  commandType: "Download",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "📲",

  async execute(sock, m, args) {
    try {
      const query = args.join(' ');
      if (!query) {
        await kord.reply(m, 'Please provide an app name to search.');
        return;
      }
      await kord.react(m, '🔎');
      const apiKey = '582fc39fae4c5e14ae'; // Replace with your actual API key
      const searchUrl = `https://api.maher-zubair.xyz/downloader/apk?apikey=${apiKey}&q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const appData = response.data.result;

      const downloadPromptText = `
╭━━ 📥 *Download APK*

┃📲 *App:* ${appData.name}
┃📏 *Size:* ${appData.size}
┃📅 *Last Updated:* ${appData.lastup}
┃📦 *Package:* ${appData.package}

╰━━━
⚠️ *Disclaimer:* Downloading APKs from unknown sources can be risky. Only download apps from trusted sources.
Downloading App...
`;

      const fontBeauty = await kord.changeFont(downloadPromptText, 'smallBoldScript');
      const finishText = `
╭━━ 📥 Downloaded APK 📥 
┃                                          
┃ 📲 \`App\`:     ${appData.name}
┃ 📏 \`Size\`:    ${appData.size}
┃ 📅 \`Updated\`: ${appData.lastup}
┃ 📦 \`Package\`: ${appData.package}
┃                                          
╰━━━
`;
      const fontBeautyTwo = await kord.changeFont(finishText, 'smallBoldScript');

      await kord.react(m, '👍');
      const sentMessage = await kord.sendImage(m, appData.icon, fontBeauty);

      await kord.react(m, '🧩');
      const maxdlSize = 70

      if (parseFloat(appData.size.split(' ')[0]) <= maxdlSize) {
        const downloadUrl = appData.dllink;
        await kord.reply(m, `Downloading ${appData.name}...`);
        await kord.react(m, '⬇️');

        const downloadResponse = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream',
        });

        const downloadFileName = `${appData.name}.apk`;
        const downloadsDir = path.join('./temp');
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir);
        }
        const filePath = path.join('./temp', downloadFileName);
        const writer = fs.createWriteStream(filePath);

        downloadResponse.data.pipe(writer);

        writer.on('finish', async () => {
          console.log(`Downloaded ${downloadFileName}`);
          await kord.react(m, '⬆️');
          await kord.sendDocument(m, filePath, 'application/vnd.android.package-archive', `${appData.name}.apk`, fontBeautyTwo);
          fs.unlinkSync(filePath);
          await kord.react(m, '👍');
        });

        writer.on('error', (err) => {
          kord.react(m, '🚫');
          console.error('Error downloading file:', err);
          kord.reply(m, `Failed to download ${appData.name}. Please try again later. ${err.message}`);
        });
      } else {
        kord.react(m, '🤚');
        await kord.reply(m, `Cannot download ${appData.name}. File size exceeds maximum allowed size.`);
      }
    } catch (error) {
      console.error("Error executing APK command:", error.message);
      await kord.reply(m, `Failed to fetch APK information. Please try again later. ${error.message}`);
    }
  }
};