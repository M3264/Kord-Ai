/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord, wtype, prefix, sleep, extractUrlsFromString, fb, ytaudio, config, ytvideo, xdl, tt, insta, mediaFire, rand, gdrive, getBuffer, kordGet, kordFetch } = require("../core")
const yts = require("yt-search")
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

kord({
cmd: "apk",
  desc: "download an andriod app",
  type: "downloader",
  fromMe: wtype,
}, async (m, text) => {
  try {
    if (!text) return await m.send("_*Provide a apk name*_")
    var data = await kordGet(`https://api.kordai.tech/api/apk?q=${text}`)
    if (data.error) return await m.send("_Apk not found.._")
    var cap = `❑ Name: ${data.app_name}
    ❑ Package Name: ${data.package_name}
    ❑ Version: ${data.version}
    ❑ Downloads: ${data.downloads}
    
    ${config().CAPTION}`
    var buff = await getBuffer(data.download_url)
    await m.send(
    buff,
    {
    mimetype: "application/vnd.android.package-archive",
    fileName: data.app_name,
    caption: cap,
    quoted: m
    },
    "document"
    );
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
cmd: "apksearch",
  desc: "search apk and download",
  fromMe: wtype,
  type: "search",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_provide a apk name_")
    if (text.startsWith("dl--")) {
    var q = text.replace("dl--", "")
    await m.send("downloading app...")
    var data = await kordGet(`https://api.kordai.tech/api/apkdl?id=${q}`)
    if (data.error) return await m.send("_Apk not found.._")
    var cap = `❑ Name: ${data.name}
    ❑ Package Name: ${data.package}
    ❑ Version: ${data.version}
    
    ${config().CAPTION}`
    var buff = await getBuffer(data.downloadUrl)
    await m.send(
    buff,
    {
    mimetype: "application/vnd.android.package-archive",
    fileName: data.name,
    caption: cap,
    quoted: m
    },
    "document"
    );
    } else {
    var info = await kordGet(`https://api.kordai.tech/api/apksearch?query=${text}`);
    const formatted = info.splice(0, 10).map(app => ({
    name: app.name,
    id: `apksearch dl--${app.id}`
}))

return await m.send({
  name: `Apk Download for ${text}`,
  values: formatted,
  onlyOnce: false,
  withPrefix: true,
  participates: [m.sender, m.ownerJid],
  selectableCount: true,
}, { quoted: m }, "poll");
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
  
})

kord({
  cmd: "subtitle",
  desc: "Download English subtitle for a movie",
  type: "downloader",
  fromMe: wtype,
}, async (m, text) => {
  if (!text) return await m.send("_*Provide a movie name*_");
  let data;
  try {
    data = await kordGet(`https://api.kordai.tech/api/subtitle?q=${text}`);
  } catch (e) {
    return await m.send("_Failed to fetch subtitle data._");
  }
  if (
    !data.downloadLinks || 
    data.downloadLinks.length === 0 || 
    (data.title && data.title.toLowerCase().includes("tempête dans une tasse de thé"))
  ) {
    return await m.send("_Busy API or invalid subtitle. Please try again later._");
  }
  const englishSub = data.downloadLinks.find(d => d.language.toLowerCase().includes("english"));
  if (!englishSub)
    return await m.send("_English subtitle not found._");
  const caption = `❑ Title: ${data.title}
❑ Language: English

${config().CAPTION}`;
  const buffer = await getBuffer(englishSub.url);
  await m.send(
    buffer,
    {
      mimetype: "application/x-subrip",
      fileName: `${data.title}-en.srt`,
      caption,
      quoted: m,
    },
    "document"
  );
});

kord({
cmd: "subtitlesearch|subtitles",
  desc: "Search subtitles from SubtitleCat",
  fromMe: wtype,
  type: "search",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_provide a movie name_");
    
    if (text.startsWith("dl--")) {
    const pageUrl = decodeURIComponent(text.slice("dl--".length));
    if (pageUrl.toLowerCase().includes("tempête dans une tasse de thé")) {
    return await m.send("_Busy API or invalid subtitle. Try again later._");
    }
    
    await m.send("_Fetching available subtitle languages..._");
    let data = await kordGet(`https://api.kordai.tech/api/subtiledl?q=${encodeURIComponent(pageUrl)}`);
    
    if (!Array.isArray(data) || data.length === 0)
    return await m.send("_No subtitles found or server busy._");
    
    const english = data.find(d => d.language.toLowerCase().includes("english"));
    if (!english) return await m.send("_English subtitle not available._");
    
    const fileName = decodeURIComponent(pageUrl.split("/").pop().replace(".html", "-en.srt"));
    
    const buffer = await getBuffer(english.url);
    await m.send(
    buffer,
    {
    mimetype: "application/x-subrip",
    fileName: fileName,
    caption: `❑ Language: English\n${config().CAPTION}`,
    quoted: m
    },
    "document"
    );
    } else {
    const info = await kordGet(`https://api.kordai.tech/api/subtitlepage?q=${text}`);
    if (!Array.isArray(info) || info.length === 0) {
    return await m.send("_No subtitle results found._");
    }
    
    const formatted = info.slice(0, 10).map(res => ({
    name: `${res.title}`,
      id: `subtitles dl--${encodeURIComponent(res.pageUrl)}`
    }));

    return await m.send({
      name: `Subtitle Search Results for ${text}`,
      values: formatted,
      onlyOnce: false,
      withPrefix: true,
      participates: [m.sender, m.ownerJid],
      selectableCount: true,
    }, { quoted: m }, "poll");
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
});



const { resolveYoutubeInput, parseYoutubeQuality } = require('../core/tools')

for (const definition of [
  { cmd: 'ytv|ytmp4', format: 'mp4' },
  { cmd: 'yta|ytmp3', format: 'mp3' },
  { cmd: 'video|ytvideo', format: 'mp4' },
  { cmd: 'play|music', format: 'mp3' },
  { cmd: 'videodoc|ytvideodoc', format: 'mp4', document: true },
  { cmd: 'playdoc|musicdoc', format: 'mp3', document: true },
  { cmd: 'ytvdoc|ytmp4doc', format: 'mp4', document: true },
  { cmd: 'ytadoc|ytmp3doc', format: 'mp3', document: true },
]) {
  kord({
    cmd: definition.cmd,
    desc: `Download YouTube ${definition.format === 'mp3' ? 'audio' : 'video'}${definition.document ? ' as a document' : ''} from a link or title${definition.format === 'mp4' ? ' (optional: 360p, 720p, 1080p)' : ''}`,
    type: 'downloader',
    fromMe: wtype,
  }, async (m, text) => {
    try {
      const parsed = definition.format === 'mp4' ? parseYoutubeQuality(text) : { source: text?.trim(), quality: 720 }
      const source = parsed.source || m.quoted?.text?.trim()
      if (!source) return await m.send('Provide a YouTube link or a search title.')
      await m.react('⏰')
      const video = await resolveYoutubeInput(source, yts)
      const download = await (definition.format === 'mp3' ? ytaudio(video.url) : ytvideo(video.url, parsed.quality))
      if (!download?.url) throw new Error('Unable to download this video. Please try again shortly.')
      const title = String(download.title || video.title || 'YouTube').replace(/[\/\\:*?"<>|\x00-\x1f]/g, '').slice(0, 150)
      const options = {
        mimetype: definition.format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
        fileName: `${title}.${definition.format}`,
        quoted: m,
      }
      if (definition.document || definition.format === 'mp4') options.caption = `➟ ${title}\n\n${config().CAPTION || ''}`
      if (definition.format === 'mp3') options.ptt = false
      return await m.send(download.url, options, definition.document ? 'document' : definition.format === 'mp3' ? 'audio' : 'video')
    } catch (error) {
      console.error('YouTube command failed:', error.message)
      const message = /abort|timeout/i.test(error.message) ? 'The download took too long. Please try again.' : error.message || 'YouTube download failed. Please try again.'
      return await m.send(message)
    } finally {
      try { await m.react('') } catch {}
    }
  })
}

kord({
        cmd: "tt|tiktok",
        desc: "downloads tiktok videos using the link given",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
        let lik;
        if (!text) { 
           lik = m.quoted?.text
        } else {
        lik = text
        }
        if (!lik) return m.send("_*reply/provide a tiktok link!*_")
        m.react("⏰")
        var links = await extractUrlsFromString(lik)
        const ttregex = /https:\/\/(?:www\.|vm\.|m\.|vt\.)?tiktok\.com\/(?:(@[\w.-]+\/(?:video|photo)\/\d+)|v\/\d+\.html|[\w-]+\/?)(?:\?.*)?$/
        var link = links.find(url => ttregex.test(url))
    if (!link) {
        m.react("❌");
        return m.send("No valid TikTok link found.");
    }
    var vData = await tt(link);
    if (!vData.success || !vData.data) {
        m.react("❌");
        return m.send(`Failed to fetch TikTok data: ${JSON.stringify(vData)}`);
    }
    if (!vData.data.downloadLinks || vData.data.downloadLinks.length === 0) {
        m.react("❌");
        return m.send("_No download links found for this TikTok_");
    }
    var dlLink = vData.data.downloadLinks[0].link;
    var titl = `${vData.data.title || "TikTok Video"}\n${config().CAPTION}`;
    m.react("✅");
    return await m.send(dlLink, {caption: titl, quoted: m}, "video");
} catch (err) {
    console.error("TikTok download error:", err);
    m.react("❌");
    return m.send(`An error occurred: ${err.message || err}`);
}
        
})

kord({
        cmd: "tik-img|tt-img",
        desc: "downloads tiktok images using the link given",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
                let lik;
                if (!text) {
                        lik = m.quoted?.text;
                } else {
                        lik = text;
                }
                if (!lik) return m.send("_*reply/provide a tiktok link!*_");
                m.react("⏰");
                var links = await extractUrlsFromString(lik);
                const ttregex = /https:\/\/(?:www\.|vm\.|m\.|vt\.)?tiktok\.com\/(?:(@[\w.-]+\/(?:video|photo)\/\d+)|v\/\d+\.html|[\w-]+\/?)(?:\?.*)?$/
                var link = links.find(url => ttregex.test(url));
                const dta = await kordFetch(`https://api.kordai.tech/api/tik-img?url=${encodeURIComponent(link)}`);
                const data = await dta.json();
                if (!data.downloadableImages || data.downloadableImages.length === 0) {
                        return m.send("_No images found._");
                }
                for (const imgUrl of data.downloadableImages) {
                        await m.send(imgUrl, {}, "image");
                }
                m.react("")
                
        } catch (err) {
                console.error(err);
                return m.send(`_${err.message || err}_`);
        }
});

kord({
        cmd: "twitter|xdl",
        desc: "downloads Twitter/X video/pic",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
        let lik;
        if (!text) {
                lik = m.quoted?.text
        } else {
                lik = text
        }
        if (!lik) return m.send("_*reply/provide a valid twitter link!*_")
        m.react("⏰")
        var links = await extractUrlsFromString(lik)
        const xregex = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.?com)\/.+$/;
        var link = links.find(url => xregex.test(url));
        var xd = await xdl(link)
        var xddl = xd.links[0].url
        m.react("")
        return await m.client.sendFileUrl(m.chat, xddl, config().CAPTION, m)
        } catch (er) {
         console.error(er)
         return await m.send(`${er}`)
        }
})

kord({
        cmd: "fb|facebook",
        desc: "downloads Facebook videos",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
                let lik = text || m.quoted?.text;
                if (!lik) return m.send("_*reply/provide a valid Facebook link!*_");
                
                m.react("⏰");
                
                const links = await extractUrlsFromString(lik);
                const fbregex = /^(https?:\/\/)?(www\.)?(fb\.com|facebook\.?com)\/.+$/;
                const link = links.find(url => fbregex.test(url));
                if (!link) return m.send("_*No valid Facebook URL found!*_");
                
                let fbD, vid, retries = 0;
                const maxRetries = 3;
                
                while (retries < maxRetries) {
                        fbD = await fb(link);
                        vid = fbD?.videos
                        if (vid) break;
                        retries++;
                        await sleep(2000);
                }
                
                if (!vid) return m.react("");
                
                const dl = vid.hd.url || vid.sd.url
                if (!dl) return m.react("");
                
                m.react("");
                return await m.send(dl, { caption: config().CAPTION }, "video");
                
        } catch (e) {
                console.error(e);
                return await m.send(`${e}`);
        }
});

