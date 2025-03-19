const { getData, storeData } = require("../../Database/syncdb")

var mData = {
  active: false,
  action: "",
  emoji: "🤍",
  text: ""
};
(async function() { 
if (!await getData("mention_config")) {
    await storeData("mention_config", JSON.stringify(mData, null, 2));
    }
})();

module.exports = {
  usage: "mention",
  on: "text",
  description: "action is done when the owner is mentioned",
  commandType: "User",
  isOwnerOnly: true,
  emoji: "⏳",
  
  execute: async (sock, m, args, kord) => {
    try {
      if (args && args.length > 0) {
  const option = args[0].toLowerCase();
  const value = args.length > 1 ? args[1] : null;
  const fArgs = args.slice(1).join(" ")
    if (option === "off")  {
      mData.active = false;
      await storeData('mention_config', JSON.stringify(mData, null, 2))
      return settings.INVINCIBLE_MODE ? await kord.react("✅") : await kord.reply("_Mention Action Has Been Turned Off!_");
       } else if (option === "-status" || option === "status") {
          var info = await getData('mention_config')
          return kord.reply(`*Mention Status:*\n\n \`\`\`Active: ${info.active}\nAction: ${info.action}\nEmoji: ${info.emoji}\nText: ${info.text}\`\`\``)
        } else if (option === "-react" || option === "react") {
          var emoji = value
          mData.active = true;
          mData.action = "react";
          mData.emoji = emoji
          await storeData('mention_config', JSON.stringify(mData, null, 2))
          return settings.INVINCIBLE_MODE ? await kord.react("✅") : await kord.reply(`_Query Saved!_`);
        } else if (option === "-text"  || option === "text") {
          var sentText = fArgs
          mData.active = true;
          mData.action = "text";
          mData.text = sentText;
          await storeData('mention_config', JSON.stringify(mData, null, 2))
          return settings.INVINCIBLE_MODE ? await kord.react("✅") : await kord.reply(`_Query Saved!_`);
        } else {
          return settings.INVINCIBLE_MODE ? await kord.react("❌") : await kord.reply(`_*Invalid Option!!!*_

_*Provide an Option*_
_.mention off_
_.mention -status_
_.mention -react 🤍_ (reacts when the owner is mentioned)
_.mention -text Your Text_ (sends custom text when owner is mentioned, Example: \'Your Text \')`);
        }
      } else {
        return settings.INVINCIBLE_MODE ? await kord.react("❌") : await kord.reply(`_ *Provide an Option*_
_.mention off_
_.mention -status_
_.mention -react 🤍_ (reacts when the owner is mentioned)
_.mention -text Your Text_ (sends custom text when owner is mentioned, Example: \'Your Text \')`);
      }
    } catch (e) {
    console.error(e)
    kord.send(`${e}`)
  } 
  },
   
  async onText(sock, m, text, kord) {
    try {
      const ownerNumber = settings.OWNER_NUMBERS;
            const ownerJid = `${ownerNumber}@s.whatsapp.net`;
            const senderNumber = m.key.fromMe 
            ? sock.user.id.split(':')[0]
            : m.key.participant 
            ? m.key.participant.split('@')[0]
            : m.key.remoteJid.split('@')[0];
            const isOwner = settings.OWNER_NUMBERS === senderNumber;
            
          var MData = await getData("mention_config");
          if (!MData.active) {
            return;
          }
          var jidd = m.key.remoteJid
          if (text.includes(ownerNumber) || text.includes(ownerJid)) {
            if (MData.action === "react") {
            var pEmoji = MData.emoji
            return await sock.sendMessage(jidd, { react: { text: pEmoji, key: m.key } })
            } else if (MData.action === "text") {
              var pText = MData.text
              return await sock.sendMessage(jidd, { text: pText }, { quoted: m })
            }
          
          }
    } catch (err) {
      console.error(err)
    }
  }
  
}