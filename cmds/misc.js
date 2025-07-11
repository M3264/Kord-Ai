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
        getMeta
} = require("../core")
const axios = require("axios")

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
  desc: "makes sticker of replied messaged",
  fromMe: wtype,
  type: "misc",
}, async (m, text, c, str) => {
  try {
    if (!m.quoted) return await m.send("_reply to a message.._")
    let p = await m.client.profilePictureUrl(m.quoted.sender).catch(() => "https://files.catbox.moe/wpi099.png")
    
    let td = ["#FFFFFF", "#000000", "#1f272a"]
    let tdd = td[Math.floor(Math.random() * td.length)]
    var username = await str.getname(m.quoted.sender)
    let qq
    qq = {}
    let k = {
    type: "quote",
    format: "png",
    backgroundColor: tdd,
    width: 512,
    height: 512,
    scale: 3,
    messages: [{
    avatar: true,
    from: {
    first_name: username,
    language_code: "en",
    name: username,
    photo: {
    url: p,
    },
    },
    text: m.quoted.text,
    replyMessage:  qq,
    }, ],
    }
    let res = await axios.post("https://bot.lyo.su/quote/generate", k)
    let img = Buffer.from(res.data.result.image, "base64")
    return await m.sendstk(img)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
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
    var b = await m.axios("https://api.jcwyt.com/breakup")
    return await m.send(
    `\`\`\`┏ BREAKUP-LINE ┓\`\`\`
    \n\`\`\`${b}\`\`\``
    )
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})
 