kord({
        cmd: "insta|ig",
        desc: "downloads Instagram videos/images",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
                let lik;
if (!text) {
        lik = m.quoted?.text
} else {
        lik = text
}
if (!lik) return m.send("_*reply/provide a valid Instagram link!*_")
m.react("⏰")
var links = await extractUrlsFromString(lik)
const igregex = /^(https?:\/\/)?(www\.)?(ig\.com|instagram\.?com)\/.+$/;
var link = links.find(url => igregex.test(url)); 
        var data = await insta(link)
        var title = data.title || undefined;
        const dlUrl = data.url || data.thumb;
        m.react("")
        return await m.client.sendFileUrl(m.chat, dlUrl, config().CAPTION, m)
        } catch (e) {
        console.error(e)
        return await m.send(`${e}`)
        }
})

kord({
        cmd: "mediafire",
        desc: "downloads mediafire links",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
          let lik
                
                if (!text) {
                        lik = m.quoted?.text
                } else {
                        lik = text
                }

                if (!lik) return m.send("_*reply/provide a mediafire link!*_")

                m.react("⏰")

                const links = await extractUrlsFromString(lik)

                const mfregex = /^(https?:\/\/)?(www\.)?(mediafire\.com)\/.+$/i

                const link = links.find(url => mfregex.test(url))

                if (!link) {
                        m.react("")
                        return m.send("_*invalid mediafire link!*_")
                }

                const mfdl = await mediaFire(link)

                const filename = mfdl.filename
                const size = mfdl.size || "Unknown"
                const uploaded = mfdl.uploadedText || "Unknown"
                const dlLink = mfdl.directUrl

                const caption = `*❦ ᴍ ᴇ ᴅ ɪ ᴀ ꜰ ɪ ʀ ᴇ • ᴅ ᴏ ᴡ ɴ ʟ ᴏ ᴀ ᴅ ᴇ ʀ ❦*
➠ *FileName:* ${filename}
➠ *File Size:* ${size}
➠ *Uploaded:* ${uploaded}

${config().CAPTION}`

                m.react("")

                return await m.client.sendFileUrl(
                        m.chat,
                        dlLink,
                        caption,
                        m
                )

        } catch (err) {
                console.error(err)
                m.react("")
                return await m.send(String(err))
        }
})


