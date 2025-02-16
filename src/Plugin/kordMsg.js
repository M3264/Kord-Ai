const fs = require('fs').promises;
const path = require('path');
const { downloadContentFromMessage, downloadMediaMessage, delay } = require('@whiskeysockets/baileys');
const { streamToBuffer } = require('./kordStreamToBuffer');
const fancyScriptFonts = require('./kordFonts');
const { writeExif, imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif.js');
const { proto } = require('@whiskeysockets/baileys');
const { prepareWAMessageMedia, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const fss = require('fs');
const fetch = require('node-fetch');
const RED = '[31m';
const RESET = '[0m';
const settings = require('../../Config.js');
const packagejson = require('../../package.json');
const OWNER_NUMBERS = settings.OWNER_NUMBERS || global.settings?.OWNER_NUMBERS;
const { jidDecode } = require("@whiskeysockets/baileys");

if (!OWNER_NUMBERS) {
  console.error(RED + 'CRITICAL: OWNER_NUMBERS is not set!' + RESET);
}

const ownerJid = OWNER_NUMBERS ? `${OWNER_NUMBERS}@s.whatsapp.net` : null;
const version = '1';

class MessageListener {
  constructor(sock) {
    this.sock = sock;
    this.listeners = new Map();
    this.kordListeners = new Set(); // Track Kord-specific listeners
    this.setupMessageHandler();
  }

  setupMessageHandler() {
    this.sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
        if (!message.message || message.message.protocolMessage) continue;

        const sender = message.key.participant || message.key.remoteJid;
        const chatId = message.key.remoteJid;

        // Handle different message types
        const messageTypes = {
          text: message.message.conversation || message.message.extendedTextMessage?.text,
          image: message.message.imageMessage,
          video: message.message.videoMessage,
          sticker: message.message.stickerMessage,
          document: message.message.documentMessage,
        };

        // Notify relevant listeners
        for (const [listenerId, listener] of this.listeners) {
          try {
            if (listener.type in messageTypes && messageTypes[listener.type]) {
              await listener.callback({
                content: messageTypes[listener.type],
                sender,
                chatId,
                message,
                reply: (text) => this.sock.sendMessage(chatId, { text }),
              });
            }
          } catch (error) {
            console.error(`Error in listener ${listenerId}:`, error);
          }
        }
      }
    });
  }

  listen(type, callback, isKordListener = false) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const listener = { type, callback };
    this.listeners.set(id, listener);
    
    if (isKordListener) {
      this.kordListeners.add(id);
    }

    // Return function to remove this specific listener
    return () => {
      this.listeners.delete(id);
      if (isKordListener) {
        this.kordListeners.delete(id);
      }
    };
  }

  removeAllListeners() {
    this.listeners.clear();
    this.kordListeners.clear();
  }

  stopListening(listenerRemover) {
    if (typeof listenerRemover === 'function') {
      listenerRemover();
    }
  }

  removeKordListeners() {
    for (const id of this.kordListeners) {
      this.listeners.delete(id);
    }
    this.kordListeners.clear();
  }
}

const getBuffer = async (url) => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error in getBuffer:', error);
    throw error;
  }
};

