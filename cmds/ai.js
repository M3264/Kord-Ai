const { kord,
 wtype,
 chatWithAi,
 getData,
 storeData,
 chatbotResponse,
 clearChatHistory,
 getAIStatus
} = require("../core")


kord({
        cmd: "gemma",
        desc: "chat with ai (gemma)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "Gemma"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "gpt",
        desc: "chat with ai (gpt)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "gpt-3.5-turbo"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "llama",
        desc: "chat with ai (llama)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "Llama-2-int8"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "llama2",
        desc: "chat with ai (llama)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "Llama-2-int8"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "mistral",
        desc: "chat with ai (mistral)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "Mistral"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "llama3",
        desc: "chat with ai (llama)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "Llama-2-awq"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "hermes",
        desc: "chat with ai (hermes)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "OpenHermes"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

kord({
        cmd: "zephyr",
        desc: "chat with ai (Zephyr)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {
        try {
                var prompt = text || m.quoted?.text
                if (!prompt) return await m.send("Hi!, What's Your Prompt?")
                return await m.send(await chatWithAi(prompt, "Zephyr"))
        } catch (e) {
                console.log("cmd error", e)
                return await m.sendErr(e)
        }
})

var chatc = {
    active: false,
    global: false,
    activeChats: [
        '1234@g.us'
    ],
}

if (!getData("chatbot_cfg")) {
    storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))
}

kord({
  cmd: "chatbot",
  desc: "activate chatbot in chat",
  fromMe: true,
  type: "ai",
}, async (m, text, cmd) => {
  try {
    if (!text) return m.btnText("Toggle chatbot", {
      [`${cmd} on`]: "✅ON",
      [`${cmd} off`]: "OFF",
      [`${cmd} on all`]: "On (All chats)",
      [`${cmd} off all`]: "Off (All chats)",
      [`${cmd} status`]: "📊 Status",
      [`${cmd} clear`]: "🗑️ Clear History"
    })

    const args = text.split(" ")
    if (args && args.length > 0) {
      const option = args[0].toLowerCase()
      const value = args.length > 1 ? args[1] : null

      if (option === 'on' && value === 'all') {
        chatc.global = true
        await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2))
        return await m.send('_*Chatbot enabled for all chats!*_')
      } else if (option === 'off' && value === 'all') {
        chatc.global = false
        await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2))
        return await m.send('_*Chatbot disabled for all chats!*_')
      } else if (option === "on") {
        chatc.active = true
        if (!chatc.activeChats.includes(m.chat)) {
          chatc.activeChats.push(m.chat)
        }
        await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2))
        return await m.send('_Chatbot is now active in this chat_')
      } else if (option === 'off') {
        chatc.activeChats = chatc.activeChats.filter(jid => jid !== m.chat)
         clearChatHistory(m.chat)
        await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2))
        return await m.send("_Chatbot deactivated in this chat_")
      } else if (option === 'status') {
        const status = await getAIStatus()
        if (status) {
          return await m.send(`*AI Status:*\n• Status: ${status.status}\n• Active Sessions: ${status.activeSessions}\n• Last Updated: ${new Date(status.timestamp).toLocaleString()}`)
        } else {
          return await m.send('_Unable to fetch AI status_')
        }
      } else if (option === 'clear') {
        const cleared = clearChatHistory(m.chat)
        if (cleared) {
          return await m.send('_Chat history cleared successfully_')
        } else {
          return await m.send('_Failed to clear chat history_')
        }
      } else {
        return m.btnText("Toggle chatbot", {
          [`${cmd} on`]: "✅ON",
          [`${cmd} off`]: "OFF",
          [`${cmd} on all`]: "On (All chats)",
          [`${cmd} off all`]: "Off (All chats)",
          [`${cmd} status`]: "📊 Status",
          [`${cmd} clear`]: "🗑️ Clear History"
        })
      }
    } else {
      return m.btnText("Toggle chatbot", {
        [`${cmd} on`]: "✅ON",
        [`${cmd} off`]: "OFF",
        [`${cmd} on all`]: "On (All chats)",
        [`${cmd} off all`]: "Off (All chats)",
        [`${cmd} status`]: "📊 Status",
        [`${cmd} clear`]: "🗑️ Clear History"
      })
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  on: "text",
  fromMe: false,
}, async (m, text) => {
  try {
    const config = await getData("chatbot_cfg") || { global: false, activeChats: [] }
    if (!config) return

    const shouldRespond = (config.global || config.activeChats.includes(m.chat)) &&
                          (m.quoted?.fromMe || m.mentionedJid?.includes(m.user.jid))
    if (!shouldRespond) return

    const typingInterval = setInterval(() => {
      try {
        m.client.sendPresenceUpdate("composing", m.chat)
      } catch {}
    }, 1000)

    try {
      const response = await chatbotResponse(m, m.chat)
      clearInterval(typingInterval)
      
      if (response?.trim()) {
        await m.send(response.trim())
      }
    } catch (error) {
      clearInterval(typingInterval)
      console.error("AI response error:", error)

      let errorMessage = "hmm, i can't process that rn, try again"

      if (error.message.includes('timeout')) {
        errorMessage = "Response took too long, please try again"
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Too many requests, please wait a moment"
      } else if (error.message.includes('server error')) {
        errorMessage = "AI service is temporarily unavailable"
      }

      return await m.send(errorMessage)
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "aitest",
  desc: "test AI connectivity",
  fromMe: true,
  type: "ai",
}, async (m) => {
  try {
    const response = await chatbotResponse({ text: "Hello, this is a test message" }, `test_${Date.now()}`)
    await m.send(`*AI Test Successful!*\n\n*Response:* ${response}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})