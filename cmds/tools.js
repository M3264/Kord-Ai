/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord,
commands,
wtype,
prefix,
getData,
storeData,
changeFont,
formatTime,
config
} = require("../core/")
const path = require("path")
const fs = require("fs")

const pre = prefix


kord({
  cmd: "setcmd",
  desc: "bind a command to a sticker (whenevrr that stk is sent, the binded command is executed)",
  fromMe: true,
  type: "tools",
}, async (m, text) => {
  try {
  if (!m.quoted.sticker) return await m.send(`_Reply to a sticker with ${prefix}setcmd command_\n_example: ${prefix}setcmd ping_`)
  if (!text) return await m.send(`_provide a command also.._`) 
  var f = text?.trim()?.split(/\s+/)[0];
  var hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString('hex') : null;
  if (!hash) return await m.send("couldn't get stk hash")
  const data = await getData("stk_cmd");
  const stk_cmd = data || {}
  stk_cmd[hash] = text
  await storeData("stk_cmd", JSON.stringify(stk_cmd, null, 2))
  return await m.send(`❏ Sticker set to *${f}*`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "delcmd",
  desc: "Remove/unbind a command from a sticker",
  fromMe: true,
  type: "tools",
}, async (m) => {
  try {
  if (!m.quoted.sticker) {
    return await m.send(`_Reply to a sticker to delete its command_`);
  }
  const hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString("hex") : null;
  if (!hash) return await m.send(`_hash not found_`);
  const data = await getData("stk_cmd");
  const stk_cmd = data || {}
  if (!stk_cmd[hash]) {
    return await m.send(`_no cmd found for that sticker.._`);
  }
  const oldCmd = stk_cmd[hash];
  delete stk_cmd[hash];
  await storeData("stk_cmd", JSON.stringify(stk_cmd, null, 2));
  return await m.send(`*cmd deleted!*\n_from:_ *${oldCmd}*`);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
});

kord({
  cmd: "listcmd|listcmds",
  desc: "List all sticker-bound commands",
  fromMe: true,
  type: "tools",
}, async (m) => {
  try {
  const data = await getData("stk_cmd");
  const stk_cmd = data || {}
  const entries = Object.entries(stk_cmd);
  if (entries.length === 0) {
    return await m.send(`_No sticker commands have been set yet._`);
  }
  let text = `❏ *Sticker Commands:*\n\n`;
  for (const [hash, cmd] of entries) {
    text += `❏ *${cmd}*\n_↳ hash:_ \`${hash.slice(0, 16)}...\`\n\n`;
  }
  return await m.send(text.trim());
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
});



kord({
  cmd: "permit",
  desc: "permit a command or command group to work even when bot is private",
  fromMe: true,
  type: "tools",
}, async (m, text) => {
  try {
    const args = text.split(" ");

      if (!args || args.length === 0) {
        return await m.send(`*_Permit Command_*\n\nUsage:\n_${pre}permit-cmd list_\n_${pre}permit-cmd remove cmdtype CommandType_\n_${pre}permit-cmd remove cmd CommandName_\n_${pre}permit-cmd remove all_\n_${pre}permit-cmd cmdtype CommandType_\n_${pre}permit-cmd cmd CommandName_\n_${pre}permit-cmd all_`)
      }

      const option = args[0].toLowerCase();
      const value = args.length > 1 ? args.slice(1).join(" ") : null;
      const chatJid = m.chat;
      var pmdata = await getData("permit_cmd");
      if (!Array.isArray(pmdata)) pmdata = [];
      let isExist = pmdata.find(entry => entry.chatJid === chatJid);

      if (option === "list") {
        if (pmdata.length === 0) {
          return await m.send("_No permissions set for any chat._");
        }
        const thisChat = pmdata.filter(entry => entry.chatJid === chatJid);
        if (thisChat.length === 0) {
          return await m.send("_No permissions set for this chat_");
        }
        let listMsg = "_*Permitted Commands for this chat*_\n\n";
        thisChat.forEach((entry, i) => {
          listMsg += `${i+1}. ${entry.cmdType ? `cmd Type: ${entry.cmdType}` : ''}${entry.cmd ? `cmd: ${entry.cmd}` : ''}\n`;
        });
        return await m.send(listMsg);
      }

      if (option === "all") {
        const cmdTypes = [...new Set(commands.map(cmd => cmd.type))];
        const existingTypes = pmdata.filter(entry => entry.chatJid === chatJid && entry.cmdType).map(entry => entry.cmdType);
        const typesToAdd = cmdTypes.filter(type => !existingTypes.includes(type));
        
        if (typesToAdd.length === 0) {
          return await m.send("_*All command types are already permitted in this chat*_");
        }

        typesToAdd.forEach(cmdType => {
          pmdata.push({
            chatJid,
            cmdType,
            cmd: ""
          });
        });

        await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
        return await m.send(`_*All command types (${typesToAdd.length} types) are now permitted in this chat*_\n\n_Added: ${typesToAdd.join(", ")}_`);
      }

      if (option === "remove") {
        if (!value) {
          return await m.send(`*_specify what to remove._*\n_example: ${pre}permit-cmd remove cmdtype CommandType_\n_${pre}permit-cmd remove cmd CommandName_\n_${pre}permit-cmd remove all_`);
        }
        if (value.toLowerCase() === "all") {
          pmdata = pmdata.filter(entry => entry.chatJid !== chatJid);
          await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
          return await m.send("_*All permissions for this chat have been removed!*_");
        }
        const removeArgs = value.split(" ");
        const removeType = removeArgs[0].toLowerCase();
        const removeName = removeArgs.slice(1).join(" ");
        if (removeType === "cmdtype") {
          const cmdTypes = [...new Set(commands.map(cmd => cmd.type))];
          if (!cmdTypes.includes(removeName)) {
            return await m.send(`_*Invalid command type!!*_\n_Available types:_\n_${cmdTypes.join("\n")}_`);
          }
          const beforeLength = pmdata.length;
          pmdata = pmdata.filter(entry => !(entry.chatJid === chatJid && entry.cmdType === removeName));
          if (beforeLength === pmdata.length) {
            return await m.send(`_*cmd type "${removeName}" was not permitted in this chat*_`);
        }
          await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
          return await m.send(`_*cmd type "${removeName}" is no longer permitted in this chat*_`);
        }
        if (removeType === "cmd") {
          const usages =  [
  ...new Set(
    commands
      .flatMap(cmd => cmd.cmd?.split('|') || [])
      .map(cmd => cmd.trim())
      .filter(Boolean)
  )
].sort();
          if (!usages.includes(removeName)) {
            return await m.send(`_*cmd not found!*_ _use ${pre}menu to see available commands_`);
          }
          const beforeLength = pmdata.length;
          pmdata = pmdata.filter(entry => !(entry.chatJid === chatJid && entry.cmd === removeName));
          if (beforeLength === pmdata.length) {
            return await m.send(`_*cmd "${removeName}" was not permitted in this chat*_`);
          }
          await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
          return await m.send(`_*cmd "${removeName}" is no longer permitted in this chat*_`);
        }
        const index = parseInt(value) - 1;
        const thisChat = pmdata.filter(entry => entry.chatJid === chatJid);
        if (isNaN(index) || index < 0 || index >= thisChat.length) {
          return await m.send(`*_Invalid removal format_*\n_Use: ${pre}permit-cmd remove cmdtype CommandType_\n_or: ${pre}permit-cmd remove cmd CommandName_\n_or: ${pre}permit-cmd remove all_`);
        }
        const targetEntry = thisChat[index];
        pmdata = pmdata.filter(entry => 
          !(entry.chatJid === chatJid && 
            entry.cmdType === targetEntry.cmdType && 
            entry.cmd === targetEntry.cmd)
        );
        await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
        return await m.send(`_Permission removed: ${targetEntry.cmdType || targetEntry.cmd}_`);
      }
      if (option === "cmdtype") {
        if (!value) {
          const cmdTypes = [...new Set(commands.map(cmd => cmd.type))];
          return await m.send(`_*specify command type.*_ Available types:\n${cmdTypes.join("\n")}`);
        }
        const cmdTypes = [...new Set(commands.map(cmd => cmd.type))];
        if (!cmdTypes.includes(value)) {
          return await m.send(`_*Invalid command type!!*_\n_Available types:_\n_${cmdTypes.join("\n")}_`);
        }
        const alreadyPermitted = pmdata.some(entry => 
          entry.chatJid === chatJid && entry.cmdType === value
        );
        if (alreadyPermitted) {
          return await m.send(`_*cmd type "${value}" is already permitted in this chat*_`);
        }
        const entry = {
          chatJid,
          cmdType: value,
          cmd: ""
        };
        pmdata.push(entry);
        await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
        return await m.send(`_*cmd type "${value}" is now permitted in this chat*_`);
      }
      if (option === "cmd") {
        if (!value) {
          return await m.send(`_*specify a command*_`);
        }
        const usages = [
  ...new Set(
    commands
      .flatMap(cmd => cmd.cmd?.split('|') || [])
      .map(cmd => cmd.trim())
      .filter(Boolean)
  )
].sort();
        if (!usages.includes(value)) {
          return await m.send(`_*cmd not found!*_ _use ${pre}menu to see available commands_`);
        }
        const alreadyPermitted = pmdata.some(entry => 
          entry.chatJid === chatJid && entry.cmd === value
        );
        
        if (alreadyPermitted) {
          return await m.send(`_*cmd "${value}" is already permitted in this chat*_`);
        }
        const entry = {
          chatJid,
          cmdType: "",
          cmd: value
        };
        pmdata.push(entry);
        await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
        return await m.send(`_*cmd "${value}" is now permitted in this chat*_`);
      }
      const cmdTypes = [...new Set(commands.map(cmd => cmd.type))];
      if (cmdTypes.includes(option)) {
        const alreadyPermitted = pmdata.some(entry => 
          entry.chatJid === chatJid && entry.cmdType === option
        );
        if (alreadyPermitted) {
          return await m.send(`_*cmd type "${option}" is already permitted in this chat*_`);
        }
        const entry = {
          chatJid,
          cmdType: option,
          cmd: ""
        };
        pmdata.push(entry);
        await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
        return await m.send(`_*cmd type "${option}" is now permitted in this chat*_`);
      } 
      const usages = [
  ...new Set(
    commands
      .flatMap(cmd => cmd.cmd?.split('|') || [])
      .map(cmd => cmd.trim())
      .filter(Boolean)
  )
].sort();
      if (usages.includes(option)) {
        const alreadyPermitted = pmdata.some(entry => 
          entry.chatJid === chatJid && entry.cmd === option
        );
        if (alreadyPermitted) {
          return await m.send(`_*cmd "${option}" is already permitted in this chat*_`);
        }
        const entry = {
          chatJid,
          cmdType: "",
          cmd: option
        };
        pmdata.push(entry);
        await storeData("permit_cmd", JSON.stringify(pmdata, null, 2));
        return await m.send(`_*cmd "${option}" is now permitted in this chat*_`);
      }
      return await m.send(`\`\`\`INVALID\`\`\` \n*_Permit Command_*\n\nUsage:\n_${pre}permit-cmd list_\n_${pre}permit-cmd remove cmdtype CommandType_\n_${pre}permit-cmd remove cmd CommandName_\n_${pre}permit-cmd remove all_\n_${pre}permit-cmd cmdType/cmd_\n_${pre}permit-cmd all_`);
    } catch(err) {
      console.error(err);
      await m.send(`Error: ${err.message}`);
    }
})

kord({
  cmd: "mention",
  type: "tools",
  desc: "set action to be done when owner is mentioned",
  fromMe: true,
}, async (m, text) => {
  try {
    
    var mData =  await getData("mention_config") || {
  active: false,
  action: "",
  emoji: "🤍",
  text: ""
};
    const args = text.split(" ");
      if (args && args.length > 0) {
  const option = args[0].toLowerCase();
  const value = args.length > 1 ? args[1] : null;
  const fArgs = args.slice(1).join(" ")
    if (option === "off")  {
      mData.active = false;
      await storeData('mention_config', JSON.stringify(mData, null, 2))
      return await m.send("_Mention Action Has Been Turned Off!_");
       } else if (option === "-status" || option === "status") {
          var info = await getData('mention_config') || {active: false, action: "", emoji: "", text: ""}
          return m.send(`*Mention Status:*\n\n \`\`\`Active: ${info.active}\nAction: ${info.action}\nEmoji: ${info.emoji}\nText: ${info.text}\`\`\``)
        } else if (option === "-react" || option === "react") {
          var emoji = value
          mData.active = true;
          mData.action = "react";
          mData.emoji = emoji
          await storeData('mention_config', JSON.stringify(mData, null, 2))
          return await m.send(`_Query Saved!_`);
        } else if (option === "-text"  || option === "text") {
          var sentText = fArgs
          mData.active = true;
          mData.action = "text";
          mData.text = sentText;
          await storeData('mention_config', JSON.stringify(mData, null, 2))
          return await m.send(`_Query Saved!_`);
        } else {
          return await m.send(`_*Invalid Option!!!*_

_*Provide an Option*_
_.mention off_
_.mention -status_
_.mention -react 🤍_ (reacts when the owner is mentioned)
_.mention -text Your Text_ (sends custom text when owner is mentioned, Example: \'Your Text \')`);
        }
      } else {
        return await m.send(`_ *Provide an Option*_
_.mention off_
_.mention -status_
_.mention -react 🤍_ (reacts when the owner is mentioned)
_.mention -text Your Text_ (sends custom text when owner is mentioned, Example: \'Your Text \')`);
      }
    } catch (e) {
    console.error(e)
    m.send(`${e}`)
  } 
})
kord({
  on: "all"
}, async (m, text) => {
  try {
  var MData = await getData("mention_config") || {}
          if (!MData.active) {
            return;
          }
          var jidd = m.chat
          if (text.includes(config().OWNER_NUMBER) || text.includes(m.ownerJid)) {
            if (MData.action === "react") {
            var pEmoji = MData.emoji
            return await m.client.sendMessage(jidd, { react: { text: pEmoji, key: m.key } })
            } else if (MData.action === "text") {
              var pText = MData.text
              return await m.client.sendMessage(jidd, { text: pText }, { quoted: m })
            }
          }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

async function loadAfkData() {
  try {
    const data = await getData("afk_config");
    if (!data || typeof data !== 'object') {
      return { users: {}, owner: { active: false, message: "", lastseen: "" } };
    }
    return data;
  } catch (err) {
    console.error("Error loading AFK data:", err);
    return { users: {}, owner: { active: false, message: "", lastseen: "" } };
  }
}

async function saveAfkData(data) {
  try {
    await storeData("afk_config", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving AFK data:", err);
  }
}

kord({
  cmd: "afk",
  desc: "set afk message",
  fromMe: true,
  type: "tools"
}, async (m, text) => {
  try {
  const txt = !text ? "" : text;
  global.afkData = await loadAfkData();
  if (txt.toLowerCase() === "off" || txt.toLowerCase() === "stop") {
    if (m.sender === m.ownerJid) {
      global.afkData.owner.active = false;
    } else {
      if (global.afkData.users[m.sender]) {
        global.afkData.users[m.sender].active = false;
      }
    }
    await saveAfkData(global.afkData);
    return await m.send("afk off");
  }
  
  const currentTime = Math.round((new Date()).getTime() / 1000);
  
  if (m.sender === m.ownerJid) {
    global.afkData.owner = {
      active: true,
      message: txt,
      lastseen: currentTime
    };
    await saveAfkData(global.afkData);
    return await m.send(`owner is now afk..`);
  } else {
    if (!global.afkData.users) {
      global.afkData.users = {};
    }
    
    global.afkData.users[m.sender] = {
      active: true,
      jid: m.chat,
      message: txt,
      lastseen: currentTime
    };
    
    await saveAfkData(global.afkData);
    return await m.send(`@${m.sender.split("@")[0]} is now afk..\n_Reason:_ ${txt}`, {mentions: [m.sender]});
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  on: "all",
}, async (message, text, c, store) => {
  try {
 //   console.log("AFK Handler triggered")
  //  const user = message.sender
 //   console.log("User:", user)
   // console.log("OwnerJid:", message.ownerJid)
    //console.log("Text:", text)
    //console.log("MentionedJid:", message.mentionedJid)
    
    const afkData = await loadAfkData() || { users: {}, owner: { active: false, message: "", lastseen: "" } }
  //  console.log("AFK Data loaded:", JSON.stringify(afkData, null, 2))
    
    if (message.message && message.message.reactionMessage) {
   //   console.log("Reaction message, returning")
      return
    }
    if (!text) {
    //  console.log("No text, returning")
      return
    }
    
    if (c && c.includes("afk")) {
    //  console.log("AFK command, ignoring")
      return
    }
    
    if (afkData.users && afkData.users[user] && afkData.users[user].active) {
    //  console.log("User is AFK, welcoming back")
      afkData.users[user].active = false
      await saveAfkData(afkData)
      const timeDiff = Math.round((new Date()).getTime() / 1000) - afkData.users[user].lastseen
      const timeStr = formatTime(timeDiff)
      await message.send(`Welcome back @${user.split("@")[0]}!\nYou were afk for: *${timeStr}*`, {mentions: [user]})
    }
    
    if (user === message.ownerJid && afkData.owner && afkData.owner.active) {
    //  console.log("Owner returned from AFK")
      afkData.owner.active = false
      await saveAfkData(afkData)
      return
    }
    
    if (afkData.owner && afkData.owner.active && user !== message.ownerJid) {
    //  console.log("Checking owner AFK notifications")
      let shouldNotify = false
      
      if (message.mentionedJid && message.mentionedJid.includes(message.ownerJid)) {
     //   console.log("Owner mentioned in mentionedJid")
        shouldNotify = true
      }
      
      if (text.includes(message.ownerJid) || text.includes(message.ownerJid.split('@')[0])) {
       // console.log("Owner mentioned in text")
        shouldNotify = true
      }
      
      if (message.quoted.sender === message.ownerJid) {
    //    console.log("Owner message quoted")
        shouldNotify = true
      }
      
    //  console.log("Should notify owner:", shouldNotify)
      
      if (shouldNotify) {
        const timeDiff = Math.round((new Date()).getTime() / 1000) - afkData.owner.lastseen
        const timeStr = formatTime(timeDiff)
        await message.send(`*Owner is currently AFK.*\n*Reason:* ${afkData.owner.message || "Not specified"}\n*Last seen:* ${timeStr} ago`)
        
        const mesa = await message.forwardMessage(
          message.ownerJid,
          await global.store.findMsg(message.id),
          { quoted: message }
        )
        await message.client.sendMessage(message.ownerJid, { 
          text: `User: ${await global.store.getname(message.sender)}(${message.sender.split("@")[0]}) tagged/reply during afk, Message above:` 
        }, { quoted: mesa })
      }
    }
    
//    console.log("Checking user AFK notifications")
    for (const mentionedUser in afkData.users) {
      if (afkData.users[mentionedUser] && 
          afkData.users[mentionedUser].active && 
          user !== mentionedUser) {
        
  //      console.log("Checking AFK user:", mentionedUser)
        let shouldNotify = false
        
        if (message.mentionedJid && message.mentionedJid.includes(mentionedUser)) {
    //      console.log("User mentioned in mentionedJid:", mentionedUser)
          shouldNotify = true
        }
        
        if (text.includes(mentionedUser) || text.includes(mentionedUser.split('@')[0])) {
      //    console.log("User mentioned in text:", mentionedUser)
          shouldNotify = true
        }
        
        if (message.quoted && message.quoted.sender === mentionedUser) {
        //  console.log("User message quoted:", mentionedUser)
          shouldNotify = true
        }
        
    //    console.log("Should notify user:", mentionedUser, shouldNotify)
        
        if (shouldNotify) {
          const timeDiff = Math.round((new Date()).getTime() / 1000) - afkData.users[mentionedUser].lastseen
          const timeStr = formatTime(timeDiff)
          await message.send(`@${mentionedUser.split("@")[0]} *is currently AFK*.\n*Reason:* ${afkData.users[mentionedUser].message || "Not specified"}\n*Last seen:* ${timeStr} ago`, {mentions: [mentionedUser]})
        }
      }
    }
    
  } catch (e) {
  //  console.log("cmd error", e)
   // return await message.sendErr(e)
  }
})

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
    
kord({
  cmd: "areact|autoreact|autoreaction",
  desc: "automatically react to messages",
  fromMe: true,
  type: "tools",
}, async (m, text) => {
  try {
  const args = text.split(" ");
  if (args && args.length > 0) {
                const option = args[0].toLowerCase();
                const value = args.length > 1 ? args[1] : null;
                const fArgs = args.slice(1).join(" ")
        if (option === 'on' && value === 'global') {
            areact.global = true;
            await storeData('areact_config', JSON.stringify(areact, null, 2))
            return await m.send('_*Auto React Has Benn Enabled Globally!*_')
        } else if (option === 'off' && value === 'global') {
            areact.global = false;
            await storeData('areact_config', JSON.stringify(areact, null, 2))
            return await m.send('_*Auto react Has been disabled globally*_')
        } else if(option === 'on') {
      areact.active = true;
      areact.activeChats.push(m.chat)
      await storeData('areact_config', JSON.stringify(areact, null, 2))
      return await m.send('_*Auto react Has been Enabled for this group!*_\n\n> Use \`.areact global\` to turn on for all groups')
    } else if (option === 'off') {
      
      areact.activeChats = areact.activeChats.filter(jid => jid !== m.chat);
      await storeData('areact_config', JSON.stringify(areact, null, 2))
      return await m.send('_*Auto react Has been disabled for this group!*_\n\n> Use \`.areact off global\` to turn on for all groups')
    } else if(option === "status") {
      var sareact = await getData('areact_config')
      var actif = sareact.active
      var sglobal = sareact.global
     var sactifChat = new Set(sareact.activeChats || []);
      var sactiveChats = sactifChat.has(m.chat)
      await m.send(`_*AUto React Settings*_\n\n\`\`\`Active: ${actif}\nGlobal?: ${sglobal}\nActive Here?:${sactiveChats}\`\`\``)
    } else {
      m.send(`_*Choose A Valid Option!!*_
      
_*Avaliable Options:*_
\`.areact on\` (to turn on for the present chat)
\`.areact on global\` global (to turn on for all chats)
\`.areact off\` (to turn off for the present chat)
\`.areact off global\` (to turn off for all chats)
\`.areact status\` (to view rhe settings for the present chat)`)
    }
            } else {
m.send(`_*Avaliable Options:*_
\`.areact on\` (to turn on for the present chat)
\`.areact on global\` global (to turn on for all chats)
\`.areact off\` (to turn off for the present chat)
\`.areact off global\` (to turn off for all chats)
\`.areact status\` (to view rhe settings for the present chat)`)
            }
  } catch(e) {
    console.error(e)
    return await m.send(`an error occured: ${e}`)
  }
})

kord({
  on: "all",
  fromMe: false,
}, async(m, text) =>{
  try {
  if (!await getData("areact_config")) {
    await storeData("areact_config", JSON.stringify(areact, null, 2));
    }
   const ePath = path.join(__dirname, "..", "core", "store", 'emojis.json');
     const emojiList = JSON.parse(fs.readFileSync(ePath, 'utf-8')).emojis;
    const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
   const presentJid = m.chat
   var aReact = await getData('areact_config')
   var activeChats = new Set(aReact.activeChats || []);
   if (!activeChats.has(presentJid) && !aReact.global) {
     return;
   } else if (activeChats.has(presentJid) && !aReact.global) {
    await m.react(randomEmoji);
   } else if (aReact.global) {
     await m.react(randomEmoji)
   }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "ignore",
  desc: "ignores the current chat",
  fromMe: true,
  type: "bot"
}, async (m) => {
  try {
  let sdata = await getData("ignored")
  if (!Array.isArray(sdata)) sdata = []

  if (sdata.includes(m.chat)) return m.send("_this chat is already ignored_")

  sdata.push(m.chat)
  await storeData("ignored", JSON.stringify(sdata, null, 2))
  return m.send("_this chat is now ignored_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "allow",
  desc: "removes the current chat from ignore list",
  fromMe: true,
  type: "bot"
}, async (m) => {
   try {
  let sdata = await getData("ignored")
  if (!Array.isArray(sdata)) sdata = []

  if (!sdata.includes(m.chat)) return m.send("_this chat is not ignored_")

  sdata = sdata.filter(jid => jid !== m.chat)
  await storeData("ignored", JSON.stringify(sdata, null, 2))
  return m.send("_this chat is now allowed_")
   } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "bot",
  desc: "turn bot on or off in this chat",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
  let sdata = await getData("ignored")
  if (!Array.isArray(sdata)) sdata = []

  const isIgnored = sdata.includes(m.chat)

  if (/off/i.test(text)) {
    if (isIgnored) return m.send("_bot is already turned off in this chat_")
    sdata.push(m.chat)
    await storeData("ignored", JSON.stringify(sdata, null, 2))
    return m.send("_bot has been turned off in this chat_")
  }

  if (/on/i.test(text)) {
    if (!isIgnored) return m.send("_bot is already active in this chat_")
    sdata = sdata.filter(jid => jid !== m.chat)
    await storeData("ignored", JSON.stringify(sdata, null, 2))
    return m.send("_bot has been turned on in this chat_")
  }

  return m.send("_usage: .bot on | .bot off_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})