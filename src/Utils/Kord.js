console.log('🐾 Starting...');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, delay } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require('pino');
const path = require('path');
const useMongoDBAuthState = require("../Plugin/kordMongoAuth");
const { MongoClient } = require("mongodb");
const fs = require('fs');
const { setupAntidelete } = require('../Plugin/Antidelete');

// Small Fix For Waiting for Message
const NodeCache = require('node-cache');
const msgRetryCounterCache = new NodeCache();
const antilinkCommand = require('../Commands/Bot/antilink');
const chatbotModule = require('../Commands/Bot/bot');

// Set up logging
const logger = pino({
    level: process.env.LOG_LEVEL || 'silent',
});

// Plugins
const { kordMsg } = require('../Plugin/kordMsg');
const { initializeKordEvents } = require('../Plugin/kordEvent');
const { loadCommands } = require('../Plugin/kordLoadCmd');
const { againstEventManager } = require('../Plugin/kordEventHandle');
const sessionDir = path.join(__dirname, '..', 'Session');
(async () => {
    await loadCommands(path.join(__dirname, '../Commands'));
})();

let messagesSent = 0;

async function getAuthState() {
    const credsPath = path.join(sessionDir, 'creds.json');

    try {
        // Retrieve the SESSION_ID from global.settings
        let sessionId = global.settings.SESSION_ID;

        if (sessionId && sessionId !== '') {
            // If SESSION_ID is provided, use it
            console.log("Session ID from config:", sessionId);

            // Decode the SESSION_ID and save it to creds.json
            const decodedData = Buffer.from(sessionId, 'base64').toString('utf-8');
            fs.writeFileSync(credsPath, decodedData);
        } else if (fs.existsSync(credsPath)) {
            // If SESSION_ID is not provided, use creds.json
            const decodedData = fs.readFileSync(credsPath, 'utf-8');
            const savedSessionId = JSON.parse(decodedData);
            console.log("Using SESSION_ID from creds.json:", savedSessionId);
            sessionId = savedSessionId;
        } else {
            console.log("No SESSION_ID in config or creds.json found. Proceeding to pairing code...");
            // Continue without session ID or creds.json, handle pairing code below
        }

        // Use multi-file auth state
        console.log('\x1b[33m%s\x1b[0m', 'Using multi-file auth state.');
        return await useMultiFileAuthState(sessionDir);
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Error in getAuthState:', err);
        throw err;
    }
}

