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
 chatWithAi,
 gemini,
 chatgpt,
 getData,
 storeData,
 prefix,
 commands
} = require("../core")
const axios = require('axios') 

kord({
  cmd: "openai",
  desc: "chat with ai (openai gpt-5 nano)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "openai"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "gpt",
  desc: "chat with ai (openai fast)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "openai-fast"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "gemini",
  desc: "chat with ai (gemini 2.5)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "gemini"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "aisearch",
  desc: "chat with ai (gemini with google search)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "gemini-search"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "mistral",
  desc: "chat with ai (mistral small 3.2)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "mistral"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "deepseek",
  desc: "chat with ai (deepseek v3.1 reasoning)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "deepseek"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "reasoning",
  desc: "chat with ai (openai o4 mini reasoning)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "openai-reasoning"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "coder",
  desc: "chat with ai (qwen coder)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "qwen-coder"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "llama",
  desc: "chat with ai (llama 3.1)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "roblox-rp"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "bidara",
  desc: "chat with ai (nasa biomimetic designer)",
  fromMe: wtype,
  type: "ai",
}, async (m, text) => {
  try {
    var prompt = text || m.quoted?.text
    if (!prompt) return await m.send("Hi!, What's Your Prompt?")
    return await m.send(await chatWithAi(prompt, "bidara"))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

const { CohereClient } = require('cohere-ai')
const fs = require('fs')
const path = require('path')

const cohere = new CohereClient({
  token: 'YIsaBvSxI7MNTz4dEMMFW0aszjgWfKqXacL0I6j3',
})

const SYSTEM_PREAMBLE = fs.readFileSync(
  path.join(__dirname, 'know.txt'), 
  'utf-8'
)

const chatHistories = new Map()

async function getAIResponse(m, quoted) {
  const chatId = m.chat || m.chatId || m.key?.remoteJid || 'unknown'
  

  let message = `Text: ${m.text}
Sender: ${m.sender}
IsCreator: ${m.isCreator}
PushName: ${m.pushName}
IsSudo: ${m.isSudo}`

  if (quoted) {
    message += `\n\nQuoted:
Text: ${quoted.text}
Sender: ${m.quoted?.sender}
PushName: ${m.quoted?.pushName}`
  }
  try {
    if (!chatHistories.has(chatId)) chatHistories.set(chatId, [])
    const history = chatHistories.get(chatId)

    const chatHistory = history.slice(-10).map(h => ({
      role: h.role,
      message: h.message
    }))

    const response = await cohere.chat({
      model: 'command-a-03-2025',
      message: message,
      preamble: SYSTEM_PREAMBLE,
      chatHistory: chatHistory,
      temperature: 0.7,
      maxTokens: 500,
    })

    const output = response.text

    if (output) {
      history.push({ role: 'USER', message: message })
      history.push({ role: 'CHATBOT', message: output })
      chatHistories.set(chatId, history.slice(-20))
      return output
    } else {
      throw new Error('Empty response')
    }
  } catch (e) {
    console.error('Cohere AI Error:', e.message)
    if (e.message?.includes('timeout')) throw new Error('Request timeout - try again')
    if (e.statusCode === 429) throw new Error('Rate limit exceeded - wait a moment')
    if (e.statusCode >= 500) throw new Error('Server error - try later')
    throw new Error('Failed to get AI response')
  }
}

function clearChatHistory(chatId) {
  chatHistories.delete(chatId)
  return true
}

async function getAIStatus() {
  try {
    const response = await cohere.chat({
      model: 'command-a-03-2025',
      message: 'ping',
      maxTokens: 10,
    })
    return {
      status: 'active',
      activeSessions: chatHistories.size,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('AI status error:', error.message)
    return null
  }
}

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

async function loadChatbotConfig() {
  try {
    const data = await getData("chatbot_cfg")
    if (!data) {
      return {
        active: false,
        global: false,
        activeChats: [],
        mentionOnlyChats: []
      }
    }
    
    
      return data
    } catch (er) {
      console.error("Error loading chatbot shi", er)
    }
    
}
async function saveChatbotConfig(config) {
  await storeData('chatbot_cfg', JSON.stringify(config, null, 2))
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
      [`${cmd} on -m`]: "ON (Mention only)",
      [`${cmd} on all`]: "On (All chats)",
      [`${cmd} off all`]: "Off (All chats)",
      [`${cmd} status`]: "📊 Status",
      [`${cmd} clear`]: "🗑️ Clear History"
    })
    
    const config = await loadChatbotConfig()
    
    const args = text.split(" ")
    if (args && args.length > 0) {
      const option = args[0].toLowerCase()
      const value = args.length > 1 ? args[1] : null
      
      if (option === 'on' && value === 'all') {
        config.global = true
        config.mentionOnly = false
        await saveChatbotConfig(config)
        return await m.send('_*Chatbot enabled for all chats!*_')
      } else if (option === 'off' && value === 'all') {
        config.global = false
        await saveChatbotConfig(config)
        return await m.send('_*Chatbot disabled for all chats!*_')
      } else if (option === "on" && value === '-m') {
        config.active = true
        if (!config.mentionOnlyChats) config.mentionOnlyChats = []
        if (!config.mentionOnlyChats.includes(m.chat)) {
          config.mentionOnlyChats.push(m.chat)
        }
        if (!config.activeChats.includes(m.chat)) {
          config.activeChats.push(m.chat)
        }
        await saveChatbotConfig(config)
        return await m.send('_Chatbot is now active (mention only)_')
      } else if (option === "on") {
        config.active = true
        if (config.mentionOnlyChats) {
          config.mentionOnlyChats = config.mentionOnlyChats.filter(jid => jid !== m.chat)
        }
        if (!config.activeChats.includes(m.chat)) {
          config.activeChats.push(m.chat)
        }
        await saveChatbotConfig(config)
        return await m.send('_Chatbot is now active in this chat_')
      } else if (option === 'off') {
        config.activeChats = config.activeChats.filter(jid => jid !== m.chat)
        if (config.mentionOnlyChats) {
          config.mentionOnlyChats = config.mentionOnlyChats.filter(jid => jid !== m.chat)
        }
        clearChatHistory(m.chat)
        await saveChatbotConfig(config)
        return await m.send("_Chatbot deactivated in this chat_")
      } else if (option === 'status') {
        const isMentionOnly = config.mentionOnlyChats?.includes(m.chat) || false
        const isActive = config.activeChats?.includes(m.chat) || config.global
        const statusText = `*Chatbot Status for this chat:*\n• Active: ${isActive ? '✅' : '❌'}\n• Mention Only: ${isMentionOnly ? '✅' : '❌'}\n• Global Mode: ${config.global ? '✅' : '❌'}\n• Active Chats: ${config.activeChats?.length || 0}`
        return await m.send(statusText)
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
          [`${cmd} on -m`]: "ON (Mention only)",
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
        [`${cmd} on -m`]: "ON (Mention only)",
        [`${cmd} on all`]: "On (All chats)",
        [`${cmd} off all`]: "Off (All chats)",
        [`${cmd} status`]: "📊 Status",
        [`${cmd} clear`]: "🗑️ Clear History"
      })
    }
  } catch (err) {
    console.error(err)
    return await m.send(`An error occurred: ${err.message}`)
  }
})

