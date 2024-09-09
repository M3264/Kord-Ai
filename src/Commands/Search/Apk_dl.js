const axios = require('axios');
const fs = require('fs')
const path = require('path')

module.exports = {
    usage: ["apk", "app"],
    desc: "Search and send a stunning image from Google Images.",
    commandType: "Search",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "⬇️", // Emoji for download

    async execute(sock, m, args) {
        try {
            const query = args.join(' ');
            if (!query) {
                await kord.reply(m, 'Please provide an app name to search.');
                return;
            }
            await kord.react(m, '🔎');
            const searchUrl = `https://api.maher-zubair.tech/download/apk?id=${encodeURIComponent(query)}`;
            const response = await axios.get(searchUrl);
            const appData = response.data.result;

            // Prepare the download prompt with aesthetic styling and emojis
            const downloadPromptText = `
╭━━ 📥 *Download APK*

┃📲 *App:* ${appData.name}
┃🔢 *Version:* ${appData.version}
┃📏 *Size:* ${appData.size}
┃📅 *Last Updated:* ${appData.lastup}
┃📦 *Package:* ${appData.package}

╰━━━
⚙️ *Reply with "1" to download this APK.*

⚠️ *Disclaimer:* Downloading APKs from unknown sources can be risky. Only download apps from trusted sources.
`;

const fontBeauty = await kord.changeFont(downloadPromptText, 'smallBoldScript');
// Prepare the download prompt with aesthetic styling and emojis
const finishText = `
╭━━ 📥 Downloaded APK 📥 
┃                                          
┃ 📲 \`App\`:     ${appData.name}
┃ 🔢 \`Version\`: ${appData.version}
┃ 📏 \`Size\`:    ${appData.size}
┃ 📅 \`Updated\`: ${appData.lastup}
┃ 📦 \`Package\`: ${appData.package}
┃                                          
╰━━━
`;
const fontBeautyTwo = await kord.changeFont(finishText, 'smallBoldScript');
            // Send the download prompt message and react with emoji
            await kord.react(m, '👍');
            const sentMessage = await kord.sendImage(m, appData.icon, fontBeauty);
            await kord.react(m, '🤔');
            if (sentMessage) {
                const response = await kord.getResponseText(m, sentMessage, 30000); // wait for user response for 1 minute

                if (response.response.trim() === '1') {
                    await kord.react(m, '🧩');
                    // Check maximum download size from settings
                    const maxdlSize = settings.MAX_DOWNLOAD_SIZE; // Assuming settings is imported and contains MAX_DOWNLOAD_SIZE

                    if (parseFloat(appData.size.split(' ')[0]) <= maxdlSize) {
                        // Perform the download logic here
                        const downloadUrl = appData.dllink;
                        await kord.reply(m, `Downloading ${appData.name}...`);
                        await kord.react(m, '⬇️');
                        // Implement your download logic here, e.g., using axios to download the APK file
                        const downloadResponse = await axios({
                            method: 'get',
                            url: downloadUrl,
                            responseType: 'stream',
                        });

                        // Example: Save the file to disk
                        const downloadFileName = `${appData.name}.apk`;
                        // Ensure the downloads directory exists
                        const downloadsDir = path.join('./temp');
                        if (!fs.existsSync(downloadsDir)) {
                            fs.mkdirSync(downloadsDir);
                        }
                        const filePath = path.join('./temp', downloadFileName); // Adjust the download path as needed
                        const writer = fs.createWriteStream(filePath);

                        downloadResponse.data.pipe(writer);

                        // Handle completion or errors
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
                            kord.reply(m, `Failed to download ${appData.name}. Please try again later.`);
                        });
                    } else {
                        kord.react(m, '🤚');
                        await kord.reply(m, `Cannot download ${appData.name}. File size exceeds maximum allowed size.`);
                    }
                } else {
                    kord.react(m, '❌');
                    await kord.reply(m, 'Download cancelled.');
                }
            }
        } catch (error) {
            console.error("Error executing APK command:", error.message);
            await kord.reply(m, `Failed to fetch APK information. Please try again later.`);
        }
    }
};
