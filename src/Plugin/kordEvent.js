const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { kordCmdUpsert } = require('./kordCmd');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const logger = require('./kordlogger');
const chalk = require('chalk');

class KordEventsManager extends EventEmitter {
    constructor(sock) {
        super();
        this.sock = sock;
        this.processedMessages = new Set();
        this.mediaDownloadPath = './media_downloads';
        this.messageStore = new Map();
        this.storeCapacity = 1000;
        this.debugMode = process.env.DEBUG_MODE === 'true';
        this.ownerJid = null;
        this.mediaTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds
    }

    async initialize() {
        try {
            await this.createMediaDownloadDirectory();
            this.initializeEventListeners();
            this.startPeriodicCleanup();
            this.setOwnerJid();
            logger.info(chalk.green('✅ KordEventsManager initialized successfully.'));
        } catch (error) {
            logger.error(chalk.red('❌ Error initializing KordEventsManager:'), error);
            throw error;
        }
    }

    async createMediaDownloadDirectory() {
        try {
            await fs.mkdir(this.mediaDownloadPath, { recursive: true });
            logger.info(chalk.blue(`📁 Media download directory created: ${this.mediaDownloadPath}`));
        } catch (error) {
            logger.error(chalk.red('❌ Error creating media download directory:'), error);
            throw error;
        }
    }

    initializeEventListeners() {
        const events = ['messages.upsert', 'messages.update', 'messages.delete'];
        events.forEach(event => {
            this.sock.ev.on(event, (...args) => this.handleEvent(event, ...args));
        });
        logger.info(chalk.blue('👂 Baileys event listeners initialized.'));
    }

    async handleEvent(event, ...args) {
        try {
            logger.debug(chalk.cyan(`🔄 Handling event: ${event}`));
            if (this.debugMode) {
                logger.debug(chalk.gray('📊 Event args:'), JSON.stringify(args, null, 2));
            }
            switch (event) {
                case 'messages.upsert':
                    await this.handleMessagesUpsert(...args);
                    break;
                case 'messages.update':
                    await this.handleMessagesUpdate(...args);
                    break;
                case 'messages.delete':
                    await this.handleMessagesDelete(...args);
                    break;
                default:
                    logger.debug(chalk.yellow(`⚠️ Unhandled event: ${event}`));
                    break;
            }
        } catch (error) {
            logger.error(chalk.red(`❌ Error handling ${event} event:`), error);
            this.emit('error', { event, error, args });
        }
    }

    async handleMessagesUpsert({ messages }) {
        logger.debug(chalk.cyan('🔄 Handling messages.upsert'));
        for (const message of messages) {
            if (!this.isValidMessage(message)) continue;

            const messageId = message.key?.id;
            const userJid = message.key.remoteJid;

            if (userJid === 'status@broadcast') {
                await this.handleStatus(message);
                continue;
            }

            this.storeMessage(userJid, message);

            if (this.processedMessages.has(messageId)) {
                logger.debug(chalk.gray(`🔁 Message ${messageId} already processed, skipping.`));
                continue;
            }

            this.processedMessages.add(messageId);
            logger.debug(chalk.cyan(`🔄 Processing message ${messageId}`));

            try {
                if (message.message?.protocolMessage) {
                    await this.handleProtocolMessage(message);
                } else {
                    await this.processNormalMessage(message);
                }
            } catch (error) {
                logger.error(chalk.red(`❌ Error processing message ${messageId}:`), error);
            } finally {
                this.scheduleMessageCleanup(messageId);
            }
        }
    }

    async handleStatus(message) {
        const sender = message.key.participant || message.key.remoteJid;
        const messageContent = this.getMessageContent(message.message);

        logger.info(chalk.magenta('📊 New status update received:'));
        logger.info(chalk.green(`👤 Sender JID: ${sender}`));
        logger.info(chalk.yellow(`💬 Status Content: ${messageContent}`));
        logger.info(chalk.white(`🏷️ Status Type: ${Object.keys(message.message)[0]}`));

        try {
            await this.sock.readMessages([message.key]);
            logger.info(chalk.cyan('✅ Status marked as read'));
        } catch (error) {
            logger.error(chalk.red('❌ Error marking status as read:'), error);
        }
    }

