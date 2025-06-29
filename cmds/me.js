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
  getData,
  storeData,
  prefix,
  secondsToHms,
  isBotAdmin,
  config,
  updateBot
} = require("../core")
const { exec } = require("child_process")
const pre = prefix
const core = require("../core")
const path = require('path')
const fs = require('fs')
const { warn } = require("../core/db")

kord({
  cmd: 'ping',
  desc: 'check the bot ping',
  react: "🙂‍↔️",
  fromMe: wtype,
  type: 'bot'
}, async (m, text) => {
  const start = performance.now();
  const msg = await m.send("```pinging...```");
  const end = performance.now();
  const ping = Math.round(end - start);
   msg.edit(`*_々 Pong! ${ping}ms_*`);
});

kord({
  cmd: "ban",
  desc: "bans a user from using the bot",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  let user;
  if (m.isGroup) {
    if (m.mentionedJid?.length) {
  user = m.mentionedJid[0]
  } else if (m.quoted?.sender) {
  user = m.quoted.sender
  } else {
  return m.send("_reply or mention a user_");
}
  } else if (text) {
    user = text.replace(/[^\d]/g, '');
  } else {
    user = m.chat
  }
  
  if (!user) return m.send("_reply or mention a user_")
  let sdata = await getData("banned");
if (!Array.isArray(sdata)) sdata = [];
let isExist = sdata.includes(user);
  if (isExist) {
    return m.send("_user is already banned_")
  } else {
    sdata.push(user)
    await storeData("banned", JSON.stringify(sdata, null, 2))
    return m.send("_user is now banned_")
  }
})

kord({
  cmd: "unban",
  desc: "unbans an already banned user",
  fromMe: true,
  type: "bot",
  }, async (m, text) => {
    let user;
if (m.chat.endsWith("@g.us")) {
  if (m.mentionedJid?.length) {
  user = m.mentionedJid[0];
} else if (m.quoted?.sender) {
  user = m.quoted.sender;
} else {
  return m.send("_reply or mention a user_");
}
} else if (text) {
  user = text.replace(/[^\d]/g, '');
} else {
  user = m.chat
}

  if (!user) return m.send("_reply or mention a user_")
  let sdata = await getData("banned");
if (!Array.isArray(sdata)) sdata = [];
let isExist = sdata.includes(user);
  if (!isExist) return m.send("_user is not banned currently_")
  sdata = sdata.filter(entry => entry !== user)
  await storeData("banned", JSON.stringify(sdata, null, 2))
  return m.send("_user is now unbaned_")
  }
)



kord({
  cmd: 'uptime',
  desc: 'checks the bot\'s uptime',
  react: '💨',
  fromMe: wtype,
  type: 'bot'
}, async(m, text) => {
  var uptime = await secondsToHms(process.uptime())
  return m.send(`_*Active since ${uptime} ago!..*_`)
})

