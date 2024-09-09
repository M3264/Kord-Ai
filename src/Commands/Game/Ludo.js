const emojis = {
    dice: '🎲',
    player: ['🔴', '🟢', '🔵', '🟡'],
    home: '🏠',
    finish: '🏁',
    error: '❌',
    success: '✅'
};

let games = {};

module.exports = {
    usage: ["ludo"],
    desc: "Play a game of Ludo with friends! <start|join|roll|status>",
    commandType: "Game",
    isGroupOnly: true,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.dice,
    async execute(sock, m, args) {
        const action = args[0]?.toLowerCase();
        const groupId = m.key.remoteJid;
        const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid

        switch (action) {
            case 'start':
                return startGame(sock, m, groupId, sender);
            case 'join':
                return joinGame(sock, m, groupId, sender);
            case 'roll':
                return rollDice(sock, m, groupId, sender);
            case 'status':
                return gameStatus(sock, m, groupId);
            default:
                return kord.reply(m, `${emojis.error} Invalid action. Use: .ludo <start|join|roll|status>`);
        }
    }
};

function startGame(sock, m, groupId, sender) {
    if (games[groupId]) {
        return kord.reply(m, `${emojis.error} A game is already in progress in this group.`);
    }

    games[groupId] = {
        players: [{ id: sender, position: 0, color: emojis.player[0] }],
        currentPlayer: 0,
        started: false
    };

    return kord.reply(m, `${emojis.success} Ludo game started! Use .ludo join to join the game.`);
}

function joinGame(sock, m, groupId, sender) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .ludo start to begin a new game.`);
    }

    if (games[groupId].started) {
        return kord.reply(m, `${emojis.error} Game already in progress. Wait for the next game.`);
    }

    if (games[groupId].players.some(p => p.id === sender)) {
        return kord.reply(m, `${emojis.error} You've already joined the game.`);
    }

    if (games[groupId].players.length >= 4) {
        return kord.reply(m, `${emojis.error} Game is full. Maximum 4 players allowed.`);
    }

    const playerIndex = games[groupId].players.length;
    games[groupId].players.push({ id: sender, position: 0, color: emojis.player[playerIndex] });

    if (games[groupId].players.length === 4) {
        games[groupId].started = true;
        return kord.reply(m, `${emojis.success} You joined the game. The game is now full and will begin! Use .ludo roll to take your turn.`);
    }

    return kord.reply(m, `${emojis.success} You joined the game. Waiting for more players...`);
}

function rollDice(sock, m, groupId, sender) {
    if (!games[groupId] || !games[groupId].started) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .ludo start to begin a new game.`);
    }

    const currentPlayer = games[groupId].players[games[groupId].currentPlayer];
    if (currentPlayer.id !== sender) {
        return kord.reply(m, `${emojis.error} It's not your turn.`);
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    currentPlayer.position += roll;

    let message = `${currentPlayer.color} rolled a ${emojis.dice}${roll}. `;

    if (currentPlayer.position >= 50) {
        message += `${emojis.finish} Player ${currentPlayer.color} has won the game!`;
        delete games[groupId];
    } else {
        message += `New position: ${currentPlayer.position}`;
        games[groupId].currentPlayer = (games[groupId].currentPlayer + 1) % games[groupId].players.length;
    }

    return kord.reply(m, message);
}

function gameStatus(sock, m, groupId) {
    if (!games[groupId]) {
        return kord.reply(m, `${emojis.error} No game in progress. Use .ludo start to begin a new game.`);
    }

    const status = games[groupId].players.map(p => `${p.color}: Position ${p.position}`).join('\n');
    const currentPlayer = games[groupId].players[games[groupId].currentPlayer].color;

    return kord.reply(m, `Current game status:\n${status}\n\nCurrent turn: ${currentPlayer}`);
}