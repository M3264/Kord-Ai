const axios = require('axios');

const emojis = {
    game: '🎮',
    letter: '🔤',
    correct: '✅',
    wrong: '❌',
    win: '🏆',
    lose: '💀',
    hangman: ['🧍', '🧍‍♂️', '🧍‍♂️🪵', '🧍‍♂️🪵🪢', '😵'],
    error: '⚠️',
    success: '🎉'
};

let games = {};

module.exports = {
    usage: ["hangman", "hm"],
    desc: "Play Hangman! Guess the word letter by letter. <start|guess|hint|status>",
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
                return kord.reply(m, `${emojis.error} Invalid action. Use: .hm <start|guess|hint|status>`);
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
            guessedLetters: new Set(),
            wrongGuesses: 0,
            maxWrongGuesses: 5,
            startTime: Date.now(),
            hints: 2,
            players: new Set([sender])
        };

        const hiddenWord = hideWord(word, new Set());
        return kord.reply(m, `${emojis.success} Hangman started! The word has ${word.length} letters.\n${hiddenWord}\nUse .hm guess <letter> to make a guess.`);
    } catch (error) {
        console.error("Error starting Hangman game:", error);
        return kord.reply(m, `${emojis.error} Failed to start the game. Please try again later.`);
    }
}

async function makeGuess(sock, m, groupId, sender, guess) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .hm start to begin a new game.`);
    }

    const game = games[groupId];
    game.players.add(sender);

    if (!guess || guess.length !== 1 || !guess.match(/[a-z]/i)) {
        return kord.reply(m, `${emojis.error} Invalid guess. Please guess a single letter.`);
    }

    guess = guess.toLowerCase();
    if (game.guessedLetters.has(guess)) {
        return kord.reply(m, `${emojis.error} The letter '${guess}' has already been guessed.`);
    }

    game.guessedLetters.add(guess);

    let message = '';
    if (game.word.includes(guess)) {
        message += `${emojis.correct} Good guess! '${guess}' is in the word.\n`;
    } else {
        game.wrongGuesses++;
        message += `${emojis.wrong} Sorry, '${guess}' is not in the word.\n`;
    }

    const hiddenWord = hideWord(game.word, game.guessedLetters);
    message += `${hiddenWord}\n`;
    message += `${emojis.hangman[game.wrongGuesses]} Wrong guesses: ${game.wrongGuesses}/${game.maxWrongGuesses}\n`;

    if (!hiddenWord.includes('_')) {
        const timeTaken = Math.floor((Date.now() - game.startTime) / 1000);
        message += `${emojis.win} Congratulations! You've guessed the word "${game.word}" in ${timeTaken} seconds!`;
        delete games[groupId];
    } else if (game.wrongGuesses >= game.maxWrongGuesses) {
        message += `${emojis.lose} Game over! The word was "${game.word}".`;
        delete games[groupId];
    }

    return kord.reply(m, message);
}

function giveHint(sock, m, groupId) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .hm start to begin a new game.`);
    }

    const game = games[groupId];
    if (game.hints <= 0) {
        return kord.reply(m, `${emojis.error} No hints remaining.`);
    }

    const unguessedLetters = [...game.word].filter(letter => !game.guessedLetters.has(letter));
    if (unguessedLetters.length === 0) {
        return kord.reply(m, `${emojis.error} No more letters to reveal.`);
    }

    const hintLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
    game.guessedLetters.add(hintLetter);
    game.hints--;

    const hiddenWord = hideWord(game.word, game.guessedLetters);
    return kord.reply(m, `${emojis.letter} Hint: The letter '${hintLetter}' is in the word.\n${hiddenWord}\nHints remaining: ${game.hints}`);
}

function gameStatus(sock, m, groupId) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .hm start to begin a new game.`);
    }

    const game = games[groupId];
    const timePassed = Math.floor((Date.now() - game.startTime) / 1000);
    const guessesLeft = game.maxWrongGuesses - game.wrongGuesses;

    let status = `${emojis.game} Hangman Status\n`;
    status += `${emojis.letter} Word: ${hideWord(game.word, game.guessedLetters)}\n`;
    status += `⏳ Time: ${timePassed} seconds\n`;
    status += `${emojis.hangman[game.wrongGuesses]} Wrong guesses: ${game.wrongGuesses}/${game.maxWrongGuesses}\n`;
    status += `Hints left: ${game.hints}\n`;
    status += `Guessed letters: ${[...game.guessedLetters].join(', ')}\n`;
    status += `Players: ${[...game.players].length}\n`;

    return kord.reply(m, status);
}

function hideWord(word, guessedLetters) {
    return [...word].map(letter => guessedLetters.has(letter) ? letter : '_').join(' ');
}

async function fetchRandomWord() {
    const response = await axios.get('https://random-word-api.herokuapp.com/word');
    return response.data[0];
}