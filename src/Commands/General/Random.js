module.exports = {
    usage: 'random',
    description: 'Generates a random number between 1 and 100.',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emojis:'🔂',
    
    async execute(sock, m, args) {
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        await sock.sendMessage(m.key.remoteJid, { text: `🎲 Your random number is: ${randomNumber}` });
    }
};