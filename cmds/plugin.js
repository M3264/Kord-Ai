/* 
 * Copyright © 2025 Kenny
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const fs = require("fs")
const axios = require("axios")
const util = require("util")
const path = require("path")
const { kord, wtype, storeData, getData, isUrl, extractUrlsFromString, sleep } = require("../core")

kord({
  cmd: "plugin|install",
  desc: "install plugin from url",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  
  const input = match || m.quoted?.text?.trim()
if (!input || !isUrl(input)) return await m.send("send a valid plugin url")
const arr = await extractUrlsFromString(input)

  for (const element of arr) {
    let rawUrl

    try {
      const parsed = new URL(element)

      if (parsed.host === "gist.github.com") {
        parsed.host = "gist.githubusercontent.com"
        rawUrl = parsed.toString() + "/raw"
      } else if (parsed.host === "plugins.kord-ai.web.id") {
        rawUrl = parsed.toString().includes("/raw")
          ? parsed.toString()
          : parsed.toString().replace("/plugin/", "/api/plugin/") + "/raw"
      } else {
        rawUrl = parsed.toString()
      }
    } catch {
      return await m.send("invalid url")
    }

    try {
      const { data, status } = await axios.get(rawUrl)
      if (status !== 200) return await m.send("plugin fetch failed")

      if (data?.code) data = data.code
      const cmdMatch = data.match(/cmd:\s*["'](.*?)["']/)
      const pluginName = cmdMatch ? cmdMatch[1].trim().replace(/['"]/g, '') : null
      const file = (pluginName || "__" + Math.random().toString(36).substring(8)) + ".js"
      const filePath = __dirname + "/" + file

      fs.writeFileSync(filePath, data)

      try {
        require("./" + file)
      } catch (e) {
        fs.unlinkSync(filePath)
        return await m.send("invalid plugin\n\n" + util.format(e))
      }

      const isEvent = data.includes("kord({") && data.includes("on:")
      const pluginMeta = {
        name: pluginName || file.replace(".js", ""),
        url: rawUrl,
        type: isEvent ? "event" : "cmd"
      }

      const former = await getData("plugins") || []
      await storeData("plugins", [...former, pluginMeta])

      await m.send(pluginMeta.name === pluginName ? `plugin "${pluginName}" installed` : "plugin installed")
      await sleep(1500)
    } catch (er) {
      await m.send(`plugin fetch failed\n\n${er}`)
    }
  }
})

kord({
  cmd: "remove|uninstall",
  desc: "remove external plugin by name or url",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  if (!match) return await m.send("provide plugin name or url to remove")

  const plugins = await getData("plugins") || []
  if (!plugins.length) return await m.send("no external plugins installed")

  const input = match.trim()
  let norm = input
if (norm.includes("plugins.kord-ai.web.id") && !norm.includes("/raw")) {
  norm = norm.replace("/plugin/", "/api/plugin/") + "/raw"
}
let toRemove = plugins.find(p => p.name === input || p.url === norm)

  if (!toRemove) return await m.send("plugin not found or not installed via url")

  const file = toRemove.name + ".js"
  const filePath = path.join(__dirname, file)

  try {
    if (fs.existsSync(filePath)) {
      delete require.cache[require.resolve("./" + file)]
      fs.unlinkSync(filePath)
    }

    const filtered = plugins.filter(p => p.name !== toRemove.name)
    await storeData("plugins", filtered)

    await m.send(`plugin "${toRemove.name}" removed`)
  } catch (e) {
    await m.send("remove failed\n\n" + util.format(e))
  }
})

kord({
cmd: "plugins",
  desc: "list installed plugins",
  fromMe: true,
  type: "plugins"
}, async (m) => {
  try {
    const data = await getData("plugins") || []
    if (!data.length) return await m.send("no plugins installed")
    
    const list = data.map((p, i) => {
    const mark = p.type === "event" ? " (event)" : ""
    return `${i + 1}. ${p.name}${mark} → ${p.url}`
}).join("\n")
  await m.send("```" + list + "```")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})