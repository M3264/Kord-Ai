const { storeData, getData } = require("../../Database/syncdb");
const fs = require("fs")
const path = require('path')
var areact = {
    active: false,
    global: false,
    activeChats: [
        '1234@g.us'
    ],
}

if (!getData("areact_config")) {
     storeData("areact_config", JSON.stringify(areact, null, 2));
    }

module.exports = {
    usage: ['areact', 'autoreaction'],
    on: "all",
    description: 'auto reacts on messages in chats',
    commandType: 'Utitlity',
    isOwnerOnly: true,
    emoji: '💫',

    execute: async(sock, m, args, kord) => {
        try {
            if (args && args.length > 0) {
                const option = args[0].toLowerCase();
                const value = args.length > 1 ? args[1] : null;
                const fArgs = args.slice(1).join(" ")
        if (option === 'on' && value === 'global') {
            areact.global = true;
            await storeData('areact_config', JSON.stringify(areact, null, 2))
            return settings.INVINCIBLE_MODE ? await kord.react('✅') : await kord.reply('_*Auto React Has Benn Enabled Globally!*_')
        } else if (option === 'off' && value === 'global') {
            areact.global = false;
            await storeData('areact_config', JSON.stringify(areact, null, 2))
            return settings.INVINCIBLE_MODE ? await kord.react('✅') : await kord.reply('_*Auto react Has been disabled globally*_')
        } else if(option === 'on') {
      areact.active = true;
      areact.activeChats.push(m.key.remoteJid)
      await storeData('areact_config', JSON.stringify(areact, null, 2))
      return settings.INVINCIBLE_MODE ? await kord.react('✅') : await kord.reply('_*Auto react Has been Enabled for this group!*_\n\n> Use \`.areact global\` to turn on for all groups')
    } else if (option === 'off') {
      
      areact.activeChats = areact.activeChats.filter(jid => jid !== m.key.remoteJid);
      await storeData('areact_config', JSON.stringify(areact, null, 2))
      return settings.INVINCIBLE_MODE ? await kord.react('✅') : await kord.reply('_*Auto react Has been disabled for this group!*_\n\n> Use \`.areact off global\` to turn on for all groups')
    } else if(option === "status") {
      var sareact = await getData('areact_config')
      var actif = sareact.active
      var sglobal = sareact.global
     var sactifChat = new Set(sareact.activeChats || []);
      var sactiveChats = sactifChat.has(m.key.remoteJid)
      await kord.reply(`_*AUto React Settings*_\n\n\`\`\`Acive: ${actif}\nGlobal?: ${sglobal}\nActive Here?:${sactiveChats}\`\`\``)
    } else {
      kord.reply(`_*Choose A Valid Option!!*_
      
_*Avaliable Options:*_
\`.areact on\` (to turn on for the present chat)
\`.areact on global\` global (to turn on for all chats)
\`.areact off\` (to turn off for the present chat)
\`.areact off global\` (to turn off for all chats)
\`.areact status\` (to view rhe settings for the present chat)`)
    }
            } else {
kord.reply(`_*Avaliable Options:*_
\`.areact on\` (to turn on for the present chat)
\`.areact on global\` global (to turn on for all chats)
\`.areact off\` (to turn off for the present chat)
\`.areact off global\` (to turn off for all chats)
\`.areact status\` (to view rhe settings for the present chat)`)
            }
    } catch(err) {
        console.error(err)
        kord.send(`${err}`)
    }
 },
 
 
 async onAll(sock, m, kord) {
 if (!await getData("areact_config")) {
    await storeData("areact_config", JSON.stringify(areact, null, 2));
    }
   const ePath = path.join(__dirname, 'emojis.json');
     const emojiList = JSON.parse(fs.readFileSync(ePath, 'utf-8')).emojis;
    const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
   const presentJid = m.key.remoteJid
   var aReact = await getData('areact_config')
   var activeChats = new Set(aReact.activeChats || []);
   if (!activeChats.has(presentJid) && !aReact.global) {
     return;
   } else if (activeChats.has(presentJid) && !aReact.global) {
    await kord.react(randomEmoji);
   } else if (aReact.global) {
     await kord.react(randomEmoji)
   }
 }
}

