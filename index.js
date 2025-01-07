const express = require('express');
const http = require('http');
const { kordAi } = require('./src/Utils/Kord');
const path = require('path');
const { kordStatistic } = require('./src/Plugin/kordStatistic');
const { checkFFmpeg } = require('./src/Plugin/kordModule');
const socketIo = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/Public/index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal Server Error';
    res.status(statusCode).send(errorMessage);
});

// Start the server
(async () => {
    try {
        kordStatistic(app, io);
        checkFFmpeg((isInstalled) => {
            if (!isInstalled) {
                checkDiskSpace((hasSpace) => {
                    if (hasSpace) {
                        downloadFFmpeg();
                    }
                });
            }
        });
        server.listen(port, async () => {
            console.log(`Server is listening on port ${port}`);
            await kordAi(io, app);
        });
    } catch (err) {
        console.error('Error starting server or running functions:', err);
    }
})();
