const { kord,
  wtype,
  npmstalk,
  duckduckgo,
  searchBing,
  audioCut,
  ytaudio,
  ytvideo,
  prefix,
  searchYahoo } = require("../core")
const gis = require('g-i-s')
const { promisify } = require('util')
const { v4: uuidv4 } = require('uuid')
const gisPromise = promisify(gis)
const FormData = require('form-data')
const fetch = require('node-fetch')
const crypto = require('crypto')
const yts = require("yt-search")
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
kord(
{
        cmd: "websearch|search",
        desc: "search the web based on given query",
        fromMe: wtype,
        react: "🔎",
        type: "search",
}, async (m, text) => {
        let q
        if (!text) { 
           q = m.quoted?.text
        } else {
        q = text
        }
        if (!q) return m.send("_*reply/provide a query!*_")
         m.react("🔎")
         var res = await duckduckgo(q)
         if (!res.length) return m.send("_no results found_")
         const formatted = res.map((item, index) => {
  const fullLink = decodeURIComponent(item.link.split('uddg=')[1].split('&')[0])
  return `
➔ *Result ${index + 1}*
*❖ Title:* ${item.title}
*➔ Link:* ${fullLink}
*° Description:* ${item.description}
──────────────────────────────
`
}).join('\n')
        m.react("")
        return m.send(formatted)
})


kord({
        cmd: "img|image",
        desc: "search images based on query",
        fromMe: wtype,
        react: "🖼️",
        type: "search",
}, async (m, text) => {
        let q = text || m.quoted?.text
        if (!q) return m.send("_*Reply to a message or provide a search query!*_")
        m.react("⏳")
        const opt = {
                searchTerm: q,
                queryStringAddition: '&safe=false',
                filterOutDomains: ['deviantart.com']
        }
        try {
                const imgs = await gisPromise(opt)
                if (!imgs || imgs.length === 0) return m.send("_Sorry, I found nothing..._")
                const selected = imgs.slice(0, 3)
                for (let img of selected) {
                        await m.send(img.url, {}, "image")
                }
        m.react("")
        } catch (err) {
                console.error(err)
                m.send("_Failed to fetch images._")
        }
})

kord({
        cmd: "npm",
        desc: "gives description of a given npm package",
        fromMe: wtype,
        react: "📦",
        type: "search",
}, async (m, text) => {
        if (!text) return m.send(`_*provide a npm package*_\n_Example: ${prefix}npm axios`)
        var n = await npmstalk(text)
        return m.send(`\`\`\`❏ NPM PACKAGE INFO ❏ 
➥ _*Name:*_ ${name}
➥ _*Lastest Version:*_ ${versionLatest}
➥ _*Published Version:*_ ${versionPublish}
➥ _*Published Time:*_ ${publishTime}
➥ _*Latest Published Time:*_ ${latestPublishTime}
➥ _*Latest Dependencies:*_ ${latestDependencies}\`\`\``)
})


