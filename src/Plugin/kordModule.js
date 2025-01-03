const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

// Function to check if FFmpeg is installed
function checkFFmpeg(callback) {
    exec('ffmpeg -version', (error, stdout, stderr) => {
        if (error) {
            console.log('FFmpeg is not installed.');
            callback(false);
        } else {
            console.log('FFmpeg is already installed.');
            callback(true);
        }
    });
}

// Function to check disk space
function checkDiskSpace(callback) {
    const checkCommand = os.platform() === 'win32' ? 'wmic logicaldisk get size,freespace,caption' : 'df -h';
    exec(checkCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error checking disk space: ${error.message}`);
            return callback(false);
        }
        const freeSpace = parseFreeSpace(stdout);
        console.log(`Free space: ${freeSpace} MB`);
        if (freeSpace > 100) { // Check if there's more than 100MB free space
            callback(true);
        } else {
            console.log('Not enough disk space to download FFmpeg.');
            callback(false);
        }
    });
}

// Function to parse free space from command output
function parseFreeSpace(output) {
    if (os.platform() === 'win32') {
        const match = output.match(/(\d+)\s+(\d+)/);
        return match ? Math.floor(parseInt(match[1]) / (1024 * 1024)) : 0;
    } else {
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('/')) {
                const parts = line.split(/\s+/);
                return parseInt(parts[3].replace('G', '')) * 1024; // Convert GB to MB
            }
        }
    }
    return 0;
}

// Function to download and install FFmpeg
function downloadFFmpeg() {
    const platform = os.platform();

    let downloadCommand;

    if (platform === 'win32') {
        downloadCommand = `
        curl -L -o ffmpeg.zip https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip && \
        tar -xf ffmpeg.zip && \
        del ffmpeg.zip && \
        cd ffmpeg-* && \
        move bin\\ffmpeg.exe .. && \
        cd .. && \
        rmdir /s /q ffmpeg-* && \
        echo FFmpeg downloaded successfully
        `;
    } else if (platform === 'darwin') {
        downloadCommand = `
        brew install ffmpeg && \
        echo FFmpeg downloaded successfully
        `;
    } else if (platform === 'linux') {
        downloadCommand = `
        sudo apt update && \
        sudo apt install ffmpeg -y && \
        echo FFmpeg downloaded successfully
        `;
    } else {
        console.log(`Platform ${platform} not supported.`);
        process.exit(1);
    }

    exec(downloadCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error downloading FFmpeg: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error: ${stderr}`);
            return;
        }
        console.log(stdout);
    });
}

// Export all necessary functions
module.exports = {
    checkFFmpeg,
    checkDiskSpace,
    downloadFFmpeg,
    parseFreeSpace
};