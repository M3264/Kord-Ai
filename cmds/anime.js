/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord, extractUrlsFromString, fetchWaifu, getJson, prefix, wtype, ss } = require("../core")
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch")

kord({
    cmd: "anime",
    desc: "search for anime info from MyAnimeList",
    fromMe: wtype,
    react: "🔍",
    type: "anime",
}, async (m, text) => {
    try {
        if(!text) return m.send("_*provide anime name to search!*_")
        m.react("⏳")
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`)
        const json = await res.json()
        
        if(json.data.length < 1) return m.send("_*no results found!*_")
        const anime = json.data[0]
        let caption = `🎬 *${anime.title}*\n`
        caption += `🔖 *Type:* ${anime.type}\n`
        caption += `📊 *Score:* ${anime.score}\n`
        caption += `🎯 *Episodes:* ${anime.episodes}\n`
        caption += `📅 *Aired:* ${anime.aired.string}\n`
        caption += `🔞 *Rated:* ${anime.rating}\n`
        caption += `💫 *Status:* ${anime.status}\n\n`
        caption += `📝 *Synopsis:* ${anime.synopsis}`
        
        return m.send(anime.images.jpg.large_image_url, {caption}, "image")
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "waifu|animegirl",
    desc: "send random anime girl image",
    fromMe: wtype,
    react: "💕",
    type: "anime"
}, async(m, text) => {
    try {
        m.react("⌛")
        const categories = ["waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "kiss", "pat", "smug", "highfive"]
        let category = text || categories[Math.floor(Math.random() * categories.length)]
        if(!categories.includes(category)) category = "waifu"
        
        const res = await fetch(`https://api.waifu.pics/sfw/${category}`)
        const json = await res.json()
        return m.send(json.url, {caption: `> here's your ${category} waifu`}, "image")
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "manga",
    desc: "search for manga information from MyAnimeList",
    fromMe: wtype,
    react: "📚",
    type: "anime",
}, async (m, text) => {
    try {
        if(!text) return m.send("_*provide manga name to search!*_")
        m.react("🔎")

        const resp = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(text)}&limit=1`)
        const data = await resp.json()

        if(data.data.length < 1) return m.send("_*no manga found with that name!*_")
        const manga = data.data[0]

        let txt = `📕 *${manga.title}*\n`
        txt += `🔖 *Type:* ${manga.type}\n`
        txt += `⭐ *Score:* ${manga.score}\n`
        txt += `📑 *Chapters:* ${manga.chapters || "Unknown"}\n`
        txt += `📰 *Volumes:* ${manga.volumes || "Unknown"}\n`
        txt += `📅 *Published:* ${manga.published.string}\n`
        txt += `💫 *Status:* ${manga.status}\n\n`
        txt += `📝 *Synopsis:* ${manga.synopsis}`

        return m.send(manga.images.jpg.large_image_url, {caption: txt}, "image")
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "animequote",
    desc: "get random anime quote",
    type: "anime",
    fromMe: wtype,
    react: "💭"
}, async(m) => {
    try {
        const res = await fetch("https://yurippe.vercel.app/api/quotes?random=1")
        const quot = await res.json()
        const quote = quot[0]
        const msg = `💬 *Quote:* ${quote.quote}\n\n`
                + `👤 *Character:* ${quote.character}\n`
                + `📺 *Show:* ${quote.show}`

        return m.send(msg)
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "animenews",
    desc: "latest anime news from MyAnimeList",
    fromMe: wtype,
    type: "anime",
    react: "📰"
}, async(m, text) => {
    try {
        m.react("🔄")
        const res = await fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=5")
        const data = await res.json()
        if(!data.data || data.data.length < 1) return m.send("_*no trending anime found!*_")

        let msg = "🌟 *TOP TRENDING ANIME RIGHT NOW* 🌟\n\n"
        for(const anime of data.data) {
            msg += `📺 *${anime.title}*\n`
            msg += `⭐ *Score:* ${anime.score}\n`
            msg += `🔗 *Link:* ${anime.url}\n\n`
        }

        return m.send(msg)
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "character|animechar",
    desc: "search for anime character info",
    fromMe: wtype,
    type: "anime",
    react: "👤"
}, async(m, text) => {
    try {
        if(!text) return m.send("_*provide character name to search!*_")
        m.react("🔍")
        const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(text)}&limit=1`)
        const json = await res.json()

        if(json.data.length < 1) return m.send("_*no character found with that name!*_")
        const char = json.data[0]

        let info = `👤 *${char.name}*\n\n`
        if(char.nicknames.length > 0) {
            info += `✨ *Nicknames:* ${char.nicknames.join(", ")}\n\n`
        }
        info += `📝 *About:* ${char.about || "No information available"}`

        return m.send(char.images.jpg.image_url, {caption: info}, "image")
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "animesearch|animeinfo",
    desc: "search anime by image (reply to image)",
    fromMe: wtype,
    react: "🔍",
    type: "anime"
}, async(m) => {
    try {
        if(!m.quoted || !m.quoted.media) return m.send("_*reply to anime image to search*_")
        m.react("⏳")
        const path = await m.client.dlandsave(m.quoted)
        const url = await m.upload(path, "temp")
        const trace = await fetch(`https://api.trace.moe/search?url=${encodeURIComponent(url)}`)
        const result = await trace.json()

        if(!result.result || result.result.length < 1) return m.send("_*couldn't identify anime from image*_")

        const match = result.result[0]
        const preview = await fetch(`https://media.trace.moe/video/${match.anilist}/${encodeURIComponent(match.filename)}?t=${match.from}&token=${match.video}`)
        const buffer = await preview.buffer()

        let text = `🎯 *Found match!*\n\n`
        text += `📺 *Title:* ${match.filename}\n`
        text += `⏰ *Timestamp:* ${formatTime(match.from)} - ${formatTime(match.to)}\n`
        text += `🔍 *Similarity:* ${(match.similarity * 100).toFixed(2)}%\n`
        text += `🎬 *Episode:* ${match.episode || "Unknown"}`

        await m.send(buffer, {caption: text, gifPlayback: true}, "video")
        await fs.promises.unlink(path)
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60)
        const sec = Math.floor(seconds % 60)
        return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    }
})

