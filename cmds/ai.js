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
 chatbotResponse,
 clearChatHistory,
 prefix,
 commands
} = require("../core")
const axios = require('axios') 

// Three task-focused commands share the anonymous Pollinations model.
// Deliberately separate from chatbotResponse and its providers/history.
const namedAiState = globalThis[Symbol.for('kord.namedFreeAi.v1')] ||= { busy: false, nextAt: 0 }
const namedAiRoles = [
  { name: 'gpt', description: 'general questions and explanations', system: 'You are Nova, a helpful general-purpose assistant. Answer clearly, accurately, and concisely. Say when you are unsure. Do not claim live web access.' },
  { name: 'scribe', description: 'writing, rewriting and summaries', system: 'You are Scribe, a writing assistant. Help draft, rewrite, translate and summarize text. Preserve the user intent and facts. Prefer the requested output over commentary.' },
  { name: 'forge', description: 'coding and debugging help', system: 'You are Forge, a coding assistant. Help write, explain and debug code. Prefer concise correct examples, call out assumptions, and never claim you ran code or tools.' }
]

for (const role of namedAiRoles) {
  kord({ cmd: role.name, desc: `${role.description} (free Pollinations openai-fast)`, fromMe: wtype, type: 'ai' }, async (m, text) => {
    const prompt = String(text || m.quoted?.text || '').trim()
    if (!prompt) return m.send(`Send a prompt or reply to text with ${role.name}.`)
    if (prompt.length > 12000) return m.send('Please shorten the prompt to 12,000 characters or less.')
    if (namedAiState.busy) return m.send('An AI request is already running. Please wait.')
    const wait = Math.ceil((namedAiState.nextAt - Date.now()) / 1000)
    if (wait > 0) return m.send(`Free AI cooldown: try again in ${wait}s. Nova, Scribe and Forge share one free allowance.`)
    namedAiState.busy = true
    namedAiState.nextAt = Date.now() + 31000
    let output
    try {
      const response = await axios.post('https://text.pollinations.ai/openai', {
        model: 'openai-fast',
        messages: [{ role: 'system', content: role.system }, { role: 'user', content: prompt }],
        max_tokens: 2048,
        stream: false
      }, { timeout: 60000, maxContentLength: 262144, headers: { 'Content-Type': 'application/json' } })
      const choice = response.data?.choices?.[0]
      const raw = choice?.message?.content
      if (typeof raw !== 'string') throw new Error('empty-ai-reply')
      output = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      if (!output) throw new Error('empty-ai-reply')
      if (choice.finish_reason === 'length') output += '\n\n[Reply reached the free output limit; ask a narrower question.]'
    } catch (error) {
      const status = error.response?.status
      console.error('Named AI request failed:', role.name, status || error.code || 'response-error')
      if (status === 402 || status === 429) {
        const detail = typeof error.response?.data === 'string' ? error.response.data : ''
        const retry = Number(error.response?.headers?.['retry-after']) || Number(detail.match(/wait\s+(\d+)\s*seconds?/i)?.[1]) || 30
        namedAiState.nextAt = Date.now() + Math.min(3600, Math.max(31, retry + 1)) * 1000
        output = 'The free AI allowance is busy or rate-limited. Please wait at least 30 seconds and try again.'
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        output = 'The free AI service timed out. Please try again shortly.'
      } else {
        output = 'The free AI service could not return a reply. Please try again later.'
      }
    } finally {
      namedAiState.busy = false
      namedAiState.nextAt = Math.max(namedAiState.nextAt, Date.now() + 31000)
    }
    // Output is text only. Never evaluate instructions/code returned by the model.
    for (let offset = 0; offset < output.length; offset += 3800) {
      await m.send(output.slice(offset, offset + 3800))
    }
  })
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
    if (!text) return m.send("use on/off")

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
}, async (m, text, x, store) => {
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
      const response = await chatbotResponse(text, m.chat, m, m.client, store)
      clearInterval(typingInterval)
      
      if (response?.trim()) {
        await m.send(response.trim())
      }
    } catch (error) {
      clearInterval(typingInterval)
      console.error("AI response error:", error)

      let errorMessage = "rate limit, try again."

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