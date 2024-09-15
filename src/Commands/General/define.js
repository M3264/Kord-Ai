const axios = require('axios');

module.exports = {
  usage: ["define"],
  desc: "Get the definition of a word from Urban Dictionary.",
  commandType: "Utility",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "📖",

  async execute(sock, m, args) {
    const q = args[0];
    if (!q) {
      await kord.reply(m, 'What do you want to define?');
      return;
    }

    try {
      const response = await axios.get(`http://api.urbandictionary.com/v0/define?term=${q}`);
      const targetfine = response.data.list[0];

      if (!targetfine) {
        await kord.reply(m, 'No definition found.');
        return;
      }

      const reply = `
*📃 Word:* ${q}
*📜Definition:* ${targetfine.definition.replace(/\[/g, "").replace(/\]/g, "")}
*🔹Example:* ${targetfine.example.replace(/\[/g, "").replace(/\]/g, "")}
      `;

      await kord.reply(m, reply);
    } catch (error) {
      console.error('Error fetching definition:', error.message);
      await kord.reply(m, `Failed to fetch definition. Please try again later.\nError: ${error.message}`);
    }
  }
};
