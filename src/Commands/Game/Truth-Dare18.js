const fs = require('fs');
const path = require('path');

module.exports = {
    usage: ['truth18', 'dare18', 'truthordare18', 'td18'],
    description: 'Play a game of Truth or Dare with options for normal or 18+ questions.',
    emoji: '🎲',
    commandType: 'Fun',
    isGroupOnly: true,  // Only allow this command in group chats

    async execute(sock, m, args) {
        const groupId = m.key.remoteJid;
        const userId = m.key.participant;
        const isAdult = args.includes('adult'); // Check if 'adult' is specified in the arguments
        const choice = args[0]?.toLowerCase() || (Math.random() < 0.5 ? 'truth' : 'dare'); // Default to a random choice if not specified

        try {
            // Determine the correct file path based on the choice and whether it's an adult question
            const filePath = path.join(__dirname, 
                isAdult ? `18truth-dare-adult-${choice}.json` : `18truth-dare-adult-${choice}.json`
            );

            // Read and parse the JSON file to get questions
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!data[choice]) {
                throw new Error(`No ${choice} questions available.`);
            }

            // Randomly select a question from the list
            const question = data[choice][Math.floor(Math.random() * data[choice].length)];

            // Send the selected question to the group
            await sock.sendMessage(groupId, {
                text: `
╭─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╮
┊ 🎲 *${choice.toUpperCase()}* for @${userId.split('@')[0]}: ${question}
╰─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╯
                `,
                mentions: [userId] // Mention the user who triggered the command
            }, { quoted: m });

        } catch (error) {
            console.error('Error fetching truth or dare question:', error);
            await sock.sendMessage(groupId, {
                text: "An error occurred while fetching a question. Please try again later."
            }, { quoted: m });
        }
    }
};