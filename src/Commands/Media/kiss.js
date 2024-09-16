const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

module.exports = {
    usage: ["animekiss", "kiss"],
    desc: "Fetch and send a random anime wallpaper.",
    commandType: "Anime",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🍁",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const gifPath = path.join(__dirname, 'temp.gif');
        const mp4Path = path.join(__dirname, 'temp.mp4');

        try {
            // Notify user the image is being fetched
            kord.react(m, '🍁');
            
            const waifudd = await axios.get(`https://api.waifu.pics/sfw/kiss`);

            if (!waifudd.data.url) {
                return await global.kord.reply(m, '❌ Failed to fetch the wallpaper.');
            }

            const imageUrl = waifudd.data.url;
            const fileExtension = imageUrl.split('.').pop(); // Get the file extension

            if (fileExtension === 'gif' || fileExtension === 'GIF') {
                // Fetch GIF URL and data
                const { data: gifBuffer } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(gifPath, Buffer.from(gifBuffer));

                // Convert GIF to MP4
                await new Promise((resolve, reject) => {
                    ffmpeg(gifPath)
                        .output(mp4Path)
                        .noAudio()
                        .videoCodec('libx264')
                        .size('320x240')
                        .outputOptions('-pix_fmt yuv420p')
                        .outputOptions('-t 5')
                        .on('end', resolve)
                        .on('error', reject)
                        .run();
                });

                // Send the converted MP4
                const mp4Buffer = fs.readFileSync(mp4Path);
                await sock.sendMessage(jid, {
                    video: mp4Buffer,
                    mimetype: 'video/mp4',
                    caption: '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™',
                    gifPlayback: true
                });

                // Clean up
                fs.unlinkSync(gifPath);
                fs.unlinkSync(mp4Path);
            } else if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'JPG' || fileExtension === 'JPEG') {
                // Send image if the URL ends with .jpg or .jpeg
                await global.kord.sendImage(m, imageUrl, '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™');
            } else {
                await global.kord.reply(m, '❌ Unsupported file type.');
            }
        } catch (error) {
            console.error('Error fetching or sending media:', error.message);
            await global.kord.reply(m, `❌ An error occurred: ${error.message}`);
        }
    }
};