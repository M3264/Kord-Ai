const fetch = require('node-fetch');

module.exports = {
  usage: ["bible"],
  desc: "Fetches Bible Verses",
  commandType: "Religion",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: '✝️',
  
  async execute(sock, m, args) {
    try {
      const text = args.join(" ");
      const BASE_URL = "https://bible-api.com";

      // Extract the chapter number or name from the command text.
      let chapterInput = text.trim();
      if (!chapterInput) {
        throw new Error(`Please specify the chapter number or name. Example: .bible john 3:16`);
      }

      // Encode the chapterInput to handle special characters
      chapterInput = encodeURIComponent(chapterInput);

      // Make an API request to fetch the chapter information.
      let chapterRes = await fetch(`${BASE_URL}/${chapterInput}`);
      if (!chapterRes.ok) {
        throw new Error(`Failed to fetch Bible verse. Please check your input and try again.`);
      }

      let chapterData = await chapterRes.json();

      // Prepare the response message
      let bibleChapter = `
📖 *The Holy Bible*\n
📜 *Verse: ${chapterData.reference}*\n
Translation: ${chapterData.translation_name}\n
🔮 *Verse Content:*\n
${chapterData.text.trim()}\n\n
> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™
      `;

      // Send the message back to the user
      await kord.reply(m, bibleChapter);
      
    } catch (error) {
      console.error('Error in bible command:', error);
      await kord.reply(m, `Error: ${error.message}`);
    }
  }
};