kord({
    cmd: "animewatch|watching",
    desc: "track anime you're currently watching",
    fromMe: wtype,
    type: "anime",
    react: "📝"
}, async(m, text) => {
    const watchlistFile = path.join(__dirname, "../data/watchlist.json")
    let watchlist = {}

    try {
        if(fs.existsSync(watchlistFile)) {
            watchlist = JSON.parse(fs.readFileSync(watchlistFile))
        }

        if(!watchlist[m.sender]) watchlist[m.sender] = []

        if(!text) {
            if(watchlist[m.sender].length === 0) return m.send("_*your watchlist is empty*_\nAdd anime with .animewatch <anime name> | <episode>")
            let list = "📺 *YOUR ANIME WATCHLIST* 📺\n\n"
            watchlist[m.sender].forEach((anime, i) => {
                list += `${i+1}. *${anime.title}*\n`
                list += `   Episode: ${anime.episode}\n`
            })
            return m.send(list)
        }

        if(text.toLowerCase() === "clear") {
            watchlist[m.sender] = []
            fs.writeFileSync(watchlistFile, JSON.stringify(watchlist, null, 2))
            return m.send("_*successfully cleared your watchlist*_ ✅")
        }

        const parts = text.split("|").map(p => p.trim())
        if(parts.length < 2) return m.send("_*format:*_ .animewatch <anime name> | <episode>")

        const animeName = parts[0]
        const episode = parts[1]

        const existingIndex = watchlist[m.sender].findIndex(a => a.title.toLowerCase() === animeName.toLowerCase())
        if(existingIndex !== -1) {
            watchlist[m.sender][existingIndex].episode = episode
            fs.writeFileSync(watchlistFile, JSON.stringify(watchlist, null, 2))
            return m.send(`_*updated ${animeName} to episode ${episode}*_ ✅`)
        } else {
            watchlist[m.sender].push({title: animeName, episode: episode})
            fs.writeFileSync(watchlistFile, JSON.stringify(watchlist, null, 2))
            return m.send(`_*added ${animeName} (episode ${episode}) to watchlist*_ ✅`)
        }
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "animegif|animatedgif",
    desc: "sends random anime gif based on category",
    fromMe: wtype,
    type: "anime",
    react: "🎬"
}, async(m, text) => {
    try {
        m.react("⏳")
        const categories = ["happy", "sad", "angry", "dance", "hug", "kiss", "punch", "slap"]
        let category = text.toLowerCase()
        if(!text || !categories.includes(category)) category = categories[Math.floor(Math.random() * categories.length)]

        const res = await fetch(`https://nekos.best/api/v2/${category}`)
        const json = await res.json()
        if(!json.results || json.results.length < 1) return m.send("_*no gif found*_ 😔")

        return m.send(json.results[0].url, {caption: `> ${category} anime gif`, gifPlayback: true}, "video")
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "season|animeseason",
    desc: "get anime from specific season",
    fromMe: wtype,
    type: "anime",
    react: "🗓️"
}, async(m, text) => {
    try {
        if(!text) return m.send("_*provide season info:*_ .season <year> <season>\nSeasons: winter, spring, summer, fall")
        m.react("🔍")

        const args = text.split(" ")
        if(args.length < 2) return m.send("_*format:*_ .season <year> <season>")

        const year = args[0]
        const season = args[1].toLowerCase()
        const validSeasons = ["winter", "spring", "summer", "fall"]

        if(!validSeasons.includes(season)) return m.send("_*invalid season! Choose:*_ winter, spring, summer, fall")
        if(isNaN(year) || year < 1990 || year > 2030) return m.send("_*provide valid year between 1990-2030*_")

        const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}?limit=10`)
        const json = await res.json()

        if(!json.data || json.data.length < 1) return m.send(`_*no anime found for ${season} ${year}*_`)

        let msg = `📺 *ANIME FROM ${season.toUpperCase()} ${year}* 📺\n\n`
        for(let i = 0; i < json.data.length; i++) {
            const anime = json.data[i]
            msg += `${i+1}. *${anime.title}*\n`
            msg += `   Type: ${anime.type} | Score: ${anime.score || "N/A"}\n`
            if(i < 9) msg += "\n"
        }

        return m.send(msg)
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "animerec|recommend",
    desc: "get anime recommendations",
    fromMe: wtype,
    type: "anime",
    react: "🎯"
}, async(m, text) => {
    try {
        m.react("⏳")
        let url = "https://api.jikan.moe/v4/recommendations/anime"
        let limit = 5

        if(text) {
            const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`)
            const json = await res.json()
            if(json.data && json.data.length > 0) {
                url = `https://api.jikan.moe/v4/anime/${json.data[0].mal_id}/recommendations`
                limit = 5
            }
        }

        const res = await fetch(url)
        const json = await res.json()

        if(!json.data || json.data.length < 1) return m.send("_*no recommendations found*_ 😔")

        let msg = text ? `🎬 *BECAUSE YOU LIKE ${text.toUpperCase()}* 🎬\n\n` : "🎬 *ANIME RECOMMENDATIONS* 🎬\n\n"
        for(let i = 0; i < Math.min(json.data.length, limit); i++) {
            const rec = text ? json.data[i].entry : json.data[i].entry[0]
            msg += `${i+1}. *${rec.title}*\n`
            if(text) {
                msg += `   Votes: ${json.data[i].votes}\n`
            }
            if(i < Math.min(json.data.length, limit)-1) msg += "\n"
        }

        return m.send(msg)
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }
})

