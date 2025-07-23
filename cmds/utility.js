/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord, extractUrlsFromString, getJson, talkNote, prefix, wtype, config, ss } = require("../core")
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit")
const fetch = require("node-fetch")
const { tiny, fancytext, listall } = require('../core/store/style-font');
const os = require('os');
const Jimp = require('jimp');
const ffmpeg = require('fluent-ffmpeg');
const http = require('http')
const { getDevice } = require('baileys')


kord({
        cmd: "ss",
        desc: "screenshots a given url live page",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
       try {
        let lik;
        if (!text) { 
           lik = m.quoted?.text
        } else {
        lik = text
        }
        if (!lik) return m.send("_*reply/provide a valid link!*_")
         m.react("⏰")
        var links = await extractUrlsFromString(lik)
        var link = links[0]

        var img = await fetch(`https://puppeteer-on-vercel-roan.vercel.app/ss?url=${encodeURIComponent(link)}&device=desktop`) //or mobile or tablet 
        var imgbuff = await img.buffer()
        return m.send(imgbuff, {caption: "> here\'s your screenshot", quoted: m}, "image")
       } catch (err) {
               console.error(err)
               return m.send(`${err}`)
       }
})

kord({
        cmd: "sstab",
        desc: "screenshots a given url live page(tab view)",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
        try {
                let lik;
                if (!text) {
                        lik = m.quoted?.text
                } else {
                        lik = text
                }
                if (!lik) return m.send("_*reply/provide a valid link!*_")
                m.react("⏰")
                var links = await extractUrlsFromString(lik)
                var link = links[0]

                var img = await fetch(`https://puppeteer-on-vercel-roan.vercel.app/ss?url=${encodeURIComponent(link)}&device=tablet`)  //or mobile or tablet 
                var imgbuff = await img.buffer()
                return m.send(imgbuff, {caption: "> here\'s your screenshot", quoted: m}, "image")
        } catch (err) {
                console.error(err)
                return m.send(`${err}`)
        }
})

kord({
        cmd: "ssphone",
        desc: "screenshots a given url live page(Mobile version)",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
        try {
                let lik;
                if (!text) {
                        lik = m.quoted?.text
                } else {
                        lik = text
                }
                if (!lik) return m.send("_*reply/provide a valid link!*_")
                m.react("⏰")
                var links = await extractUrlsFromString(lik)
                var link = links[0]

                var img = await fetch(`https://puppeteer-on-vercel-roan.vercel.app/ss?url=${encodeURIComponent(link)}&device=mobile`)  //or mobile or tablet 
                var imgbuff = await img.buffer()
                return m.send(imgbuff, {caption: "> here\'s your screenshot", quoted: m}, "image")
        } catch (err) {
                console.error(err)
                return m.send(`${err}`)
        }
})


kord({
  cmd: "tts",
  desc: "text to speech",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
  if (!text) return m.send("_*What do you want me to say?*_")
  var res = await m.axios(`https://ab-text-voice.abrahamdw882.workers.dev/?q=${encodeURIComponent(text)}&voicename=henry`)
  return await m.send(res.url, { mimetype: "audio/mpeg", ptt: true, quoted: m}, "audio")
  } catch(e) {
    console.error(err)
    return await m.send(`_*error!*_`)
  }
})

kord({
cmd: "audio2text|text",
  desc: "convert audio or video to text",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!(m.quoted.audio || m.quoted.video)) return await m.send("_reply to an audio or video_")
    var p = await m.client.dlandsave(m.quoted)
    var t = await talkNote(p)
    var c = t.text
    await m.send(`${c}`)
    await require("fs").promises.unlink(p);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "wm|walink",
        desc: "return walink of either replied/mention/chat user",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
     try {
             let wan;
      if (m.mentionedJid && m.mentionedJid[0]) {
         wan = m.mentionedJid[0].replace(/[^0-9]/g, '')
      } else if (m.quoted) {
        wan = m.quoted.sender.replace(/[^0-9]/g, '')
      } else {
        if (m.chat.endsWith("@g.us")) return m.send("_reply to a user or mention a user.._")
        wan = m.chat.split("@")[0]
      }
      const waLink = `https://wa.me/${wan}`
      return await m.send(waLink)
     } catch (e) {
             console.error(e)
             return e
     }   
})

