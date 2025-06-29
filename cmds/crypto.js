/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { wtype, kord } = require("../core")



kord({
  cmd: 'curr-rates|currency-rates',
  desc: "get rate of currency",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  if (!text) return await m.send("*provide currency code* e.g USD, EUR, NGN")
  text = text.toUpperCase()
  
  try {
    const response = await m.axios(`https://open.er-api.com/v6/latest/${text}`)
    if (!response.rates) {
          return await m.send(`*check the code and try again*`)
        }
    const rates = response.rates
        let message = `Exchange Rates from ${text}:\n\n`;
        for (const [currency, rate] of Object.entries(rates)) {
          message += `*- ${text} to ${currency}:* ${rate.toFixed(2)}\n`
        }
        return await m.send(`${message}`)
  } catch (e) {
    console.error("error in currency rate", e)
    return await m.send(`*error!*\n${e}`)
  }
})


kord({
  cmd: "btc-usdt",
  desc: "Fetches market stats for the BTC-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT")
    

    let message = `⭑ *BTC-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} BTC\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "eth-usdt",
  desc: "Fetches market stats for the ETH-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT")
    

    let message = `⭑ *ETH-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} ETH\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "ltc-usdt",
  desc: "Fetches market stats for the LTC-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=LTC-USDT")
    

    let message = `⭑ *LTC-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} LTC\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "xrp-usdt",
  desc: "Fetches market stats for the XRP-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT")
    

    let message = `⭑ *XRP-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} XRP\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "doge-usdt",
  desc: "Fetches market stats for the DOGE-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=DOGE-USDT")
    

    let message = `⭑ *DOGE-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} DOGE\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "bch-usdt",
  desc: "Fetches market stats for the BCH-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=BCH-USDT")
    

    let message = `⭑ *BCH-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} BCH\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "ada-usdt",
  desc: "Fetches market stats for the ADA-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=ADA-USDT")
    

    let message = `⭑ *ADA-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} ADA\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "link-usdt",
  desc: "Fetches market stats for the LINK-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=LINK-USDT")
    

    let message = `⭑ *LINK-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} LINK\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "btc-usdt",
  desc: "Fetches market stats for the BTC-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT")
    

    let message = `⭑ *BTC-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} BTC\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "eth-usdt",
  desc: "Fetches market stats for the ETH-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT")
    

    let message = `⭑ *ETH-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} ETH\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "ltc-usdt",
  desc: "Fetches market stats for the LTC-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=LTC-USDT")
    

    let message = `⭑ *LTC-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} LTC\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "xrp-usdt",
  desc: "Fetches market stats for the XRP-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT")
    

    let message = `⭑ *XRP-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} XRP\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "doge-usdt",
  desc: "Fetches market stats for the DOGE-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=DOGE-USDT")
    

    let message = `⭑ *DOGE-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} DOGE\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "bch-usdt",
  desc: "Fetches market stats for the BCH-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=BCH-USDT")
    

    let message = `⭑ *BCH-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} BCH\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "ada-usdt",
  desc: "Fetches market stats for the ADA-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=ADA-USDT")
    

    let message = `⭑ *ADA-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} ADA\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "link-usdt",
  desc: "Fetches market stats for the LINK-USDT pair from KuCoin",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://api.kucoin.com/api/v1/market/stats?symbol=LINK-USDT")
    

    let message = `⭑ *LINK-USDT Market Stats*\n\n`
    message += `⭑ *Last Price:* $${parseFloat(response.last).toFixed(2)}\n`
    message += `⭑ *24h Change:* ${parseFloat(response.changeRate).toFixed(2)}%\n`
    message += `⭑ *24h High:* $${parseFloat(response.high).toFixed(2)}\n`
    message += `⭑ *24h Low:* $${parseFloat(response.low).toFixed(2)}\n`
    message += `⭑ *24h Volume:* ${parseFloat(response.vol).toFixed(2)} LINK\n`

    return await m.send(message)
  } catch (error) {
    return await m.send(`⭑ Error: ${error.message}`)
  }
})

kord({
  cmd: "ngn-rates",
  desc: "Fetches and sends exchange rates from NGN to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/NGN")
    var rates = response.rates

    let message = 'Exchange Rates from NGN:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- NGN to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "eur-rates",
  desc: "Fetches and sends exchange rates from EUR to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/EUR")
    var rates = response.rates

    let message = 'Exchange Rates from EUR:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- EUR to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "usd-rates",
  desc: "Fetches and sends exchange rates from USD to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/USD")
    var rates = response.rates

    let message = 'Exchange Rates from USD:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- USD to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "gbp-rates",
  desc: "Fetches and sends exchange rates from GBP to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/GBP")
    var rates = response.rates

    let message = 'Exchange Rates from GBP:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- GBP to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "jpy-rates",
  desc: "Fetches and sends exchange rates from JPY to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/JPY")
    var rates = response.rates

    let message = 'Exchange Rates from JPY:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- JPY to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "inr-rates",
  desc: "Fetches and sends exchange rates from INR to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/INR")
    var rates = response.rates

    let message = 'Exchange Rates from INR:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- INR to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "aud-rates",
  desc: "Fetches and sends exchange rates from AUD to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/AUD")
    var rates = response.rates

    let message = 'Exchange Rates from AUD:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- AUD to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "cad-rates",
  desc: "Fetches and sends exchange rates from CAD to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/CAD")
    var rates = response.rates

    let message = 'Exchange Rates from CAD:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- CAD to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})

kord({
  cmd: "cny-rates",
  desc: "Fetches and sends exchange rates from CNY to other currencies",
  fromMe: wtype,
  type: "crypto",
}, async (m, text) => {
  try {
    var response = await m.axios("https://open.er-api.com/v6/latest/CNY")
    var rates = response.rates

    let message = 'Exchange Rates from CNY:\n'
    for (const [currency, rate] of Object.entries(rates)) {
      message += `- CNY to ${currency}: ${rate.toFixed(2)}\n`
    }

    return await m.send(message)
  } catch (error) {
    return await m.send(`Error: ${error.message}`)
  }
})