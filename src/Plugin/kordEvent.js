const { getAggregateVotesInPollMessage } = require("@whiskeysockets/baileys");
const { kordCmdUpsert } = require('./kordCmd');
const logger = require('./kordlogger');
const { EventEmitter } = require('events');

class KordEventsManager extends EventEmitter {
    constructor(sock, chalk) {
        super();
        this.sock = sock;
        this.chalk = chalk;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const events = [
            'messages.upsert',
            'messages.update',
            'chats.upsert',
            'chats.update',
            'labels.association',
            'labels.edit',
            'presence.update',
            'groups.upsert',
            'groups.update',
            'group-participants.update',
            'creds.update',
            'messaging-history.set',
            'chats.delete',
            'message-receipt.update',
            'blocklist.set',
            'blocklist.update',
            'call'
        ];

        events.forEach(event => {
            const handlerName = `handle${this.formatEventName(event)}`;
            
            if (typeof this[handlerName] === 'function') {
                this.sock.ev.on(event, async (...args) => {
                    try {
                        await this[handlerName](...args);
                    } catch (error) {
                        logger.error(this.chalk.red(`❌ Error handling ${event} event:`), error);
                        this.emit('error', { event, error });
                    }
                });
            } else {
                logger.error(this.chalk.red(`❌ Handler ${handlerName} for event ${event} does not exist.`));
            }
        });

        logger.info(this.chalk.green(`🚀 Baileys event listeners initialized.`));
    }

    formatEventName(event) {
        return event.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    }

    async handleMessagesUpsert({ messages }) {
        for (const m of messages) {
            if (m.key.remoteJid === 'status@broadcast') {
                console.log('Received a new status:', m);
                try {
                    // Mark the status as read
                    await this.sock.readMessages([m.key]);
                    console.log('Status marked as read.');
                } catch (error) {
                    console.error('Error marking status as read:', error);
                }
            } else {
                console.log('Handling other message types');
                await kordCmdUpsert(this.sock, m);
                this.emit('messageUpserted', m);
            }
        }
    }

    async handleMessagesUpdate(updates) {
        for (const { key, update } of updates) {
            if (update.pollUpdates) {
                try {
                    const pollCreation = await this.sock.getMessage(key.remoteJid, key.id);
                    if (pollCreation) {
                        const pollMessage = await getAggregateVotesInPollMessage({
                            message: pollCreation,
                            pollUpdates: update.pollUpdates,
                        });
                        logger.info('Updated poll message:', pollMessage);
                        this.emit('pollUpdated', pollMessage);
                    }
                } catch (error) {
                    logger.error('Error handling poll updates:', error);
                }
            }

            // Anti-delete handling
            if (update.message && update.message.protocolMessage && update.message.protocolMessage.type === 0) {
                await this.handleDeletedMessage(key);
            }
        }
    }

    async handleDeletedMessage(key) {
        const chat = key.remoteJid;
        const sender = key.participant || chat;
        
        try {
            const deletedMessage = await this.sock.loadMessage(chat, key.id);

            if (deletedMessage) {
                const messageContent = this.formatMessageContent(deletedMessage.message);
                const ownerNumber = global.settings.OWNER_NUMBERS[0];

                await this.sock.sendMessage(ownerNumber, { 
                    text: `🚨 *Anti-Delete Alert* 🚨\n\nA message was deleted!\n\n*From:* ${sender}\n*Chat:* ${chat}\n*Message:* ${messageContent}` 
                });

                logger.info(this.chalk.green('AntiDelete: Deleted message was sent to the owner.'));
            }
        } catch (err) {
            logger.error(this.chalk.red('Error in AntiDelete handler:'), err);
        }
    }

    formatMessageContent(message) {
        if (!message) return 'No message content available.';

        if (message.conversation) return message.conversation;
        if (message.extendedTextMessage) return message.extendedTextMessage.text;
        if (message.imageMessage) return '[Image]';
        if (message.videoMessage) return '[Video]';
        if (message.stickerMessage) return '[Sticker]';
        return '[Unknown Message Type]';
    }

