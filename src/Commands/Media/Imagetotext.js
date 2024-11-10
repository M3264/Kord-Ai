const Tesseract = require('tesseract.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = {
  usage: ["itt", "imageToText"],
  desc: "Converts an image to text using Tesseract",
  commandType: "Utility",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: '🖼️',

  async execute(sock, m, args) {
    let imageUrl;

    if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage) {
      // If the message is a quoted image
      const media = await sock.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage);
      const imagePath = path.join(__dirname, 'temp_image.jpg');
      fs.writeFileSync(imagePath, media);
      imageUrl = imagePath;
    } else if (args.length > 0) {
      // If an image URL is provided as an argument
      imageUrl = args[0];
    } else {
      return sock.sendMessage(m.key.remoteJid, { text: "Please provide an image URL or quote an image." });
    }

    try {
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
        logger: m => console.log(m)
      });

      sock.sendMessage(m.key.remoteJid, { text: `Extracted Text: ${text}` });

      // Clean up the temporary image file if it was created
      if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage) {
        fs.unlinkSync(imageUrl);
      }
    } catch (error) {
      console.error(error);
      sock.sendMessage(m.key.remoteJid, { text: `An error occurred while processing the image. ${error.message}` });
    }
  }
};