kord({
  on: "text",
  fromMe: false,
}, async (m, text) => {
  try {
    const config = await loadChatbotConfig()
    if (!config) return

    const isMentioned = m.mentionedJid?.includes(m.user.jid)
    const isQuoted = m.quoted?.fromMe

    let shouldRespond = false
    
    const isMentionOnlyChat = config.mentionOnlyChats?.includes(m.chat) || false
    
    if (config.global) {
      shouldRespond = isMentionOnlyChat ? isMentioned : (isQuoted || isMentioned)
    } else if (config.activeChats?.includes(m.chat)) {
      shouldRespond = isMentionOnlyChat ? isMentioned : (isQuoted || isMentioned)
    }

    if (!shouldRespond) return

    const typingInterval = setInterval(() => {
      try {
        m.client.sendPresenceUpdate("composing", m.chat)
      } catch {}
    }, 1000)

    try {
      const fullResponse = await getAIResponse(m, m.quoted)
      clearInterval(typingInterval)

      const [messagePart, codePart] = fullResponse.split("$$")

      if (messagePart?.trim()) await m.send(messagePart.trim())

      if (codePart?.trim()) {
        try {
          const sock = m.client
          const command = m.command
          const store = global.store

          await (async () => {
            await eval(`(async () => { ${codePart.trim()} })()`)
          })()
        } catch (e) {
          console.error("Eval error:", e)
          console.log("evaled:", codePart.trim())
        }
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
  } catch (err) {
    console.error("Message handling error:", err)
  }
})
kord({
  cmd: "aitest",
  desc: "test AI connectivity",
  fromMe: true,
  type: "ai",
}, async (m) => {
  try {
    const testMessage = "Hello, this is a test message"
    const response = await getAIResponse({ chat: `test_${Date.now()}` }, null)
    await m.send(`*AI Test Successful!*\n\n*Sent:* ${testMessage}\n*Response:* ${response}`)
  } catch (error) {
    await m.send(`*AI Test Failed:* ${error.message}`)
  }
})