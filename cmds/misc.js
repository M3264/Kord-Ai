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
  var q = await m.axios("https://favqs.com/api/qotd")
  return await m.send(
`\`\`\`┏ QUOTE ┓\`\`\`
\n\`\`\`${q.quote.body}\`\`\`
> ${q.quote.author}`
    )
})

kord({
  cmd: "fact",
  desc: "get random fact",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  var f = await m.axios("https://nekos.life/api/v2/fact")
  return await m.send(
`\`\`\`┏ FACT ┓\`\`\`
\n\`\`\`${f.fact}\`\`\``
    )
})

kord({
  cmd: "q|quotely",
  desc: "makes sticker of replied messaged",
  fromMe: wtype,
  type: "misc",
}, async (m, text, c, str) => {
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
})

kord({
  cmd: "ebinary|ebin",
  desc: "encode text to binary",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  var txt = text || m.quoted.text
  if (!txt) return await m.send("_Reply or provide a text._")
  return await m.send(await eBinary(txt))
})

kord({
  cmd: "dbinary|dbin",
  desc: "decode text to binary",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  var txt = text || m.quoted.text
  if (!txt) return await m.send("_Reply or provide a text._")
  return await m.send(await dBinary(txt))
})

kord({
  cmd: "pick",
  desc: "pick a random person in group",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  if (!text) return await m.send("*provide a reason!*")
  var gm = await getMeta(m.client, m.chat)
  var p = gm.participants
  var user = p[Math.floor(Math.random() * p.length)].id
  return await m.send(`The ${text} person here is: @${user.split("@")[0]}`, {mentions: [user]})
})

kord({
  cmd: "pickupl|pickupline",
  desc: "get pickupline",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  var p = await m.axios("https://api.popcat.xyz/pickuplines")
  return await m.send(
`\`\`\`┏ PICKUP-LINE ┓\`\`\`
\n\`\`\`${p.pickupline}\`\`\``
    )
})

kord({
  cmd: "breakupl|breakupline",
  desc: "get breakupline",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  var b = await m.axios("https://api.jcwyt.com/breakup")
  return await m.send(
`\`\`\`┏ BREAKUP-LINE ┓\`\`\`
\n\`\`\`${b}\`\`\``
    )
})
 