const { getAggregateVotesInPollMessage, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { kordCmdUpsert } = require('./kordCmd');
const logger = require('./kordlogger');
const { EventEmitter } = require('events');
const { promisify } = require('util');
const stream = require('stream');

const pipeline = promisify(stream.pipeline);

class KordEventsManager extends EventEmitter {
    constructor(sock, chalk) {
        super();
        this.sock = sock;
        this.chalk = chalk;
        this.processedMessages = new Set(); // To track processed messages
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const events = [
            'messages.upsert',
            'messages.update',
            'chats.upsert',
            'chats.update',
            'presence.update',
            'groups.upsert',
            'groups.update',
            'group-participants.update',
            'call'
        ];

        events.forEach(event => {
            this.sock.ev.on(event, (...args) => this.handleEvent(event, ...args));
        });

        logger.info(this.chalk.green('🚀 Baileys event listeners initialized.'));
    }

    async handleEvent(event, ...args) {
        try {
            switch (event) {
                case 'messages.upsert':
                    await this.handleMessagesUpsert(...args);
                    break;
                case 'messages.update':
                    await this.handleMessagesUpdate(...args);
                    break;
                // Add cases for other events as needed
                default:
                    logger.debug(this.chalk.yellow(`Event handled: ${event}`));
                    break;
            }
        } catch (error) {
            logger.error(this.chalk.red(`❌ Error handling ${event} event:`), error);
            logger.debug('Event args:', JSON.stringify(args, null, 2));
            this.emit('error', { event, error, args });
        }
    }

    async handleMessagesUpsert({ messages, type }) {
        for (const message of messages) {
            if (!message.message) continue;

            const messageId = message.key.id;
            if (this.processedMessages.has(messageId)) {
                logger.info(this.chalk.yellow('Message already processed, skipping.'));
                continue;
            }

            this.processedMessages.add(messageId);

            logger.debug('Full message structure:', JSON.stringify(message, null, 2));

            const messageType = Object.keys(message.message)[0];
            const userJid = message.key.remoteJid;
            const participantJid = message.key.participant || userJid;
            const isGroup = userJid.endsWith('@g.us');

            const messageContent = this.getMessageContent(message.message);

            logger.info(this.chalk.blue('📩 New message received:'));
            logger.info(this.chalk.green(`User JID: ${participantJid}`));
            logger.info(this.chalk.yellow(`Message: ${messageContent}`));
            logger.info(this.chalk.cyan(`Chat JID: ${userJid}`));
            logger.info(this.chalk.white(`Message Type: ${messageType}`));

            try {
                if (userJid === 'status@broadcast') {
                    await this.handleStatus(message);
                } else {
                    await kordCmdUpsert(this.sock, message);
                    this.emit('messageReceived', message);

                    // Check for keywords and handle quoted media
                    const keywords = ['save', 'send', 'download', 'statusdown', 'take'];
                    if (keywords.some(keyword => messageContent.toLowerCase().includes(keyword))) {
                        await this.handleQuotedMediaDownload(message);
                    }
                }
            } catch (error) {
                logger.error(this.chalk.red('Error processing message:'), error);
            } finally {
                // Remove the message from processed set after a delay
                setTimeout(() => {
                    this.processedMessages.delete(messageId);
                }, 60000); // Remove after 1 minute
            }
        }
    }

    async handleMessagesUpdate(updates) {
        for (const update of updates) {
            if (update.update.pollUpdates) {
                await this.handlePollUpdate(update);
            }
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

    async handleStatus(message) {
        const sender = message.key.participant || message.key.remoteJid;
        const messageContent = this.getMessageContent(message.message);

        logger.info(this.chalk.magenta('📊 New status update received:'));
        logger.info(this.chalk.green(`Sender JID: ${sender}`));
        logger.info(this.chalk.yellow(`Status Content: ${messageContent}`));
        logger.info(this.chalk.white(`Status Type: ${Object.keys(message.message)[0]}`));

        try {
            const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMessage) {
                logger.debug('Quoted message structure:', JSON.stringify(quotedMessage, null, 2));

                if (quotedMessage.imageMessage) {
                    await this.downloadAndSendMedia(message.key.remoteJid, 'image', quotedMessage.imageMessage);
                } else if (quotedMessage.videoMessage) {
                    await this.downloadAndSendMedia(message.key.remoteJid, 'video', quotedMessage.videoMessage);
                } else {
                    logger.info(this.chalk.yellow('Quoted message does not contain downloadable media.'));
                }
                await this.sock.sendMessage(message.key.remoteJid, { text: '*Status processing completed.*' });
            } else {
                logger.info(this.chalk.yellow('No quoted message found in the status update.'));
            }

            await this.sock.readMessages([message.key]);
            logger.info(this.chalk.cyan('Status marked as read'));
        } catch (error) {
            logger.error(this.chalk.red('Error handling status or media:'), error);
        }
    }

    async downloadAndSendMedia(remoteJid, mediaType, mediaMessage) {
        try {
            const caption = mediaMessage.caption || '';
            const downloadedMedia = await this.downloadMedia({ type: `${mediaType}Message`, message: mediaMessage });
            
            if (downloadedMedia) {
                await this.sock.sendMessage(remoteJid, {
                    [mediaType]: downloadedMedia.buffer,
                    caption: caption
                });
                logger.info(this.chalk.green(`Successfully downloaded and sent status ${mediaType}.`));
            } else {
                logger.warn(this.chalk.yellow(`Failed to download ${mediaType} from status.`));
            }
        } catch (error) {
            logger.error(this.chalk.red(`Error downloading and sending ${mediaType}:`), error);
        }
    }

    async handlePollUpdate(update) {
        try {
            const pollCreation = await this.sock.getMessage(update.key.remoteJid, update.key.id);
            if (pollCreation) {
                const pollMessage = await getAggregateVotesInPollMessage({
                    message: pollCreation,
                    pollUpdates: update.update.pollUpdates,
                });
                logger.info(this.chalk.blue('Updated poll message:'), pollMessage);
                this.emit('pollUpdated', pollMessage);
            }
        } catch (error) {
            logger.error(this.chalk.red('Error handling poll updates:'), error);
        }
    }

    async handleQuotedMediaDownload(message) {
        try {
            const quotedMedia = await this.getQuotedOrDirectMedia(message);
            if (!quotedMedia) {
                logger.info(this.chalk.yellow('No quoted media found in the message.'));
                return;
            }

            logger.debug('Quoted media structure:', JSON.stringify(quotedMedia, null, 2));

            const downloadedMedia = await this.downloadMedia(quotedMedia);
            if (!downloadedMedia) {
                logger.info(this.chalk.yellow('Failed to download quoted media.'));
                return;
            }

            const { buffer, extension, filename } = downloadedMedia;

            // Send the downloaded media back to the chat
            await this.sock.sendMessage(message.key.remoteJid, {
                [quotedMedia.type.replace('Message', '')]: buffer,
                mimetype: quotedMedia.message.mimetype,
                fileName: filename,
                caption: 'ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ✅'
            });

            logger.info(this.chalk.green('Successfully downloaded and sent quoted media.'));
        } catch (error) {
            logger.error(this.chalk.red('Error handling quoted media download:'), error);
        }
    }

    async getQuotedOrDirectMedia(m) {
        const findMediaMessage = (obj) => {
            if (!obj) return null;
            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
            for (const type of mediaTypes) {
                if (obj[type]) return { type, message: obj[type] };
            }
            if (typeof obj === 'object') {
                for (const key in obj) {
                    const result = findMediaMessage(obj[key]);
                    if (result) return result;
                }
            }
            return null;
        };

        // Check if the message itself has media
        const directMedia = findMediaMessage(m.message);
        if (directMedia) return directMedia;

        // Check if quoted message has media
        for (const key in m.message) {
            const msg = m.message[key];
            if (msg?.contextInfo?.quotedMessage) {
                const quotedMedia = findMediaMessage(msg.contextInfo.quotedMessage);
                if (quotedMedia) return quotedMedia;
            }
        }

        return null;
    }

    async downloadMedia(mediaMessage) {
        if (!mediaMessage || !mediaMessage.message) {
            logger.error(this.chalk.red('Invalid media message structure'));
            return null;
        }

        const mediaType = mediaMessage.type.replace('Message', '');
        if (!['image', 'video', 'audio', 'document', 'sticker'].includes(mediaType)) {
            logger.error(this.chalk.red(`Unsupported media type: ${mediaType}`));
            return null;
        }

        try {
            const getExtension = (type) => {
                const extensions = { image: 'png', video: 'mp4', audio: 'mp3', document: 'bin', sticker: 'webp' };
                return extensions[type] || 'bin';
            };

            const extension = getExtension(mediaType);
            const filename = mediaMessage.message.fileName || `media_${Date.now()}.${extension}`;
            const mimeType = mediaMessage.message.mimetype?.split('/')[0] || mediaType;
            const mediaStream = await downloadContentFromMessage(mediaMessage.message, mimeType);

            const buffer = await this.streamToBuffer(mediaStream);

            return { buffer, extension, filename };
        } catch (error) {
            logger.error(this.chalk.red('Error downloading media:'), error);
            return null;
        }
    }

    async streamToBuffer(mediaStream) {
        const chunks = [];
        for await (const chunk of mediaStream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
}

function initializeKordEvents(sock, chalk) {
    const kordEventsManager = new KordEventsManager(sock, chalk);

    kordEventsManager.on('error', ({ event, error, args }) => {
        logger.error(`Error in event ${event}:`, error);
        logger.debug('Event args:', JSON.stringify(args, null, 2));
        // Implement error handling strategy (e.g., retry logic, notifications)
    });

    return kordEventsManager;
}

module.exports = { initializeKordEvents, KordEventsManager };