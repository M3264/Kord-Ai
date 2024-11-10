const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_STICKER_FILE_SIZE_MB = 10; // Set your desired limit

module.exports = {
  usage: ["s", "sticker"],
  desc: "Convert Your images to stickers.",
  commandType: "Convert",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "✨", // Emoji for download

  async execute(sock, m, args) {
    try {
      const quoted = await kord.getQuotedMedia(m);
      const caption = await kord.getCaptionMessage(m);
      const messageType = await kord.getMessageType(m);
      const quotedMessageType = await kord.getQuotedMessageType(m);

      const validImageTypes = ['imageMessage'];
      const validVideoTypes = ['videoMessage'];

      let mediaType;

      if (!quoted && !caption && !validImageTypes.includes(messageType) && !validVideoTypes.includes(messageType) && !validImageTypes.includes(quotedMessageType) && !validVideoTypes.includes(quotedMessageType)) {
        await kord.reply(m, 'Please reply to an image or video to convert to a sticker.');
        await kord.react(m, '❌'); // React with an 'X' for invalid input
        return;
      }

      let mediabuff;
      let fileSizeMB = null; // Initialize fileSizeMB to null

      if (quoted) {
        const quotedMedia = await kord.downloadQuotedMedia(m);
        if (quotedMedia) {
          mediabuff = quotedMedia.buffer;
          mediaType = quotedMedia.type === 'imageMessage' ? 'image' : 'video';
          fileSizeMB = await kord.getFileSizeInMB(m); // Get file size if quoted
        }
      } else if (caption) {
        const mediaMsg = await kord.downloadMediaMsg(m);
        if (mediaMsg) {
          mediabuff = mediaMsg.buffer;
          mediaType = mediaMsg.type === 'imageMessage' ? 'image' : 'video';
          fileSizeMB = await kord.getFileSizeInMB(m); // Get file size if caption
        }
      } else if (validImageTypes.includes(messageType) || validVideoTypes.includes(messageType)) {
        const mediaMsg = await kord.downloadMediaMsg(m);
        if (mediaMsg) {
          mediabuff = mediaMsg.buffer;
          mediaType = messageType === 'imageMessage' ? 'image' : 'video';
          fileSizeMB = mediabuff.length / (1024 * 1024); // Calculate file size directly from buffer
        }
      }

      if (mediabuff) {
        if (fileSizeMB > MAX_STICKER_FILE_SIZE_MB) {
          await kord.reply(m, `Media is too large to process. Maximum allowed size is ${MAX_STICKER_FILE_SIZE_MB} MB.`);
          await kord.react(m, '❌'); // React with an 'X' for file size error
          return;
        }


        await kord.react(m, '⏳'); // Processing reaction

        const tempDir = path.join('./temp');
        fs.mkdirSync(tempDir, { recursive: true }); // Ensure temp directory exists

        const timestamp = Date.now(); 
        const tempFilePath = path.join(tempDir, `temp_media_${timestamp}.${mediaType === 'image' ? 'jpg' : 'mp4'}`); 
        const outputFilePath = path.join(tempDir, `sticker_${timestamp}.webp`);

        fs.writeFileSync(tempFilePath, mediabuff);

        if (mediaType === 'image') {
          // For images: Handle transparency, optimize for size
          ffmpegCommand = `ffmpeg -i "${tempFilePath}" -vcodec libwebp -q:a 100 -lossless 0 -compression_level 6 -preset default -loop 0 -vf "scale=512:512:flags=lanczos,setsar=1" -y "${outputFilePath}"`;
      } else if (mediaType === 'video') {
          // For videos: Optimize for WebP, add metadata for animated stickers
          ffmpegCommand = `ffmpeg -i "${tempFilePath}" -vcodec libwebp -q:a 100 -preset picture -loop 0 -metadata:s:v:0 alpha_mode=1 -vf "scale=512:512:flags=lanczos,setsar=1,fps=15" -y "${outputFilePath}"`;
      }

        

        exec(ffmpegCommand, async (error) => {
            if (error) {
                console.error("FFmpeg error:", error.message);
                await kord.reply(m, 'Failed to create sticker. Please try again later.');
                await kord.react(m, '❌');
            } else {
                const stickerBuffer = fs.readFileSync(outputFilePath);
                await kord.sendSticker(m, stickerBuffer);
                await kord.react(m, '✅'); 
            }
            
            // Clean up temporary files regardless of success or failure
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(outputFilePath);  
        });
    }
} catch (error) {
    console.error("Error executing Sticker command:", error.message);
    await kord.reply(m, `Failed to create sticker. Please try again later.`);
    await kord.react(m, '❌');
}
}
};