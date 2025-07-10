const { sock } = require("./core/sock")
const { getPlatformInfo } = require("./core/dclient")
const { spawn } = require("child_process")
const http = require("http")

const run = async () => {
  try {
    const platform = getPlatformInfo?.().platform?.toLowerCase() || ""

    if (!platform.includes("pterodactyl")) {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" })
        res.end("Bot is running\n")
      })

      const PORT = process.env.PORT || 5000
      server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`)
      })
    }

    await sock()
  } catch (e) {
    console.error(e)
  }
}

if (!process.env.PM2_HOME && !process.env.STARTED_BY_NPM) {
  const pm2p = spawn("npm", ["start"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, STARTED_BY_NPM: "true" }
  })

  pm2p.on("error", err => console.error("Failed to start PM2:", err))
  pm2p.on("exit", code => console.error("PM2 process exited with code:", code))
  return
}

run()