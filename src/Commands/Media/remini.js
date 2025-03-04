const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const mime = require('mime-types');

module.exports = {
  usage: ["enhance", "hd", "remini"],
  desc: "Enhance an image using AI.",
  commandType: "Utility",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "✨",
  async execute(sock, m, args, kord) {
    try {
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const mediaMsg = quotedMsg?.imageMessage || m.message?.imageMessage;
      if (!mediaMsg) {
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react("🚫");
          return await kord.sendErr(null, { context: "Image Enhance", info: "No image provided for enhancement" });
        } else {
          return await sock.sendMessage(m.key.remoteJid, { text: '❌ Please reply to or send an image to enhance it.' });
        }
      }
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🔧");
      } else {
     //   await sock.sendMessage(m.key.remoteJid, { text: '🛠️ Enhancing the image, please wait...' });
      }
      const mediaBuffer = await downloadMediaMessage(
        { message: quotedMsg || m.message },
        'buffer',
        { logger: sock.logger }
      );
      if (!mediaBuffer || mediaBuffer.length === 0) {
        if (global.settings?.INVINCIBLE_MODE) {
          await kord.react("🚫");
          return await kord.sendErr(null, { context: "Image Enhance", info: "Failed to download media" });
        } else {
          return await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed to download the image.' });
        }
      }
      const mimeType = mediaMsg.mimetype;
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        return await sock.sendMessage(m.key.remoteJid, { text: '❌ Only JPG, JPEG, PNG, and WebP images are supported.' });
      }
      const formData = new FormData();
      formData.append('image', mediaBuffer, { filename: 'image.jpg', contentType: mimeType });
      formData.append('scale', '2');
      const headers = {
        'authority': 'api2.pixelcut.app',
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': '',
        'origin': 'https://www.pixelcut.ai',
        'referer': 'https://www.pixelcut.ai/',
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'x-client-version': 'web',
        ...formData.getHeaders()
      };
      const response = await axios.post("https://api2.pixelcut.app/image/upscale/v1", formData, { headers, maxBodyLength: Infinity });
      if (!response.data || !response.data.result_url) {
        console.error("Pixelcut API Response:", response.data);
        throw new Error("Failed to get upscaled image URL from Pixelcut API");
      }
      const upscaledImageUrl = response.data.result_url;
      await sock.sendMessage(m.key.remoteJid, { image: { url: upscaledImageUrl }, caption: '> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™' }, { quoted: m });
    } catch (error) {
      console.error('Error in enhance command:', error);
      if (global.settings?.INVINCIBLE_MODE) {
        await kord.react("🚫");
        await kord.sendErr(error, { context: "Image Enhance", query: args.join(" ") });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Oops! Something went wrong.\n\nError: ${error.message}` });
      }
    }
  }
};