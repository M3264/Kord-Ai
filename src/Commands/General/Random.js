module.exports = {
    usage: 'random',
    description: 'Generates a random number between 1 and 100.',
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emojis:'🔂',
    
    async execute(sock, m, args) {
        await kord.react(m, '👾');
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        
        // Use kord.externalAdreply to send the message with an external ad
        await kord.externalAdReply(
            m,
            `🎲 Your random number is: ${randomNumber}`,
            'Random Number Generator',
            'Generate numbers between 1 and 100',
            1,
            'https://telegra.ph/file/f5945740d07991c7ae698.jpg'
        );
    }
};