const { kord, wtype, extractUrlsFromString, fb, ytaudio, ytvideo, xdl, tt, insta, mediaFire, config, kordFetch } = require("../core")
const { getData, storeData } = require("../core")

const AUTODL_KEY = "autodl_chats"

const urlPatterns = {
  youtube: /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com|youtu\.be)\/.+/,
  tiktok: /https:\/\/(?:www\.|vm\.|m\.|vt\.)?tiktok\.com\/(?:(@[\w.-]+\/(?:video|photo)\/\d+)|v\/\d+\.html|[\w-]+\/?)(?:\?.*)?$/,
  twitter: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.?com)\/.+$/,
  facebook: /^(https?:\/\/)?(www\.)?(fb\.com|facebook\.?com)\/.+$/,
  instagram: /^(https?:\/\/)?(www\.)?(ig\.com|instagram\.?com)\/.+$/,
  mediafire: /^(https?:\/\/)?(www\.)?(mediafire\.com)\/.+$/,
  pinterest: /^(https?:\/\/)?(www\.)?(pin\.it|pinterest\.?com)\/.+$/
}

async function getAutoDlChats() {
  const data = await getData(AUTODL_KEY)
  return data || []
}

async function addAutoDlChat(chatId) {
  const chats = await getAutoDlChats()
  if (!chats.includes(chatId)) {
    chats.push(chatId)
    await storeData(AUTODL_KEY, chats)
  }
  return true
}

async function removeAutoDlChat(chatId) {
  const chats = await getAutoDlChats()
  const filtered = chats.filter(id => id !== chatId)
  await storeData(AUTODL_KEY, filtered)
  return true
}

async function downloadYoutube(link, m) {
  try {
    let videoData = await ytvideo(link)
    if (videoData.url?.toLowerCase().includes("processing")) {
      await new Promise(r => setTimeout(r, 1000))
      videoData = await ytvideo(link)
    }
    if (!videoData.url) return false
    await m.send(videoData.url, { caption: `${videoData.title}\n\n${config().CAPTION}` }, "video")
    return true
  } catch (e) {
    console.error("autodl yt error:", e)
    return false
  }
}

async function downloadTiktok(link, m) {
  try {
    const vData = await tt(link)
    if (!vData.success || !vData.data?.downloadLinks?.length) return false
    const dlLink = vData.data.downloadLinks[0].link
    const title = `${vData.data.title || "TikTok Video"}\n${config().CAPTION}`
    await m.send(dlLink, { caption: title }, "video")
    return true
  } catch (e) {
    console.error("autodl tt error:", e)
    return false
  }
}

async function downloadTwitter(link, m) {
  try {
    const xd = await xdl(link)
    const xddl = xd.links[0].url
    await m.client.sendFileUrl(m.chat, xddl, config().CAPTION, m)
    return true
  } catch (e) {
    console.error("autodl x error:", e)
    return false
  }
}

async function downloadFacebook(link, m) {
  try {
    let fbD = await fb(link)
    const vid = fbD?.videos
    if (!vid) return false
    const dl = vid.hd?.url || vid.sd?.url
    if (!dl) return false
    await m.send(dl, { caption: config().CAPTION }, "video")
    return true
  } catch (e) {
    console.error("autodl fb error:", e)
    return false
  }
}

async function downloadInstagram(link, m) {
  try {
    const data = await insta(link)
    const dlUrl = data.url || data.thumb
    if (!dlUrl) return false
    await m.client.sendFileUrl(m.chat, dlUrl, config().CAPTION, m)
    return true
  } catch (e) {
    console.error("autodl ig error:", e)
    return false
  }
}

async function downloadMediafire(link, m) {
  try {
    const mfdl = await mediaFire(link)
    const caption = `*ᴍᴇᴅɪᴀꜰɪʀᴇ ᴅᴏᴡɴʟᴏᴀᴅ*\n➠ *File:* ${mfdl.title}\n➠ *Size:* ${mfdl.size}\n\n${config().CAPTION}`
    await m.client.sendFileUrl(m.chat, mfdl.url, caption, m)
    return true
  } catch (e) {
    console.error("autodl mf error:", e)
    return false
  }
}

async function downloadPinterest(link, m) {
  try {
    const api = `https://api.kordai.tech/api/pinterest?url=${encodeURIComponent(link)}`
    const res = await kordFetch(api)
    const json = await res.json()
    const data = json?.data?.data
    if (!data) return false
    const downloads = data.downloads || []
    const video = downloads.find(v => v.format === "MP4")?.url
    const thumb = downloads.find(v => v.format === "JPG")?.url
    const dlUrl = video || thumb
    if (!dlUrl) return false
    await m.client.sendFileUrl(m.chat, dlUrl, config().CAPTION, m)
    return true
  } catch (e) {
    console.error("autodl pin error:", e)
    return false
  }
}

kord({
  cmd: "autodl",
  desc: "toggle auto download for this chat",
  type: "downloader",
  fromMe: wtype
}, async (m, text) => {
  try {
    const action = text?.toLowerCase()
    const chatId = m.chat
    const chats = await getAutoDlChats()
    const isEnabled = chats.includes(chatId)

    if (action === "on" || action === "enable") {
      if (isEnabled) return m.send("_AutoDL is already enabled in this chat_")
      await addAutoDlChat(chatId)
      return m.send("_AutoDL enabled for this chat_")
    }

    if (action === "off" || action === "disable") {
      if (!isEnabled) return m.send("_AutoDL is not enabled in this chat_")
      await removeAutoDlChat(chatId)
      return m.send("_AutoDL disabled for this chat_")
    }

    if (action === "list") {
      if (chats.length === 0) return m.send("_No chats have AutoDL enabled_")
      return m.send(`*AutoDL Enabled Chats:*\n${chats.join("\n")}`)
    }

    const status = isEnabled ? "enabled" : "disabled"
    return m.send(`_AutoDL is currently ${status} in this chat_\n\nUsage:\n• autodl on\n• autodl off\n• autodl list`)
  } catch (e) {
    console.error("autodl cmd error:", e)
    return m.send(`${e}`)
  }
})

kord({
  on: "all",
  fromMe: false
}, async (m, text) => {
  try {
    const chats = await getAutoDlChats()
    if (!chats.includes(m.chat)) return

    const urls = await extractUrlsFromString(text)
    if (urls.length === 0) return
    if (!urls) return 
    for (const url of urls) {
      let downloaded = false

      if (urlPatterns.youtube.test(url)) {
        downloaded = await downloadYoutube(url, m)
      } else if (urlPatterns.tiktok.test(url)) {
        downloaded = await downloadTiktok(url, m)
      } else if (urlPatterns.twitter.test(url)) {
        downloaded = await downloadTwitter(url, m)
      } else if (urlPatterns.facebook.test(url)) {
        downloaded = await downloadFacebook(url, m)
      } else if (urlPatterns.instagram.test(url)) {
        downloaded = await downloadInstagram(url, m)
      } else if (urlPatterns.mediafire.test(url)) {
        downloaded = await downloadMediafire(url, m)
      } else if (urlPatterns.pinterest.test(url)) {
        downloaded = await downloadPinterest(url, m)
      }

      if (downloaded) break
    }
  } catch (e) {
    console.error("autodl listener error:", e)
  }
})