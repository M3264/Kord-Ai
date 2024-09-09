const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const debounce = require('lodash.debounce');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

require('../../Config');

class CommandLoader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.watchers = new Set();
    this.configPath = path.resolve(__dirname, '../../Config.js');
    this.debounceTime = 1000;
  }

  async loadCommands(commandDir) {
    await this.loadAllCommands(commandDir);
    this.watchCommands(commandDir);
    this.watchConfig();

    process.on('SIGINT', () => this.cleanup());
  }

  async loadAllCommands(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await this.loadAllCommands(filePath);
      } else if (file.endsWith('.js')) {
        await this.loadCommand(filePath);
      }
    }
  }

  async loadCommand(filePath) {
    try {
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      if (command.usage) {
        const usages = Array.isArray(command.usage) ? command.usage : [command.usage];
        usages.forEach(usage => this.commands.set(usage.toLowerCase(), command));
    //    console.log(`${colors.green}Loaded command: ${command.usage}${colors.reset}`);

        if (command.aliases) {
          command.aliases.forEach(alias => {
            this.aliases.set(alias, command.usage);
          });
        }
      } else {
        console.log(`${colors.yellow}Skipped: ${filePath} does not export 'usage'.${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}Error loading command from ${filePath}:${colors.reset}`, error);
    }
  }

  watchCommands(commandDir) {
    const watcher = chokidar.watch(commandDir, {
      ignored: /(^|[\/\\])\../, // Ignore dot files
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    watcher
      .on('add', path => this.handleFileChange('add', path))
      .on('change', path => this.handleFileChange('change', path))
      .on('unlink', path => this.handleFileChange('unlink', path));

    this.watchers.add(watcher);
  }

  watchConfig() {
    const watcher = chokidar.watch(this.configPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    watcher.on('change', () => this.handleConfigChange());

    this.watchers.add(watcher);
  }

  handleFileChange = debounce(async (event, filePath) => {
    if (filePath.endsWith('.js')) {
      console.log(`${colors.yellow}[HOT RELOAD] Detected ${event} in ${filePath}${colors.reset}`);
      if (event === 'unlink') {
        this.removeCommand(filePath);
      } else {
        await this.loadCommand(filePath);
      }
    }
  }, this.debounceTime);

  handleConfigChange = debounce(() => {
    console.log(`${colors.yellow}[HOT RELOAD] Detected change in ${this.configPath}${colors.reset}`);
    this.reloadConfig();
  }, this.debounceTime);

  removeCommand(filePath) {
    const commandToRemove = Array.from(this.commands.entries())
      .find(([_, cmd]) => cmd.__filename === filePath);

    if (commandToRemove) {
      const [usage, command] = commandToRemove;
      this.commands.delete(usage);
      if (command.aliases) {
        command.aliases.forEach(alias => this.aliases.delete(alias));
      }
      console.log(`${colors.red}Removed command: ${usage}${colors.reset}`);
    }
  }

  reloadConfig() {
    try {
      delete require.cache[require.resolve(this.configPath)];
      require(this.configPath);
      console.log(`${colors.green}Reloaded config: ${this.configPath}${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error reloading config from ${this.configPath}:${colors.reset}`, error);
    }
  }

  cleanup() {
    this.watchers.forEach(watcher => watcher.close());
    console.log(`${colors.blue}Watchers closed.${colors.reset}`);
    process.exit();
  }

  getCommand(name) {
    return this.commands.get(name.toLowerCase());
  }
}

const loader = new CommandLoader();

module.exports = {
  loadCommands: (dir) => loader.loadCommands(dir),
  getCommand: (name) => loader.getCommand(name),
  getAllCommands: () => Array.from(loader.commands.values())
};