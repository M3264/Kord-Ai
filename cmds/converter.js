/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const {kord, webp2png, webp2mp4, elevenlabs, rand, getBuffer, toAudio, config, processAudio, extractUrlsFromString, toPTT, isMediaURL, wtype} = require("../core")

const { Sticker, StickerTypes } = require("wa-sticker-formatter")
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const { Image } = require("node-webpmux")
const ff = require("fluent-ffmpeg")
const path = require('path')
const {
   read
} = require('jimp')
const {
   fromBuffer
} = require('file-type')

kord({
        cmd: "sticker|s|stk",
        desc: "converts replied media to sticker",
        fromMe: wtype,
        type: "converter",
}, async (m, text) => {
  try {
    if (!(m.image || m.video || m.quoted.video || m.quoted.image)) return await m.send("_Reply to photo or video_")
    let buff = await m.client.downloadMediaMessage((m.image || m.video) ? m : m.quoted ? m.quoted : null)
    
    let stkpack, stkauthor
    
    if (text) {
      if (text.includes(',') || text.includes(';') || text.includes('|')) {
        const parts = text.split(/[,;|]/).map(s => s.trim())
        stkpack = parts[0] || config().STICKER_PACKNAME
        stkauthor = parts[1] || config().STICKER_AUTHOR
      } else {
        stkpack = text.trim()
        stkauthor = ""
      }
    } else {
      stkpack = config().STICKER_PACKNAME
      stkauthor = config().STICKER_AUTHOR
    }
    
    return await m.sendstk(buff, { packname: stkpack, author: stkauthor})
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
  })


kord({
cmd: "photo|toimg",
        desc: "convert sticker to image",
        fromMe: wtype,
        type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.sticker) return await m.send("_reply to a sticker_")
    if (m.quoted.isAnimated) return await m.send("_reply to a photo sticker_")
    let buff = await m.quoted.download()
    return m.send(buff, {}, "image")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "ptv",
        desc: "converts video to ptv message",
        fromMe: wtype,
        type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.video) return await m.send("_reply to a video_")
    var vid = await m.quoted.download()
    return await m.send(vid, {ptv: true}, 'video')
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "mp4",
        desc: "converts sticker to video",
        fromMe: wtype,
        type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.sticker) return await m.send("_reply to a sticker_")
    if (!m.quoted.isAnimated) return await m.send("_reply to a video sticker_")
    let buffer = await webp2mp4(await m.quoted.download())
    return await m.send(buffer, {}, "video")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "gif",
        desc: "converts sticker to gif",
        fromMe: wtype,
        type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.sticker) return await m.send("_reply to a sticker_")
    if (!m.quoted.isAnimated) return await m.send("_reply to a video sticker_")
    let buffer = await webp2mp4(await m.quoted.download())
    return await m.send(buffer, { gifPlayback: true }, "video")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "tomp3|toaudio",
  desc: "convert video to audio",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
  if (!m.quoted.video) return await m.send("_Reply to a video_")
  var au = await toAudio(await m.quoted.download(), "mp3")
  return await m.send(au, { ptt: false, mimetype: "audio/mpeg" }, "audio")
  } catch (er){
    return await m.send(`${er}`)
  }
})

kord({
cmd: "black",
  desc: "converts mp3 to black video",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.audio) return m.send("_reply to audio_")
    const args = text?.trim()?.split(/\s+/)
    const ffmpegg = ff()
    let file = path.join(__dirname, '../core/store/black.jpg')
    if (!fs.existsSync(file)) {
    const blackImg = await getBuffer("https://cdn.kordai.biz.id/serve/n2BwUtItyeae.jpg")
    fs.writeFileSync(file, blackImg)
    }
    if (args[0] && await isMediaURL(args[0])) {
    const buff = await getBuffer(extractUrlsFromString(args)[0])
    const readed = await read(buff)
    if (readed.getWidth() != readed.getHeight()) return await m.send('_image width and height must be same!!_')
    const {
    mime
    } = await fromBuffer(buff)
    if (!['jpg', 'jpeg', 'png'].includes(mime.split('/')[1])) return await m.send("*_please provide a image url_*")
    file = '../core/store/' + mime.replace('/', '.')
    fs.writeFileSync(file, buff)
    const audioFile = path.join(__dirname, '../core/store/audio.mp3')
    var buf = await m.quoted.download()
    fs.writeFileSync(audioFile, buf)
    const Opath = path.join(__dirname, '../core/store/videoMixed.mp4')
    ffmpegg.input(file)
    ffmpegg.input(audioFile)
    ffmpegg.output(Opath)
    ffmpegg.on('end', async () => {
    await m.send(fs.readFileSync(Opath), {}, 'video')
    fs.unlinkSync(audioFile)
    fs.unlinkSync(Opath)
      ffmpegg.on('error', async (err) => {
         await m.send(`${err}`)
      })
      ffmpegg.run()
      })
    }
    } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
