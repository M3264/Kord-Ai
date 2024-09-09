const fs = require('fs'); // For reading the trivia questions from a file
const path = require('path');

const emojis = {
    success: '✅',
    error: '❌',
    thinking: '🤔',
    party: '🎉',
};

// Load trivia questions from a JSON file (create 'trivia.json' with questions in the specified format)
const triviaFilePath = path.join(__dirname, 'trivia.json'); 
const triviaQuestions = JSON.parse(fs.readFileSync(triviaFilePath));
let currentQuestion = null;

module.exports = {
    usage: ["trivia"],
    desc: "Play a trivia game. Usage: `trivia`",
    commandType: "Quiz",
    emoji: emojis.thinking,
    async execute(sock, m) {
        try {
            if (!currentQuestion) { // Start a new game
                currentQuestion = getRandomQuestion();

                await kord.reply(m, `${emojis.thinking} Trivia Time!\n\n${currentQuestion.question}\n\nOptions:\n${currentQuestion.options.map((opt, i) => `${i+1}. ${opt}`).join('\n')}`);

                // Set a timeout for the question
                setTimeout(async () => {
                    if (currentQuestion) {
                        await kord.reply(m, `${emojis.error} Time's up! The correct answer was: ${currentQuestion.answer}`);
                        currentQuestion = null; // Reset the question
                    }
                }, 30 * 1000); // 30 seconds
            } else { // Answer the current question
                const userAnswer = parseInt(m.message?.conversation) - 1; // Convert 1-based index to 0-based
                if (isNaN(userAnswer) || userAnswer < 0 || userAnswer >= currentQuestion.options.length) {
                    return await kord.reply(m, `${emojis.error} Invalid answer. Please choose a number from 1 to ${currentQuestion.options.length}.`);
                }

                if (currentQuestion.options[userAnswer] === currentQuestion.answer) {
                    await kord.reply(m, `${emojis.success} Correct!\n\n${currentQuestion.fact}`);
                } else {
                    await kord.reply(m, `${emojis.error} Incorrect! The correct answer was: ${currentQuestion.answer}\n\n${currentQuestion.fact}`);
                }

                currentQuestion = null; // Reset for the next question
            }
        } catch (error) {
            console.error('Error in trivia command:', error);
            await kord.reply(m, `${emojis.error} Error: ${error.message}`);
        }
    }
};

// Helper function to get a random question from the triviaQuestions array
function getRandomQuestion() {
    return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
}
