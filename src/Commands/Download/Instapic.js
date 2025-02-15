const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    usage: ["instapic", "igpic", "instadlpic"],
    desc: "Download Instagram pictures",
    commandType: "General",
    isGroupOnly: false,
    isAdminOnly: false,
    emoji: "📥",

    async execute(sock, m, args, kord) {
        if (!args[0]) {
          await kord.react("❌");
          if (global.settings?.INVINCIBLE_MODE) {
            await kord.sendErr('No query', {
                context: "Instagram Command",
                text: "No query Provided"
              });
          } else {
            return await kord.reply('Please provide an Instagram post URL to download.');
        }
        return;
        }

        const url = args[0];

        try {
            const apiUrl = `https://ironman.koyeb.app/ironman/v3/dl/insta?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (!data) {
              await kord.react("❌");
              if (global.settings?.INVINCIBLE_MODE) {
              await kord.sendErr(data, {
                context: "Instagram Command",
                query: args[0]
              });
              } else {
                return await kord.reply('_*Unknown Error!*_');
            }
            return;
            }
            
            var title = data.title || "Instagram Media";
            const downloadUrl = data.downloadUrls[0] || data.thumbnail;
            
            if (!downloadUrl) {
              if (global.settings?.INVINCIBLE_MODE) {
                await kord.sendErr(data, {
                context: "Instagram Command",
                query: args[0],
                err: "no downloadUrl gotten"
              });
              } else {
              return await kord.react("❌");
            }
            return;
            }

            // Fetch the media content
            const mediaResponse = await fetch(downloadUrl);
            if (!mediaResponse.ok) {
              await kord.react("❌");
              if (global.settings?.INVINCIBLE_MODE) {
                await kord.sendErr("Download Failed!", {
                context: "Instagram Command",
                query: args[0],
                mediaresponse: mediaResponse || "No found!"
              });
              } else {
                return await kord.reply('❌ Failed to download the image from Instagram.');
            }
            return;
            }

            const mediaBuffer = await mediaResponse.buffer();
            const fileName = `instagram_${Date.now()}.jpg`;
            const filePath = path.join(__dirname, '../tmp/', fileName);

            // Ensure the directory exists
            try {
                await fs.access(path.dirname(filePath));
            } catch {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
            }

            // Write the file to the temporary directory
            await fs.writeFile(filePath, mediaBuffer);

            // Send the image with the specific caption
            await kord.sendImage(filePath, `${title} \n\n> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`);

            // Clean up the file after sending
            await fs.unlink(filePath);

        } catch (error) {
            console.error('Error in Instagram downloader command:', error);
            await kord.react("❌");
              if (global.settings?.INVINCIBLE_MODE) {
                await kord.sendErr(error, {
                context: "Instagram Command",
                query: args[0],
              });
              } else {
            await kord.reply('❌ An error occurred while downloading the Instagram image.');
        }
    }
    }
}