cmd: "roundstk|round",
  desc: "create or convert sticker to round frame type",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
    if (!(m.image || m.quoted.sticker || m.quoted.image)) return await m.send("_reply to a photo/sticker_")
    if (m.quoted.isAnimated) return await m.send("_reply to a photo sticker_")
    var media = await m.client.downloadMediaMessage(m.image ? m : m.quoted ? m.quoted : null)
    
    let stkpack, stkauthor
    
    if (text) {
      if (text.includes(',') || text.includes(';') || text.includes('|')) {
        const parts = text.split(/[,;|]/).map(s => s.trim())
        stkpack = parts[0] || config().STICKER_PACKNAME
        stkauthor = parts[1] || config().STICKER_AUTHOR
      } else {
        stkpack = text.trim()
        stkauthor = ""
      }
    } else {
      stkpack = config().STICKER_PACKNAME
      stkauthor = config().STICKER_AUTHOR
    }
    
    let sticker = new Sticker(media, {
    pack: stkpack,
    author: stkauthor,
    type: StickerTypes.ROUNDED,
    categories: ["🤩", "🎉"],
    id: "https://github.com/M3264/Kord-Ai",
    quality: 75,
    })
   const buffer = await sticker.toBuffer()
   await m.send(buffer, {packname: stkpack, author: stkauthor}, "sticker")
    } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "circlestk|circle",
  desc: "create or convert sticker to circle frame type",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
    if (!(m.image || m.quoted.sticker || m.quoted.image)) return await m.send("_reply to a photo/sticker_")
    if (m.quoted.isAnimated) return await m.send("_reply to a photo sticker_")
    var media = await m.client.downloadMediaMessage(m.image ? m : m.quoted ? m.quoted : null)
    
    let stkpack, stkauthor
    
    if (text) {
      if (text.includes(',') || text.includes(';') || text.includes('|')) {
        const parts = text.split(/[,;|]/).map(s => s.trim())
        stkpack = parts[0] || config().STICKER_PACKNAME
        stkauthor = parts[1] || config().STICKER_AUTHOR
      } else {
        stkpack = text.trim()
        stkauthor = ""
      }
    } else {
      stkpack = config().STICKER_PACKNAME
      stkauthor = config().STICKER_AUTHOR
    }
    
    let sticker = new Sticker(media, {
    pack: stkpack,
    author: stkauthor,
    type: StickerTypes.CIRCLE ,
    categories: ["🤩", "🎉"],
    id: "https://github.com/M3264/Kord-Ai",
    quality: 75,
})
   const buffer = await sticker.toBuffer()
   await m.send(buffer, { packname: stkpack, author: stkauthor }, "sticker")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
  cmd: "take|steal",
  desc: "change the data of a sticker or audio",
  fromMe: wtype,
  type: "converter",
}, async(m, text) => {
  if (!(m.quoted.sticker || m.quoted.audio)) return await m.send("_*reply to a sticker or audio*_")
  
  if (m.quoted.sticker) {
    let stkpack, stkauthor
    
    if (text) {
      if (text.includes(',') || text.includes(';') || text.includes('|')) {
        const parts = text.split(/[,;|]/).map(s => s.trim())
        stkpack = parts[0] || config().STICKER_PACKNAME
        stkauthor = parts[1] || config().STICKER_AUTHOR
      } else {
        stkpack = text.trim()
        stkauthor = ""
      }
    } else {
      stkpack = config().STICKER_PACKNAME
      stkauthor = config().STICKER_AUTHOR
    }
    
    await m.send(await m.quoted.download(), {packname: stkpack, author: stkauthor}, "sticker")
  } else if (m.quoted.audio) {
    let data
    var buf = await m.quoted.download()
    const audioBuffer = Buffer.from(buf)
    const audioResult = await toAudio(audioBuffer, 'mp4')
    
    if (text) {
      data = text.split(";")
    } else {
      data = config().AUDIO_DATA.split(";") || ["kord", "v2", ""]
    }
    
    const title = data[0] || "kord"
    const artist = data[1] || "v2"
    const coverUrl = data[2] || "https://cdn.kordai.biz.id/serve/tuNyPANPYD2v.png"
    
    try {
      const audioBase64 = audioResult.toString('base64')
      
      const response = await fetch('https://kord-api.vercel.app/add-mp3-meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          songUrl: `data:audio/mp4;base64,${audioBase64}`,
          coverUrl: coverUrl,
          title: title,
          artist: artist
        })
      })
      
      if (!response.ok) {
        throw new Error('API request failed')
      }
      
      const taggedAudio = await response.buffer()
      await m.send(taggedAudio, { mimetype: "audio/mp4" }, "audio")
    } catch (error) {
      console.error('API Error:', error)
      await m.send(audioResult, { mimetype: "audio/mp4" }, "audio")
    }
  }
})

