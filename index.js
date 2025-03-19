const { spawn } = require('child_process');

if (!process.env.PM2_HOME && !process.env.STARTED_BY_NPM) {
  //  console.log('Attempting to start with PM2...');
    const pm2Process = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, STARTED_BY_NPM: 'true' }
    });
    
    pm2Process.on('error', (err) => {
        console.error('Failed to start PM2:', err);
    //    console.log('Falling back to normal server startup...');
        startServer();
    });

    pm2Process.on('exit', (code) => {
        if (code !== 0) {
            console.error('PM2 process exited with code:', code);
       //     console.log('Falling back to normal server startup...');
            startServer();
        }
    });
    
    return;
}

const express = require('express');
const http = require('http');
const { kordAi } = require('./src/Utils/Kord');
const path = require('path');
const { checkFFmpeg } = require('./src/Plugin/kordModule');
const socketIo = require('socket.io');

function startServer() {
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

    (async () => {
        try {
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
}

if (process.env.PM2_HOME || process.env.STARTED_BY_NPM) {
    startServer();
}