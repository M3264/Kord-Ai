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
        cmd: "gemma",
        desc: "chat with ai (gemma)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "Gemma"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})

kord({
        cmd: "gpt",
        desc: "chat with ai (gpt)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "gpt-3.5-turbo"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})


kord({
        cmd: "llama",
        desc: "chat with ai (llama)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "Llama-2-int8"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})


kord({
        cmd: "llama2",
        desc: "chat with ai (llama)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "Llama-2-int8"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})

kord({
        cmd: "mistral",
        desc: "chat with ai (mistral)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "Mistral"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})


kord({
        cmd: "llama3",
        desc: "chat with ai (llama)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                        return await m.send(await chatWithAi(prompt, "Llama-2-awq"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})

kord({
        cmd: "hermes",
        desc: "chat with ai (hermes)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "OpenHermes"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})

kord({
        cmd: "zephyr",
        desc: "chat with ai (Zephyr)",
        fromMe: wtype,
        type: "ai",
}, async (m, text) => {try {

        var prompt = text || m.quoted?.text

                if (!prompt) return await m.send("Hi!, What's Your Prompt?")

                return await m.send(await chatWithAi(prompt, "Zephyr"))
} catch (e) {

        console.log("cmd error", e)

        return await m.sendErr(e)
}})

const API_BASE_URL = 'https://api.mistral.ai/v1'
const API_KEY = 'AA46jQW0VLsz2x7FW7sCUnBVIpBaa1qW'
const AGENT_ID = 'ag:4151fcb9:20250104:untitled-agent:d1bde2e5'

const chatHistories = new Map()

function stripThoughts(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

async function getAIResponse(m, quoted) {
  const chatId = m.chat || m.chatId || m.key?.remoteJid || 'unknown'
  const rawMessage = JSON.stringify(m, null, 2)
  const rawQuoted = quoted ? JSON.stringify(quoted, null, 2) : null

  let message = rawQuoted
    ? `Message:\n${rawMessage}\n\nQuoted:\n${rawQuoted}`
    : `Message:\n${rawMessage}`

  try {
    if (!chatHistories.has(chatId)) chatHistories.set(chatId, [])
    const history = chatHistories.get(chatId)
    history.push({ role: 'user', content: message })

    const contextMessages = history.slice(-10)
    const messages = [
      {
        role: 'system',
        content: "You're a WhatsApp bot. You receive raw JSON of messages and quoted messages. Respond with useful answers in WhatsApp format using *bold*, _italic_, ~strikethrough~, and ```monospace```."
      },
      ...contextMessages
    ]

    const res = await axios.post(`${API_BASE_URL}/agents/completions`, {
      agent_id: AGENT_ID,
      messages,
      max_tokens: 500,
      stream: false,
      tool_choice: 'auto',
      parallel_tool_calls: true,
      prompt_mode: 'reasoning'
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    const raw = res.data?.choices?.[0]?.message?.content
    const output = stripThoughts(raw)

    if (output) {
      history.push({ role: 'assistant', content: output })
      chatHistories.set(chatId, history.slice(-10))
      return output
    } else {
      throw new Error('Empty response')
    }
  } catch (e) {
    console.error('Mistral AI Error:', e.message)
    if (e.code === 'ECONNABORTED') throw new Error('Request timeout - try again')
    if (e.response?.status === 429) throw new Error('Rate limit exceeded - wait a moment')
    if (e.response?.status >= 500) throw new Error('Server error - try later')
    throw new Error('Failed to get AI response')
  }
}

function clearChatHistory(chatId) {
  chatHistories.delete(chatId)
  return true
}

async function getAIStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/ai/status`, {
      timeout: 10000
    })
    return response.data.data
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
        const cleared =  clearChatHistory(m.chat)
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
      const fullResponse = await getAIResponse(text, m.chat)
      clearInterval(typingInterval)

      const [messagePart, codePart] = fullResponse.split("$$")

      if (messagePart?.trim()) await m.send(messagePart.trim())

      if (codePart?.trim()) {
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
    const response = await getAIResponse(testMessage, `test_${Date.now()}`)
    await m.send(`*AI Test Successful!*\n\n*Sent:* ${testMessage}\n*Response:* ${response}`)
  } catch (error) {
    await m.send(`*AI Test Failed:* ${error.message}`)
  }
})