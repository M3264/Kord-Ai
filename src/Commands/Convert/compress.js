const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

module.exports = {
    usage: 'compress',
    description: 'Compress images or videos.',
    emoji: "⏳",
    execute: async (sock, m, args, kord) => {
    try {
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return await kord.reply("*_reply to an image or video_*")
    
        let mediaBuffer, fileExtension, tempFilePath;
        if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage) {
            const quotedMedia = await kord.downloadQuotedMedia(m);
            if (quotedMedia) {
                mediaBuffer = quotedMedia.buffer;
                fileExtension = quotedMedia.extension;
            } else {
                return await kord.reply("_Failed to download the quoted media._");
            }
        } else {
            const mediaMsg = await kord.downloadMediaMsg(m);

            if (mediaMsg) {
                mediaBuffer = mediaMsg.buffer;
                fileExtension = mediaMsg.extension;
            } else {
                return await kord.reply("_failed to download the media._");
            }
        }
        if (!fileExtension.match(/(jpg|jpeg|png|webp|mp4|mkv|avi)/)) {
            return await kord.reply("_*Only images and videos are supported for compression.*_");
        }
        tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.${fileExtension}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        const outputFilePath = path.join(os.tmpdir(), `compressed_${Date.now()}.${fileExtension}`);
        try {
            if (fileExtension.match(/(jpg|jpeg|png|webp)/)) {
                await sharp(tempFilePath)
                    .resize({ width: 800 })
                    .jpeg({ quality: 60 })
                    .toFile(outputFilePath);
                await sock.sendMessage(m.key.remoteJid, { image: fs.readFileSync(outputFilePath), caption: '> compressed image..._' }, { quoted: m });
            } else if (fileExtension.match(/(mp4|mkv|avi)/)) {
                await kord.reply("*_Compressing video..._* This might take minutes.");
                
                await new Promise((resolve, reject) => {
                    ffmpeg(tempFilePath)
                        .outputOptions([
                            '-c:v libx264',
                            '-preset faster',
                            '-crf 28',
                            '-b:v 500k',
                            '-maxrate 800k',
                            '-bufsize 1200k',
                            '-vf scale=-2:480',
                            '-c:a aac',
                            '-b:a 96k'
                        ])
                        .save(outputFilePath)
                        .on('end', resolve)
                        .on('error', reject);
                });

                await sock.sendMessage(m.key.remoteJid, { video: fs.readFileSync(outputFilePath), caption: '> compressed video..' }, {quoted: m });
            }
        } catch (error) {
            return await kord.reply(`Compression failed: ${error.message}`);
        } finally {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
        }
    } catch (e) {
    console.error(e)
    await kord.send(`${e}`)
    }
    }
};