const axios = require('axios');

const emojis = {
    game: '🎮',
    letter: '🔤',
    correct: '🟩',
    wrong: '⬜',
    misplaced: '🟨',
    win: '🏆',
    lose: '💔',
    timer: '⏳',
    error: '❌',
    success: '✅'
};

let games = {};

module.exports = {
    usage: ["wordmastermind", "wm"],
    desc: "Play Word Mastermind! Guess the secret word. <start|guess|hint|status>",
    commandType: "Game",
    isGroupOnly: true,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.game,
    async execute(sock, m, args) {
        const action = args[0]?.toLowerCase();
        const groupId = m.key.remoteJid;
        const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;

        switch (action) {
            case 'start':
                return startGame(sock, m, groupId, sender);
            case 'guess':
                return makeGuess(sock, m, groupId, sender, args[1]);
            case 'hint':
                return giveHint(sock, m, groupId);
            case 'status':
                return gameStatus(sock, m, groupId);
            default:
                return kord.reply(m, `${emojis.error} Invalid action. Use: .wm <start|guess|hint|status>`);
        }
    }
};

async function startGame(sock, m, groupId, sender) {
    if (games[groupId]) {
        return kord.reply(m, `${emojis.error} A game is already in progress in this group.`);
    }

    try {
        const word = await fetchRandomWord();
        games[groupId] = {
            word: word.toLowerCase(),
            creator: sender,
            guesses: [],
            maxAttempts: 6,
            startTime: Date.now(),
            hints: 2
        };

        return kord.reply(m, `${emojis.success} Word Mastermind started! The secret word has ${word.length} letters. Use .wm guess <word> to make a guess.`);
    } catch (error) {
        console.error("Error starting Word Mastermind game:", error);
        return kord.reply(m, `${emojis.error} Failed to start the game. Please try again later.`);
    }
}

async function makeGuess(sock, m, groupId, sender, guess) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .wm start to begin a new game.`);
    }

    const game = games[groupId];
    if (!guess || guess.length !== game.word.length) {
        return kord.reply(m, `${emojis.error} Invalid guess. The word has ${game.word.length} letters.`);
    }

    guess = guess.toLowerCase();
    game.guesses.push(guess);

    const feedback = generateFeedback(game.word, guess);
    let message = `Guess ${game.guesses.length}/${game.maxAttempts}: ${guess}\nFeedback: ${feedback}\n`;

    if (guess === game.word) {
        const timeTaken = Math.floor((Date.now() - game.startTime) / 1000);
        message += `${emojis.win} Congratulations! You've guessed the word in ${game.guesses.length} attempts and ${timeTaken} seconds!`;
        delete games[groupId];
    } else if (game.guesses.length >= game.maxAttempts) {
        message += `${emojis.lose} Game over! The word was "${game.word}".`;
        delete games[groupId];
    }

    return kord.reply(m, message);
}

function giveHint(sock, m, groupId) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .wm start to begin a new game.`);
    }

    const game = games[groupId];
    if (game.hints <= 0) {
        return kord.reply(m, `${emojis.error} No hints remaining.`);
    }

    const revealedIndices = new Set(game.guesses.flatMap((guess, i) => 
        [...guess].map((char, j) => char === game.word[j] ? j : -1).filter(i => i !== -1)
    ));

    let unrevealedIndices = [...game.word].map((_, i) => i).filter(i => !revealedIndices.has(i));
    if (unrevealedIndices.length === 0) {
        return kord.reply(m, `${emojis.error} No more letters to reveal.`);
    }

    const revealIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    game.hints--;

    const hint = [...game.word].map((char, i) => i === revealIndex ? char : '_').join('');
    return kord.reply(m, `${emojis.letter} Hint: ${hint}\nHints remaining: ${game.hints}`);
}

function gameStatus(sock, m, groupId) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .wm start to begin a new game.`);
    }

    const game = games[groupId];
    const timePassed = Math.floor((Date.now() - game.startTime) / 1000);
    const guessesLeft = game.maxAttempts - game.guesses.length;

    let status = `${emojis.game} Word Mastermind Status\n`;
    status += `${emojis.timer} Time: ${timePassed} seconds\n`;
    status += `${emojis.letter} Word length: ${game.word.length}\n`;
    status += `Guesses left: ${guessesLeft}\n`;
    status += `Hints left: ${game.hints}\n\n`;

    status += `Previous guesses:\n`;
    game.guesses.forEach((guess, index) => {
        status += `${index + 1}. ${guess} - ${generateFeedback(game.word, guess)}\n`;
    });

    return kord.reply(m, status);
}

function generateFeedback(word, guess) {
    return [...guess].map((char, i) => {
        if (char === word[i]) return emojis.correct;
        if (word.includes(char)) return emojis.misplaced;
        return emojis.wrong;
    }).join('');
}

async function fetchRandomWord() {
    const response = await axios.get('https://random-word-api.herokuapp.com/word?length=5');
    return response.data[0];
}