    // Other event handlers...
    async handleChatsUpsert(chats) {
        logger.debug(this.chalk.green(`🗣️ Upserted chats:`), JSON.stringify(chats));
        this.emit('chatsUpserted', chats);
    }

    async handleChatsUpdate(updatedChats) {
        logger.debug(this.chalk.green(`🗣️ Updated chats:`), JSON.stringify(updatedChats));
        this.emit('chatsUpdated', updatedChats);
    }

    async handleLabelsAssociation(labelAssociation) {
        logger.debug(this.chalk.yellow(`🏷️ Label association:`), JSON.stringify(labelAssociation));
        this.emit('labelsAssociated', labelAssociation);
    }

    async handleLabelsEdit(label) {
        logger.debug(this.chalk.yellow(`🏷️ Edited label:`), JSON.stringify(label));
        this.emit('labelEdited', label);
    }

    async handlePresenceUpdate({ id, presences }) {
        logger.debug(this.chalk.cyan(`👤 Presence update for ${id}:`), JSON.stringify(presences));
        this.emit('presenceUpdated', { id, presences });
    }

    async handleGroupsUpsert(groupMetadata) {
        logger.debug(this.chalk.magenta(`👥 Upserted groups:`), JSON.stringify(groupMetadata));
        this.emit('groupsUpserted', groupMetadata);
    }

    async handleGroupsUpdate(updatedGroups) {
        logger.debug(this.chalk.magenta(`👥 Updated groups:`), JSON.stringify(updatedGroups));
        this.emit('groupsUpdated', updatedGroups);
    }

    async handleGroupParticipantsUpdate({ id, participants, action }) {
        logger.debug(this.chalk.magenta(`👥 Group participants update for ${id}:`), participants, action);
        this.emit('groupParticipantsUpdated', { id, participants, action });
    }

    async handleCredsUpdate(credentials) {
        // Avoid logging sensitive information
        logger.debug(this.chalk.blueBright(`🔑 Credentials updated`));
        this.emit('credsUpdated', credentials);
    }

    async handleMessagingHistorySet({ chats, contacts, messages, isLatest }) {
        logger.debug(this.chalk.cyan(`📜 Messaging history set:`), { chatsCount: chats.length, contactsCount: contacts.length, messagesCount: messages.length, isLatest });
        this.emit('messagingHistorySet', { chats, contacts, messages, isLatest });
    }

    async handleChatsDelete(chatIds) {
        logger.debug(this.chalk.green(`🗑️ Deleted chats:`), JSON.stringify(chatIds));
        this.emit('chatsDeleted', chatIds);
    }

    async handleMessageReceiptUpdate(receiptUpdates) {
        logger.debug(this.chalk.blue(`📨 Message receipt update:`), JSON.stringify(receiptUpdates));
        this.emit('messageReceiptUpdated', receiptUpdates);
    }

    async handleBlocklistSet({ blocklist }) {
        logger.debug(this.chalk.red(`🚫 Blocklist set:`), JSON.stringify(blocklist));
        this.emit('blocklistSet', blocklist);
    }

    async handleBlocklistUpdate({ blocklist, type }) {
        logger.debug(this.chalk.red(`🚫 Blocklist update:`), { blocklist: JSON.stringify(blocklist), type });
        this.emit('blocklistUpdated', { blocklist, type });
    }

    async handleCall(callEvents) {
        logger.debug(this.chalk.yellowBright(`📞 Call events:`), JSON.stringify(callEvents));
        this.emit('callReceived', callEvents);
    }
}

function initializeKordEvents(sock, chalk) {
    const kordEventsManager = new KordEventsManager(sock, chalk);

    kordEventsManager.on('error', ({ event, error }) => {
        logger.error(`Error in event ${event}:`, error);
        // Implement error handling strategy (e.g., retry logic, notifications)
    });

    return kordEventsManager;
}

module.exports = { initializeKordEvents, KordEventsManager };