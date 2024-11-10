const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const { exec, spawn } = require('child_process');
const util = require('util');
const crypto = require('crypto');
const semver = require('semver');

const execPromise = util.promisify(exec);

const config = {
    github: {
        owner: 'M3264',
        repo: 'Kord-Ai'
    },
    paths: {
        root: path.resolve(__dirname, '..', '..', '..'),
        temp: path.join(path.resolve(__dirname, '..', '..', '..'), 'temp_update'),
        zip: path.join(path.resolve(__dirname, '..', '..', '..'), 'bot-update.zip')
    },
    // Updated protected files list - only protect Config.js and node_modules
    protected: ['node_modules', 'Config.js']
};

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
        console.log(`Note: Could not remove ${dir}: ${error.message}`);
    }
}

async function getVersions() {
    const packageJson = JSON.parse(
        await fs.readFile(
            path.join(config.paths.root, 'package.json'), 
            'utf-8'
        )
    );
    
    const { data } = await axios.get(
        `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/releases/latest`
    );
    
    return {
        current: packageJson.version,
        latest: data.tag_name,
        downloadUrl: data.zipball_url
    };
}

async function downloadAndExtract(url) {
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(config.paths.zip, data);
    
    const zip = new AdmZip(config.paths.zip);
    await new Promise((resolve, reject) => {
        zip.extractAllToAsync(config.paths.temp, true, err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function performUpdate() {
    const files = await fs.readdir(config.paths.temp);
    const updateSource = path.join(config.paths.temp, files[0]);
    await enhancedFileSync(updateSource, config.paths.root);
}

async function enhancedFileSync(source, destination) {
    const sourceFiles = await mapDirectory(source);
    const destFiles = await mapDirectory(destination);

    for (const [relativePath, sourceInfo] of sourceFiles) {
        // Skip protected files
        if (config.protected.some(protectedPath => 
            relativePath === protectedPath || 
            relativePath.startsWith(protectedPath + path.sep)
        )) {
            console.log(`Skipping protected path: ${relativePath}`);
            continue;
        }

        const destPath = path.join(destination, relativePath);

        try {
            await ensureDir(path.dirname(destPath));
            await fs.copyFile(sourceInfo.path, destPath);
            console.log(`Updated: ${relativePath}`);
        } catch (error) {
            console.log(`Error syncing ${relativePath}: ${error.message}`);
        }
    }

    // Handle deletions (except for protected files)
    for (const [relativePath, destInfo] of destFiles) {
        if (!sourceFiles.has(relativePath) && 
            !config.protected.some(protectedPath => 
                relativePath === protectedPath || 
                relativePath.startsWith(protectedPath + path.sep)
            )) {
            try {
                await fs.unlink(destInfo.path);
                console.log(`Removed: ${relativePath}`);
            } catch (error) {
                console.log(`Error removing ${relativePath}: ${error.message}`);
            }
        }
    }
}

async function mapDirectory(dir, baseDir = dir) {
    const fileMap = new Map();
    
    async function scan(currentDir) {
        const items = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item.name);
            const relativePath = path.relative(baseDir, fullPath);
            
            if (item.isDirectory()) {
                await scan(fullPath);
            } else {
                const stats = await fs.stat(fullPath);
                fileMap.set(relativePath, {
                    path: fullPath,
                    stats: stats,
                    type: path.extname(item.name).toLowerCase()
                });
            }
        }
    }
    
    await scan(dir);
    return fileMap;
}

async function updateBot(sock, m) {
    try {
        await ensureDir(config.paths.temp);
        
        const versions = await getVersions();
        console.log(`Current: ${versions.current} | Latest: ${versions.latest}`);

        if (semver.gt(versions.latest, versions.current)) {
            await sock.sendMessage(
                m.key.remoteJid, 
                { text: '🔄 *New update found! Starting update process...*' },
                { quoted: m }
            );

            /* await sock.sendMessage(
                m.key.remoteJid, 
                { text: '📥 Downloading update...' },
                { quoted: m }
            ); */

            await downloadAndExtract(versions.downloadUrl);
            console.log('✓ Files downloaded and extracted');

            await sock.sendMessage(
                m.key.remoteJid,
                { text: '🔄* Installing updates...*' },
                { quoted: m }
            );

            await performUpdate();
            console.log('✓ Files merged');

            await sock.sendMessage(
                m.key.remoteJid,
                { text: `🔄 𝐈𝐧𝐬𝐭𝐚𝐥𝐥𝐢𝐧𝐠 𝐝𝐞𝐩𝐞𝐧𝐝𝐞𝐧𝐜𝐢𝐞𝐬...


> 𝐏𝐥𝐞𝐚𝐬𝐞 𝐛𝐞 𝐜𝐚𝐥𝐦 𝐰𝐢𝐭𝐡 𝐭𝐡𝐢𝐬 𝐮𝐩𝐝𝐚𝐭𝐞 𝐚𝐬 𝐢𝐭 𝐦𝐚𝐲 𝐭𝐚𝐤𝐞 𝐮𝐩 𝐭𝐨 10𝐦𝐢𝐧𝐬 𝐟𝐨𝐫 𝐭𝐡𝐞 𝐮𝐩𝐝𝐚𝐭𝐞` },
                { quoted: m }
            );

            await execPromise('npm install', { cwd: config.paths.root });
            console.log('✓ Dependencies updated');

            await cleanup();

            await sock.sendMessage(
                m.key.remoteJid,
                { text: '✅ 𝐔𝐩𝐝𝐚𝐭𝐞 𝐜𝐨𝐦𝐩𝐥𝐞𝐭𝐞! 𝐑𝐞𝐬𝐭𝐚𝐫𝐭𝐢𝐧𝐠...' },
                { quoted: m }
            );

            const botProcess = spawn('node', ['index.js'], {
                detached: true,
                stdio: 'ignore',
                cwd: config.paths.root
            });
            botProcess.unref();
            process.exit(0);

        } else {
            await sock.sendMessage(
                m.key.remoteJid,
                { text: '✅ Already on latest version!' },
                { quoted: m }
            );
        }
    } catch (error) {
        console.error('Update error:', error);
        await sock.sendMessage(
            m.key.remoteJid,
            { text: `❌ Update failed: ${error.message}` },
            { quoted: m }
        );

        await cleanup();
    }
}

async function cleanup() {
    await Promise.all([
        removeDir(config.paths.temp),
        fs.unlink(config.paths.zip).catch(() => {})
    ]);
}

module.exports = {
    usage: ["update"],
    desc: "Updates the bot files from the upstream GitHub repository.",
    commandType: "Bot",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    isOwnerOnly: true,
    emoji: '⚙️',
    execute: updateBot
};
