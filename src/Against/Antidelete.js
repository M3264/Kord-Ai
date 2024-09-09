// ./src/Against/AntiDelete.js
module.exports = {
    event: ['messages.upsert'],
    desc: 'Sends deleted messages to the bot owner.',
    isEnabled: global.settings.ANTI_DELETE_ENABLED, // Check if anti-delete is enabled
    async execute(sock, updates) {
        const chalk = (await import('chalk')).default;

        for (const update of updates) {
            if (update.message && update.message.protocolMessage 
                && update.message.protocolMessage.type === 0) { // Type 0 indicates a message delete
                const key = update.message.protocolMessage.key;
                const chat = key.remoteJid;
                const sender = key.participant || chat;

                try {
                    // Fetch the deleted message
                    const msg = await sock.loadMessage(chat, key.id);

                    // Prepare and send the notification to the owner
                    const messageContent = formatMessageContent(msg.message);
                    const ownerNumber = global.settings.OWNER_NUMBERS[0]; // Send to the first owner in list

                    await sock.sendMessage(ownerNumber, { 
                        text: `🚨 *Anti-Delete Alert* 🚨\n\nA message was deleted!\n\n*From:* ${sender}\n*Chat:* ${chat}\n*Message:* ${messageContent}` 
                    });

                    console.log(chalk.green('AntiDelete: Deleted message was sent to the owner.'));
                } catch (err) {
                    console.error(chalk.red('Error in AntiDelete handler:', err));
                }
            }
        }
    }
};

// Helper function to format the message content nicely
function formatMessageContent(message) {
    if (!message) return 'No message content available.';

    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage) return message.extendedTextMessage.text;
    if (message.imageMessage) return '[Image]';
    if (message.videoMessage) return '[Video]';
    if (message.stickerMessage) return '[Sticker]';
    // Add more checks for different types of messages if needed

    return '[Unknown Message Type]';
}