async function kordAi(io, app) {
    try {
        const chalk = (await import('chalk')).default;

        // Endpoint to fetch statistics
        app.get('/messagestotal', (req, res) => {
            res.json({
                messageTotal: messagesSent,
            });
        });
        const pairingOption = 'Whatsapp Pairing Code';

        // In-memory store for caching
        const store = makeInMemoryStore({ logger });

        const { state, saveCreds } = await getAuthState();

        // fetch latest version of WA Web
        const { version, isLatest } = await fetchLatestBaileysVersion()
        console.log(chalk.cyanBright(`using WA v${version.join('.')}, isLatest: ${isLatest}`))

        const sock = await makeWASocket({
            version: [2, 3000, 1014080102],
            printQRInTerminal: !pairingOption === 'Whatsapp Pairing Code',
            mobile: false,
            keepAliveIntervalMs: 10000,
            downloadHistory: false,
            msgRetryCounterCache,
            syncFullHistory: true,
            shouldSyncHistoryMessage: msg => {
                console.log(chalk.cyanBright(`Syncing chats..[${msg.progress}%]`));
                return !!msg.syncType;
            },
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: undefined,
            logger,
            Browsers: ['KORD-AI', 'Chrome', '113.0.5672.126'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            linkPreviewImageThumbnailWidth: 1980,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id)
                    return msg?.message || undefined
                }
                return {
                    conversation: ''
                }
            },
            patchMessageBeforeSending: async (msg, recipientJids) => {
                await sock.uploadPreKeysToServerIfRequired();
                messagesSent = messagesSent + 1;
                return msg;
            }
        });

        store.bind(sock.ev);
        await againstEventManager.init(sock);
        initializeKordEvents(sock, chalk);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(qr);
            }

            if (!sock.authState.creds.registered && pairingOption === 'Whatsapp Pairing Code') {
                setTimeout(async () => {
                    const ownerNumbers = global.settings.OWNER_NUMBERS.split(',').map(num => num.trim());
                    for (const number of ownerNumbers) {
                        const code = await sock.requestPairingCode(number);
                        console.log(chalk.greenBright(`Pairing Code for ${number}: ${code}`));
                    }
                }, 5000);
            }

            if (connection === "open") {
                try {
                    console.log(chalk.cyan('Checking Connection....'));
                    console.log(chalk.cyan('Making Socket....'));
                    console.log(chalk.cyan('Calling Socket...'));
                    console.log(chalk.cyan('Connected! 🔒✅'));
                    
                    
                    setInterval(() => {
                        deletePreKeyAndSessionFiles(sessionDir)
                        .then(() => console.log('Pre-key and session files (except creds.json) deleted successfully.'))
                        .catch(error => console.error('Error deleting files:', error));
                    }, 30 * 60 * 1000); // 30 minutes in milliseconds
                    chatbotModule.init(sock);
                    antilinkCommand.init(sock);
                    setupAntidelete(sock, store);
                    kordMsg(sock);
                    return new Promise((resolve, reject) => {
                        setTimeout(async () => {
                            try {
                                console.log(chalk.yellow('Restarting socket...'));
                                await sock.end({ reason: 'Clearing store' });
                            } catch (error) {
                                console.error(chalk.red('Error restarting socket:'), error.message);
                            } finally {
                                kordAi(io, app);
                            }
                        }, 300 * 60 * 1000); // 300 minutes
                    });
                } catch (err) {
                    console.log('Error in:', err)
                }
            }

            const code = lastDisconnect?.error?.output?.statusCode;

            if (code === 428 || code === 500) {
                console.log(chalk.cyan('Connection closed! 🔒'));
                sock.ev.removeAllListeners();
                await delay(2000);
                kordAi(io, app);
                await sock.ws.close();
                return;
            }

            if (connection === "close" || code) {
                try {
                    const reason = lastDisconnect && lastDisconnect.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
                    switch (reason) {
                        case DisconnectReason.connectionClosed:
                        case DisconnectReason.connectionLost:
                        case DisconnectReason.timedOut:
                            console.log(chalk.cyan(`Connection ${reason === DisconnectReason.connectionClosed ? 'closed' : reason === DisconnectReason.connectionLost ? 'lost' : 'timed out'}! ${reason === DisconnectReason.connectionLost ? '📡' : '🔒'}`));
                            sock.ev.removeAllListeners();
                            await delay(5000);
                            kordAi(io, app);
                            await sock.ws.close();
                            return;
                        case DisconnectReason.restartRequired:
                            console.log(chalk.cyan('Restart required, restarting... 🔄'));
                            await delay(5000);
                            kordAi(io, app);
                            return;
                        default:
                            console.log(chalk.cyan('Connection closed with bot. Trying to run again. ⚠️'));
                            sock.ev.removeAllListeners();
                            await delay(5000);
                            kordAi(io, app);
                            await sock.ws.close();
                            return;
                    }
                } catch (error) {
                    console.error(chalk.red('Error occurred during connection close:'), error.message);
                }
            }

            sock.sendReadReceiptAck = true;
        });
    } catch (err) {
        console.log('Error in kordAi:', err)
    }
}

async function deletePreKeyAndSessionFiles(sessionDir) {
  try {
    const files = await fs.promises.readdir(sessionDir);

    for (const filename of files) {
      if (filename.startsWith('pre-key')) {
        if (filename !== 'creds.json') { // Exclude creds.json
          const filePath = path.join(sessionDir, filename);
          await fs.promises.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting files:', error);
  }
}

module.exports = { kordAi };