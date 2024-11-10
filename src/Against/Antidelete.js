const logger = require('../Plugin/kordlogger');

class AntiDelete {
    constructor(sock) {
        this.sock = sock;
        this.isEnabled = global.settings.ANTI_DELETE_ENABLED;
        this.ownerNumber = this.getOwnerNumber();
        this.messageStore = new Map();
        this.storeCapacity = 1000;

        logger.info('AntiDelete initialized', {
            enabled: this.isEnabled,
            ownerNumber: this.ownerNumber || 'Not set',
            storeCapacity: this.storeCapacity
        });

        if (this.isEnabled) {
            this.startPeriodicCleanup();
        }
    }

    getOwnerNumber() {
        const ownerNumber = global.settings.OWNER_NUMBERS;
        if (typeof ownerNumber === 'string' && ownerNumber.trim() !== '') {
            return ownerNumber.trim();
        }
        logger.warn('Owner number not properly configured in global settings');
        return null;
    }

    async handleMessage(m) {
        if (!this.isEnabled || !this.ownerNumber) return;

        for (const msg of m.messages) {
            if (msg.key && msg.key.remoteJid) {
                this.storeMessage(msg.key.remoteJid, msg);
                
                if (msg.message?.protocolMessage?.type === 0) {
                    await this.handleDeletedMessage(msg.message.protocolMessage);
                }
            }
        }
    }

    storeMessage(jid, message) {
        if (!this.messageStore.has(jid)) {
            this.messageStore.set(jid, []);
        }
        const chatMessages = this.messageStore.get(jid);
        chatMessages.push(message);
        
        if (chatMessages.length > this.storeCapacity) {
            chatMessages.shift(); // Remove the oldest message
        }
    }

    getMessageFromStore(jid, messageId) {
        const chatMessages = this.messageStore.get(jid);
        return chatMessages ? chatMessages.find(m => m.key.id === messageId) : null;
    }

    async handleDeletedMessage(protocolMessage) {
        const deletedMessageKey = protocolMessage.key;
        const remoteJid = deletedMessageKey.remoteJid;
        
        logger.info(`Deleted message detected. Remote JID: ${remoteJid}, Message ID: ${deletedMessageKey.id}`);

        const deletedMessage = this.getMessageFromStore(remoteJid, deletedMessageKey.id);

        if (!deletedMessage) {
            logger.warn('Deleted message not found in store.');
            return;
        }

        const ownerJid = `${this.ownerNumber}@s.whatsapp.net`;
        const sender = deletedMessage.key.participant || deletedMessage.key.remoteJid;
        const messageContent = this.getMessageContent(deletedMessage.message);

        const notificationText = `*Deleted Message Detected*\n\n` +
            `*From:* ${sender}\n` +
            `*Chat:* ${remoteJid}\n` +
            `*Message Type:* ${Object.keys(deletedMessage.message)[0]}\n` +
            `*Content:* ${messageContent}`;

        try {
            await this.sock.sendMessage(ownerJid, { text: notificationText });
            logger.info('Deleted message notification sent to owner.');

            if (this.isMediaMessage(deletedMessage.message)) {
                await this.sock.relayMessage(ownerJid, deletedMessage.message, { messageId: deletedMessage.key.id });
                logger.info('Deleted media message relayed to owner.');
            }
        } catch (error) {
            logger.error('Error sending deleted message notification:', error);
        }
    }

    getMessageContent(messageContent) {
        if (messageContent.conversation) return messageContent.conversation;
        if (messageContent.extendedTextMessage) return messageContent.extendedTextMessage.text;
        if (messageContent.imageMessage) return `[Image] ${messageContent.imageMessage.caption || ''}`;
        if (messageContent.videoMessage) return `[Video] ${messageContent.videoMessage.caption || ''}`;
        if (messageContent.audioMessage) return '[Audio]';
        if (messageContent.stickerMessage) return '[Sticker]';
        if (messageContent.documentMessage) return `[Document] ${messageContent.documentMessage.fileName || ''}`;
        if (messageContent.contactMessage) return '[Contact]';
        if (messageContent.locationMessage) return '[Location]';
        return '[Unknown Message Type]';
    }

    isMediaMessage(message) {
        return message.imageMessage || 
               message.videoMessage || 
               message.audioMessage ||
               message.stickerMessage;
    }

    startPeriodicCleanup() {
        setInterval(() => this.cleanupMessageStore(), 3600000); // Run every hour
    }

    cleanupMessageStore() {
        for (const [jid, messages] of this.messageStore) {
            if (messages.length > this.storeCapacity) {
                this.messageStore.set(jid, messages.slice(-this.storeCapacity));
            }
        }
        logger.debug(`Cleaned up message store. Current size: ${this.messageStore.size} chats`);
    }
}

// Export a function that creates and returns an AntiDelete instance
module.exports = (sock) => {
    const antiDelete = new AntiDelete(sock);
    return {
        event: 'messages.upsert',
        desc: 'Detects deleted messages and sends them to the owner',
        isEnabled: antiDelete.isEnabled,
        execute: (m) => antiDelete.handleMessage(m)
    };
};