kord({
    cmd: "airing|nextep",
    desc: "check when next episode airs",
    fromMe: wtype,
    type: "anime",
    react: "📅"
}, async(m, text) => {
    try {
        if(!text) return m.send("_*provide anime name to check airing status*_")
        m.react("🕒")

        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&status=airing&limit=1`)
        const json = await res.json()

        if(!json.data || json.data.length < 1) return m.send(`_*couldn't find airing info for ${text}*_`)

        const anime = json.data[0]
        if(anime.status !== "Currently Airing") return m.send(`_*${anime.title} is not currently airing*_`)

        const schedule = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/schedule`)
        const scheduleJson = await schedule.json()

        if(!scheduleJson.data || Object.keys(scheduleJson.data).length === 0) 
            return m.send(`_*no schedule information available for ${anime.title}*_`)

        const now = new Date()
        let nextEp = null
        let nextDate = null

        for(const day in scheduleJson.data) {
            if(scheduleJson.data[day]?.length > 0) {
                const epDate = new Date(scheduleJson.data[day][0].aired)
                if(epDate > now) {
                    if(!nextDate || epDate < nextDate) {
                        nextDate = epDate
                        nextEp = scheduleJson.data[day][0]
                    }
                }
            }
        }

        if(!nextEp) return m.send(`_*no upcoming episodes found for ${anime.title}*_`)

        const timeUntil = timeDifference(now, nextDate)
        const msg = `📺 *${anime.title}*\n\n`
                + `⏰ Episode ${nextEp.episode} airs in: ${timeUntil}\n`
                + `📅 Date: ${nextDate.toDateString()}\n`
                + `🕒 Time: ${nextDate.toTimeString().split(' ')[0]}`

        return m.send(msg)
    } catch(e) {
        console.log("cmd error", e)
        return await m.sendErr(e)
    }

    function timeDifference(current, future) {
        const diff = future - current
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        let result = ""
        if(days > 0) result += `${days} day${days > 1 ? 's' : ''} `
        if(hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `
        result += `${minutes} minute${minutes > 1 ? 's' : ''}`
        
        return result
    }
})
const sendMedia = async (m, pic, caption, target) => {
    const mentions = target ? [m.sender, target] : []
    if (pic.gif) {
        return await m.send(pic.buff, { caption, gifPlayback: true, mentions }, "video")
    }
    return await m.send(pic.buff, { caption, mentions }, "image")
}

