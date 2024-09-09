const axios = require('axios');

async function chatGpt(query) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post('https://www.basedgpt.chat/api/chat', JSON.stringify({
                messages: [{ role: 'user', content: 'Use English language: ' + query }],
            }), {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                resolve(response.data.choices[0].message.content);
            } else {
                resolve("No response from GPT.");
            }
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = { chatGpt };