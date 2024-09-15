const { tiny, fancytext, listall } = require('../../Plugin/style-font');

module.exports = {
  usage: ["fancy", "font"],
  desc: "Change the font of a given text",
  commandType: "Font",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,
  emoji: "✍️",
  async execute(sock, m, args) {
    try {
      // Ensure arguments exist
      if (args.length === 0) {
        let texxt = "Fancy text generator\n\nExample: .fancy 32 KORD\n\n";
        listall("Kord-Ai").forEach((txt, num) => {
          texxt += `${num + 1} ${txt}\n`;
        });
        return await sock.sendMessage(m.key.remoteJid, { text: texxt });
      }

      const text = args.join(" "); // Join the args to handle spaces in the input
      const num = parseInt(text.split(" ")[0], 10); // Extract the number

      // Check if the first part of the text is a number
      if (isNaN(num)) {
        return await sock.sendMessage(m.key.remoteJid, { text: "Please provide a valid font size number." });
      }

      const fancyTextResult = await fancytext(text.slice(text.indexOf(' ') + 1), num); // Slice the input after the number
      return await sock.sendMessage(m.key.remoteJid, { text: fancyTextResult });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(m.key.remoteJid, { text: "An error occurred while processing the fancy text." });
    }
  }
};