    async handleMessagesUpdate(updates) {
        logger.debug(chalk.cyan('🔄 Handling messages.update event'));
        for (const update of updates) {
            try {
                if (update.update?.deleteMessages) {
                    await this.handleDeletedMessage(update.key.remoteJid, update.key.id);
                } else if (update.update?.protocolMessage) {
                    await this.handleProtocolMessage(update);
                } else {
                    logger.debug(chalk.yellow('⚠️ Unhandled update type:'), JSON.stringify(update, null, 2));
                }
            } catch (error) {
                logger.error(chalk.red('❌ Error processing update:'), error);
            }
        }
    }

    async handleMessagesDelete(deletedMessages) {
        logger.debug(chalk.cyan('🔄 Handling messages.delete event'));
        if (typeof deletedMessages === 'object' && deletedMessages !== null) {
            for (const [chatJid, messageIds] of Object.entries(deletedMessages)) {
                for (const messageId of messageIds) {
                    await this.handleDeletedMessage(chatJid, messageId);
                }
            }
        } else {
            logger.warn(chalk.yellow('⚠️ Invalid format for deleted messages'));
        }
    }

    async handleDeletedMessage(chatJid, messageId) {
        logger.debug(chalk.cyan(`🔄 Handling deleted message. Chat JID: ${chatJid}, Message ID: ${messageId}`));
        const deletedMessage = this.getMessageFromStore(chatJid, messageId);
        if (deletedMessage) {
            await this.notifyOwnerAboutDeletedMessage(deletedMessage);
        } else {
            logger.warn(chalk.yellow(`⚠️ Deleted message not found in store. Chat JID: ${chatJid}, Message ID: ${messageId}`));
        }
    }

    async handleProtocolMessage(message) {
        const protocolMessage = message.message?.protocolMessage || message.update?.protocolMessage;
        if (!protocolMessage) {
            logger.warn(chalk.yellow('⚠️ Invalid protocol message structure'));
            return;
        }

        logger.debug(chalk.cyan(`🔄 Protocol message type: ${protocolMessage.type}`));

        if (protocolMessage.type === 0) {
            const deletedMessageKey = protocolMessage.key;
            const remoteJid = deletedMessageKey.remoteJid || message.key.remoteJid;
            await this.handleDeletedMessage(remoteJid, deletedMessageKey.id);
        } else {
            logger.debug(chalk.yellow(`⚠️ Unhandled protocol message type: ${protocolMessage.type}`));
        }
    }

    async processNormalMessage(message) {
        const messageType = Object.keys(message.message)[0];
        const userJid = message.key.remoteJid;
        const participantJid = message.key.participant || userJid;
        const messageContent = this.getMessageContent(message.message);

        this.logMessageInfo(participantJid, messageContent, userJid, messageType);
        this.storeMessage(userJid, message);

        await kordCmdUpsert(this.sock, message);
        this.emit('messageReceived', message);
    }

    async notifyOwnerAboutDeletedMessage(deletedMessage) {
        if (!this.ownerJid) {
            logger.error(chalk.red('❌ Owner JID not set'));
            return;
        }

        const sender = deletedMessage.key.participant || deletedMessage.key.remoteJid;
        const chat = deletedMessage.key.remoteJid;
        const messageContent = this.getMessageContent(deletedMessage.message);

        try {
            const fakeReply = this.createFakeReply();
            let sentMessage = await this.sendDeletedMessageNotification(deletedMessage, messageContent, sender, chat, fakeReply);

            if (sentMessage) {
                await this.sendDeletedMessageInfo(sentMessage, sender, chat);
                logger.info(chalk.green('✅ Deleted message notification sent to owner.'));
            }
        } catch (error) {
            logger.error(chalk.red('❌ Error sending deleted message notification:'), error);
        }
    }

    async sendDeletedMessageNotification(deletedMessage, messageContent, sender, chat, fakeReply) {
        if (this.isMediaMessage(deletedMessage.message)) {
            return await this.sendDeletedMediaNotification(deletedMessage, sender, chat, fakeReply);
        } else if (messageContent) {
            return await this.sendDeletedTextNotification(messageContent, sender, chat, fakeReply);
        }
        return null;
    }

