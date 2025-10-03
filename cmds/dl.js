/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord, wtype, prefix, sleep, extractUrlsFromString, fb, ytaudio, config, ytvideo, xdl, tt, insta, mediaFire, rand, getBuffer } = require("../core")
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
    var data = await m.axios(`https://api.kordai.biz.id/api/apk?q=${text}`)
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
    var data = await m.axios(`https://api.kordai.biz.id/api/apkdl?id=${q}`)
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
    var info = await m.axios(`https://api.kordai.biz.id/api/apksearch?query=${text}`);
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
    data = await m.axios(`https://api.kordai.biz.id/api/subtitle?q=${text}`);
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
    const pageUrl = decodeURIComponent(text.replace("d--", ""));
    if (pageUrl.toLowerCase().includes("tempête dans une tasse de thé")) {
    return await m.send("_Busy API or invalid subtitle. Try again later._");
    }
    
    await m.send("_Fetching available subtitle languages..._");
    let data = await m.axios(`https://api.kordai.biz.id/api/subtiledl?q=${encodeURIComponent(pageUrl)}`);
    
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
    const info = await m.axios(`https://api.kordai.biz.id/api/subtitlepage?q=${text}`);
    if (!Array.isArray(info) || info.length === 0) {
    return await m.send("_No subtitle results found._");
    }
    
    const formatted = info.slice(0, 10).map(res => ({
    name: `${res.title} (${res.languagesSummary
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})`,
      id: `apksearch dl--${encodeURIComponent(res.pageUrl)}`
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



kord({
        cmd: "ytv|ytmp4",
        desc: "download a YouTube video with its link",
        type: "downloader",
        fromMe: wtype,
}, async (m, text) => {
        var source;
        var link
        if (!text) { 
        source = m.quoted?.text
        if (!source) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
        } else {
        source = text
        }
        if (!source) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
        m.react("⏰")
        var lik = await extractUrlsFromString(source)
        if (lik.length === 0) {
                let result = await yts(source)
                lik = [result.videos[0]?.url]
        }
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
         link = lik.find(url => ytRegex.test(url));
        if (!link) {
        let result = await yts(text)
        link = result.videos[0]?.url
        if (!link) return m.send("_*No results found for your query.*_")
}
      if (!link) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
      if (!ytRegex.test(link)) return m.send(`_*provide a valid YouTube link! or use ${prefix}video if you want to download a video with its name.*_`)
     try {
           let videoData = await ytvideo(link)
           var test = videoData.url.toLowerCase()
           if (test.includes("processing"))  await sleep(1000)
           videoData = await ytvideo(link)
           if (!videoData.url) return m.send("_*failed to fetch video, try again*_")
           m.react("")
           return await m.send(videoData.url, { caption: `➟ ${videoData.title}\n\n${config().CAPTION}`, quoted: m }, "video")
     } catch (e) {
             console.error(e)
             return m.send(`${e}`)
     }
})


kord({
        cmd: "yta|ytmp3",
        desc: "downloads YouTube audio with its link",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        var source;
if (!text) {
        source = m.quoted?.text
        if (!source) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
} else {
        source = text
}
if (!source) return m.send(`_*provide a YouTube link*_\n_Example: ${prefix}yt https://youtube.com/video_`)
m.react("⏰")
var lik = await extractUrlsFromString(source)
if (lik.length === 0) {
        let result = await yts(source)
        lik = [result.videos[0]?.url]
}
const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
var link = lik.find(url => ytRegex.test(url));
if (!link) {
        let result = await yts(text)
        link = result.videos[0]?.url
        if (!link) return m.send("_*No results found for your query.*_")
}
if (!link) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
if (!ytRegex.test(link)) return m.send(`_*provide a valid YouTube link! or use ${prefix}play if you want to download a audio with its name.*_`)
try {
        let audioD = await ytaudio(link)
        var test = audioD.url.toLowerCase()
        if (test.includes("processing")) await sleep(1000)
        audioD = await ytaudio(link)
        if (!audioD.url) return m.send("_*failed to fetch video, try again*_")
        m.react("")
       return await m.send(audioD.url, { caption: `➟ ${audioD.title}\n\n${config().CAPTION}`, mimetype: "audio/mpeg", quoted: m }, "audio")
} catch (e) {
        console.error(e)
      return  m.send(`${e}`)
}
}
)

kord({
        cmd: "video|ytvideo",
        desc: "downloads and send video based on the title given",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide a query*_\n_example: ${prefix}video avengers doomsday trailer_`)
        m.react("⏰")
        var ytsr = await yts(text)
        var ytsd = ytsr.videos[0]
        var dl = await ytvideo(ytsd.url)
        var caption = `*❦ ᴠɪᴅᴇᴏ ᴅᴇᴛᴀɪʟꜱ ❦*
*➟ Video Url:* ${ytsd.url}
*➟ Title:* ${ytsd.title}
*➟ Description:* ${ytsd.description}
*➟ Duration:* ${ytsd.duration.timestamp}
*➟ Views:* ${ytsd.views.toLocaleString()}
*➟ Date Uploaded:* ${ytsd.ago}

${config().CAPTION}`
m.react("")

        return await m.send(dl.url, {caption: caption, quoted: m}, "video")
} catch (err) {
        console.error(err)
       return m.send(`an error occured: ${err}`)
}
})

kord({
        cmd: "play|music",
        desc: "downloads and send audio based on the title given",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide a query*_\n_example: ${prefix}play unstoppable_`)
        m.react("⏰")
        var ytsr = await yts(text)
        var ytsa = ytsr.videos[0]
        var dl = await ytaudio(ytsa.url)
        var cap = `00:00 ───◁ㅤ ❚❚ ㅤ▷─── ${ytsa.duration.timestamp} ♡`
        m.react("")
        return await m.send(dl.url, {ptt: false,
            mimetype: 'audio/mpeg',
            contextInfo: {
              externalAdReply: {
                title: ytsa.title,
                body: cap,
                mediaType: 1,
                renderLargerThumbnail: false,
                thumbnailUrl: ytsa.thumbnail,
                sourceUrl: ytsa.url
              }
            }
            }, "audio")
            } catch (err) {
        console.error(err)
       return m.send(`an error occured: ${err}`)
}
})
kord({
       cmd: "videodoc|ytvideodoc",
        desc: "downloads and send video(document) based on the title given",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
                if (!text) return await m.send(`_*provide a query*_\n_example: ${prefix}video avengers doomsday trailer_`)
                m.react("⏰")
                var ytsr = await yts(text)
                var ytsd = ytsr.videos[0]
                var dl = await ytvideo(ytsd.url)
                var caption = `*❦ ᴠɪᴅᴇᴏ ᴅᴇᴛᴀɪʟꜱ ❦*
*➟ Video Url:* ${ytsd.url}
*➟ Title:* ${ytsd.title}
*➟ Description:* ${ytsd.description}
*➟ Duration:* ${ytsd.duration.timestamp}
*➟ Views:* ${ytsd.views.toLocaleString()}
*➟ Date Uploaded:* ${ytsd.ago}

${config().CAPTION}`
m.react("")
                
                return await m.send(dl.url, { mimetype: "video/mp4", fileName: `${ytsd.title}.mp4`, caption: caption, quoted: m }, "document") 
        }catch (err) {
        console.error(err)
      return  m.send(`an error occured: ${err}`)
        }
})

