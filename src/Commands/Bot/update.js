const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const { exec, spawn } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration constants
const CONFIG = {
    github: {
        owner: 'M3264',
        repo: 'Kord-Ai'
    },
    paths: {
        root: path.resolve(__dirname, '..', '..', '..'),
        temp: path.join(path.resolve(__dirname, '..', '..', '..'), 'temp_update'),
        zip: path.join(path.resolve(__dirname, '..', '..', '..'), 'bot-update.zip'),
        backup: path.join(path.resolve(__dirname, '..', '..', '..'), 'backup_temp')
    },
    protected: [
        'node_modules',
        '.env',
        'Config.js',
        'src/Session/creds.json'
    ]
};

// File system utilities
const FileSystem = {
    async ensureDir(dir) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    },

    async removeDir(dir) {
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch (error) {
            console.warn(`Failed to remove directory ${dir}: ${error.message}`);
        }
    },

    async copyFile(source, dest, isDirectory = false) {
        try {
            if (isDirectory) {
                await fs.cp(source, dest, { recursive: true });
            } else {
                await fs.copyFile(source, dest);
            }
            return true;
        } catch (error) {
            console.warn(`Failed to copy ${source} to ${dest}: ${error.message}`);
            return false;
        }
    }
};

// Version management
const VersionManager = {
    async getCurrentVersion() {
        const packageJsonPath = path.join(CONFIG.paths.root, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        return packageJson.version;
    },

    async getLatestRelease() {
        const { data } = await axios.get(
            `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/releases/latest`
        );
        return {
            version: data.tag_name,
            zipUrl: data.zipball_url
        };
    }
};

// Update operations
const UpdateOperations = {
    async downloadUpdate(url) {
        const { data } = await axios.get(url, { responseType: 'arraybuffer' });
        await fs.writeFile(CONFIG.paths.zip, data);
    },

    async extractZip() {
        return new Promise((resolve, reject) => {
            const zip = new AdmZip(CONFIG.paths.zip);
            zip.extractAllToAsync(CONFIG.paths.temp, true, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    async getExtractedDir() {
        const files = await fs.readdir(CONFIG.paths.temp);
        if (files.length === 0) {
            throw new Error('Extracted directory is empty');
        }
        return path.join(CONFIG.paths.temp, files[0]);
    },

    async backupCurrentFiles() {
        await FileSystem.removeDir(CONFIG.paths.backup);
        await FileSystem.ensureDir(CONFIG.paths.backup);

        const files = await fs.readdir(CONFIG.paths.root);
        for (const file of files) {
            if (!CONFIG.protected.includes(file)) {
                const sourcePath = path.join(CONFIG.paths.root, file);
                const destPath = path.join(CONFIG.paths.backup, file);
                
                const stats = await fs.stat(sourcePath);
                await FileSystem.copyFile(sourcePath, destPath, stats.isDirectory());
            }
        }
    },

    async updateFiles() {
        const extractedDir = await this.getExtractedDir();
        const newFiles = await fs.readdir(extractedDir);

        for (const file of newFiles) {
            if (!CONFIG.protected.includes(file)) {
                const sourcePath = path.join(extractedDir, file);
                const destPath = path.join(CONFIG.paths.root, file);
                
                await FileSystem.removeDir(destPath);
                const stats = await fs.stat(sourcePath);
                const success = await FileSystem.copyFile(sourcePath, destPath, stats.isDirectory());
                
                if (!success) {
                    throw new Error(`Failed to update ${file}`);
                }
            }
        }
    },

    async restoreBackup() {
        const backupExists = await fs.stat(CONFIG.paths.backup)
            .then(stats => stats.isDirectory())
            .catch(() => false);

        if (!backupExists) {
            throw new Error('Backup directory not found');
        }

        const files = await fs.readdir(CONFIG.paths.backup);
        for (const file of files) {
            const sourcePath = path.join(CONFIG.paths.backup, file);
            const destPath = path.join(CONFIG.paths.root, file);
            
            const stats = await fs.stat(sourcePath);
            await FileSystem.copyFile(sourcePath, destPath, stats.isDirectory());
        }
    },

    async cleanup() {
        await FileSystem.removeDir(CONFIG.paths.temp);
        await fs.unlink(CONFIG.paths.zip).catch(() => {});
        await FileSystem.removeDir(CONFIG.paths.backup);
    },

    async installDependencies() {
        await execPromise('npm install', { cwd: CONFIG.paths.root });
    },

    async restartBot() {
        const botProcess = spawn('node', ['index.js'], {
            detached: true,
            stdio: 'ignore',
            cwd: CONFIG.paths.root
        });
        botProcess.unref();
        process.exit(0);
    }
};

// Main update function
async function updateBot(sock, m) {
    try {
        await FileSystem.ensureDir(CONFIG.paths.temp);

        const currentVersion = await VersionManager.getCurrentVersion();
        const { version: latestVersion, zipUrl } = await VersionManager.getLatestRelease();

        console.log(`Current Version: ${currentVersion}`);
        console.log(`Latest Version: ${latestVersion}`);

        if (currentVersion !== latestVersion) {
            await sock.sendMessage(m.key.remoteJid, { text: '🆕 New version available! Starting update process...' }, { quoted: m });
            
            await UpdateOperations.backupCurrentFiles();
            console.log('Backup created.');

            await UpdateOperations.downloadUpdate(zipUrl);
            console.log('Download complete. Extracting...');
            
            await UpdateOperations.extractZip();
            console.log('Extraction complete. Updating files...');
            
            await UpdateOperations.updateFiles();
            console.log('Files updated. Installing dependencies...');
            
            await UpdateOperations.installDependencies();
            console.log('Dependencies installed.');
            
            await UpdateOperations.cleanup();
            console.log('Cleanup complete.');

            await sock.sendMessage(m.key.remoteJid, { text: '✅ Update installed. Restarting bot...' }, { quoted: m });

            await UpdateOperations.restartBot();
        } else {
            await sock.sendMessage(m.key.remoteJid, { text: '✅ Bot is already up to date!' }, { quoted: m });
            await UpdateOperations.cleanup();
        }
    } catch (error) {
        console.error("Error in update process:", error);
        await sock.sendMessage(m.key.remoteJid, { text: `❌ An error occurred while updating: ${error.message}` }, { quoted: m });
        
        try {
            console.log('Attempting to restore from backup...');
            await UpdateOperations.restoreBackup();
            console.log('Restore complete.');
            await sock.sendMessage(m.key.remoteJid, { text: '🔄 Update failed. Original files restored.' }, { quoted: m });
        } catch (restoreError) {
            console.error("Error during restore:", restoreError);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Update failed and restore failed. Manual intervention required.' }, { quoted: m });
        }

        await UpdateOperations.cleanup();
    }
}

module.exports = {
    usage: ["update"],
    desc: "Updates the bot files from the upstream GitHub repository.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: '✅',
    execute: updateBot
};