    async sendDeletedMediaNotification(deletedMessage, sender, chat, fakeReply) {
        logger.debug(chalk.cyan('🔄 Sending deleted media to owner'));
        const mediaData = await this.downloadDeletedMedia(deletedMessage.message);
        if (mediaData) {
            const originalCaption = this.getOriginalCaption(deletedMessage.message) || '';
            const mediaType = Object.keys(mediaData)[0];
            const mediaMsg = {
                [mediaType]: mediaData[mediaType],
                mimetype: mediaData.mimetype,
                fileName: mediaData.fileName,
                caption: `*[DELETED MEDIA]*\n\n${originalCaption}`,
                contextInfo: {
                    mentionedJid: [sender],
                    quotedMessage: fakeReply.message,
                    participant: sender,
                    remoteJid: chat
                }
            };
            const sentMessage = await this.sock.sendMessage(this.ownerJid, mediaMsg, { quoted: fakeReply });
            this.scheduleMediaDeletion(mediaData.fileName);
            return sentMessage;
        }
        return null;
    }

    async sendDeletedTextNotification(messageContent, sender, chat, fakeReply) {
        const textMsg = {
            text: `*[DELETED MESSAGE]*\n\n${messageContent}`,
            contextInfo: {
                mentionedJid: [sender],
                quotedMessage: fakeReply.message,
                participant: sender,
                remoteJid: chat
            }
        };
        return await this.sock.sendMessage(this.ownerJid, textMsg, { quoted: fakeReply });
    }