kord({
        cmd: "playdoc|musicdoc",
        desc: "downloads and send audio from YouTube as doc",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        try {
        if (!text) return await m.send(`_*provide a query*_\n_example: ${prefix}play unstoppable_`)
        m.react("⏰")
        var ytsr = await yts(text)
        var ytsa = ytsr.videos[0]
        var dl = await ytaudio(ytsa.url)
        var cap = `00:00 ───◁ㅤ ❚❚ ㅤ▷─── ${ytsa.duration.timestamp} ♡`
        m.react("")
        return await m.send(dl.url, {ptt: false,
            mimetype: 'audio/mpeg',
            fileName: `${ytsa.title}.mp3`,
            caption: ytsa.title,
            contextInfo: {
              externalAdReply: {
                title: ytsa.title,
                body: cap,
                mediaType: 1,
                renderLargerThumbnail: false,
                thumbnailUrl: ytsa.thumbnail,
                sourceUrl: ytsa.url
              }
            }
            }, "document")
        } catch (err) {
        console.error(err)
        return m.send(`an error occured: ${err}`)
        }
})

kord({
        cmd: "ytvdoc|ytmp4doc",
        desc: "download a YouTube video with its link and send as document",
        type: "downloader",
        fromMe: wtype,
}, async (m, text) => {
        var source;
        if (!text) { 
        source = m.quoted?.text
        if (!source) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
        } else {
        source = text
        }
        if (!source) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
        var lik = await extractUrlsFromString(source)
        if (lik.length === 0) {
        let result = await yts(source)
        lik = [result.videos[0]?.url]
}
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        var link = lik.find(url => ytRegex.test(url));
        if (!link) {
        let result = await yts(source)
        link = result.videos[0]?.url
        if (!link) return m.send("_*No results found for your query.*_")
}
      if (!link) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
      if (!ytRegex.test(link)) return m.send(`_*provide a valid YouTube link! or use ${prefix}video if you want to download a video with its name.*_`)
      m.react("⏰")
     try {
           let videoData = await ytvideo(link)
           var test = videoData.url.toLowerCase()
           if (test.includes("processing"))  await sleep(1000)
           videoData = await ytvideo(link)
           if (!videoData.url) return m.send("_*failed to fetch video, try again*_")
           m.react("")
           return await m.send(videoData.url, { mimetype: "video/mp4", fileName: `${videoData.title}.mp4`, caption: `➟ ${videoData.title}\n\n${config().CAPTION}`, quoted: m }, "document")
     } catch (e) {
             console.error(e)
            return m.send(`${e}`)
     }
})

