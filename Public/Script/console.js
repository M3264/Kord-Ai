const terminal = document.getElementById('terminal-output');
const colors = {
    reset: '#f8f8f2',
    black: '#000000',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#6272a4',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
};

function appendToTerminal(text, color = colors.reset) {
    const span = document.createElement('span');
    span.style.color = color;
    span.textContent = text;
    terminal.appendChild(span);
    terminal.scrollTop = terminal.scrollHeight;
}

function simulateTyping(text, color = colors.reset, speed = 50) {
    return new Promise(resolve => {
        let i = 0;
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        terminal.appendChild(cursor);

        function type() {
            if (i < text.length) {
                appendToTerminal(text.charAt(i), color);
                i++;
                setTimeout(type, speed);
            } else {
                terminal.removeChild(cursor);
                appendToTerminal('\n');
                resolve();
            }
        }
        type();
    });
}

async function runTerminalSimulation() {
    await simulateTyping('Initializing Kord-Ai...', colors.cyan);
    await simulateTyping('Loading modules...', colors.yellow);
    await simulateTyping('Connecting to WhatsApp servers...', colors.blue);
    await simulateTyping('Connection established!', colors.green);
    await simulateTyping('Starting Kord-Ai...', colors.magenta);
    await simulateTyping('Kord-Ai is now online and ready!', colors.green);

    const socket = io(); // Initialize Socket.IO

    socket.on('consoleLog', async message => {
        const { text, color } = message;
        await simulateTyping(text, color, 30);
    });

    // Simulate random console logs
    setInterval(() => {
        const randomMessages = [
            { text: 'Received message from +1234567890', color: colors.blue },
            { text: 'Processing command: !help', color: colors.yellow },
            { text: 'Sending response...', color: colors.cyan },
            { text: 'Error: Invalid command format', color: colors.red },
            { text: 'User joined group: Kord-Ai Fans', color: colors.green },
        ];
        const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        socket.emit('consoleLog', randomMessage); // Emitting simulated 'consoleLog' event to server
    }, 5000);
}

runTerminalSimulation();
