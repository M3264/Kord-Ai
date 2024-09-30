const emojis = {
    loading: '⏰',
    response: '🗨️',
    error: '😖'
};

const axios = require('axios');

module.exports = {
    usage: 'chatbot',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,

    async execute(sock, m, args, context) {
        if (args[0] === 'on') {
            // Start listening to messages
            sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const message of messages) {
                    if (!message.key.fromMe && message.message) {
                        const chatId = message.key.remoteJid;
                        const messageText = message.message.conversation || message.message.extendedTextMessage?.text || '';

                        // Send typing indicator
                        await sock.sendPresenceUpdate('composing', chatId);

                        try {
                            // Send loading emoji
                            await sock.sendMessage(chatId, { text: emojis.loading });

                            // Send message to AI (OpenAI/Gemini) and get response
                            const aiResponse = await getAIResponse(messageText);

                            // Send AI response
                            await sock.sendMessage(chatId, { text: `${emojis.response} ${aiResponse}` });
                        } catch (error) {
                            console.error('Error in chatbot:', error);
                            await sock.sendMessage(chatId, { text: `${emojis.error} An error occurred. Please try again later.` });
                        } finally {
                            // Clear typing indicator
                            await sock.sendPresenceUpdate('paused', chatId);
                        }
                    }
                }
            });

            return m.reply('Chatbot is now active and listening to messages.');
        } else {
            return m.reply('Usage: chatbot on');
        }
    }
};

async function getAIResponse(message) {
    // Replace this with actual API call to OpenAI or Gemini
    // This is a placeholder implementation
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }]
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}