const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const emojis = {
    loading: '⏰',
    response: '🗨️',
    error: '😖'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const configPath = path.join(__dirname, 'chatbot_config.json');
let messageListener = null;
let activeChats = new Set();

module.exports = {
    usage: ['chatbot'],
    desc: "Chat With Bot",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,

    async execute(sock, m, args, context) {
        const chatId = m.key.remoteJid;

        if (args[0] === 'on') {
            if (activeChats.has(chatId)) {
                return kord.reply(m, 'Chatbot is already active in this chat.');
            }

            activeChats.add(chatId);
            await this.updateConfig(chatId, true);

            if (!messageListener) {
                this.startListening(sock);
            }

            return kord.freply(m, 'Chatbot is now active and listening to messages in this chat.', this.usage);

        } else if (args[0] === 'off') {
            if (!activeChats.has(chatId)) {
                return kord.reply(m, 'Chatbot is already inactive in this chat.');
            }

            activeChats.delete(chatId);
            await this.updateConfig(chatId, false);

            if (activeChats.size === 0 && messageListener) {
                sock.ev.off('messages.upsert', messageListener);
                messageListener = null;
            }

            return kord.reply(m, 'Chatbot has been deactivated and is no longer listening to messages in this chat.');
        } else {
            return kord.reply(m, 'Usage: chatbot on/off');
        }
    },

    async updateConfig(chatId, isEnabled) {
        let config;
        try {
            const data = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(data);
        } catch (error) {
            config = {};
        }

        if (isEnabled) {
            config[chatId] = true;
        } else {
            delete config[chatId];
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    },

    startListening(sock) {
        messageListener = async ({ messages }) => {
            for (const message of messages) {
                if (!activeChats.has(message.key.remoteJid)) continue;

                const chatId = message.key.remoteJid;
                const messageText = message.message.conversation || message.message.extendedTextMessage?.text || '';

                if (!message.key.fromMe && message.message) {
                    await sock.sendPresenceUpdate('composing', chatId);

                    try {
                        await kord.react(message, emojis.loading);

                        const aiResponse = await getGeminiResponse(messageText);

                        await kord.react(message, emojis.response);

                        await kord.freply(message, aiResponse);
                    } catch (error) {
                        console.error('Error in chatbot:', error);
                        await sock.sendReaction(chatId, emojis.error, message.key);
                        await sock.sendMessage(chatId, { text: `An error occurred. ${error.message}.` });
                    } finally {
                        await sock.sendPresenceUpdate('paused', chatId);
                    }
                }
            }
        };

        sock.ev.on('messages.upsert', messageListener);
    },

    async init(sock) {
        try {
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            activeChats = new Set(Object.keys(config).filter(chatId => config[chatId]));
            if (activeChats.size > 0) {
                this.startListening(sock);
            }
        } catch (error) {
            console.error('Error initializing chatbot:', error);
            await fs.writeFile(configPath, '{}', 'utf8');
        }
    }
};

async function getGeminiResponse(message) {
    const apiKey = 'AIzaSyBh9sWiRWxqcAbdgjNpyg7eDySU_qZQZRI';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    await delay(1000);

    try {
        const response = await axios.post(`${apiUrl}?key=${apiKey}`, {
            contents: [{
                parts: [{
                    text: message
                }]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const generatedText = response.data.candidates[0].content.parts[0].text;
        return generatedText;
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get response from AI');
    }
}
