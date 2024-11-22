const FormData = require('form-data');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const os = require('os');
const https = require('https');

async function processImage(imagePath, processingType) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    const apiUrl = `https://inferenceengine.vyro.ai/${processingType}`;
    
    formData.append('model_version', 1, {
      'Content-Transfer-Encoding': 'binary',
      contentType: 'multipart/form-data; charset=utf-8',
    });
    
    formData.append('image', fs.createReadStream(imagePath), {
      filename: 'enhance_image_body.jpg',
      contentType: 'image/jpeg',
    });
    
    const request = https.request(apiUrl, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'okhttp/4.9.3',
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip',
      },
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP error! status: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', reject);
    formData.pipe(request);
  });
}

module.exports = {
    usage: ["enhance", "hd", "remini"],
    desc: "Enhance an image using AI.",
    commandType: "Utility",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: "✨",

    async execute(sock, m, args) {
        let tempFilePath;

        try {
            // Extract media from quoted message using kord.getQuotedMedia
            const mediaData = await global.kord.getQuotedMedia(m);

            // If no media found, return an error
            if (!mediaData) {
                return await global.kord.reply(m, '❌ Please reply to an image to enhance it.');
            }

            // Download the media
            const mediaBuffer = await global.kord.downloadMediaMsg(m);
            if (!mediaBuffer) {
                return await global.kord.reply(m, '❌ Failed to download the media. Try again.');
            }

            // Create a temporary file path
            tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.jpg`);

            // Save the media to a temporary file
            await fsPromises.writeFile(tempFilePath, mediaBuffer);
            console.log("Media saved to:", tempFilePath);

            // Inform the user that the enhancement process has started
            await global.kord.reply(m, '🛠️ Enhancing the image, please wait...');

            // Process the image
            const enhancedImageBuffer = await processImage(tempFilePath, 'enhance');

            if (!enhancedImageBuffer || enhancedImageBuffer.length === 0) {
                throw new Error('Received empty response from the enhancement service');
            }

            // Send the enhanced image to the chat
            await sock.sendMessage(m.key.remoteJid, { image: enhancedImageBuffer, caption: 'Here\'s your enhanced image!' }, { quoted: m });

        } catch (error) {
            console.error('Error in enhance command:', error);
            // Notify the user about the error
            await global.kord.reply(m, `❌ Oops! Something went wrong.\n\nError: ${error.message}`);
        } finally {
            // Clean up: delete the temporary file if it exists
            if (tempFilePath) {
                try {
                    await fsPromises.unlink(tempFilePath);
                    console.log("Temporary file deleted:", tempFilePath);
                } catch (unlinkError) {
                    console.error("Error deleting temporary file:", unlinkError);
                }
            }
        }
    }
};