function kordMsg(sock, originalMessage) {
  try {
    // Clear previous cache/data
    Object.keys(require.cache).forEach((key) => {
      delete require.cache[key];
    });

    // Create message listener instance
    const messageListener = new MessageListener(sock);

    // Store the original message context
    const ctx = {
      jid: originalMessage.key.remoteJid,
      sender: originalMessage.key.participant || originalMessage.key.remoteJid,
      quotedMsg: originalMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage,
      messageId: originalMessage.key.id,
      message: originalMessage,
    };

    // Define constants for listener management
    const MAX_LISTENERS = 20;
    const listeners = [];

    const sendMessage = async (content, options = {}) => {
      try {
        await sock.sendPresenceUpdate('composing', ctx.jid);
        await delay(200);
        return await sock.sendMessage(ctx.jid, content, options);
      } catch (err) {
        console.error(`${RED}Error sending message: ${err.message}${RESET}`);
        throw err;
      }
    };
    

      const methods = {
        reply: async (text) => {
          try {
            const thumbnail = await fetch("https://cdn.kordai.us.kg/serve/TlAqdcaBl4bm.png").then((res) => res.buffer());
            const messageContent = {
              text: text,
              contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                mentionedJid: [ctx.sender],
                forwardedNewsletterMessageInfo: {
                  newsletterName: "𝙆𝙊𝙍𝘿-𝘼𝙄",
                  newsletterJid: "120363321914137077@newsletter",
                },
                externalAdReply: {
                  title: "Kord-Ai",
                  body: "シ",
                  mediaType: 1,
                  thumbnail,
                  sourceUrl: "https://kordai.us.kg",
                },
              },
            };
            return await sendMessage(messageContent, { quoted: ctx.message });
          } catch (err) {
            console.error(`${RED}Error in enhanced reply: ${err.message}${RESET}`);
            throw err;
          }
        },
        send: async (text) => sendMessage({ text }),
        react: async (emoji) => sendMessage({ react: { text: emoji, key: ctx.message.key } }),
        editMsg: async (sentMessage, newMessage) => sendMessage({ edit: sentMessage.key, text: newMessage, type: "MESSAGE_EDIT" }),
        deleteMsg: async () => {
          const groupMetadata = await sock.groupMetadata(ctx.jid);
          const botId = sock.user.id.replace(/:.*$/, "") + "@s.whatsapp.net";
          const botIsAdmin = groupMetadata.participants.some((p) => p.id.includes(botId) && p.admin);
          if (!botIsAdmin) {
            throw new Error("I cannot delete messages because I am not an admin in this group.");
          }
          const quotedMsg = ctx.message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          if (!quotedMsg) {
            throw new Error("Please reply to the message you want to delete.");
          }
          const isOwnMessage = ctx.message.key.participant === ctx.message?.message?.extendedTextMessage?.contextInfo?.participant;
          const stanId = ctx.message?.message?.extendedTextMessage?.contextInfo?.stanzaId;
          const messageToDelete = {
            key: {
              remoteJid: ctx.jid,
              fromMe: isOwnMessage,
              id: stanId,
              participant: ctx.message?.message?.extendedTextMessage?.contextInfo?.participant,
            },
          };
          await sock.sendPresenceUpdate('composing', ctx.jid);
          await delay(200);
          const response = await sock.sendMessage(ctx.jid, { delete: messageToDelete.key });
          await delay(750);
          await sock.sendMessage(ctx.jid, { delete: ctx.message.key });
          return response;
        },
        listen: {
      text: (callback) => messageListener.listen('text', callback, true),
      image: (callback) => messageListener.listen('image', callback, true),
      video: (callback) => messageListener.listen('video', callback, true),
      sticker: (callback) => messageListener.listen('sticker', callback, true),
      document: (callback) => messageListener.listen('document', callback, true),
    },
    stopListening: (listenerRemover) => messageListener.stopListening(listenerRemover),
    removeKordListeners: () => messageListener.removeKordListeners(),

        freply: async (text) => {
          try {
            const thumbnail = await fetch("https://cdn.kordai.us.kg/serve/TlAqdcaBl4bm.png").then((res) => res.buffer());
            const quotedContent =
              ctx.message.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
              ctx.message.message.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
              ctx.message.message.conversation ||
              "𝙆𝙊𝙍𝘿-𝘼𝙄";
            const quotedMsg = {
              key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
              },
              message: {
                conversation: quotedContent,
              },
            };
            const messageContent = {
              text: text,
              contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                mentionedJid: [ctx.sender],
                forwardedNewsletterMessageInfo: {
                  newsletterName: "𝙆𝙊𝙍𝘿-𝘼",
                  newsletterJid: "120363321914137077@newsletter",
                },
                externalAdReply: {
                  title: "Kord-Ai",
                  body: "シ",
                  mediaType: 1,
                  thumbnail,
                  sourceUrl: "https://kordai.us.kg",
                },
              },
            };
            return await sendMessage(messageContent, { quoted: quotedMsg });
          } catch (err) {
            console.error(`${RED}Error in enhanced freply: ${err.message}${RESET}`);
            throw err;
          }
        },
        sendImage: async (bufferOrUrl, caption) => {
          const options = typeof bufferOrUrl === 'string'
            ? { image: { url: bufferOrUrl }, caption }
            : { image: bufferOrUrl, caption };
          return sendMessage(options);
        },
        sendVideo: async (bufferOrUrl, caption) => {
          const options = typeof bufferOrUrl === 'string'
            ? { video: { url: bufferOrUrl }, caption }
            : { video: bufferOrUrl, caption };
          return sendMessage(options);
        },
        sendDocument: async (bufferOrUrl, mimetype, fileName, caption) => {
          const options = typeof bufferOrUrl === 'string'
            ? { document: { url: bufferOrUrl }, mimetype, fileName, caption }
            : { document: bufferOrUrl, mimetype, fileName, caption };
          return sendMessage(options);
        },
        sendAudio: async (bufferOrUrl, ptt = false) => {
          const options = typeof bufferOrUrl === 'string'
            ? { audio: { url: bufferOrUrl }, ptt, mimetype: 'audio/mpeg' }
            : { audio: bufferOrUrl, ptt, mimetype: 'audio/mpeg' };
          await sock.sendPresenceUpdate('recording', ctx.jid);
          await delay(400);
          return sendMessage(options, { quoted: ctx.message });
        },
        sendGif: async (bufferOrUrl, playback = true) => {
          let gifBuffer;
          if (typeof bufferOrUrl === 'string') {
            const response = await fetch(bufferOrUrl);
            gifBuffer = await response.arrayBuffer();
          } else {
            gifBuffer = bufferOrUrl;
          }
          return sendMessage({ video: gifBuffer, gifPlayback: playback });
        },
        sendVideoAsSticker: async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fss.existsSync(path) ? fss.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
          buffer = await writeExifVid(buff, options)
        } else {
          buffer = await videoToWebp(buff)
        }
        await sock.sendMessage(jid, { sticker: { url:
        buffer }, ...options }, { quoted })
        return buffer
        
      },
      
      sendImageAsSticker: async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fss.existsSync(path) ? fss.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
          buffer = await writeExifImg(buff, options)
          
        } else {
          buffer = await imageToWebp(buff)
          
        }
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        .then( response => {
          fss.unlinkSync(buffer)
          return response
          
        })
      },
        sendSlide: async (title, msgText, footer, slides) => {
          try {
            if (!Array.isArray(slides) || !slides.length) {
              throw new Error('Slides must be a non-empty array');
            }
            const cards = await Promise.all(
              slides.map(async ([imageUrl, slideTitle, bodyText, footerText, buttonText, commandId, buttonType, buttonUrl]) => {
                const mediaMessage = await prepareWAMessageMedia(
                  { image: { url: imageUrl } },
                  { upload: sock.waUploadToServer }
                );
                return {
                  headerType: 1,
                  body: { text: bodyText },
                  footer: { text: footerText },
                  header: {
                    title: slideTitle,
                    hasMediaAttachment: true,
                    mediaType: 1,
                    mediaMessage,
                  },
                  nativeFlowMessage: {
                    buttons: [
                      {
                        name: buttonType,
                        buttonParamsJson: JSON.stringify(buildButtonParams(buttonType, buttonText, commandId, buttonUrl)),
                      },
                    ],
                  },
                };
              })
            );
            const messageContent = {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2,
                  },
                  interactiveMessage: {
                    body: { text: msgText },
                    footer: { text: footer },
                    header: { title: title, subtitle: title, hasMediaAttachment: false },
                    carouselMessage: { cards },
                    contextInfo: {
                      mentionedJid: [ctx.sender],
                      forwardingScore: 999,
                      isForwarded: true,
                      forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363321914137077@newsletter',
                        newsletterName: "KORD-AI",
                        serverMessageId: 143,
                      },
                    },
                  },
                },
              },
            };
            const generatedMessage = await generateWAMessageFromContent(
              ctx.jid,
              messageContent,
              { quoted: ctx.message, userJid: sock.user.id }
            );
            return await sock.relayMessage(ctx.jid, generatedMessage.message, { messageId: generatedMessage.key.id });
          } catch (error) {
            console.error('Error in sendSlide:', error);
            throw error;
          }
        },
        getbuff: async (source) => {
        try {
                // If no source provided, try to get quoted media
                if (!source) {
                        // Get quoted message properly using message context
                        const quotedMsg = ctx.message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                        if (!quotedMsg) throw new Error('No source provided and no quoted message found');

                        // Find the media message with expanded media types
                        const mediaTypes = [
                    'imageMessage',
                    'videoMessage',
                    'audioMessage',
                    'documentMessage',
                    'stickerMessage',
                    'documentWithCaptionMessage'
                ];

                        let mediaMsg = null;
                        let mediaType = null;

                        // Check for media in quoted message
                        for (const type of mediaTypes) {
                                if (quotedMsg[type]) {
                                        mediaMsg = quotedMsg[type];
                                        mediaType = type;
                                        break;
                                }
                                // Special handling for document with caption
                                if (type === 'documentWithCaptionMessage' && quotedMsg[type]?.message?.documentMessage) {
                                        mediaMsg = quotedMsg[type].message.documentMessage;
                                        mediaType = 'documentMessage';
                                        break;
                                }
                        }

                        if (!mediaMsg) throw new Error('No media found in quoted message');

                        // Get the correct mimetype base
                        const mimeTypeBase = mediaMsg.mimetype ? mediaMsg.mimetype.split('/')[0] : mediaType.replace('Message', '');

                        // Download the media content
                        const stream = await downloadContentFromMessage(mediaMsg, mimeTypeBase);
                        return await streamToBuffer(stream);
                }

                // Handle Buffer
                if (Buffer.isBuffer(source)) {
                        return source;
                }

                // Handle base64
                if (typeof source === 'string' && /^data:.*?\/.*?;base64,/i.test(source)) {
                        return Buffer.from(source.split(',')[1], 'base64');
                }

                // Handle URL
                if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
                        const response = await fetch(source);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const arrayBuffer = await response.arrayBuffer();
                        return Buffer.from(arrayBuffer);
                }

                // Handle file path
                if (typeof source === 'string' && fss.existsSync(source)) {
                        return fss.readFileSync(source);
                }

                // Handle stream
                if (source?.pipe && typeof source.pipe === 'function') {
                        return await streamToBuffer(source);
                }

                throw new Error('Invalid source type or source not found');
        } catch (error) {
                console.error(`${RED}Error in getbuff: ${error.message}${RESET}`);
                throw error;
        }
},
        sendErr: async (error, additionalContext = {}) => {
          try {
            if (!ownerJid) {
              console.error(RED + 'CRITICAL: Owner JID is not set!' + RESET);
              console.error('Please set OWNER_NUMBERS in environment or global settings');
              return null;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorReport = `
\`\`\`
|---- KORD-AI ERROR! ----|
Version: ${packagejson.version}
Command: ${additionalContext.command || 'command error'}
Error Report: ${errorMessage}
ChatJid: ${ctx.jid || 'Unknown'}
Sender: ${ctx.sender || 'Unknown'}
Additional Context:
${JSON.stringify(additionalContext, null, 2)}
|---- > © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™ ----|
\`\`\``;
            console.log(RED + 'Sending Error Report to:' + RESET, ownerJid);
            return await sock.sendMessage(ownerJid, { text: errorReport });
          } catch (sendError) {
            console.error(RED + 'Failed to send error report:' + RESET, sendError);
            return null;
          }
        },
        externalAdReply: async (head, title, body, mediaType, thumbnailPath) => {
          const urlOrPath = typeof thumbnailPath === 'string'
            ? { url: thumbnailPath }
            : await fs.readFile(thumbnailPath);
          return sendMessage({
            text: head,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: false,
                renderLargerThumbnail: true,
                title: title,
                body: body,
                previewType: 0,
                mediaType: mediaType,
                thumbnail: urlOrPath,
                mediaUrl: '',
              },
            },
          });
        },
        replyWithMention: async (text, users) => {
          const mentions = users.map((u) => `@${u}`).join(' ');
          return sendMessage({ text: `${text} ${mentions}`, mentions }, { quoted: ctx.message });
        },
        forwardMessage: async (jid, messageToForward, options = {}) => {
          return sock.relayMessage(jid, messageToForward.message, options);
        },
        getQuotedMessage: async () => {
                const quotedMessage =
                        ctx.message?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                        ctx.message?.message?.conversation?.contextInfo?.quotedMessage;
                return quotedMessage || null;
        },

        getQuotedText: async () => {
                const quotedMessage = await methods.getQuotedMessage();
                if (quotedMessage) {
                        return (
                                quotedMessage.extendedTextMessage?.text || quotedMessage.conversation || null
                        );
                }
                return null;
        },
        getQuotedMedia: async () => {
          const findMediaMessage = (obj) => {
            if (!obj) return null;
            const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'];
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
          for (const key in ctx.message.message) {
            const msg = ctx.message.message[key];
            if (msg?.contextInfo?.quotedMessage) {
              const media = findMediaMessage(msg.contextInfo.quotedMessage);
              if (media) return media;
            }
          }
          return false;
        },
        replyid: async () => {
          return ctx.message.message?.extendedTextMessage?.contextInfo?.stanzaId;
        },
        getMessageType: async () => {
          return ctx.message.message ? Object.keys(ctx.message.message)[0] : null;
        },
        getQuotedMessageType: async () => {
          if (!ctx.message.message) return null;
          const messageType = Object.keys(ctx.message.message)[0];
          return ctx.message.message[messageType]?.contextInfo?.quotedMessage;
        },
        getCaptionMessage: async () => {
          for (const key in ctx.message.message) {
            const msg = ctx.message.message[key];
            if (msg?.caption) return msg;
          }
          return null;
        },
        /*let quoted_sender = ''*/
      getResponseText: async (sentMessage, timeout) => {
        return new Promise((resolve, reject) => {
          const timer = timeout && timeout > 0 ? setTimeout(() => {
            sock.ev.off('messages.upsert', replyHandler);
            reject(new Error('Timeout exceeded while waiting for response'));
          }, timeout) : null;

          const replyHandler = async ({ messages }) => {
            const msg = messages[0];
            const senderJid = ctx.jid;
            const isValidReply = (
              (msg.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMessage.key.id ||
                msg.message?.conversation?.contextInfo?.stanzaId === sentMessage.key.id) &&
              (senderJid.endsWith('@g.us')
                ? ctx.sender
                : senderJid) ===
                (msg.key.remoteJid.endsWith('@g.us') ? msg.key.participant : msg.key.remoteJid)
            );

            if (isValidReply) {
              if (timer) clearTimeout(timer);
              sock.ev.off('messages.upsert', replyHandler);
              const responseText = msg.message?.extendedTextMessage?.text || msg.message?.conversation;
              resolve({ key: msg.key, message: msg.message, response: responseText });
            }
          };

          listeners.push(replyHandler);
          if (listeners.length > MAX_LISTENERS) {
            const oldestListener = listeners.shift();
            sock.ev.off('messages.upsert', oldestListener);
          }
          sock.ev.on('messages.upsert', replyHandler);
        });
      },
        
        
        downloadQuotedMedia: async () => {
        const quotedMsg = await methods.getQuotedMedia();
        if (!quotedMsg) throw new Error('No quoted media message found.');
        const getExtension = (type) => {
                const extensions = { imageMessage: 'png', videoMessage: 'mp4', audioMessage: 'mp3' };
                return extensions[type] || 'bin';
        };
        const extension = getExtension(quotedMsg.type);
        const mimeType = quotedMsg.message.mimetype.split('/')[0];
        const mediaData = await downloadContentFromMessage(quotedMsg.message, mimeType);
        const buffer = await streamToBuffer(mediaData);
        return { buffer, extension, filename: `media_${Date.now()}.${extension}` };
},
        downloadMediaMsg: async () => {
          if (!ctx.message.message) return null;
          const messageType = Object.keys(ctx.message.message)[0];
          const validTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'documentWithCaptionMessage'];
          if (!validTypes.includes(messageType)) {
            return 'Provide a valid message (quoted messages are not valid)';
          }
          const buffer = await downloadMediaMessage(
            ctx.message,
            'buffer',
            {},
            { logger: console, reuploadRequest: sock.updateMediaMessage }
          );
          const getExtension = (type) => {
            const extensions = {
              imageMessage: ctx.message.message.imageMessage.mimetype === 'image/png' ? '.png' : '.jpeg',
              videoMessage: '.mp4',
              audioMessage: '.mp3',
              documentMessage: `.${ctx.message.message.documentMessage.fileName.split('.').pop()}`,
              documentWithCaptionMessage: `.${ctx.message.message.documentWithCaptionMessage.message.documentMessage.fileName.split('.').pop()}`,
            };
            return extensions[type];
          };
          const extension = getExtension(messageType);
          return { buffer, extension };
        },
        changeFont: async (text, font) => {
          if (typeof text !== 'string' || typeof font !== 'string') {
            throw new Error("Both 'text' and 'font' must be of type string.");
          }
          const fontMap = fancyScriptFonts[font];
          if (!fontMap) {
            throw new Error(`Font '${font}' is not available in fancyScriptFonts.`);
          }
          await delay(10);
          return text.split('').map((char) => fontMap[char] || char).join('');
        },
        getFileSizeInMB: async () => {
          if (!ctx.message.message) return null;
          for (const key of Object.keys(ctx.message.message)) {
            const messageContent = ctx.message.message[key];
            if (messageContent && messageContent.fileLength) {
              const fileSizeBytes = parseInt(messageContent.fileLength);
              return fileSizeBytes / (1024 * 1024); // Convert to MB
            }
          }
          return null;
        },
        saveFileToTemp: async (bufferData, filename) => {
          try {
            const tempDir = path.join(__dirname, 'temp');
            await fs.mkdir(tempDir, { recursive: true });
            const tempPath = path.join(tempDir, filename);
            await fs.writeFile(tempPath, bufferData);
            return tempPath;
          } catch (err) {
            console.error(`${RED}Error in saveFileToTemp: ${err.message}${RESET}`);
            throw err;
          }
        },
        buildButtonParams: (buttonType, textCommand, command, url) => {
          const params = {
            cta_url: { display_text: textCommand, url, merchant_url: url },
            cta_call: { display_text: textCommand, id: command },
            quick_reply: { display_text: textCommand, id: command },
            cta_copy: { display_text: textCommand, id: '', copy_code: command },
            cta_reminder: { display_text: textCommand, id: command },
            cta_cancel_reminder: { display_text: textCommand, id: command },
            address_message: { display_text: textCommand, id: command },
            send_location: {},
          };
          return params[buttonType] || {};
        },
      }
      return methods;
  } catch (err) {
    console.error(`${RED}Error in kordMsg: ${err.message}${RESET}`);
    throw err;
  }
}

module.exports = {
  kordMsg,
}