function buildStringToSign(
    method,
    uri,
    accessKey,
    dataType,
    signatureVersion,
    timestamp
) {
    return [method, uri, accessKey, dataType, signatureVersion, timestamp].join(
        '\n'
    )
}
function sign(signString, accessSecret) {
    return crypto
        .createHmac('sha1', accessSecret)
        .update(Buffer.from(signString, 'utf-8'))
        .digest()
        .toString('base64')
}
kord({
  cmd: "shazam|findaudio|find|identifyaudio",
  desc: "search for audio details of replied video/audio",
  fromMe: wtype,
  react: "🎶",
  type: "search",
}, async (m, text) => {
  if (!(m.quoted.audio || m.quoted.video)) return await m.send("❦ *Reply to a audio/video msg*")
  try {
    var media = await m.client.dlandsave(m.quoted)
    var opt = {
      host: 'identify-eu-west-1.acrcloud.com',
      endpoint: '/v1/identify',
      signature_version: '1',
      data_type: 'audio',
      secure: true,
      access_key: '8c21a32a02bf79a4a26cb0fa5c941e95',
      access_secret: 'NRSxpk6fKwEiVdNhyx5lR0DP8LzeflYpClNg1gze',
    }
    const daa = await audioCut(media, 0, 15)
    const data = daa.data
    const current_data = new Date()
    const timestamp = current_data.getTime() / 1000
    const stringToSign = buildStringToSign(
      'POST',
      opt.endpoint,
      opt.access_key,
      opt.data_type,
      opt.signature_version,
      timestamp
    )
    const signature = sign(stringToSign, opt.access_secret)
    const form = new FormData()
    form.append('sample', data)
    form.append('sample_bytes', data.length)
    form.append('access_key', opt.access_key)
    form.append('data_type', opt.data_type)
    form.append('signature_version', opt.signature_version)
    form.append('signature', signature)
    form.append('timestamp', timestamp)

    const res = await fetch('http://' + opt.host + opt.endpoint, {
      method: 'POST',
      body: form,
    })
    const { status, metadata } = await res.json()
    if (status.code === 0) {
      const track = metadata.music[0]
      let ytInfo = null
      try {
        const searchQuery = `${track.title} ${track.artists[0].name}`
        const ytResults = await yts(searchQuery)
        ytInfo = ytResults.videos[0]
      } catch (error) {
        console.error("YouTube search error:", error)
      }
      const resultText = `_*Audio Found!*_\n\n` +
        `➤ *Title*: ${track.title}\n` +
        `➤ *Artist*: ${track.artists.map(a => a.name).join(", ")}\n` +
        `➤ *Album*: ${track.album.name}\n` +
        `➤ *Released*: ${track.release_date || "N/A"}\n\n` +
        `*_Listen On:_*\n` +
        `➤ *Spotify*: ${track.external_metadata.spotify?.track.id ? 
          `https://open.spotify.com/track/${track.external_metadata.spotify.track.id}` : "N/A"}\n` +
        `➤ *YouTube*: ${ytInfo ? ytInfo.url : 
          (track.external_metadata.youtube?.vid ? 
            `https://youtube.com/watch?v=${track.external_metadata.youtube.vid}` : "N/A")}\n\n` +
        (ytInfo ? `*YouTube Info:*\n` +
          `➤ *Views*: ${ytInfo.views.toLocaleString()}\n` +
          `➤ *Duration*: ${ytInfo.duration.timestamp}\n` +
          `➤ *Uploaded*: ${ytInfo.ago}\n` : '') + 
          `_*REPLY*_\n 1. audio\n 2. video\n_to download it!*_`
      
      const thumbnailUrl = ytInfo?.thumbnail || 
        (track.external_metadata.spotify?.album.id ? 
          `https://i.scdn.co/image/${track.external_metadata.spotify.album.id}` :
          "https://via.placeholder.com/300")
      var sMsg = await m.send(thumbnailUrl, { caption: resultText, quoted: m }, "image")
      
      try {
        var rMsg = await m.getResponse(sMsg, 60000)
        await sMsg.react("⏰")
        var rs = rMsg.text.toLowerCase()
        if (rs === "audio" || rs === "download" || rs === "1" || rs === "send") {
          if (!ytInfo || !ytInfo.url) {
            return await m.send("Sorry, YouTube link not available to download audio")
          }
          var mp3Link = await ytaudio(ytInfo.url)
          var mp = mp3Link.url
          await m.send(mp, { ptt: false, quoted: rMsg }, "audio")
          
        } else if (rs === "video" || rs === "2") {
          if (!ytInfo || !ytInfo.url) {
            return await m.send("Sorry, YouTube link not available to download video")
          }
          
          var mp4Link = await ytvideo(ytInfo.url)
          var mk = mp4Link.url
          await m.send(mk, { caption: `*Video for ${ytInfo.title}*`, quoted: rMsg }, "video")
        } else {
          await m.send("Invalid option. Please reply with either '1' for audio or '2' for video.")
        }
      } catch (e) {
        console.error("Response handling error:", e)
        await sMsg.react("")
      }
            
    } else {
      return await m.send("_Couldn't find that song..._")
    }
    const filesToDelete = [media, daa.path]
    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
  } catch (error) {
    console.error(error)
    return await m.send(`Error: ${error.message || error}`)
  }
})



kord({
  cmd: "element",
  desc: "get info of a periodic element",
  fromMe: wtype,
  type: "tools",
}, async (m, text) => {
  if (!text) return await m.send(`*𝌫 Provide an element name!*\n_example: ${prefix}element Hydrogen`)
  const elementName = encodeURIComponent(text)
      var apiUrl = `https://api.popcat.xyz/periodic-table?element=${elementName}`
      var data = await m.axios(apiUrl)
            if (data.name) {
              const imageUrl = data.image
      const responseText = `
*✠ Element Name:* ${data.name}
*✠ Symbol:* ${data.symbol}
*✠ Atomic Number:* ${data.atomic_number}
*✠ Atomic Mass:* ${data.atomic_mass}
*✠ Period:* ${data.period}
*✠ Phase:* ${data.phase}
*✠ Discovered By:* ${data.discovered_by}

*❍ Summary:* ${data.summary}
`

      await m.send(imageUrl, { caption: responseText, quoted: m}, "image")
            } else {
              return await m.send("_nothing found.._")
            }
})