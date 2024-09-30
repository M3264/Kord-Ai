const emojis = {
    ping: '🏓',
    response: '🚀',
    thinking: '🤔'
};


module.exports = {
    usage: 'ping',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,

    async execute(sock, m, args, context) {
        try {
            const uusage = this.usage
            const msg = {
                key: {
                    fromMe: false,
                    participant: "0@s.whatsapp.net",
                    remoteJid: "status@broadcast"
                },
                message: {
                    conversation: `${uusage}`
                }
            };
            const startTime = Date.now();
            await kord.react(m, "⚡")
            const latency = Date.now() - startTime;
            
            

            const Rmsg = {
                text: `🚀 ⚡ Pong! ${latency}ms`,
                contextInfo: { 
                    quotedMessage: msg.message,
                    participant: msg.key.participant
                }
            };

            await sock.sendMessage(m.key.remoteJid, Rmsg, { quoted: msg });

        } catch (error) {
            console.error('Error Sending Ping:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `An error occurred ${error.mesaage}` });
        }
    }
}