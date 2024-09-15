module.exports = {
  usage: ["fakebusinessreply"],
  desc: "Send a fake reply as WhatsApp Business",
  commandType: "fun",
  isGroupOnly: false,
  isAdminOnly: false,
  isPrivateOnly: false,

  async execute(sock, m) {
    const fakeBusinessReply = {
      key: {
        fromMe: false,
        remoteJid: '2348160247341@s.whatsapp.net', // Fake business JID (must end with @s.whatsapp.net)
        participant: '2348160247341@s.whatsapp.net', // The WhatsApp Business JID
        id: m.key.id // Using the ID of the original message to quote
      },
      message: {
        conversation: "This is a fake reply from WhatsApp Business.", // The text of the fake reply
      },
      pushName: "Remini", // The name that appears as the sender (WhatsApp Business name)
      messageTimestamp: Math.floor(Date.now() / 1000), // Current timestamp
      status: "VALID", // Ensure it's a valid message
    };

    // Send the crafted fake business reply quoting the original message
    await sock.sendMessage(m.key.remoteJid, fakeBusinessReply, { quoted: m });
  },
};