const express = require('express');
const http = require('http');
const { kordAi } = require('./src/Utils/Kord');
const path = require('path');
const { kordStatistic } = require('./src/Plugin/kordStatistic');
const { checkFFmpeg, checkDiskSpace, downloadFFmpeg } = require('./src/Plugin/kordModule');
const socketIo = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

// Promisify the callback-based functions
const checkFFmpegAsync = () => {
    return new Promise((resolve) => {
        checkFFmpeg(resolve);
    });
};

const checkDiskSpaceAsync = () => {
    return new Promise((resolve) => {
        checkDiskSpace(resolve);
    });
};

const downloadFFmpegAsync = () => {
    return new Promise((resolve, reject) => {
        try {
            downloadFFmpeg();
            // Wait a bit to ensure FFmpeg installation completes
            setTimeout(async () => {
                const isInstalled = await checkFFmpegAsync();
                if (isInstalled) {
                    resolve(true);
                } else {
                    reject(new Error('FFmpeg installation failed'));
                }
            }, 5000); // Wait 5 seconds for installation to complete
        } catch (error) {
            reject(error);
        }
    });
};

// Setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/Public/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal Server Error';
    res.status(statusCode).send(errorMessage);
});

// Initialize FFmpeg and start server
async function initializeServer() {
    try {
        console.log('Checking FFmpeg installation...');
        const isFFmpegInstalled = await checkFFmpegAsync();
        
        if (!isFFmpegInstalled) {
            console.log('FFmpeg not found. Checking disk space...');
            const hasSpace = await checkDiskSpaceAsync();
            
            if (!hasSpace) {
                throw new Error('Not enough disk space to install FFmpeg');
            }
            
            console.log('Installing FFmpeg...');
            await downloadFFmpegAsync();
            console.log('FFmpeg installation completed');
        }

        // Verify FFmpeg installation one final time
        const finalCheck = await checkFFmpegAsync();
        if (!finalCheck) {
            throw new Error('FFmpeg installation verification failed');
        }

        console.log('FFmpeg is ready. Starting server...');
        
        // Initialize statistics
        kordStatistic(app, io);
        
        // Start the server
        server.listen(port, async () => {
            console.log(`Server is listening on port ${port}`);
            await kordAi(io, app);
        });

    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1); // Exit if initialization fails
    }
}

// Start the initialization process
initializeServer();