kord({
        cmd: "gdrive",
        desc: "downloads google drive files",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
                let lik

                if (!text) {
                        lik = m.quoted?.text
                } else {
                        lik = text
                }

                if (!lik) return m.send("_*reply/provide a google drive link!*_")

                m.react("⏰")

                const links = await extractUrlsFromString(lik)

                const gdRegex = /^(https?:\/\/)?(drive\.google\.com)\/.+$/i

                const link = links.find(url => gdRegex.test(url))

                if (!link) {
                        m.react("")
                        return m.send("_*invalid google drive link!*_")
                }

                const data = await gdrive(link)

                const filename = data.filename || "Google Drive File"
                const size = data.size || "Unknown"
                const dlLink = data.directUrl

                const caption = `*❦ ɢ ᴏ ᴏ ɢ ʟ ᴇ • ᴅ ʀ ɪ ᴠ ᴇ • ᴅ ᴏ ᴡ ɴ ʟ ᴏ ᴀ ᴅ ᴇ ʀ ❦*
➠ *FileName:* ${filename}
➠ *File Size:* ${size}

${config().CAPTION}`

                m.react("")

                return await m.client.sendFileUrl(
                        m.chat,
                        dlLink,
                        caption,
                        m
                )

        } catch (err) {
                console.error(err)
                m.react("")
                return await m.send(String(err))
        }
})


