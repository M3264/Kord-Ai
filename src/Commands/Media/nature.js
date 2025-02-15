const axios = require('axios');
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

const formatFileSize = bytes => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const sendnaturewall = async (sock, m, jid) => {
    try {
        const response = await axios.get('https://api.kordai.us.kg/lumina/search?query=nature');
        const { wallpapers } = response.data;

        const slides = wallpapers.map(wallpaper => {
            const stats = `📥 ${wallpaper.downloads} ⭐ ${wallpaper.likes} 👁️ ${wallpaper.views}`;
            const details = `Resolution: ${wallpaper.resolution}\nSize: ${formatFileSize(wallpaper.size * 1024)}`;
            
            return [
                wallpaper.thumbnail,
                'Nature Wallpaper',
                `${details}\n\n${stats}`,
                wallpaper.tags,
                'Download',
                wallpaper.image,
                'cta_url',
                wallpaper.image
            ];
        });

        const cards = await Promise.all(
            slides.map(async ([image, titMess, boMessage, fooMess, textCommand, command, buttonType, url]) => ({
                body: proto.Message.InteractiveMessage.Body.fromObject({ text: boMessage }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: fooMess }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: titMess,
                    hasMediaAttachment: true,
                    ...(await prepareWAMessageMedia(
                        { image: { url: image } },
                        { upload: sock.waUploadToServer }
                    ))
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: buttonType,
                        buttonParamsJson: JSON.stringify({
                            display_text: textCommand,
                            url,
                            merchant_url: url
                        })
                    }]
                })
            }))
        );

        const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: '🌿 Explore beautiful nature wallpapers'
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: '© Kord-Ai Lumina'
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '🌿 Nature Wallpapers',
                subtitle: 'Swipe to browse',
                hasMediaAttachment: false
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards }),
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363321914137077@newsletter',
                    newsletterName: 'KordAi',
                    serverMessageId: 143
                }
            }
        });

        const msg = generateWAMessageFromContent(
            jid,
            { viewOnceMessage: { message: { interactiveMessage } } },
            { quoted: m }
        );

        await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
    } catch (error) {
        console.error('Error fetching nature wallpapers:', error);
        throw error;
    }
};

module.exports = {
    usage: ['nature'],
    desc: 'Browse and download beautiful nature wallpapers.',
    commandType: 'Wallpaper',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: false,
    emoji: '🌿',
    execute: async (sock, m, args) => await sendnaturewall(sock, m, m.key.remoteJid)
};