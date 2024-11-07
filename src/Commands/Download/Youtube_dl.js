const gifted = require('gifted-dls');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    usage: ["youtube", "yt", "ytmp4"],
    desc: "Download YouTube videos.",
    commandType: "Download",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "🎥",

    async execute(sock, m, args) {
        try {
            const url = args[0];
            if (!url) return await kord.reply(m, "🔗 Please provide a YouTube video URL.");

            // Get download URL using gifted-dls
            const data = await gifted.giftedytmp4(url);
            if (!data || !data.result.download_url) throw new Error('Download URL not found');

            // Create temp directory if it doesn't exist
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempPath = path.join(tempDir, `video_${Date.now()}.mp4`);

            // Download video using axios
            const response = await axios({
                method: 'GET',
                url: data.result.download_url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(tempPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Send video with caption
            await kord.sendVideo(m, fs.readFileSync(tempPath), "> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™");

            // Clean up temp file
            fs.unlinkSync(tempPath);

        } catch (error) {
            await kord.reply(m, "❌ Error downloading video. Please try again.");
            
            // Clean up temp file if it exists
            const tempPath = path.join(__dirname, '../../temp', `video_${Date.now()}.mp4`);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }
};