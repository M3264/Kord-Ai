const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const { exec, spawn } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const GITHUB_OWNER = 'M3264';
const GITHUB_REPO = 'Kord-Ai';
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const TEMP_DIR = path.join(ROOT_DIR, 'temp_update');
const ZIP_PATH = path.join(ROOT_DIR, 'bot-update.zip');
const BACKUP_DIR = path.join(ROOT_DIR, 'backup_temp');

const PROTECTED_FILES = ['node_modules', '.env', 'Config.js', 'src/Commands/Bot/update.js', 'src/Session/creds.json'];

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function removeDir(dir) {
    try {
        await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
        console.warn(`Failed to remove directory ${dir}: ${error.message}`);
    }
}

async function getCurrentVersion() {
    const packageJson = JSON.parse(await fs.readFile(PACKAGE_JSON_PATH, 'utf-8'));
    return packageJson.version;
}

async function getLatestRelease() {
    const { data } = await axios.get(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`);
    return {
        version: data.tag_name,
        zipUrl: data.zipball_url
    };
}

async function downloadUpdate(url) {
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(ZIP_PATH, data);
}

async function extractZip() {
    return new Promise((resolve, reject) => {
        const zip = new AdmZip(ZIP_PATH);
        zip.extractAllToAsync(TEMP_DIR, true, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function getExtractedDir() {
    const files = await fs.readdir(TEMP_DIR);
    if (files.length === 0) {
        throw new Error('Extracted directory is empty');
    }
    return path.join(TEMP_DIR, files[0]);
}

async function backupCurrentFiles() {
    // Clean up any existing backup
    await removeDir(BACKUP_DIR);
    await ensureDir(BACKUP_DIR);

    const files = await fs.readdir(ROOT_DIR);
    for (const file of files) {
        if (!PROTECTED_FILES.includes(file)) {
            const sourcePath = path.join(ROOT_DIR, file);
            const destPath = path.join(BACKUP_DIR, file);
            
            try {
                const stats = await fs.stat(sourcePath);
                if (stats.isDirectory()) {
                    await fs.cp(sourcePath, destPath, { recursive: true });
                } else {
                    await fs.copyFile(sourcePath, destPath);
                }
            } catch (error) {
                console.warn(`Failed to backup ${file}: ${error.message}`);
            }
        }
    }
}

async function updateFiles() {
    const extractedDir = await getExtractedDir();
    const newFiles = await fs.readdir(extractedDir);

    for (const file of newFiles) {
        if (!PROTECTED_FILES.includes(file)) {
            const sourcePath = path.join(extractedDir, file);
            const destPath = path.join(ROOT_DIR, file);
            
            try {
                await removeDir(destPath);
                await fs.cp(sourcePath, destPath, { recursive: true });
            } catch (error) {
                console.warn(`Failed to update ${file}: ${error.message}`);
                throw error; // Propagate error to trigger rollback
            }
        }
    }
}

async function restoreBackup() {
    if (!(await fs.stat(BACKUP_DIR)).isDirectory()) {
        throw new Error('Backup directory not found');
    }

    const files = await fs.readdir(BACKUP_DIR);
    for (const file of files) {
        const sourcePath = path.join(BACKUP_DIR, file);
        const destPath = path.join(ROOT_DIR, file);
        
        try {
            const stats = await fs.stat(sourcePath);
            if (stats.isDirectory()) {
                await removeDir(destPath);
                await fs.cp(sourcePath, destPath, { recursive: true });
            } else {
                await fs.copyFile(sourcePath, destPath);
            }
        } catch (error) {
            console.warn(`Failed to restore ${file}: ${error.message}`);
        }
    }
}

async function installDependencies() {
    await execPromise('npm install', { cwd: ROOT_DIR });
}

async function cleanup() {
    await removeDir(TEMP_DIR);
    await fs.unlink(ZIP_PATH).catch(() => {});
    await removeDir(BACKUP_DIR);
}

async function restartBot() {
    const botProcess = spawn('node', ['index.js'], {
        detached: true,
        stdio: 'ignore',
        cwd: ROOT_DIR
    });
    botProcess.unref();
    process.exit(0);
}

async function updateBot(sock, m) {
    try {
        await ensureDir(TEMP_DIR);

        const currentVersion = await getCurrentVersion();
        const { version: latestVersion, zipUrl } = await getLatestRelease();

        console.log(`Current Version: ${currentVersion}`);
        console.log(`Latest Version: ${latestVersion}`);

        if (latestVersion !== `v${currentVersion}`) {
            await sock.sendMessage(m.key.remoteJid, { text: '🆕 New version available! Starting update process...' }, { quoted: m });
            
            await backupCurrentFiles();
            console.log('Backup created.');

            await downloadUpdate(zipUrl);
            console.log('Download complete. Extracting...');
            
            await extractZip();
            console.log('Extraction complete. Updating files...');
            
            await updateFiles();
            console.log('Files updated. Installing dependencies...');
            
            await installDependencies();
            console.log('Dependencies installed.');
            
            await cleanup();
            console.log('Cleanup complete.');

            await sock.sendMessage(m.key.remoteJid, { text: '✅ Update installed. Restarting bot...' }, { quoted: m });

            await restartBot();
        } else {
            await sock.sendMessage(m.key.remoteJid, { text: '✅ Bot is already up to date!' }, { quoted: m });
        }
    } catch (error) {
        console.error("Error in update process:", error);
        await sock.sendMessage(m.key.remoteJid, { text: `❌ An error occurred while updating: ${error.message}` }, { quoted: m });
        
        try {
            console.log('Attempting to restore from backup...');
            await restoreBackup();
            console.log('Restore complete.');
            await sock.sendMessage(m.key.remoteJid, { text: '🔄 Update failed. Original files restored.' }, { quoted: m });
        } catch (restoreError) {
            console.error("Error during restore:", restoreError);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Update failed and restore failed. Manual intervention required.' }, { quoted: m });
        }

        await cleanup();
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