kord({
    cmd: "slap",
    desc: "slap someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("slap")
        let caption = target ? `@${m.sender.split("@")[0]} slapped @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "hug",
    desc: "hug someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("hug")
        let caption = target ? `@${m.sender.split("@")[0]} hugged @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "kiss",
    desc: "kiss someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("kiss")
        let caption = target ? `@${m.sender.split("@")[0]} kissed @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "pat",
    desc: "pat someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("pat")
        let caption = target ? `@${m.sender.split("@")[0]} patted @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "cuddle",
    desc: "cuddle someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("cuddle")
        let caption = target ? `@${m.sender.split("@")[0]} cuddled with @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "tickle",
    desc: "tickle someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("tickle")
        let caption = target ? `@${m.sender.split("@")[0]} tickled @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "spank",
    desc: "spank someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("spank")
        let caption = target ? `@${m.sender.split("@")[0]} spanked @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "feed",
    desc: "feed someone",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("feed")
        let caption = target ? `@${m.sender.split("@")[0]} fed @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "smug",
    desc: "send a smug face",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("smug")
        let caption = target ? `@${m.sender.split("@")[0]} gave @${target.split("@")[0]} a smug look` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "neko",
    desc: "send a neko",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("neko")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "waifu",
    desc: "send a waifu",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("waifu")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "meow",
    desc: "send a meow",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let target = m.mentionedJid[0] || m.quoted?.sender
        let pic = await fetchWaifu("meow")
        let caption = target ? `@${m.sender.split("@")[0]} meowed at @${target.split("@")[0]}` : ""
        return await sendMedia(m, pic, caption, target)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "woof",
    desc: "send a woof",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("woof")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "goose",
    desc: "send a goose",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("goose")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "lizard",
    desc: "send a lizard",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("lizard")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "foxgirl",
    desc: "send a fox girl",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("fox_girl")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "wallpaper",
    desc: "send an anime wallpaper",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("wallpaper")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

kord({
    cmd: "ngif",
    desc: "send a random neko gif",
    fromMe: wtype,
    type: "fun"
}, async (m) => {
    try {
        let pic = await fetchWaifu("ngif")
        return await sendMedia(m, pic, "", null)
    } catch (e) {
        return await m.sendErr(e)
    }
})

