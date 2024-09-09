const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  usage: ["gif", "togif"],
  desc: "Generate GIFs from videos.",
  commandType: "Convert",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "🎬",

  async execute(sock, m, args) {
    try {
      const MAX_FILE_SIZE_MB = 10; // Set your desired limit
      const MAX_GIF_DURATION = 3; // Maximum GIF duration in seconds

      const quoted = await kord.getQuotedMedia(m);
      const messageType = await kord.getMessageType(m);
      const quotedMessageType = await kord.getQuotedMessageType(m);

      const validVideoTypes = ['videoMessage'];

      if (!quoted && !validVideoTypes.includes(messageType) && !validVideoTypes.includes(quotedMessageType)) {
        await kord.reply(m, 'Please reply to a video to generate a GIF.');
        await kord.react(m, '❌');
        return;
      }

      let vidbuff;
      let fileExtension;

      if (quoted) {
        const quotedMedia = await kord.downloadQuotedMedia(m);
        if (quotedMedia) {
          vidbuff = quotedMedia.buffer;
          fileExtension = quotedMedia.extension;
        }
      } else {
        const mediaMsg = await kord.downloadMediaMsg(m);
        if (mediaMsg) {
          vidbuff = mediaMsg.buffer;
          fileExtension = mediaMsg.extension;
        }
      }

      if (vidbuff) {
        const fileSizeMB = await kord.getFileSizeInMB(m);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          await kord.reply(m, `The video is too large to process. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
          await kord.react(m, '❌'); 
          return;
        }

        await kord.react(m, '⏳');

        const tempDir = path.join('./temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }

        const tempFilePath = path.join(tempDir, `temp_video_${Date.now()}.${fileExtension}`);
        const outputFilePath = path.join(tempDir, `gif_${Date.now()}.gif`);

        fs.writeFileSync(tempFilePath, vidbuff);

        const ffmpegCommand = `ffmpeg -ss 00:00:00 -t ${MAX_GIF_DURATION} -i "${tempFilePath}" -vf "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outputFilePath}"`;

        exec(ffmpegCommand, async (error) => {
          if (error) {
            console.error("FFmpeg error:", error.message);
            await kord.reply(m, 'Failed to create GIF. Please try again later.');
            await kord.react(m, '❌');
          } else {
            const gifBuffer = fs.readFileSync(outputFilePath);
            await kord.sendGif(m, gifBuffer, true)
            await kord.react(m, '✅');
          }
          fs.unlinkSync(tempFilePath);
          fs.unlinkSync(outputFilePath);
        });
      }
    } catch (error) {
      console.error("Error generating GIF:", error.message);
      await kord.reply(m, `Failed to create GIF. Please try again later.`);
      await kord.react(m, '❌'); 
    }
  }
};