    async sendDeletedMessageInfo(sentMessage, sender, chat) {
        const chatName = await this.getChatName(chat);
        const lagosTime = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });

        const infoText = `*[DELETED INFORMATION]*\n\n` +
                         `*TIME:* ${lagosTime}\n` +
                         `*CHAT:* ${chatName}\n` +
                         `*DELETED BY:* @${sender.split('@')[0]}\n` +
                         `*MESSAGE FROM:* @${sender.split('@')[0]}`;

        const infoMsg = {
            text: infoText,
            contextInfo: {
                mentionedJid: [sender],
                participant: sender,
                remoteJid: chat
            }
        };

        await this.sock.sendMessage(this.ownerJid, infoMsg, { quoted: sentMessage });
    }

    createFakeReply() {
        return {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                conversation: "*ANTIDELETE DETECTED*"
            }
        };
    }

    getMessageContent(messageContent) {
        if (!messageContent) return '[Unknown Message Type]';
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
        return message && (message.imageMessage || 
               message.videoMessage || 
               message.audioMessage ||
               message.stickerMessage ||
               message.documentMessage);
    }

    storeMessage(jid, message) {
        if (!this.messageStore.has(jid)) {
            this.messageStore.set(jid, []);
        }
        const chatMessages = this.messageStore.get(jid);
        chatMessages.push(message);
        
        if (chatMessages.length > this.storeCapacity) {
            chatMessages.splice(0, chatMessages.length - this.storeCapacity);
        }
    }

    getMessageFromStore(jid, messageId) {
        if (this.messageStore.has(jid)) {
            const chatMessages = this.messageStore.get(jid);
            return chatMessages.find(m => m.key.id === messageId);
        }
        return null;
    }

    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupProcessedMessages();
            this.cleanupMessageStore();
        }, 3600000); // Run every hour
    }

    cleanupProcessedMessages() {
        const now = Date.now();
        for (const messageId of this.processedMessages) {
            if (now - parseInt(messageId.split('_')[0]) > 3600000) { // Remove messages older than 1 hour
                this.processedMessages.delete(messageId);
            }
        }
        logger.debug(chalk.cyan(`🧹 Cleaned up processed messages. Current count: ${this.processedMessages.size}`));
    }

    cleanupMessageStore() {
        for (const [jid, messages] of this.messageStore) {
            if (messages.length > this.storeCapacity) {
                this.messageStore.set(jid, messages.slice(-this.storeCapacity));
            }
        }
        logger.debug(chalk.cyan(`🧹 Cleaned up message store. Current size: ${this.messageStore.size} chats`));
    }

    scheduleMessageCleanup(messageId) {
        setTimeout(() => {
            this.processedMessages.delete(messageId);
            logger.debug(chalk.cyan(`🗑️ Removed ${messageId} from processed messages`));
        }, 300000); // 5 minutes (300,000 ms)
    }

    scheduleMediaDeletion(fileName) {
        setTimeout(async () => {
            try {
                await fs.unlink(`${this.mediaDownloadPath}/${fileName}`);
                logger.info(chalk.green(`🗑️ Deleted media file: ${fileName}`));
            } catch (error) {
                logger.error(chalk.red(`❌ Error deleting media file ${fileName}:`), error);
            }
        }, this.mediaTimeout);
    }

    logMessageInfo(participantJid, messageContent, userJid, messageType) {
        logger.info(chalk.magenta('📩 New message received:'));
        logger.info(chalk.blue(`👤 User JID: ${participantJid}`));
        logger.info(chalk.green(`💬 Message: ${messageContent}`));
        logger.info(chalk.yellow(`🗨️ Chat JID: ${userJid}`));
        logger.info(chalk.cyan(`🏷️ Message Type: ${messageType}`));
    }

    getOriginalCaption(message) {
        if (!message) {
            logger.debug(chalk.yellow('⚠️ getOriginalCaption: Message is null or undefined'));
            return null;
        }

        const messageTypes = ['imageMessage', 'videoMessage', 'documentMessage', 'stickerMessage'];
        
        for (const type of messageTypes) {
            if (message[type] && message[type].caption) {
                logger.debug(chalk.cyan(`🔍 getOriginalCaption: Found caption in ${type}`));
                return message[type].caption;
            }
        }

        if (message.extendedTextMessage && message.extendedTextMessage.text) {
            logger.debug(chalk.cyan('🔍 getOriginalCaption: Found caption in extendedTextMessage'));
            return message.extendedTextMessage.text;
        }

        logger.debug(chalk.yellow('⚠️ getOriginalCaption: No caption found in message'));
        return null;
    }

    async downloadDeletedMedia(message) {
        if (!message) {
            logger.error(chalk.red('❌ Invalid message structure in downloadDeletedMedia'));
            return null;
        }

        const mediaType = this.getMediaType(message);
        if (!mediaType) return null;

        try {
            const mediaMessage = message[mediaType];
            if (!mediaMessage) {
                logger.error(chalk.red(`❌ Media message of type ${mediaType} is undefined`));
                return null;
            }

            const stream = await downloadContentFromMessage(mediaMessage, mediaType.replace('Message', ''));
            const buffer = await this.streamToBuffer(stream);
            const mimetype = mediaMessage.mimetype || 'application/octet-stream';
            const fileName = mediaMessage.fileName || `deleted_${mediaType}_${Date.now()}.${mimetype.split('/')[1]}`;

            return {
                [mediaType.replace('Message', '')]: buffer,
                mimetype,
                fileName
            };
        } catch (error) {
            logger.error(chalk.red('❌ Error downloading deleted media:'), error);
            return null;
        }
    }

    getMediaType(message) {
        if (!message) return null;
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
        return mediaTypes.find(type => message[type]);
    }

    async streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    async getChatName(jid) {
        try {
            if (jid.endsWith('@g.us')) {
                // It's a group chat
                const chat = await this.sock.groupMetadata(jid);
                return chat.subject;
            } else {
                // It's a private chat
                const contact = await this.sock.getContactInfo(jid);
                return contact.pushName || contact.notify || jid.split('@')[0];
            }
        } catch (error) {
            logger.error(chalk.red('❌ Error getting chat name:'), error);
            return jid.split('@')[0]; // Return the number/user part of the JID as fallback
        }
    }

    setOwnerJid() {
        const ownerNumbers = global.settings?.OWNER_NUMBERS;
        if (!ownerNumbers) {
            logger.error(chalk.red('❌ Owner numbers not set in global settings'));
            return;
        }
        this.ownerJid = `${ownerNumbers}@s.whatsapp.net`;
    }

    isValidMessage(message) {
        if (!message || !message.message) {
            logger.debug(chalk.yellow('⚠️ Skipping message with no content'));
            return false;
        }

        if (!message.key?.id) {
            logger.debug(chalk.yellow('⚠️ Skipping message with no ID'));
            return false;
        }

        return true;
    }
}

function initializeKordEvents(sock) {
    const kordEventsManager = new KordEventsManager(sock);
    kordEventsManager.initialize().catch(error => {
        console.error(chalk.red('❌ Failed to initialize KordEventsManager:'), error);
    });

    kordEventsManager.on('error', ({ event, error, args }) => {
        logger.error(chalk.red(`❌ Error in event ${event}:`), error);
        if (kordEventsManager.debugMode) {
            logger.debug(chalk.gray('📊 Event args:'), JSON.stringify(args, null, 2));
        }
    });
}

module.exports = { KordEventsManager, initializeKordEvents };