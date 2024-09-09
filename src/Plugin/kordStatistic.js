const os = require('os');
const WebSocket = require('ws');

const ws = new WebSocket('wss://web-socket-djtj.onrender.com/'); // Replace with your WebSocket server URL


async function kordStatistic(app, io) {
    // Middleware to log request start time
    app.use((req, res, next) => {
        req.startTime = Date.now();
        next();
    });

    // Endpoint to fetch statistics
    app.get('/stats', (req, res) => {
        const uptime = process.uptime(); // Uptime in seconds
        const responseTime = Date.now() - req.startTime; // Response time in milliseconds

        res.json({
            uptime: uptime,
            responseTimeInSeconds: responseTime / 1000
        });
    });

    app.get('/ownername', (req, res) => {
        const ownerName = global.settings.OWNER_NAME;
        res.send(ownerName);
    });

    let prevNetworkUsage = { totalRx: 0, totalTx: 0 };
    let prevNetworkUpdateTime = 0;

    function getNetworkSpeed() {
        const interfaces = os.networkInterfaces();
        let totalRx = 0;
        let totalTx = 0;

        Object.keys(interfaces).forEach(ifaceName => {
            const iface = interfaces[ifaceName];
            iface.forEach(entry => {
                if (!entry.internal && entry.family === 'IPv4') { // Skip internal and non-IPv4 interfaces
                    totalRx += entry.rx_bytes || 0; // Received bytes
                    totalTx += entry.tx_bytes || 0; // Sent bytes
                }
            });
        });

        const currentTime = Date.now();
        const timeDiff = (currentTime - prevNetworkUpdateTime) / 1000; // Time difference in seconds
        const rxSpeed = (totalRx - prevNetworkUsage.totalRx) / timeDiff; // Received bytes per second
        const txSpeed = (totalTx - prevNetworkUsage.totalTx) / timeDiff; // Sent bytes per second

        prevNetworkUsage = { totalRx, totalTx };
        prevNetworkUpdateTime = currentTime;

        return { rxSpeed, txSpeed };
    }

    // API endpoint to fetch system usage data including network
    app.get('/api/getUsageData', (req, res) => {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const ramUsage = Math.floor((usedMemory / totalMemory) * 100);

        // Disk usage calculation
        const diskUsage = Math.floor((os.totalmem() - os.freemem()) / os.totalmem() * 100);

        // Network usage and speed calculation
        const { rxSpeed, txSpeed } = getNetworkSpeed();
        const networkSpeed = {
            rxSpeed: rxSpeed,
            txSpeed: txSpeed
        };

        res.json({ ramUsage, diskUsage, networkSpeed });
    });

    // Emit 'console.log' messages to all connected clients
    function sendConsoleLog(text, color = 'reset') {
        io.emit('consoleLog', { text, color }); // Emitting 'consoleLog' event to all clients with text and color
    }

    // Utility function to safely stringify objects with circular references
    function safeStringify(obj) {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        });
    }

    // Override console.log to also emit via Socket.IO
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        const message = args.map(arg => (typeof arg === 'object' ? safeStringify(arg) : arg)).join(' ');
        sendConsoleLog(message); // Send console log message to clients
        originalConsoleLog(...args); // Log to server console as usual
    };

    ws.on('open', function open() {
        console.log('Connected to WebSocket server');

        // Send a message to the server
        ws.send('Hello from client!');
    });


    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
    });
}

module.exports = { kordStatistic };
