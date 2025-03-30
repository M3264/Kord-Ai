// are you a cloner?


const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
        usage: ["viewonce", "vv"],
        on: "text",
        desc: "Retrieve and resend view-once messages (images/videos/voice notes) when replied with `.vv`. Use `.vv chat` to receive in private chat.",
        commandType: "Utility",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "🕵️",

         execute: async(sock, m, args, kord) => {
                try {
                        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                        const sendToPrivate = args[0]?.toLowerCase() === 'chat';
                        const isGroup = m.key.remoteJid.endsWith('@g.us');

                        if (!quotedMsg) {
                                if (global.settings?.INVINCIBLE_MODE) {
                                        await m.react("🚫");
                                        return await kord.sendErr(null, {
                                                context: "ViewOnce Command",
                                                info: "No quoted message found!"
                                        });
                                }
                                return await m.send("Please reply to a view-once media message with `.vv` or `.vv chat` for private message.");
                        }

                        const mediaMessage = quotedMsg.imageMessage ||
                                quotedMsg.videoMessage ||
                                quotedMsg.audioMessage;

                        if (!mediaMessage?.viewOnce) {
                                if (global.settings?.INVINCIBLE_MODE) {
                                        await m.react("🚫");
                                        return await kord.sendErr(null, {
                                                context: "ViewOnce Command",
                                                info: "Not a view-once message"
                                        });
                                }
                                return await m.send("The replied message is not a view-once message.");
                        }

                        try {
                                const buffer = await kord.getbuff();
                                const caption = mediaMessage.caption || '';

                                let recipient;
                                if (sendToPrivate) {
                                        if (!isGroup) {
                                                recipient = `${global.settings.OWNER_NUMBERS}@s.whatsapp.net`;
                                               
                                                
                                        } else {
                                                recipient = m.key.participant
                                        }
                                } else {
                                        recipient = m.key.remoteJid;
                                }
                                if (mediaMessage.mimetype.startsWith('image')) {
                                        await sock.sendMessage(recipient, {
                                                image: buffer,
                                                caption: caption
                                        });
                                } else if (mediaMessage.mimetype.startsWith('video')) {
                                        await sock.sendMessage(recipient, {
                                                video: buffer,
                                                caption: caption
                                        });
                                } else if (mediaMessage.mimetype.startsWith('audio')) {
                                        await sock.sendMessage(recipient, {
                                                audio: buffer,
                                                ptt: mediaMessage.ptt || false
                                        });
                                } else {
                                        if (global.settings?.INVINCIBLE_MODE) {
                                                await m.react("🚫");
                                                return await kord.sendErr(null, {
                                                        context: "ViewOnce Command",
                                                        info: "Unsupported media type"
                                                });
                                        }
                                        return await m.send("Unsupported media type in view-once message.");
                                }
                                await m.react("✨");

                        } catch (downloadError) {
                                if (global.settings?.INVINCIBLE_MODE) {
                                        await m.react("🚫");
                                        return await kord.sendErr(downloadError, {
                                                context: "ViewOnce Command",
                                                info: "Failed to download media"
                                        });
                                }
                                return await m.send("Failed to download the media content.");
                        }

                } catch (error) {
                        if (global.settings?.INVINCIBLE_MODE) {
                                await m.react("🚫");
                                return await kord.sendErr(error, {
                                        context: "ViewOnce Command",
                                        info: "Unexpected error in processing view-once message"
                                });
                        }
                        console.error("Error in viewonce command:", error);
                        return await m.send("An error occurred while processing the view-once message.");
                }
        },
        
        onText: async(sock, m, text, kord) => {
          try {
            if (text.includes(global.settings.VV_CMD) && m.quoted) {
              var quot = m.quoted;
              const ownerNumbers = global.settings.OWNER_NUMBERS;
              const ownerJid = `${ownerNumbers}@s.whatsapp.net`;
              if (!quot.viewOnce) return;
              const buffer = await kord.getbuff();
              const caption = quot.caption || '';
              if (quot.mimetype.startsWith('image')) {
                                        await sock.sendMessage(ownerJid, {
                                                image: buffer,
                                                caption: caption
                                        });
                                } else if (quot.mimetype.startsWith('video')) {
                                        await sock.sendMessage(ownerJid, {
                                                video: buffer,
                                                caption: caption
                                        });
                                } else if (quot.mimetype.startsWith('audio')) {
                                        await sock.sendMessage(ownerJid, {
                                                audio: buffer,
                                                ptt: quot.ptt || false
                                        });
            }
            }
          } catch (err) {
            console.error(err)
            m.send(`${err}`)
          }
        }
};