kord({
cmd: "url|tourl|upload",
        desc: "uploads quoted media to Kord\'s Cdn and sends access url(safe)",
        fromMe: wtype,
        react: "🔗",
        type: "utilities",
}, async (m, text) => {
  try {
    if (!m.quoted.media) return m.send("_reply to a media message_")
    var path = await m.client.dlandsave(m.quoted)
    var url = await m.upload(path)
    await m.send(`${url}`);
    await require("fs").promises.unlink(path);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "temp-url|temp-upload",
        desc: "uploads quoted media to Kord\'s Cdn and sends access url(temporarily)",
        fromMe: wtype,
        react: "♻️",
        type: "utilities",
}, async (m, text) => {
  try {
    if (!m.quoted.media) return m.send("_reply to a media message_")
    var path = await m.client.dlandsave(m.quoted)
    var url = await m.upload(path, "temp")
    await m.send(`${url}`);
    await require("fs").promises.unlink(path);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "readmore",
        desc: "adds readmore to given text",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
  try {
    let txt = text || m.quoted?.text;
    if (!txt) return m.send(`_*provide or reply some text*_\n_example: ${prefix}readmore Hello this is visible |readmore| this is hidden_`);

    const readmoreChar = String.fromCharCode(8206).repeat(4001);
    const rtext = txt.replace(/(\|readmore\|)/i, readmoreChar);
    return await m.send(rtext);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
});


kord({
cmd: "define|whatis",
        desc: "defines given text",
        react: "🧩",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return m.send("_what do you want to define?_")
    const fWword = text?.trim()?.split(/\s+/)[0];
    var res = await m.axios(`http://api.urbandictionary.com/v0/define?term=${fWword}`);
    var def = res.list[0]
    const reply = `
    ◈ _*Word:*_ ${fWword}
    ◈ _*Definition:*_ ${def.definition.replace(/\[/g, "").replace(/\]/g, "")}
    ◈ _*Example:*_ ${def.example.replace(/\[/g, "").replace(/\]/g, "")}
    
    > definitions might not be accurate`;
    return await m.send(reply)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "weather",
        desc: "gives the weather information about given country",
        react: "🌦️",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_provide a location_");
    const res = await m.axios(`https://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=en`);
    const w = res
    const sunrise = new Date(w.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'
});
                const sunset = new Date(w.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const report = `\`\`\`
✤ Weather Report ✤
➥ Location     : ✪ ${w.name} (${w.sys.country})
➥ Coordinates  : ✷ ${w.coord.lat}°N, ${w.coord.lon}°E
➥ Condition    : ✭ ${w.weather[0].main} → ${w.weather[0].description}

✽ Temperature  : ${w.main.temp}°C ✛ Feels like ${w.main.feels_like}°C
✱ Min / Max    : ${w.main.temp_min}°C / ${w.main.temp_max}°C
✚ Humidity     : ${w.main.humidity}%
✪ Pressure     : ${w.main.pressure} hPa
➣ Sea Level    : ${w.main.sea_level || "N/A"} hPa
➣ Ground Level : ${w.main.grnd_level || "N/A"} hPa

✱ Visibility   : ${w.visibility / 1000} km
➙ Wind         : ${w.wind.speed} m/s ↣ ${w.wind.deg}°
✽ Cloud Cover  : ${w.clouds.all}%

♜ Sunrise      : ${sunrise}
♜ Sunset       : ${sunset}
\`\`\``.trim();
                return await m.send(report)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "tinyurl|shorten-url",
        desc: "makes shortened url Using the tinyurl api",
        fromMe: wtype,
        type: "utilities",
}, async (m, text) => {
        if (!text) return m.send('_Provide a link_')
try {
        link = text.split(" ")[0];
        let h = await m.axios(`https://tinyurl.com/api-create.php?url=${link}`);
       return await m.send(`*_Your Shortened URL_*\n\n${h}`);
} catch (e) {
        console.log(e);
}
})

function getQ(q) {
  if (q?.mtype === 'viewOnceMessageV2') {
    if (q?.message?.imageMessage) return 'image'
    if (q?.message?.videoMessage) return 'video'
    if (q?.message?.audioMessage) return 'audio'
  }

  if (q?.mtype === 'imageMessage') return 'image'
  if (q?.mtype === 'videoMessage') return 'video'  
  if (q?.mtype === 'audioMessage') return 'audio'

  const msg = q?.message || q
  
  if (msg?.imageMessage) return 'image'
  if (msg?.videoMessage) return 'video'
  if (msg?.audioMessage) return 'audio'
  
  return null
}

kord({
  cmd: "vv",
  desc: "resend a viewonce media as a normal media",
  fromMe: wtype,
  react: "🔓",
  type: "utilities",
}, async (m, text) => {
  try {
    if (
      !m.quoted?.viewOnce &&
      !m.quoted?.viewOnceMessageV2 &&
      m.quoted?.mtype !== 'viewOnceMessageV2Extension' &&
      m.quoted?.mtype !== 'viewOnceMessageV2'
    ) return await m.send("_*𝌫 Reply To A Viewonce Message*_")

    let mediaObj
    const type = getQ(m.quoted)
    
    if (m.quoted?.mtype === 'viewOnceMessageV2') {
      if (type === 'image') mediaObj = m.quoted.message.imageMessage
      else if (type === 'video') mediaObj = m.quoted.message.videoMessage
      else if (type === 'audio') mediaObj = m.quoted.message.audioMessage
    }
    
    if (!mediaObj) {
      if (type === 'image') mediaObj = m.quoted.imageMessage || m.quoted.message?.imageMessage
      else if (type === 'video') mediaObj = m.quoted.videoMessage || m.quoted.message?.videoMessage
      else if (type === 'audio') mediaObj = m.quoted.audioMessage || m.quoted.message?.audioMessage
    }
    
    if (!mediaObj) mediaObj = m.quoted.message || m.quoted

    const damn = await m.client.dlandsave(mediaObj)
    
    let msg

    if (type === 'image') {
      msg = { image: { url: damn }, caption: m.quoted.caption || "" }
    } else if (type === 'video') {
      msg = { video: { url: damn }, caption: m.quoted.caption || "" }
    } else if (type === 'audio') {
      msg = { audio: { url: damn }, ptt: false, caption: m.quoted.caption || "" }
    } else {
      await require("fs").promises.unlink(damn)
      return await m.send("_*Unsupported media type*_")
    }

    let target = text.trim()
    let sendTo = m.chat

    if (target === 'chat') {
      sendTo = m.sender
    } else if (target === 'owner') {
      sendTo = m.ownerJid
    } else if (/^\d{5,16}$/.test(target)) {
      sendTo = `${target}@s.whatsapp.net`
    } else if (/^\d{5,16}@s\.whatsapp\.net$/.test(target)) {
      sendTo = target
    }

    await m.client.sendMessage(sendTo, msg, { quoted: m })
    await require("fs").promises.unlink(damn)
  } catch (err) {
    console.error("vv plugin", err)
  }
})


kord({
  on: "all",
  fromMe: true,
}, async (m, text) => {
  try {
    if (text.toLowerCase().includes(config().VV_CMD)) {
      if (
        !m.quoted?.viewOnce &&
        !m.quoted?.viewOnceMessageV2 &&
        m.quoted?.mtype !== "viewOnceMessageV2Extension" &&
        m.quoted?.mtype !== "viewOnceMessageV2"
      ) return

      let mediaObj
      const type = getQ(m.quoted)
      
      if (m.quoted?.mtype === 'viewOnceMessageV2') {
        if (type === 'image') mediaObj = m.quoted.message.imageMessage
        else if (type === 'video') mediaObj = m.quoted.message.videoMessage
        else if (type === 'audio') mediaObj = m.quoted.message.audioMessage
      }
      
      if (!mediaObj) {
        if (type === 'image') mediaObj = m.quoted.imageMessage || m.quoted.message?.imageMessage
        else if (type === 'video') mediaObj = m.quoted.videoMessage || m.quoted.message?.videoMessage
        else if (type === 'audio') mediaObj = m.quoted.audioMessage || m.quoted.message?.audioMessage
      }
      
      if (!mediaObj) mediaObj = m.quoted.message || m.quoted

      const damn = await m.client.dlandsave(mediaObj)
      let msg

      if (type === 'image') {
        msg = { image: { url: damn }, caption: m.quoted.caption || "" }
      } else if (type === 'video') {
        msg = { video: { url: damn }, caption: m.quoted.caption || "" }
      } else if (type === 'audio') {
        msg = { audio: { url: damn }, ptt: false, caption: m.quoted.caption || "" }
      } else {
        await require("fs").promises.unlink(damn)
        return
      }

      await m.client.sendMessage(m.ownerJid, msg, { quoted: m.data })
      await require("fs").promises.unlink(damn)
    }
  } catch (e) {
    console.error("Error in vv", e)
  }
})


kord({
  cmd: "pdf",
  desc: "Converts image to PDF or text to PDF",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (text && !text.startsWith("send")) {
      const pdf = new PDFDocument();
      const p = "./text.pdf";
      const writeStream = fs.createWriteStream(p);

      pdf.pipe(writeStream);
      pdf.font("Helvetica", 12).text(text, 50, 50, { align: "justify" });
      pdf.end();

      await new Promise(resolve => writeStream.on('finish', resolve));

      try {
        const buffer = fs.readFileSync(p);
        await m.send(
          buffer,
          { mimetype: "application/pdf", fileName: "text.pdf", quoted: m },
          "document"
        );
      } catch (sendErr) {
        await m.send(`Failed to send PDF: ${sendErr.message}`);
      } finally {
        try {
          fs.unlinkSync(p);
        } catch (unlinkErr) {}
      }

      return;
    }

    const dir = "./pdf";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    if (text === "send") {
      const jpgFiles = fs.readdirSync(dir)
        .filter(file => file.toLowerCase().endsWith('.jpg'))
        .map(file => path.join(dir, file));

      if (jpgFiles.length === 0) {
        return await m.send("_No images found in pdf folder._");
      }

      const doc = new PDFDocument();
      const outputPath = "./image.pdf";
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      let imagesAdded = 0;
      for (const jpgPath of jpgFiles) {
        try {
          doc.addPage();
          doc.image(jpgPath, {
            fit: [500, 700],
            align: 'center',
            valign: 'center'
          });
          imagesAdded++;
        } catch (imgErr) {
          await m.send(`> Could not add image ${path.basename(jpgPath)}: ${imgErr.message}`);
        }
      }

      if (imagesAdded === 0) {
        doc.text("No valid images were found to convert", 100, 100);
      }

      doc.end();

      await new Promise(resolve => writeStream.on('finish', resolve));

      try {
        const buffer = fs.readFileSync(outputPath);
        await m.send(
          buffer,
          { mimetype: "application/pdf", fileName: "image.pdf", quoted: m },
          "document"
        );
      } catch (sendErr) {
        await m.send(`Failed to send PDF: ${sendErr.message}`);
      }

      try {
        fs.unlinkSync(outputPath);
        fs.readdirSync(dir).forEach(file => {
          fs.unlinkSync(path.join(dir, file));
        });
        fs.rmdirSync(dir);
      } catch (cleanupErr) {}
    } else {
      if (!m.quoted?.image) {
        return await m.send(
          "_*𝌫 Provide text/reply to a image*_\nExample: ```.pdf this is a text```\nUse ```.pdf send``` to get the pdf"
        );
      }

      const p = await m.client.dlandsave(m.quoted);
      if (!fs.existsSync(p)) {
        return await m.send("Error: Downloaded file does not exist.");
      }

      let index = 0, imgPath;
      do {
        imgPath = path.join(dir, `pdf${index === 0 ? "" : index}.jpg`);
        index++;
      } while (fs.existsSync(imgPath));

      try {
        fs.copyFileSync(p, imgPath);
        fs.unlinkSync(p);
      } catch (copyErr) {
        try {
          fs.renameSync(p, imgPath);
        } catch (renameErr) {
          fs.unlinkSync(p);
          return await m.send(`Failed to save image: ${renameErr.message}`);
        }
      }

      await m.send(`_*Images saved!*_\n_Total Images: ${fs.readdirSync(dir).length}_`);
    }
  } catch (err) {
    await m.send(`error: ${err.message || err}`);
  }
});


kord({
cmd: "calc|calculate",
  desc: "perform a calculation",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send('❏ i need a calculation.\n_example:_ .calc 2+3')
    if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(text)) {
    return await m.send('Invalid characters in calculation');
    }
    const result = eval(text);
    await m.send(`Result: ${text} = ${result}`);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
    cmd: "trt|translate",
    desc: "translate text to english/given lang code",
    fromMe: wtype,
    type: "utilities",
}, async (m, text, c) => {
    try{
        if (!text) return await m.send(`*reply to text/provide text with lang code*\n_example: ${c} en bonjour`)
        var f = text?.trim()?.split(/\s+/)[0]
        var a = text?.split(" ")
        var code = a[0] || config().LANG_CODE
        var t = m.quoted?.text || a.slice(1).join(" ")
        if (!a && !t) return await m.send(`*reply to text/provide text with lang code*\n_example: ${c} en bonjour`)
        var res = await m.axios(`https://kord-api.vercel.app/translate?text=${t}&code=${code}`)
        if (res.status == 400) return await m.send("*invalid language code provided*")
        return await m.send(`${res.translated}`)
    } catch (err) {
        console.error("error in translate:", err)
        return await m.send(`*error ocuurred:* ${err}`)
    }
})

kord({
cmd: "ngl",
    desc: "send message to the ngl api (username and message)",
    fromMe: wtype,
    type: "utilities",
}, async (m, text, c) => {
  try {
    if (!text) return await m.send(`*provide both username and message*\n_example: ${c} username:hello, i am a boy_`)
    var a = text.split(":")
    var user = a[0]?.trim()
    var msg = a.slice(1).join(":").trim()
    if (!msg) return await m.send(`_*provide msg*_\n_example: ${c} username:hello, i am a boy_`)

    var res = await m.axios(`https://kord-api.vercel.app/ngl?username=${encodeURIComponent(user)}&message=${encodeURIComponent(msg)}`)
    if (res?.success) {
    return await m.send(`*Message Sent!*`)
    } else {
    return await m.send(`*sorry, i encountered an error..*`)
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "ip|ipbot",
    desc: "get ip for the bot",
    fromMe: wtype,
    type: "utilities",
}, async (m) => {
  try {
    http.get({
    'host': 'api.ipify.org',
    'port': 80,
    'path': '/'
    }, function(resp) {
    let data = '';
    resp.on('data', function(chunk) {
    data += chunk;
});
        resp.on('end', function() {
            m.send(`*My public IP address is:* ${data}`);
        });
    }).on('error', function(err) {
        m.send(`error! ${err}`)
    })
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "wiki",
  desc: "search wiki",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("*provide a query to search*")
    const data = await m.axios(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
    if (!data) return await m.send("*error!*")

    return await m.send(`_*${data.title}*_\n\`\`\`${data.extract}\`\`\``)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "bible",
  desc: "get verse/verses from the bible",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("*provide reference*\n_example: bible john 3:16_")
    var r = text.trim()
    if (!r) return await m.send("*provide reference*\n_example: bible john 3:16_")
    var res = await m.axios(`https://bible-api.com/${encodeURIComponent(r)}`)
    return await m.send(`*THE BIBLE*\n\n_*Reference: ${res.reference}*_\n${res.text.trim()}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "font",
  desc: "change font of text",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) {
    let texxt = "*Fancy text generator*\n\n_*Example: .fancy 1 kord*_\n\n"
    listall("Kord-Ai").forEach((txt, num) => {
    texxt += `${num + 1} ${txt}\n`;
}); 
        return await m.send(`${texxt}`)
  }
  const num = parseInt(text.split(" ")[0], 10);
  if (isNaN(num)) return await m.send("*invalid font number!*\n_example: fancy 1 kord_")

  const txt = await fancytext(text.slice(text.indexOf(' ') + 1), num);
  return await m.send(`${txt}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "compress",
  desc: "compress image/video",
  fromMe: wtype,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!(m.image || m.video || m.quoted.image || m.quoted.video)) return await m.send("_*reply to an image/video*_")
    var pth = await m.client.dlandsave((m.image || m.video) ? m : (m.quoted.image || m.quoted.video) ? m.quoted : null)
    var ext = pth.split(".")[1]
    var opath = path.join(bin, `compressed_${Date.now()}.${ext}`)
    try {
      if (ext.match(/(jpg|jpeg|png|webp)/)) {
      const image = await Jimp.read(pth);
      await image
    .resize(800, Jimp.AUTO)
    .quality(60)
    .writeAsync(opath);

  await m.send(fs.readFileSync(opath), { caption: "> compressed image.." }, 'image')
      } else if (ext.match(/(mp4|mkv|avi)/)) {
                await m.reply("*_Compressing video..._* This might take minutes.")
                await new Promise((resolve, reject) => {
                    ffmpeg(pth)
                        .outputOptions([
                            '-c:v libx264',
                            '-preset faster',
                            '-crf 28',
                            '-b:v 500k',
                            '-maxrate 800k',
                            '-bufsize 1200k',
                            '-vf scale=-2:480',
                            '-c:a aac',
                            '-b:a 96k'
                        ])
                        .save(opath)
                        .on('end', resolve)
                        .on('error', reject);
                });
             await m.send(fs.readFileSync(opath), { caption: "*compressed video ...*"}, "video")
    }
    } catch (err) {
      return await m.send(`*Compression Error:* ${err}`)
    } finally {
            if (fs.existsSync(pth)) fs.unlinkSync(pth);
            if (fs.existsSync(opath)) fs.unlinkSync(opath);
        } 
  } catch (er) {
    console.error("error in compress cmd", er)
    return await m.send(`*error!*\n${er}`)
  }
})




kord({
cmd: 'getdevice|device',
  desc: 'Get device of sender or quoted',
  fromMe: wtype,
  type: 'utilities'
}, async (m) => {
  try {
    const id = m.quoted?.id || m.key?.id
    const device = getDevice(id)
    await m.reply(`Device: *${device}*`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})