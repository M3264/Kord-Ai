const axios = require('axios');

class TempMailService {
    constructor() {
        this.emailStore = new Map();
        this.cleanupInterval = setInterval(this.cleanup.bind(this), 5 * 60 * 1000);
        this.API_BASE = 'https://www.1secmail.com/api/v1/';
        
        // Define supported media types
        this.mediaTypes = {
            image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'],
            audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
            document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']
        };
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, data] of this.emailStore.entries()) {
            if (now - data.timestamp > 15 * 60 * 1000) {
                this.emailStore.delete(userId);
            }
        }
    }

    createResponse(text) {
        return {
            text,
            contextInfo: {
                externalAdReply: {
                    title: "𝗞𝗢𝗥𝗗 𝗔𝗜",
                    body: "Temporary Email Service",
                    thumbnailUrl: "https://files.catbox.moe/xdzljz.png",
                    sourceUrl: "https://github.com/KORD-CODE",
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                }
            }
        };
    }

    // Helper function to get file type
    getFileType(filename) {
        const extension = filename.toLowerCase();
        for (const [type, extensions] of Object.entries(this.mediaTypes)) {
            if (extensions.some(ext => extension.endsWith(ext))) {
                return type;
            }
        }
        return 'document'; // Default type for unknown extensions
    }

    // Helper function to get MIME type
    getMimeType(filename) {
        const extension = filename.toLowerCase();
        const mimeTypes = {
            // Images
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            // Videos
            '.mp4': 'video/mp4',
            '.mkv': 'video/x-matroska',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv',
            '.flv': 'video/x-flv',
            '.webm': 'video/webm',
            // Audio
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            // Documents
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.csv': 'text/csv'
        };

        for (const [ext, mime] of Object.entries(mimeTypes)) {
            if (extension.endsWith(ext)) {
                return mime;
            }
        }
        return 'application/octet-stream'; // Default MIME type
    }

    async generateEmail() {
        const response = await axios.get(`${this.API_BASE}?action=genRandomMailbox&count=1`);
        return response.data[0];
    }

    async getMessages(username, domain) {
        const response = await axios.get(`${this.API_BASE}?action=getMessages&login=${username}&domain=${domain}`);
        return response.data;
    }

    async readMessage(username, domain, id) {
        const response = await axios.get(`${this.API_BASE}?action=readMessage&login=${username}&domain=${domain}&id=${id}`);
        return response.data;
    }

    async downloadAttachment(username, domain, id, file) {
        const response = await axios.get(
            `${this.API_BASE}?action=download&login=${username}&domain=${domain}&id=${id}&file=${file}`,
            { responseType: 'arraybuffer' }
        );
        return response.data;
    }

    // Create message object for media attachments
    createMediaMessage(attachmentData, attachment) {
        const fileType = this.getFileType(attachment.filename);
        const mimeType = this.getMimeType(attachment.filename);
        const caption = `📎 *Attachment:* ${attachment.filename}`;

        const messageObject = {
            mimetype: mimeType,
            fileName: attachment.filename
        };

        switch (fileType) {
            case 'image':
                return {
                    image: attachmentData,
                    caption: caption
                };
            case 'video':
                return {
                    video: attachmentData,
                    caption: caption
                };
            case 'audio':
                return {
                    audio: attachmentData,
                    caption: caption
                };
            default:
                return {
                    document: attachmentData,
                    mimetype: mimeType,
                    fileName: attachment.filename
                };
        }
    }
}

const mailService = new TempMailService();

