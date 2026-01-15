/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord, installPlugin, removePlugin, listPlugins } = require("../core")

kord({
  cmd: "plugin|install",
  desc: "install plugin from url",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  await installPlugin(m, match)
})

kord({
  cmd: "remove|uninstall",
  desc: "remove external plugin by name or url",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  await removePlugin(m, match)
})

kord({
  cmd: "plugins",
  desc: "list installed plugins",
  fromMe: true,
  type: "plugins"
}, async (m) => {
  await listPlugins(m)
})