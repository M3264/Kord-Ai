const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const config = {
  SESSION_ID: 'kord_ai-5IqHrIcoZX22NdF9',
  OWNER_NUMBER: '2349134359857',
  WORKTYPE: 'private',
  PREFIX: '[.!?]',
  TIMEZONE: 'Africa/Lagos',
  OWNER_NAME: 'BEACON',
  BOT_NAME: 'EDT'
}

function writeEnvFile(filePath) {
  const envText = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  fs.writeFileSync(filePath, envText)
  console.log('config.env written')
}

function moveFilesToRoot(srcDir, destDir) {
  const files = fs.readdirSync(srcDir, { withFileTypes: true })
  for (const file of files) {
    const srcPath = path.join(srcDir, file.name)
    const destPath = path.join(destDir, file.name)

    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true })
    }

    fs.renameSync(srcPath, destPath)
  }
}

try {
  console.log('Cloning Kord-Ai...')
  execSync('git clone https://github.com/M3264/Kord-Ai temp-dir', { stdio: 'inherit' })

  const rootDir = process.cwd()
  const tempDir = path.join(rootDir, 'temp-dir')

  moveFilesToRoot(tempDir, rootDir)
  fs.rmdirSync(tempDir, { recursive: true })

  writeEnvFile(path.join(rootDir, 'config.env'))

  console.log('Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })

  console.log('Starting bot...')
  execSync('npm start', { stdio: 'inherit' })

} catch (err) {
  console.error('Setup failed:', err.message)
  process.exit(1)
}
