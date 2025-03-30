module.exports= {
  usage: "quoted",
  commandType: "Bot",
  isOwnerOnly: true,
  emoji: "⏳",
  
  execute: async(sock, m, args, kord) => {
    try {
      if (!m.quoted) return m.send("*_reply to a replied message_*")
      const qu = await m.getQuotedObj();
      if (!qu) return m.send("*_reply to a message that replies to a message_*")
      if (qu.quoted?.fakeObj) {
    await sock.copyNForward(m.chat, qu.quoted.fakeObj);
      } else {
    await m.send("_No quoted message found._");
}
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
  }
}