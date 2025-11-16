/* 
 * Copyright © 2025 Kenny
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
  updateBot,
  Baileys,
} = require("../core")
const { exec } = require("child_process")
const os = require("os")
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
  try {
    const start = performance.now();
    const msg = await m.send("```pinging...```");
    const end = performance.now();
    const ping = Math.round(end - start);
    msg.edit(`々 Pong! ${ping}ms..`);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
});


kord({
  cmd: "ban",
  desc: "bans a user from using the bot",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
    let user
    if (m.isGroup) {
      if (m.mentionedJid?.length) {
        user = m.mentionedJid[0]
      } else if (m.quoted?.sender) {
        user = m.quoted.sender
      } else {
        return m.send("_reply or mention a user_")
      }
    } else if (text) {
      user = text.replace(/[^\d]/g, '')
    } else {
      user = m.chat
    }

    if (!user) return m.send("_reply or mention a user_")
    if (user === m.ownerJid) return m.send("_why would you want to do that?_")

    let sdata = await getData("banned")
    if (!Array.isArray(sdata)) sdata = []

    if (sdata.includes(user)) {
      return m.send("_user is already banned_")
    }

    sdata.push(user)
    await storeData("banned", JSON.stringify(sdata, null, 2))
    return m.send("_user is now banned_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "unban",
  desc: "unbans an already banned user",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
    let user
    if (m.chat.endsWith("@g.us")) {
      if (m.mentionedJid?.length) {
        user = m.mentionedJid[0]
      } else if (m.quoted?.sender) {
        user = m.quoted.sender
      } else {
        return m.send("_reply or mention a user_")
      }
    } else if (text) {
      user = text.replace(/[^\d]/g, '')
    } else {
      user = m.chat
    }

    if (!user) return m.send("_reply or mention a user_")
    if (user === m.ownerJid) return m.send("_why would you do that?_")

    let sdata = await getData("banned")
    if (!Array.isArray(sdata)) sdata = []

    if (!sdata.includes(user)) {
      return m.send("_user is not banned currently_")
    }

    sdata = sdata.filter(entry => entry !== user)
    await storeData("banned", JSON.stringify(sdata, null, 2))
    return m.send("_user is now unbanned_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})
kord({
cmd: "banlist",
  desc: "shows all banned users",
  fromMe: true,
  type: "bot"
}, async (m) => {
  try {
    let sdata = await getData("banned")
    if (!Array.isArray(sdata)) sdata = []
    
    if (!sdata.length) return m.send("_no users are currently banned_")
    
    let mentions = sdata.map(jid => jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    let list = sdata.map((jid, i) => `${i + 1}. @${jid.replace(/[^0-9]/g, '')}`).join("\n")
    
    return m.send(`*Banned Users:*\n\n${list}`, { mentions })
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: 'uptime',
  desc: 'checks the bot\'s uptime',
  react: '💨',
  fromMe: wtype,
  type: 'bot'
}, async (m, text) => {
  try {
    var uptime = await secondsToHms(process.uptime())
    return m.send(`uptime: ${uptime}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
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
  try {
    let count = 1
    list = ""
    commands.map((cmd => {
    if (cmd.cmd && cmd.desc) {
    const firstAlias = cmd.cmd.split('|')[0].trim();
    list += `${count++} *${firstAlias}*\n_${cmd.desc}_\n\n`;
    } else {
    const fallback = cmd.cmd ? cmd.cmd.split('|')[0].trim() : '';
    list += `${count++} *${fallback}*\n`;
    } }));
return m.send(list)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
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
      sourceUrl: "https://kord.live"
    }
  }
})
    
  } catch (error) {
    console.error('Error in runtime command:', error);
    await m.send(`Error in runtime: ${error}`);
  }
});

kord({
  cmd: "stats",
  desc: "Show bot performance stats",
  fromMe: wtype,
  type: "bot"
}, async (m) => {
  try {
    const baileys = await Baileys()

    if (!global.stats) global.stats = { msgc: 0, cmdc: new Map(), cmdl: [] }

    const msgsCount = global.stats.msgc || 0
    const cmdsRunned = [...global.stats.cmdc.values()].reduce((a, b) => a + b, 0)

    const mem = process.memoryUsage().rss
    const memMB = Math.round(mem / 1024 / 1024)

    const cpus = os.loadavg()[0] / os.cpus().length
    const cpuPercent = Math.min(100, Math.round(cpus * 100))

    const pollVotes = [
      { optionName: "Msgs Count", optionVoteCount: msgsCount },
      { optionName: "Cmds Runned", optionVoteCount: cmdsRunned },
      { optionName: `Memory Usage (MB)`, optionVoteCount: memMB },
      { optionName: "CPU (%)", optionVoteCount: cpuPercent }
    ]

    const wmsg = baileys.generateWAMessageFromContent(m.chat, {
      pollResultSnapshotMessage: {
        name: `${config().BOT_NAME} Stats`,
        pollVotes
      }
    }, { quoted: m })

    await m.client.relayMessage(wmsg.key.remoteJid, wmsg.message, {
      messageId: wmsg.key.id
    })
  } catch (error) {
    console.error(error)
    await m.sendErr(error)
  }
})

kord({
  on: "all",
  fromMe: false,
}, async (m, text) => {
  try {
    const lower = text.toLowerCase()
    if (lower.includes("save") || lower.includes("download") || lower.includes("send")) {
      const quoted = m.quoted
      if (!quoted || quoted.chat !== "status@broadcast") return

      const mtype = quoted.mtype
      const buffer = mtype !== "extendedTextMessage" ? await quoted.download() : null
      const caption = quoted.caption || quoted.text || ""

      let parts = text.trim().split(/\s+/)
      let target = parts[1]
      let jid = null

      if (/^\d{5,16}$/.test(target)) {
        jid = target + "@s.whatsapp.net"
      } else if (/^\d{5,16}@s\.whatsapp\.net$/.test(target)) {
        jid = target
      }

      const send = async (targetJid) => {
        if (mtype === "imageMessage") {
          return await m.client.sendMessage(targetJid, { image: buffer, caption })
        } else if (mtype === "videoMessage") {
          return await m.client.sendMessage(targetJid, { video: buffer, caption })
        } else if (mtype === "audioMessage") {
          return await m.client.sendMessage(targetJid, { audio: buffer })
        } else {
          return await m.client.sendMessage(targetJid, { text: caption })
        }
      }

      if (jid) {
        return await send(jid)
      } else {
        if (mtype === "imageMessage") {
          return await m.send(buffer, { caption }, "image")
        } else if (mtype === "videoMessage") {
          return await m.send(buffer, { caption }, "video")
        } else if (mtype === "audioMessage") {
          return await m.send(buffer, {}, "audio")
        } else {
          return await m.send(caption)
        }
      }
    }
  } catch (e) {
    console.log("cmd error:", e)
  }
})

kord({
  on: "all",
  fromMe: false,
}, async (m, text) => {
  try {
    const lower = text.toLowerCase()
    if (lower.includes(config().SAVE_CMD)) {
      const quoted = m.quoted
      if (!quoted || quoted.chat !== "status@broadcast") return

      const mtype = quoted.mtype
      const buffer = mtype !== "extendedTextMessage" ? await quoted.download() : null
      const caption = quoted.caption || quoted.text || ""
      let jid = m.ownerJid
      let targetJid = m.ownerJid

      const send = async (targetJid) => {
        if (mtype === "imageMessage") {
          return await m.client.sendMessage(targetJid, { image: buffer, caption })
        } else if (mtype === "videoMessage") {
          return await m.client.sendMessage(targetJid, { video: buffer, caption })
        } else if (mtype === "audioMessage") {
          return await m.client.sendMessage(targetJid, { audio: buffer })
        } else {
          return await m.client.sendMessage(targetJid, { text: caption })
        }
      }

      if (jid) {
        return await send(jid)
      } else {
        if (mtype === "imageMessage") {
          return await m.send(buffer, { caption }, "image")
        } else if (mtype === "videoMessage") {
          return await m.send(buffer, { caption }, "video")
        } else if (mtype === "audioMessage") {
          return await m.send(buffer, {}, "audio")
        } else {
          return await m.send(caption)
        }
      }
    }
  } catch (e) {
    console.log("cmd error:", e)
  }
})

kord({
cmd: "owner",
  desc: "sends owner contact",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  try {
    const vcard = `
BEGIN:VCARD
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
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "crib",
  desc: "send repository link of the bot",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  try {
    const msg =
    `╔═════《 My Repository 》═════╗
╠ Link: https://github.com/kelin132/Kelin-AI.git
╠ Description: WhatsApp Bot built with Baileys
╚═════════════════════════════╝`
    
    return await m.send(msg)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "update",
    desc: "update bot",
    fromMe: true,
    type: "bot",
}, async (m, text) => {
  try {
    await updateBot(m, text)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "kelin",
  desc: "send repository link of the bot",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  try {
    const msg =
    `✨KELIN-AI IS UP AND ACTIVE✨`

    return await m.send(msg)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
 on: "all",
 fromMe: false,
}, async (m, text) => {
 try {
 const body = (text || "").trim();
 if (!body) return;
// exact match "hi" (case-insensitive)
if (body.toLowerCase() === "hi") {
  // try to react to the message (some Baileys wrappers accept this structure)
  try {
    await m.client.sendMessage(m.chat, { react: { text: "👋", key: m.key } });
  } catch (e) {
    // reaction failed or not supported — ignore
  }

  const replies = [
    "hi how are you doing today",
    "Wassup here",
    "hyyy",
    "hey you good"
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  return await m.send(reply);
}
} catch (err) {
 console.log("greeting handler error:", err);
 }
})