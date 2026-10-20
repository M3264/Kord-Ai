/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord,
        wtype,
        eBinary,
        dBinary,
        getMeta,
        config,
        getData,
        storeData,
        sleep
} = require("../core")

kord({
cmd: "quote",
  desc: "get random quote",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var q = await m.axios("https://favqs.com/api/qotd")
    return await m.send(
    `\`\`\`┏ QUOTE ┓\`\`\`
    \n\`\`\`${q.quote.body}\`\`\`
    > ${q.quote.author}`
    )
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "fact",
  desc: "get random fact",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var f = await m.axios("https://nekos.life/api/v2/fact")
    return await m.send(
    `\`\`\`┏ FACT ┓\`\`\`
    \n\`\`\`${f.fact}\`\`\``
    )
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "q|quotely",
  desc: "quote sticker; q r includes the original reply; q image or q r image sends an image",
  fromMe: wtype,
  type: "misc",
}, async (m, text, c, str) => {
  return require("../core/quote").sendQuote(m, str, text)
})

kord({
cmd: "ebinary|ebin",
  desc: "encode text to binary",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var txt = text || m.quoted.text
    if (!txt) return await m.send("_Reply or provide a text._")
    return await m.send(await eBinary(txt))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "dbinary|dbin",
  desc: "decode text to binary",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var txt = text || m.quoted.text
    if (!txt) return await m.send("_Reply or provide a text._")
    return await m.send(await dBinary(txt))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "pick",
  desc: "pick a random person in group",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  try {
    if (!text) return await m.send("*provide a reason!*")
    var gm = await getMeta(m.client, m.chat)
    var p = gm.participants
    var user = p[Math.floor(Math.random() * p.length)].id
    return await m.send(`The ${text} person here is: @${user.split("@")[0]}`, {mentions: [user] })
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "pickupl|pickupline",
  desc: "get pickupline",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var p = await m.axios("https://api.popcat.xyz/pickuplines")
    return await m.send(
    `\`\`\`┏ PICKUP-LINE ┓\`\`\`
    \n\`\`\`${p.pickupline}\`\`\``
    )
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "breakupl|breakupline",
  desc: "get breakupline",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var p = await m.axios("https://breakupline-api.vercel.app/")
    return await m.send(
    `\`\`\`┏ BREAKUP-LINE ┓\`\`\`
    \n\`\`\`${p}\`\`\``
    )
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "wyr",
  desc: "would you rather",
  fromMe: wtype,
  type: "fun"
}, async m => {
  try {
    const b = await m.axios("https://api.popcat.xyz/wyr")
    return await m.client.sendMessage(m.chat, {
      poll: {
        name: "Would You Rather?",
        values: [b.ops1, b.ops2],
        selectableCount: 1
      }
    }, {
      quoted: m
    })
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

 
 kord({
  cmd: "insult|roast",
  desc: "sends an insult message to replied/mentioned user",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
  var t = m.quoted?.sender || m.mentionedJid?.[0] || null
  if (!t) return await m.send("_reply or mention a user_")
  var yr = await m.axios("https://insult.mattbas.org/api/insult.json?who=youuu")
  var r = yr.insult
  if (t) {
    await m.send(`${yr.insult}`.replace("youuu", `@${t.split("@")[0]}`), { mentions: [t] })
  } else return await m.send("_reply or mention a user_")
  } catch (er) {
    console.error("cmd error: ", er)
    return await m.sendErr(er)
  }
})

kord({
  cmd: "emojimix|emix",
  desc: "mix two emojis into a sticker",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    if (!text || !text.includes("+")) return await m.send(`Example: ${prefix}emojimixx 😎+🤡`)
    var [emoji1, emoji2] = text.split("+")
    var url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
    var r = await m.axios(url)
    if (!r.results || r.results.length < 1) return await m.send("No mix found")
    var img = r.results[0].media_formats.png_transparent.url
    if (img) {
    return await m.send(img, { packname: config().STICKER_PACKNAME, author: config().STICKER_AUTHOR, quoted: m }, "sticker")
    } else {
      await m.react("🚫")
      sleep(2000)
      await m.react("")
    }
  } catch (e) {
    console.error("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
  cmd: "addnote|writenote|savenote",
  desc: "write note to db",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!m.quoted.text || !text) return await m.send("_reply to the note/text with its name_")
    var data = await getData("notes") || {}
    data[text.split(" ")[0]] = m.quoted.text
    await storeData("notes", data)
    return await m.send(`_save note for name: ${text.split(" ")[0]}_`)
  } catch (err) {
    console.error("cmd error(notes)", err)
    return await m.sendErr(err)
  }
})

kord({
  cmd: "delnote|removenote|deletenote",
  desc: "remove note from db",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_provide the note's name_")
    var data = await getData("notes") || {} 
    var noteName = text.split(" ")[0]
    if (!data[noteName]) return await m.send("_no note was found with that name_")
    delete data[noteName]
    await storeData("notes", data)
    return await m.send(`_deleted note: ${noteName}_`)
  } catch(err) {
    console.error("cmd error", err)
    return await m.sendErr(err)
  }
})

kord({
  cmd: "allnotes|notes|getnotes",
  desc: "get all saved notes",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    var data = await getData("notes") || {}
    if (Object.keys(data).length === 0) return await m.send("_no notes found_")
    
    var notesList = ""
    for (let name in data) {
      notesList += `*${name}:* ${data[name]}\n\n`
    }
    
    return await m.send(`*All Notes:*\n\n${notesList}`)
  } catch (err) {
    console.error("cmd error(allnotes)", err)
    return await m.sendErr(err)
  }
})

kord({
  cmd: "getnote|readnote|note",
  desc: "get specific note by name",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_provide note name_")
    var data = await getData("notes") || {}
    var noteName = text.split(" ")[0]
    
    if (!data[noteName]) return await m.send("_note not found_")
    
    return await m.send(`*${noteName}:*\n${data[noteName]}`)
  } catch (err) {
    console.error("cmd error(getnote)", err)
    return await m.sendErr(err)
  }
})

kord({
  cmd: "delallnote|delnotes|clearallnotes",
  desc: "delete all notes from db",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    var data = await getData("notes") || {}
    if (Object.keys(data).length === 0) return await m.send("_no notes to delete_")
    
    await storeData("notes", {})
    return await m.send("_all notes deleted successfully_")
  } catch (err) {
    console.error("cmd error(delallnotes)", err)
    return await m.sendErr(err)
  }
})
