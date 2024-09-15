module.exports = {
    usage: 'adreply',
    description: 'Sends a forwarded ad with external ad reply info.',
    isGroupOnly: false,
    isPrivateOnly: false,
    isAdminOnly: false,
    emoji: '💬',
    
    async execute(sock, m, args) {
        try {
            const botname = global.settings.BOT_NAME;
            const ownername = global.settings.OWNER_NAME;
            const websitex = 'https://files.catbox.moe/gz00ie.jpg'; // Replace with actual website URL
            const txt = args.join(' ') || 'This is a default text message!';

            const xliconnewrep = {      
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: "Click here to get $69",
                        newsletterJid: "120363232303807350@newsletter",
                    },
                    externalAdReply: {  
                        showAdAttribution: true,
                        title: botname,
                        body: ownername,
                        thumbnailUrl: 'https://files.catbox.moe/gz00ie.jpg', // Replace if needed
                        sourceUrl: websitex
                    },
                },
                text: txt,
            };

            await sock.sendMessage(m.key.remoteJid, xliconnewrep, {
                quoted: m,
            });

        } catch (error) {
            console.error("Error in adreply command:", error);
            await kord.reply(m, `An error occurred while sending the ad message. ${error.message}`);
        }
    }
};