kord({
  cmd: "gitclone|gitdl",
  desc: "download the zip file of a repo link",
  fromMe: wtype,
  type: "downloader",
}, async(m, text) => {
 try {
  let lik;
if (!text) {
        lik = m.quoted?.text
} else {
        lik = text
}
if (!lik) return await m.send("*provide a repo link!*")
    var links = await extractUrlsFromString(lik)
    const gcregex = /^(https?:\/\/)?(www\.)?(github\.com)\/.+$/;
    var link = links.find(url => gcregex.test(url));
    let user = link.split("/")[3];
   let repo = link.split("/")[4];
   await m.react("⏳")
   await m.send(`https://api.github.com/repos/${user}/${repo}/zipball`, { fileName: `${repo}-${rand()}.zip`, mimetype: "application/zip", quoted: m }, "document");
   await m.react("")
 } catch(e) {
   console.error("gitclone err", e)
   return await m.send("*error!*\nrepo might be private")
 }
})


kord({
        cmd: "pint|pinterest",
        desc: "downloads Pinterest videos/images",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
                let lik
                if (!text) {
                        lik = m.quoted?.text
                } else {
                        lik = text
                }
                if (!lik) return m.send("_*reply/provide a valid Pinterest link!*_")
                m.react("⏰")
                var links = await extractUrlsFromString(lik)
                const pinregex = /^(https?:\/\/)?(www\.)?(pin\.it|pinterest\.?com)\/.+$/
                var link = links.find(url => pinregex.test(url))
                if (!link) return m.send("_*No valid Pinterest URL found!*_")

                const api = `https://api.kordai.tech/api/pinterest?url=${encodeURIComponent(link)}`
                const res = await kordFetch(api)
                const json = await res.json()
                const data = json?.data?.data
                if (!data) return m.react("")

                const downloads = data.downloads || []
                const video = downloads.find(v => v.format === "MP4")?.url
                const thumb = downloads.find(v => v.format === "JPG")?.url
                const dlUrl = video || thumb

                if (!dlUrl) return m.react("")
                m.react("")
                return await m.client.sendFileUrl(m.chat, dlUrl, config().CAPTION, m)

        } catch (e) {
                console.error(e)
                return await m.send(`${e}`)
        }
})