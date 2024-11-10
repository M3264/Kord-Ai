const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core')

module.exports = {
    usage: ["trimvideo", "vtrim"],
    desc: "Trim a YouTube video to a specific duration",
    commandType: "Media",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "✂️",

    async execute(sock, m, args) {
        try {
            if (args.length !== 3) {
                return await kord.reply(m, "✂️ Usage: !trimvideo <YouTube URL> <start time> <end time>");
            }

            const [videoUrl, startTime, endTime] = args;

            if (!ytdl.validateURL(videoUrl)) {
                return await kord.reply(m, "❌ Invalid YouTube URL.");
            }

            await kord.reply(m, "⏳ Downloading and trimming video...");

            const info = await ytdl.getInfo(videoUrl);
            const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');

            const tempDir = path.join('./temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const inputPath = path.join(tempDir, `${videoTitle}_input.mp4`);
            const outputPath = path.join(tempDir, `${videoTitle}_trimmed.mp4`);

            await new Promise((resolve, reject) => {
                ytdl(videoUrl, { quality: 'highestvideo' })
                    .pipe(fs.createWriteStream(inputPath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .setStartTime(startTime)
                    .setDuration(endTime)
                    .output(outputPath)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            await kord.sendVideo(m, fs.readFileSync(outputPath), 'video/mp4', `Trimmed: ${videoTitle}.mp4`);

            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            await kord.reply(m, "✅ Video trimmed and sent successfully!");
        } catch (error) {
            console.error(error);
            await kord.reply(m, "❌ An error occurred while trimming the video.");
        }
    }
};