module.exports = [
    {
        usage: ["tempmail", "tempemail"],
        desc: "Generate a temporary email address",
        commandType: "Utility",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "📧",

        async execute(sock, m, args) {
            try {
                const email = await mailService.generateEmail();
                const [username, domain] = email.split('@');

                mailService.emailStore.set(m.sender, {
                    email,
                    timestamp: Date.now()
                });

                const reply = `
*📧 TEMPORARY EMAIL GENERATED*\n
   │✦ *EMAIL:* ➪ ${email}
   >> ────────────────── <<
   │✦ *USERNAME:* ➪ ${username}
   >> ─────────────────── <<
   │✦ *DOMAIN:* ➪ ${domain}
   
   _To check messages, use:_
   ${settings.PREFIX[0]}mailmessages, ${settings.PREFIX[0]}checkmail

*⚠️ This email will be available for 15 minutes*
*⚠️ Email will expire after 24 hours from creation*

> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`;

                await sock.sendMessage(m.key.remoteJid, mailService.createResponse(reply), { quoted: m });
            } catch (error) {
                console.error('Error generating temp mail:', error);
                await sock.sendMessage(m.key.remoteJid, mailService.createResponse('Failed to generate email. Please try again.'), { quoted: m });
            }
        }
    },
    {
        usage: ["mailmessages", "checkmail"],
        desc: "Check messages in temporary email",
        commandType: "Utility",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "📨",

        async execute(sock, m, args) {
            const userData = mailService.emailStore.get(m.sender);
            
            if (!userData) {
                await sock.sendMessage(m.key.remoteJid, mailService.createResponse('No active email found. Please generate one using !tempmail first.'), { quoted: m });
                return;
            }

            try {
                const [username, domain] = userData.email.split('@');
                const messages = await mailService.getMessages(username, domain);
                
                if (messages.length === 0) {
                    await sock.sendMessage(m.key.remoteJid, mailService.createResponse('No messages found in this mailbox.'), { quoted: m });
                    return;
                }

                for (const message of messages) {
                    const fullMessage = await mailService.readMessage(username, domain, message.id);
                    
                    // Send message content first
                    const reply = `
*📬 Email Message*
│✦ *From:* ➪ ${fullMessage.from}
│✦ *Subject:* ➪ ${fullMessage.subject}
│✦ *Date:* ➪ ${fullMessage.date}
>> ────────────────── <<

*Content:*
${fullMessage.textBody || fullMessage.htmlBody || 'No content available'}

${fullMessage.attachments?.length ? `\n*📎 Attachments:* ${fullMessage.attachments.length} files` : ''}`;

                    await sock.sendMessage(m.key.remoteJid, mailService.createResponse(reply), { quoted: m });

                    // Handle attachments
                    if (fullMessage.attachments && fullMessage.attachments.length > 0) {
                        for (const attachment of fullMessage.attachments) {
                            try {
                                const attachmentData = await mailService.downloadAttachment(
                                    username, 
                                    domain, 
                                    message.id, 
                                    attachment.filename
                                );

                                // Create and send media message
                                const mediaMessage = mailService.createMediaMessage(attachmentData, attachment);
                                await sock.sendMessage(m.key.remoteJid, mediaMessage, { quoted: m });

                            } catch (attachmentError) {
                                console.error('Error downloading attachment:', attachmentError);
                                await sock.sendMessage(
                                    m.key.remoteJid, 
                                    mailService.createResponse(`Failed to download attachment: ${attachment.filename}`),
                                    { quoted: m }
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking messages:', error);
                await sock.sendMessage(m.key.remoteJid, mailService.createResponse('Failed to check messages. Please try again.'), { quoted: m });
            }
        }
    },
    {
        usage: ["delmail"],
        desc: "Delete the current temporary email",
        commandType: "Utility",
        isGroupOnly: false,
        isAdminOnly: false,
        isPrivateOnly: false,
        emoji: "🗑️",

        async execute(sock, m, args) {
            const userData = mailService.emailStore.get(m.sender);
            
            if (!userData) {
                await sock.sendMessage(m.key.remoteJid, mailService.createResponse('No active email found to delete.'), { quoted: m });
                return;
            }

            try {
                const email = userData.email;
                mailService.emailStore.delete(m.sender);
                
                const reply = `
*🗑️ EMAIL DELETED*

   │✦ *DELETED EMAIL:* ➪ ${email}
   >> ─────────────────── <<
   
*✅ Email session has been terminated*
_Generate a new email using ${settings.PREFIX[0]}tempmail_

> © ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ ʙʏ ᴋᴏʀᴅ ɪɴᴄ³²¹™`;

                await sock.sendMessage(m.key.remoteJid, mailService.createResponse(reply), { quoted: m });
            } catch (error) {
                console.error('Error deleting email:', error);
                await sock.sendMessage(m.key.remoteJid, mailService.createResponse('Failed to delete email. Please try again.'), { quoted: m });
            }
        }
    }
];