kord({
cmd: "exif",
  desc: "get exif data of a sticker",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.sticker) return await m.send("_reply to a sticker_")
    let img = new Image();
    await img.load(await m.quoted.download());
    const exif = JSON.parse(img.exif.slice(22).toString());
    const stickerPackId = exif['sticker-pack-id'];
    const stickerPackName = exif['sticker-pack-name'];
    const stickerPackPublisher = exif['sticker-pack-publisher'];
    const cap = (`_*Sticker Pack ID ➱*_ ${stickerPackId}\n\n_*Pack name ➱*_ ${stickerPackName}\n_*Publisher ➱*_ ${stickerPackPublisher}`)
    return m.send(cap)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "aitts",
  desc: "tts ai with id split with |",
  fromMe: wtype,
  type: "converter",
}, async (m, text, cmd) => {
  try {
    if (text == 'list')
    return await m.send(` *List of Available Aitts models*\n\n 1 _rachel_ \n 2 _clyde_ \n 3 _domi_ \n 4 _dave_ \n 5 _fin_ \n 6 _bella_ \n 7 _antoni_ \n 8 _thomas_ \n 9 _charlie_ \n 10 _emily_ \n 11 _elli_ \n 12 _callum_ \n 13 _patrick_ \n 14 _harry_ \n 15 _liam_ \n 16 _dorothy_ \n 17 _josh_ \n 18 _arnold_ \n 19 _charlotte_ \n 20 _matilda_ \n 21 _matthew_ \n 22 _james_ \n 23 _joseph_ \n 24 _jeremy_ \n 25 _michael_ \n 26 _ethan_ \n 27 _gigi_ \n 28 _freya_ \n 29 _grace_ \n 30 _daniel_ \n 31 _serena_ \n 32 _adam_ \n 33 _nicole_ \n 34 _jessie_ \n 35 _ryan_ \n 36 _sam_ \n 37 _glinda_ \n 38 _giovanni_ \n 39 _mimi_ \n`.replace(/├/g, ''));
    let [txt, id] = text.split("|");
    if (!txt) {
    return await m.send(`*_Provide text to speak_*\n_Example: ${cmd} hey there|jeremy_\n\nTo see list of voices, use *aitts list*`);
    }
    if (!id) id = "jeremy";
    const stream = await elevenlabs(txt, id);
    if (!stream) {
    return await m.send(`_Seems API key is invalid or not found_\n\n*Get API key from:* https://elevenlabs.io/app/settings/api-keys\nThen set using: .setting ELEVENLABS_APIKEY yourkey\nOr set manually in config.js`);
    }
    return await m.send(stream, { mimetype: 'audio/mpeg', ptt: true }, 'audio');
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "doc",
  desc: "converts media to document",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
    var name = (text || await rand()).replace(/[^A-Za-z0-9]/g,'-');
    if (!(m.image || m.video || m.quoted.image || m.quoted.video || m.quoted.audio)) return await m.send("reply to an image/audio/video")
    var msg = (m.image || m.video) ? m : m.quoted ? m.quoted : null
    var media = await m.client.downloadMediaMessage(msg)
    const { ext, mime } = await fromBuffer(media);
    return await m.send(media, { mimetype: mime, fileName: name + "." + ext }, "document");
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "tovv",
  desc: "convert media to viewonce",
  fromMe: wtype,
  type: "converter",
}, async (m, text) => {
  try {
    if (!(m.image || m.video || m.quoted.image || m.quoted.video || m.quoted.audio)) return await m.send("reply to an image/audio/video")
    var media = (m.image || m.video) ? m : m.quoted ? m.quoted : null
    var buf = await m.client.downloadMediaMessage(media)
    if (m.image) {
    await m.send(buf, { viewOnce: true}, "image")
    } else if (m.video) {
    await m.send(buf, { viewOnce: true}, "video")
    } else if (m.quoted.image) {
    await m.send(buf, { viewOnce: true}, "image")
    } else if (m.quoted.video) {
    await m.send(buf, { viewOnce: true}, "video")
    } else if (m.quoted.audio) {
    await m.send(buf, { viewOnce: true}, "audio")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "bass",
  desc: "apply bass effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
  try {
    if (!m.quoted.audio) return await m.send("_reply a audio_")
    const output = await processAudio(m, "bass", [
    "-af", "equalizer=f=54:width_type=o:width=2:g=20"
    ]);
    await m.client.sendMessage(m.chat, {
    audio: require("fs").readFileSync(output ),
    mimetype: 'audio/mp4',
    ptt: false
    }, { quoted: m
})
     fs.unlinkSync(output)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "blown",
  desc: "apply blown effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "blown", [
                    "-af", "acrusher=.1:1:64:0:log"
                ]);
   await m.client.sendMessage(m.chat, {
     audio: require("fs").readFileSync(outputPath),
     mimetype: 'audio/mp4',
     ptt: false
     })
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "deep",
  desc: "apply deep effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "deep", [
                    "-af", "atempo=4/4,asetrate=44500*2/3"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "earrape",
  desc: "apply extremely loud effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "earrape", [
                    "-af", "volume=12"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "fast",
  desc: "speed up audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "fast", [
                    "-filter:a", "atempo=1.63,asetrate=44100"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "fat",
  desc: "apply fat effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "fat", [
                    "-filter:a", "atempo=1.6,asetrate=22100"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "nightcore",
  desc: "apply nightcore effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "nightcore", [
                    "-filter:a", "atempo=1.06,asetrate=44100*1.25"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "reverse",
  desc: "reverse audio playback",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "reverse", [
                    "-filter_complex", "areverse"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "squirrel",
  desc: "apply squirrel voice effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "squirrel", [
                    "-filter:a", "atempo=0.5,asetrate=65100"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "robot",
  desc: "apply robot voice effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "robot", [
                    "-af", "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "slow",
  desc: "slow down audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "slow", [
                    "-filter:a", "atempo=0.7,asetrate=44100"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "smooth",
  desc: "apply smooth effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "smooth", [
                    "-af", "asubboost=dry=0:wet=1:decay=0.1:feedback=0.1:cutoff=100:slope=0.5:delay=20"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "chipmunk",
  desc: "apply chipmunk voice effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "chipmunk", [
                    "-filter:a", "atempo=0.8,asetrate=65100*1.3"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "tremolo",
  desc: "apply tremolo effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "tremolo", [
                    "-af", "tremolo=f=6:d=0.5"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "vibrato",
  desc: "apply vibrato effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "vibrato", [
                    "-af", "vibrato=f=7:d=0.5"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "8d",
  desc: "apply 8D surround effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "8d", [
                    "-af", "apulsator=hz=0.125"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "echo",
  desc: "apply echo effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "echo", [
                    "-af", "aecho=0.8:0.9:1000:0.3"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

kord({
  cmd: "flanger",
  desc: "apply flanger effect to audio",
  fromMe: wtype, 
  type: "converter",
}, async (m, text) => {
try {
  if (!m.quoted.audio) return await m.send("_reply a audio_")
  const outputPath = await processAudio(m, "flanger", [
                    "-af", "flanger=delay=5:depth=2:regen=5:width=5:speed=2:shape=sine:phase=90:interp=linear"
                ]);
   await m.client.sendMessage(m.chat, {      audio: require("fs").readFileSync(outputPath),      mimetype: 'audio/mp4',      ptt: false      }, { quoted: m})
  fs.unlinkSync(outputPath);
} catch (e) {
  console.error(e)
  return await m.send(`error...: ${e}`)
}
})

