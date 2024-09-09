const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

const kord = new EventEmitter();
const debounceTimeout = 2000;

class AgainstEventManager {
    constructor() {
        this.antiCheckers = new Map();
        this.sock = null;
        this.pluginDir = path.join(__dirname, '../Against');
    }

    async loadAntiCheckers() {
        const chalk = (await import('chalk')).default;
        try {
            const files = await fs.readdir(this.pluginDir);
            
            for (const file of files) {
                if (!file.endsWith('.js')) continue;

                await this.loadCheckerModule(file);
            }
        } catch (error) {
            console.error(chalk.red('❌ Error reading the anti directory:', error));
        }
    }

    async loadCheckerModule(file) {
        const chalk = (await import('chalk')).default;
        const commandPath = path.join(this.pluginDir, file);
        try {
            const commandModule = require(commandPath);

            if (commandModule.isEnabled === false) {
                console.warn(chalk.yellow(`⚠️ Event in ${file} is disabled.`));
                return;
            }

            if (commandModule.event) {
                const events = Array.isArray(commandModule.event) 
                    ? commandModule.event 
                    : [commandModule.event];
                
                for (const event of events) {
                    this.antiCheckers.set(event, commandModule);
                }
           //     console.log(chalk.green(`✅ Loaded Event: ${commandModule.event} from ${file}`));
            } else {
           //     console.warn(chalk.yellow(`⚠️ Event in ${file} does not have an event property.`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error loading Event from ${file}:`, error));
        }
    }

    watchEvents() {
        let reloadTimeout;

        fs.watch(this.pluginDir, { recursive: true }, (eventType, filename) => {
            if (filename.endsWith('.js')) {
                clearTimeout(reloadTimeout);
                reloadTimeout = setTimeout(() => this.reloadModule(filename), debounceTimeout);
            }
        });
    }

    async reloadModule(filename) {
        const chalk = (await import('chalk')).default;
        const commandPath = path.join(this.pluginDir, filename);

        try {
            delete require.cache[require.resolve(commandPath)];
            const commandModule = require(commandPath);

            if (typeof commandModule.execute === 'function' && commandModule.event) {
                this.registerCommand(commandModule);
                console.log(chalk.magenta(`[Hot Reload] Successfully reloaded ${filename}`));
            } else {
                console.warn(chalk.magenta(`[Hot Reload] Skipped ${filename}: Invalid Event module format.`));
            }
        } catch (error) {
            console.error(chalk.red(`[Hot Reload] Error reloading ${filename}: ${error.message}`));
        }
    }

    registerCommand(commandModule) {
        if (commandModule.event) {
            const events = Array.isArray(commandModule.event) 
                ? commandModule.event 
                : [commandModule.event];
            
            for (const event of events) {
                this.antiCheckers.set(event, commandModule);
            }
        }
    }

    async registerEventListeners() {
        const chalk = (await import('chalk')).default;
        for (const [event, checker] of this.antiCheckers.entries()) {
            this.sock.ev.on(event, async (...args) => {
                try {
                    await checker.execute(this.sock, ...args);
                    console.log(chalk.blue(`📩 Event handled: ${event}`));
                } catch (error) {
                    console.error(chalk.red(`❌ Error handling event ${event}:`, error));
                }
            });
        }
    }

    async init(sock) {
        this.sock = sock;
        await this.loadAntiCheckers();
        this.watchEvents();
        await this.registerEventListeners();
    }
}

const againstEventManager = new AgainstEventManager();

module.exports = { againstEventManager, kord };