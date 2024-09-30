const emojis = {
    loading: '⏰',
    response: '🗨️',
    error: '😖'
};

const axios = require('axios');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isChatbotActive = false;
let messageListener = null;
let activeChatId = null;

module.exports = {
    usage: ['chatbot'],
    desc: "Chat With Bot",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,

    async execute(sock, m, args, context) {
        if (args[0] === 'on') {
            if (isChatbotActive) {
                return kord.reply(m, 'Chatbot is already active.');
            }

            isChatbotActive = true;
            activeChatId = m.key.remoteJid; // Store the ID of the chat where the chatbot was activated
            const chatbot = this.usage;

            // Start listening to messages
            messageListener = async ({ messages }) => {
                if (!isChatbotActive) return;

                for (const message of messages) {
                    if (!message.key.fromMe && message.message && message.key.remoteJid === activeChatId) {
                        const chatId = message.key.remoteJid;
                        const messageText = message.message.conversation || message.message.extendedTextMessage?.text || '';

                        // Send typing indicator
                        await sock.sendPresenceUpdate('composing', chatId);

                        try {
                            // React with loading emoji
                            await kord.react(message, emojis.loading);

                            // Send message to AI and get response
                            const aiResponse = await getGeminiResponse(messageText);

                            // React with response emoji
                            await kord.react(message, emojis.response);

                            // Send AI response
                            await kord.freply(message, aiResponse);
                        } catch (error) {
                            console.error('Error in chatbot:', error);
                            await sock.sendReaction(chatId, emojis.error, message.key);
                            await sock.sendMessage(chatId, { text: `An error occurred. ${error.message}.` });
                        } finally {
                            // Clear typing indicator
                            await sock.sendPresenceUpdate('paused', chatId);
                        }
                    }
                }
            };

            sock.ev.on('messages.upsert', messageListener);

            return kord.freply(m, 'Chatbot is now active and listening to messages in this chat.', chatbot);
        } else if (args[0] === 'off') {
            if (!isChatbotActive) {
                return kord.reply(m, 'Chatbot is already inactive.');
            }

            isChatbotActive = false;
            activeChatId = null;
            if (messageListener) {
                sock.ev.off('messages.upsert', messageListener);
                messageListener = null;
            }

            return kord.reply(m, 'Chatbot has been deactivated and is no longer listening to messages.');
        } else {
            return kord.reply(m, 'Usage: chatbot on/off');
        }
    }
};

async function getGeminiResponse(message) {
    const apiKey = 'AIzaSyBh9sWiRWxqcAbdgjNpyg7eDySU_qZQZRI';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    // Add a 1-second delay before making the API call
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

        // Extract the generated text from the response
        const generatedText = response.data.candidates[0].content.parts[0].text;
        return generatedText;
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get response from AI');
    }
}