kord({
  cmd: 'quoted',
  desc: 'resends the a replied messges of the quoted msg',
  fromMe: wtype,
  type: 'tools'
}, async(m, text) => {
  try {
      if (!m.quoted) return m.send("*_reply to a replied message_*")
      const qu = await m.getQuotedObj();
      if (!qu) return m.send("*_reply to a message that replies to a message_*")
      if (qu.quoted?.fakeObj) {
    await m.forwardMessage(m.chat, qu.quoted.fakeObj);
      } else {
    await m.send("_No quoted message found._");
      }
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
})

kord({
  cmd: "list",
  desc: "shows the list of available comamnds and their description",
  react: "☯️",
  fromMe: wtype,
  type: 'help',
}, async (m, text) => {
  let count = 1
      list = ""
  commands.map((cmd => {
  if (cmd.cmd && cmd.desc) {
    const firstAlias = cmd.cmd.split('|')[0].trim();
    list += `${count++} *${firstAlias}*\n_${cmd.desc}_\n\n`;
  } else {
    const fallback = cmd.cmd ? cmd.cmd.split('|')[0].trim() : '';
    list += `${count++} *${fallback}*\n`;
  }
}));
return m.send(list)
})

const pm2 = require('pm2')

kord({
  cmd: "restart|reboot",
  desc: "restart ths bot",
  fromMe: true,
  type: "process",
}, async (m) => {
  try {
    await m.send("_𝌫 restarting..._")
    await new Promise((resolve, reject) => {
      pm2.connect(err => {
        if (err) return reject(err)
        pm2.restart('kord-v2', (err) => {
          pm2.disconnect()
          return err ? reject(err) : resolve()
        })
      })
    })
  } catch (err) {
    return await m.send(`error..: ${err}`)
  }
})

kord({
  cmd: "shutdown",
  desc: "shut the bot down (you'll have to restart on server)",
  fromMe: true,
  type: "process",
}, async (m) => {
  try {
    await m.send("_𝌫 shutting down..._")
    await new Promise((resolve, reject) => {
      pm2.connect(err => {
        if (err) return reject(err)
        pm2.stop('kord-v2', (err) => {
          pm2.disconnect()
          return err ? reject(err) : resolve()
        })
      })
    })
  } catch (err) {
    return await m.send(`error..: ${err}`)
  }
})


kord({
  cmd: "p-status",
  desc: "checks process status",
  fromMe: true,
  type: "process"
}, async (m, text) => {
  try {
    exec("npx pm2 status kord-v2", async (err, stdout, stderr) => {
      if (err) {
        await m.send(`Error: ${err}`);
        return;
      }
      const lines = stdout.split('\n').filter(line => line.includes('kord-v2'));
      if (lines.length === 0) {
        await m.send("No Kord processes found running.");
        return;
      }
      const processInfoList = lines.map(line => {
        const parts = line.split('│').map(part => part.trim()).filter(Boolean);
        
        if (parts.length < 9) {
          return null;
        }
        
        return {
          id: parts[0],
          name: parts[1],
          namespace: parts[2],
          version: parts[3],
          mode: parts[4], 
          pid: parts[5],
          uptime: parts[6],
          restarts: parts[7],
          status: parts[8],
          cpu: parts[9],
          memory: parts[10]
        };
      }).filter(Boolean);
      
      let statusMsg = `*❊ Bot Status*\n\n`;
      
      processInfoList.forEach((proc, index) => {
        const statusSymbol = proc.status && proc.status.toLowerCase().includes('online') ? '✓' : '✗';
        
        statusMsg += `*Process #${proc.id}*: ${proc.name}\n`;
        statusMsg += `${statusSymbol} *Status*: ${proc.status}\n`;
        statusMsg += `*𝌫 Mode*: ${proc.mode}\n`;
        statusMsg += `*𝌫 CPU*: ${proc.cpu}\n`;
        statusMsg += `*𝌫 Memory*: ${proc.memory}\n`;
        statusMsg += `*𝌫 Uptime*: ${proc.uptime}\n`;
        statusMsg += `*𝌫 Version*: ${proc.version}\n`;
        statusMsg += `*𝌫 Restarts*: ${proc.restarts}\n`;
        
        if (index < processInfoList.length - 1) {
          statusMsg += `\n${'─'.repeat(20)}\n\n`;
        }
      });
      await m.send(statusMsg);
    });
  } catch (e) {
    console.error(e);
    return await m.send(`Error: ${e}`);
  }
});

kord({
  cmd: "runtime",
  desc: "get runtime of bot with cool display",
  fromMe: wtype,
  type: "bot",
}, async (m, text) => {
  try {
    const uptimeSeconds = process.uptime();
    const uptime = await secondsToHms(uptimeSeconds)
    const memoryUsage = process.memoryUsage();
    const memoryMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
    const currentTime = new Date().toLocaleString();
    
    let msg = `\`\`\`╔════════════════════════╗\n╠ 🤖 ${config().BOT_NAME} RUNTIME Status     ╣\n╠════════════════════════╝\n`
    msg += `╠ ⏰ Uptime: ${uptime}\n`;
    msg += `╠ 💾 Memory: ${memoryMB} MB\n`;
    msg += `╠ 🔄 Process ID: ${process.pid}\n`;
    msg += `╠ 📅 Time: ${currentTime}\n`;
    msg += `╠ 🚀 Node: ${process.version}\n`;
    msg += `╠ 💻 Platform: ${process.platform}\n`;
    msg += "╠\n╠ ✨ Bot is running smoothly!\n";
    msg += "╚════════════════════════```";

    return await m.client.sendMessage(m.chat, {
  text: msg,
  contextInfo: {
    externalAdReply: {
      title: `${config().BOT_NAME} Runtime`,
      body: `Uptime: ${uptime} | Memory: ${memoryMB}MB`,
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: false,
      sourceUrl: "https://kord-ai.web.id"
    }
  }
})
    
  } catch (error) {
    console.error('Error in runtime command:', error);
    await m.send(`Error in runtime: ${error}`);
  }
});


kord({
  on: "all",
  fromMe: false,
}, async (m, text) => {
  if (text.toLowerCase().includes("save") || text.toLowerCase().includes("download") || text.toLowerCase().includes("send")) {
    const mtype = m.quoted.mtype
    if (m.quoted.chat !== "status@broadcast") return
    const buffer = mtype !== "extendedTextMessage" ? await m.quoted.download() : null
    const caption = m.quoted.caption || m.quoted.text || ""
    let adType = "text"
    let content = caption
    if (mtype === "imageMessage") {
      adType = "image"
      content = buffer
    } else if (mtype === "videoMessage") {
      adType = "video"
      content = buffer
    } else if (mtype === "audioMessage") {
      adType = "audio"
      content = buffer
    }
    return await m.reply(content, {
      adType: adType,
      caption: caption,
      title: 'sᴛᴀᴛᴜs sᴀᴠᴇʀ',
      body: 'From: ' + (m.quoted.pushName || '') + ' | ' + m.quoted.chat.split("@")[0],
      renderLargerThumbnail: false,
      showAdAttribution: true,
      mediaType: 1
    }, "ad")
  }
})


kord({
  cmd: "owner",
  desc: "sends owner contact",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${config().OWNER_NAME}
TEL;type=CELL;type=VOICE;waid=${config().OWNER_NUMBER}:${config().OWNER_NUMBER}
END:VCARD`

  const contactMsg = {
    contacts: {
      displayName: config().OWNER_NAME,
      contacts: [{ vcard }]
    }
  }

  return await m.client.sendMessage(m.chat, contactMsg, { quoted: m })
})

kord({
  cmd: "repo|sc|script",
  desc: "send repository link of the bot",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  const msg = 
`╔═════《 My Repository 》═════╗
╠ Link: https://github.com/M3264/Kord-Ai
╠ Description: WhatsApp Bot built with Baileys
╚═════════════════════════════╝`

  return await m.send(msg)
})

kord({
    cmd: "update",
    desc: "update bot",
    fromMe: true,
    type: "bot",
}, async (m, text) => {
    await updateBot(m, text)
})