kord({
        cmd: "ytadoc|ytmp3doc",
        desc: "downloads YouTube audio with its link",
        fromMe: wtype,
        type: "downloader",
}, async (m, text) => {
        var source;
if (!text) {
        source = m.quoted?.text
        if (!source) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
} else {
        source = text
}
if (!source) return m.send(`_*provide a YouTube link*_\n_Example: ${prefix}yt https://youtube.com/video_`)
var lik = await extractUrlsFromString(source)
if (lik.length === 0) {
        let result = await yts(source)
        lik = [result.videos[0]?.url]
}
const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
var link = lik.find(url => ytRegex.test(url));
if (!link) {
        let result = await yts(source)
        link = result.videos[0]?.url
        if (!link) return m.send("_*No results found for your query.*_")
}
if (!link) return m.send(`_*provide a YouTube link/title*_\n_Example: ${prefix}yt https://youtube.com/video_`)
if (!ytRegex.test(link)) return m.send(`_*provide a valid YouTube link! or use ${prefix}play if you want to download a audio with its name.*_`)
        m.react("⏰")
try {
        let audioD = await ytaudio(link)
        var test = audioD.url.toLowerCase()
        if (test.includes("processing")) await sleep(1000)
        audioD = await ytaudio(link)
        if (!audioD.url) return m.send("_*failed to fetch video, try again*_")
        m.react("")
       return await m.send(audioD.url, { mimetype: 'audio/mpeg', fileName: `${audioD.title}.mp3`, caption: `➟ ${audioD.title}\n\n${config().CAPTION}`, quoted: m }, "audio")
} catch (e) {
        console.error(e)
    return    m.send(`${e}`)
}
})

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
                const dta = await fetch(`https://api.kordai.biz.id/api/tik-img?url=${encodeURIComponent(link)}`);
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
                        vid = fbD?.data?.[0];
                        if (vid) break;
                        retries++;
                        await sleep(2000);
                }
                
                if (!vid) return m.react("");
                
                const dl = vid.hdQualityLink || vid.normalQualityLink;
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
        let lik;
if (!text) {
        lik = m.quoted?.text
} else {
        lik = text
}
if (!lik) return m.send("_*reply/provide a mediafire link!*_")
m.react("⏰")
var links = await extractUrlsFromString(lik)
const mfregex = /^(https?:\/\/)?(www\.)?(mediafire\.com)\/.+$/;
var link = links.find(url => mfregex.test(url));
        const mfdl = await mediaFire(link)
var filename = mfdl.title
var size = mfdl.size
var timeDate = `${mfdl.time} - ${mfdl.date}`
var  dlLink = mfdl.url
var caption = `*❦ ᴍ ᴇ ᴅ ɪ ᴀ ꜰ ɪ ʀ ᴇ • ᴅ ᴏ ᴡ ɴ ʟ ᴏ ᴀ ᴅ ᴇ ʀ ❦*
➠ *FileName:* ${filename}
➠ *File Size:* ${size}
➠ *File Date:* ${timeDate}

${config().CAPTION}`
        m.react("")
        return await m.client.sendFileUrl(m.chat, dlLink, caption, m)
        } catch (err) {
        console.error(err)
       return
       await m.send(`${err}`)
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