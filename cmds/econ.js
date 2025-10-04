/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { kord, prefix, wtype, config, getData, storeData } = require("../core")
const fs = require("fs")
const path = require("path")
const edb = require("../core/edb")
if (config().MONGODB_URI) {
var con = edb.connect(config().MONGODB_URI)
} else {
  con = undefined
}
const k = "kord"
const stored = path.join(__dirname, '..', 'core', 'store')


kord({
cmd: "economy|econ",
   desc: "manage economy commands",
   fromMe: wtype,
   type: "economy"
}, async (m, text) => {
  try {
    if (!config().MONGODB_URI || config().MONGODB_URI === "") {
    return await m.send("```You need to set MONGODB_URI at config\nexample setvar MONGODB_URI=your url..```")
    }

    var edata = await getData("econ") || []

    if (text && text.toLowerCase() === "off") {
    if (!edata.includes(m.chat)) {
    return await m.send("```💎 Economy Commands Are Already Inactive```")
    }
    edata = edata.filter(chat => chat !== m.chat)
    await storeData("econ", edata)
    return await m.send("```📉 Economy commands deactivated```")
    }

    if (text && text.toLowerCase() === "on") {
    if (edata.includes(m.chat)) {
    return await m.send("```💎 Economy Commands Are Already Active```")
    }
    edata.push(m.chat)
    await storeData("econ", edata)
    return await m.send("```📈 Economy commands activated```")
    }

    if (edata.includes(m.chat)) {
    return await m.send("```💎 Economy Commands Are Already Active```")
    }
    edata.push(m.chat)
    await storeData("econ", edata)
    return await m.send("```📈 Economy commands activated```")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "bal|wallet",
   desc: "[economy]shows user's balance",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    const b = await edb.balance(m.sender, k)
    return await m.send(`\`\`\`╔════════════════╗
╠ 💰 USER BALANCE   ╣
╠════════════════╝
╠ 💎 𝗪𝗮𝗹𝗹𝗲𝘁:『 ₹${b.wallet} 』
╠ 🏦 𝗕𝗮𝗻𝗸:『 ₹${b.bank}/₹${b.bankCapacity} 』
╚════════════════\`\`\``, {title: "💰 Balance Check", body: "Your current financial status", thumbnail: fs.readFileSync(path.join(stored, 'wallet.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "daily",
   desc: "[economy] claim daily coins",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    const d  = await edb.daily(m.sender, k, 1001)
    if (d.cd) {
    return await m.send(`\`\`\`⭕ You've Already Claimed For Today
⏱️ Come back in: ${d.cdL}\`\`\``, {title: "⏰ Daily Cooldown", body: "Come back later for your reward", thumbnail: fs.readFileSync(path.join(stored, 'cooldown.png'))}, "ad")
    } else {
    const newBal = await edb.balance(m.sender, k)
    return await m.send(`╔🎉 *You've claimed:* \`\`\`₹${d.amount}\`\`\` *For Today*
╠ 💰 *New Balance:*\`\`\` ₹${newBal.wallet}\`\`\`
╚ ⏱️ *Cooldown:* \`\`\`24 Hours\`\`\``, {title: "🎁 Daily Reward", body: "Successfully claimed your daily coins", thumbnail: fs.readFileSync(path.join(stored, 'daily.png'))}, "ad")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "dep|deposit",
   desc: "[economy] deposit money to bank",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    if (!text) return await m.send("```⚠️ Please specify amount to deposit```")

    const amount = text.toLowerCase() === "all" ? "all" : parseInt(text)
    if (amount !== "all" && (isNaN(amount) || amount <= 0)) {
    return await m.send("```❌ Please provide a valid amount```")
    }

    const result = await edb.deposit(m.sender, k, amount)
    if (result.noten) {
    return await m.send("```💸 Insufficient wallet balance```")
    }

    const newBal = await edb.balance(m.sender, k)
    return await m.send(`\`\`\`╔════════════════╗
╠ 🏦 DEPOSIT SUCCESS ╣
╠════════════════╝
╠ 💰 Deposited: ₹${result.amount}
╠ 💎 Wallet: ₹${newBal.wallet}
╠ 🏦 Bank: ₹${newBal.bank}/₹${newBal.bankCapacity}
╚════════════════\`\`\``, {title: "🏦 Bank Deposit", body: "Money safely stored in bank", thumbnail: fs.readFileSync(path.join(stored, 'deposit.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "with|withdraw",
   desc: "[economy] withdraw money from bank",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    if (!text) return await m.send("```⚠️ Please specify amount to withdraw```")

    const amount = text.toLowerCase() === "all" ? "all" : parseInt(text)
    if (amount !== "all" && (isNaN(amount) || amount <= 0)) {
    return await m.send("```❌ Please provide a valid amount```")
    }

    const result = await edb.withdraw(m.sender, k, amount)
    if (result.noten) {
    return await m.send("```💸 Insufficient bank balance```")
    }
    if (result.invalid) {
    return await m.send("```❌ Invalid amount specified```")
    }

    const newBal = await edb.balance(m.sender, k)
    return await m.send(`\`\`\`╔════════════════╗
╠ 💸 WITHDRAW SUCCESS ╣
╠════════════════╝
╠ 💰 Withdrawn: ₹${result.amount}
╠ 💎 Wallet: ₹${newBal.wallet}
╠ 🏦 Bank: ₹${newBal.bank}/₹${newBal.bankCapacity}
╚════════════════\`\`\``, {title: "💸 Bank Withdrawal", body: "Money withdrawn to wallet", thumbnail: fs.readFileSync(path.join(stored, 'withdraw.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "give|pay",
   desc: "[economy] give money to someone",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    if (!m.quoted && !text) return await m.send("```⚠️ Reply to someone or mention with amount```")

    let target = m.quoted ? m.quoted.sender : m.mentions[0]
    let amount = text ? parseInt(text.split(" ")[1] || text) : parseInt(text)

    if (!target) return await m.send("```❌ Please specify who to pay```")
    if (isNaN(amount) || amount <= 0) return await m.send("```❌ Please provide valid amount```")
    if (target === m.sender) return await m.send("```😂 You cannot pay yourself```")

    const senderBal = await edb.balance(m.sender, k)
    if (senderBal.wallet < amount) return await m.send("```💸 Insufficient wallet balance```")

    await edb.deduct(m.sender, k, amount)
    await edb.give(target, k, amount)

    return await m.send(`\`\`\`╔════════════════╗
╠ 💸 PAYMENT SUCCESS ╣
╠════════════════╝
╠ 💰 Amount: ₹${amount}
╠ 👤 To: @${target.split("@")[0]}
╠ 💎 Your Balance: ₹${senderBal.wallet - amount}
╚════════════════\`\`\``, {title: "💸 Payment Sent", body: "Transaction completed successfully", thumbnail: fs.readFileSync(path.join(stored, 'payment.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "work",
   desc: "[economy] work to earn money",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    const result = await edb.work(m.sender, k)

    if (result.cd) {
    return await m.send(`\`\`\`⭕ You're still tired from work
⏱️ Come back in: ${result.cdL}\`\`\``, {title: "😴 Work Cooldown", body: "Take a rest before working again", thumbnail: fs.readFileSync(path.join(stored, 'tired.png'))}, "ad")
    }

    const jobs = ["Developer", "Designer", "Teacher", "Doctor", "Engineer", "Chef", "Writer", "Artist"]
    const job = jobs[Math.floor(Math.random() * jobs.length)]

    return await m.send(`\`\`\`╔════════════════╗
╠ 💼 WORK COMPLETE  ╣
╠════════════════╝
╠ 👷 Job: ${job}
╠ 💰 Earned: ₹${result.amount}
╠ ⏱️ Cooldown: ${result.cdL}
╚════════════════\`\`\``, {title: "💼 Work Complete", body: `Worked as ${job} and earned money`, thumbnail: fs.readFileSync(path.join(stored, 'work.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "rob",
   desc: "[economy] attempt to rob someone",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    if (!m.quoted && !m.mentions[0]) return await m.send("```⚠️ Reply to someone or mention to rob```")

    const target = m.quoted ? m.quoted.sender : m.mentions[0]
    if (target === m.sender) return await m.send("```😂 You cannot rob yourself```")

    const result = await edb.rob(m.sender, k, target)

    if (result.cd) {
    return await m.send(`\`\`\`⭕ You recently attempted robbery
⏱️ Come back in: ${result.cdL}\`\`\``, {title: "🚨 Rob Cooldown", body: "Lay low for a while", thumbnail: fs.readFileSync(path.join(stored, 'police.png'))}, "ad")
    }

    if (result.lowbal) {
    return await m.send("```💸 Target doesn't have enough money to rob```")
    }

    if (result.success) {
    return await m.send(`\`\`\`╔════════════════╗
╠ 🎯 ROBBERY SUCCESS ╣
╠════════════════╝
╠ 💰 Stolen: ₹${result.amount}
╠ 👤 From: @${target.split("@")[0]}
╠ 😈 You got away with it!
╚════════════════\`\`\``, {title: "🎯 Robbery Success", body: "Successfully robbed someone!", thumbnail: fs.readFileSync(path.join(stored, 'robbery.png'))}, "ad")
    } else {
    return await m.send(`\`\`\`╔════════════════╗
╠ 🚨 ROBBERY FAILED  ╣
╠════════════════╝
╠ 💸 Fine: ₹${result.fine}
╠ 👮 Caught by police!
╠ 😢 Better luck next time
╚════════════════\`\`\``, {title: "🚨 Robbery Failed", body: "Caught and fined by police", thumbnail: fs.readFileSync(path.join(stored, 'caught.png'))}, "ad")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "gamble|bet",
   desc: "[economy] gamble your money",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    if (!text) return await m.send("```⚠️ Please specify amount to gamble```")

    const amount = parseInt(text)
    if (isNaN(amount) || amount <= 0) return await m.send("```❌ Please provide valid amount```")

    const userBal = await edb.balance(m.sender, k)
    if (userBal.wallet < amount) return await m.send("```💸 Insufficient wallet balance```")

    const win = Math.random() > 0.5

    if (win) {
    const winAmount = Math.floor(amount * (1 + Math.random()))
    await edb.give(m.sender, k, winAmount)
    return await m.send(`\`\`\`╔════════════════╗
╠ 🎰 GAMBLING WIN   ╣
╠════════════════╝
╠ 💰 Bet: ₹${amount}
╠ 🎉 Won: ₹${winAmount}
╠ 💎 Profit: ₹${winAmount}
╚════════════════\`\`\``, {title: "🎰 Gambling Win", body: "Lady luck is on your side!", thumbnail: fs.readFileSync(path.join(stored, 'jackpot.png'))}, "ad")
    } else {
    await edb.deduct(m.sender, k, amount)
    return await m.send(`\`\`\`╔════════════════╗
╠ 💸 GAMBLING LOSS  ╣
╠════════════════╝
╠ 💰 Bet: ₹${amount}
╠ 😢 Lost: ₹${amount}
╠ 🎲 Better luck next time
╚════════════════\`\`\``, {title: "💸 Gambling Loss", body: "Not your lucky day", thumbnail: fs.readFileSync(path.join(stored, 'loss.png'))}, "ad")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "lb|leaderboard|top",
   desc: "[economy] show richest users",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    const count = parseInt(text) || 10
    const lb = await edb.lb(k, count > 20 ? 20 : count)

    if (lb.length === 0) return await m.send("```📊 No users found in economy```")

    let msg = "```╔════════════════╗\n╠ 🏆 LEADERBOARD    ╣\n╠════════════════╝\n"

    for (let i = 0; i < lb.length; i++) {
    const pos = i + 1
    const user = lb[i]
    const total = user.wallet + user.bank
    const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}.`
    msg += `╠ ${medal} @${user.userID.split("@")[0]}: ₹${total}\n`
    }
    msg += "╚════════════════```"

    return await m.send(msg, {title: "🏆 Economy Leaderboard", body: "Top richest users in the chat", thumbnail: fs.readFileSync(path.join(stored, 'leaderboard.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "shop",
   desc: "[economy] view available items",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    const shop = await edb.getShop()

    let msg = "```╔════════════════╗\n╠ 🛒 ITEM SHOP     ╣\n╠════════════════╝\n"

    shop.forEach((item, i) => {
    msg += `╠ ${i + 1}. ${item.name}\n╠    💰 Price: ₹${item.price}\n╠    📝 ${item.description}\n╠\n`
})
   msg += "╚════════════════```"

   return await m.send(msg, {title: "🛒 Item Shop", body: "Browse available items to purchase", thumbnail: fs.readFileSync(path.join(stored, 'shop.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "buy",
   desc: "[economy] buy items from shop",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    if (!text) return await m.send("```⚠️ Please specify item name or number```")

    const result = await edb.buyItem(m.sender, k, text)

    if (result.notfound) {
    return await m.send("```❌ Item not found in shop```")
    }
    if (result.insufficient) {
    return await m.send("```💸 Insufficient balance to buy this item```")
    }

    return await m.send(`\`\`\`╔════════════════╗
╠ 🛒 PURCHASE SUCCESS ╣
╠════════════════╝
╠ 🎁 Item: ${result.item.name}
╠ 💰 Price: ₹${result.item.price}
╠ 💎 Remaining: ₹${result.newBalance}
╚════════════════\`\`\``, {title: "🛒 Purchase Complete", body: `Successfully bought ${result.item.name}`, thumbnail: fs.readFileSync(path.join(stored, 'purchase.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "inv|inventory",
   desc: "[economy] view your inventory",
   fromMe: wtype,
   type: "economy",
}, async (m, text) => {
  try {
    var x = await getData("econ") || []
    if (!x.includes(m.chat)) return await m.send("```💎 Economy Is Not Activated Here```")
    const inv = await edb.getInventory(m.sender, k)

    if (inv.length === 0) {
    return await m.send("```📦 Your inventory is empty```", {title: "📦 Empty Inventory", body: "Buy some items from shop", thumbnail: fs.readFileSync(path.join(stored, 'empty.png'))}, "ad")
    }

    let msg = "```╔════════════════╗\n╠ 📦 INVENTORY     ╣\n╠════════════════╝\n"

    inv.forEach((item, i) => {
    msg += `╠ ${i + 1}. ${item.name} x${item.quantity}\n╠    📝 ${item.description}\n╠\n`
})
   msg += "╚════════════════```"

   return await m.send(msg, {title: "📦 Your Inventory", body: "Items you currently own", thumbnail: fs.readFileSync(path.join(stored, 'inventory.png'))}, "ad")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})