const { kord, wtype, prefix, storeData, getData } = require("../core")
const axios = require("axios")
let sharp = null
try {
  sharp = require("sharp")
  console.log('sharp loaded ok')
} catch (e) {
  console.error('sharp failed to load', e.message)
  sharp = null
}

const ALERTS_KEY = 'match-alerts'
const MAX_ALERTS_PER_CHAT = 5
let cachedClient = null
let lastPollAt = null
const matchRuntime = global.__kordMatchRuntime || (global.__kordMatchRuntime = {
  timer: null,
  running: false,
  generation: 0
})
const runtimeGeneration = ++matchRuntime.generation
if (matchRuntime.timer) clearTimeout(matchRuntime.timer)
matchRuntime.timer = null
const pendingConfirmations = new Map()

function scheduleAlertPoll(delayMs = 0) {
  if (runtimeGeneration !== matchRuntime.generation) return
  if (matchRuntime.timer) clearTimeout(matchRuntime.timer)
  matchRuntime.timer = setTimeout(async () => {
    matchRuntime.timer = null
    if (runtimeGeneration !== matchRuntime.generation) return
    if (matchRuntime.running) return scheduleAlertPoll(60000)
    matchRuntime.running = true
    try {
      await pollAlerts()
    } catch (e) {
      console.error('pollAlerts error', e)
    } finally {
      matchRuntime.running = false
      scheduleAlertPoll(60000)
    }
  }, delayMs)
  if (matchRuntime.timer && typeof matchRuntime.timer.unref === 'function') matchRuntime.timer.unref()
}

kord({ on: "all" }, async (m) => {
  if (m && m.client) {
    const firstClient = !cachedClient
    cachedClient = m.client
    if (firstClient) scheduleAlertPoll(0)
  }
})

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function loadAlerts() {
  try {
    const data = await getData(ALERTS_KEY)
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.error('loadAlerts failed', e.message)
    return []
  }
}

async function saveAlerts(alerts) {
  try {
    await storeData(ALERTS_KEY, alerts)
  } catch (e) {
    console.error('failed to save alerts', e.message)
  }
}

function lettersOnly(name) {
  return (name || '').replace(/[^a-zA-Z]/g, '')
}

function generateAlertId(type, criteria, existingIds) {
  let base
  if (type === 'match' && criteria.home && criteria.away) {
    base = lettersOnly(criteria.home).slice(0, 3) + lettersOnly(criteria.away).slice(0, 2)
  } else if (type === 'team' && criteria.team) {
    base = lettersOnly(criteria.team).slice(0, 5)
  } else if (type === 'league' && criteria.league) {
    base = lettersOnly(criteria.league).slice(0, 5)
  }

  if (!base) base = Math.random().toString(36).slice(2, 8)

  let id = base
  let suffix = 1
  while (existingIds.includes(id)) {
    id = base + suffix
    suffix++
  }
  return id
}

const requestCache = new Map()

function cachedGet(key, url, options, ttlMs) {
  const now = Date.now()
  const entry = requestCache.get(key)

  if (entry && entry.data && (now - entry.timestamp) < ttlMs) {
    return Promise.resolve(entry.data)
  }

  if (entry && entry.pending) {
    return entry.pending
  }

  const pending = axios.get(url, options)
    .then(res => {
      requestCache.set(key, { data: res.data, timestamp: Date.now(), pending: null })
      return res.data
    })
    .catch(err => {
      requestCache.set(key, { data: entry ? entry.data : null, timestamp: entry ? entry.timestamp : 0, pending: null })
      throw err
    })

  requestCache.set(key, { data: entry ? entry.data : null, timestamp: entry ? entry.timestamp : 0, pending })
  return pending
}

const compositeCache = new Map()
const COMPOSITE_TTL_MS = 60000

async function getCachedComposite(homeUrl, awayUrl) {
  const key = `${homeUrl}|${awayUrl}`
  const now = Date.now()
  const entry = compositeCache.get(key)

  if (entry && entry.buffer && (now - entry.timestamp) < COMPOSITE_TTL_MS) {
    return entry.buffer
  }

  if (entry && entry.pending) {
    return entry.pending
  }

  const pending = buildComposite(homeUrl, awayUrl)
    .then(buffer => {
      compositeCache.set(key, { buffer, timestamp: Date.now(), pending: null })
      return buffer
    })
    .catch(err => {
      compositeCache.delete(key)
      throw err
    })

  compositeCache.set(key, { buffer: entry ? entry.buffer : null, timestamp: entry ? entry.timestamp : 0, pending })
  return pending
}

const userCooldowns = new Map()
const COOLDOWN_MS = 3000

function isOnCooldown(userId) {
  const now = Date.now()
  const last = userCooldowns.get(userId)
  if (last && (now - last) < COOLDOWN_MS) {
    return true
  }
  userCooldowns.set(userId, now)
  return false
}

async function handleAlertCommand(m, args) {
  const chatId = m.chat
  const senderId = m.sender || m.participant || m.from || m.chat
  let trimmed = args.trim()

  if (!trimmed) {
    return await m.send(`Alert Usage:

${prefix}match -alert team <team name>
${prefix}match -alert league <league name>
${prefix}match -alert <team1> vs <team2>
${prefix}match -alert confirm
${prefix}match -alert list
${prefix}match -alert stop <id>
${prefix}match -alert mute <id>
${prefix}match -alert unmute <id>

Send to a specific number instead of this chat:
${prefix}match -alert team Arsenal to 2348012345678

Send to every group the bot is in:
${prefix}match -alert all-gc league Premier League

Alerts fire on kickoff, second-half start, goals, half-time, and full-time. Cards and goal scorers are included where ESPN has the fixture. Match-specific alerts stop automatically once the match ends.`)
  }

  let targetChatId = chatId
  let targetLabel = 'this chat'

  if (/^all-gc\b/i.test(trimmed)) {
    targetChatId = 'ALL_GROUPS'
    targetLabel = 'all groups'
    trimmed = trimmed.replace(/^all-gc\b/i, '').trim()
  }

  const toMatch = trimmed.match(/\bto\s+(\d{7,15})\b/i)
  if (toMatch) {
    targetChatId = `${toMatch[1]}@s.whatsapp.net`
    targetLabel = `+${toMatch[1]}`
    trimmed = trimmed.replace(toMatch[0], '').trim()
  }

  const lower = trimmed.toLowerCase()

  if (lower === 'list') {
    const alerts = (await loadAlerts()).filter(a => a.createdInChatId === chatId)
    if (alerts.length === 0) return await m.send('No active alerts created from this chat.')
    let msg = '*Active Alerts*\n\n'
    alerts.forEach(a => {
      let desc = ''
      if (a.type === 'team') desc = `Team: ${a.criteria.team}`
      if (a.type === 'league') desc = `League: ${a.criteria.league}`
      if (a.type === 'match') desc = `Match: ${a.criteria.home} vs ${a.criteria.away}`
      const targetDesc = a.chatId === 'ALL_GROUPS' ? 'all groups' : a.chatId === chatId ? 'this chat' : a.chatId
      msg += `*${a.id}* — ${desc}\n   → ${targetDesc}${a.muted ? ' (muted)' : ''}\n`
    })
    msg += `\n_Last checked: ${lastPollAt ? new Date(lastPollAt).toLocaleTimeString() : 'not yet'}_`
    return await m.send(msg)
  }

  if (lower.startsWith('stop ')) {
    const id = trimmed.slice(5).trim()
    let alerts = await loadAlerts()
    const before = alerts.length
    alerts = alerts.filter(a => !(a.id === id && a.createdInChatId === chatId))
    if (alerts.length === before) return await m.send(`No alert found with id "${id}" from this chat.`)
    await saveAlerts(alerts)
    return await m.send(`Alert "${id}" stopped.`)
  }

  if (lower.startsWith('mute ') || lower.startsWith('unmute ')) {
    const muting = lower.startsWith('mute ')
    const id = trimmed.slice(muting ? 5 : 7).trim()
    const alerts = await loadAlerts()
    const alert = alerts.find(a => a.id === id && a.createdInChatId === chatId)
    if (!alert) return await m.send(`No alert found with id "${id}" from this chat.`)
    alert.muted = muting
    await saveAlerts(alerts)
    return await m.send(`Alert "${id}" ${muting ? 'muted' : 'unmuted'}.`)
  }

  if (lower === 'confirm') {
    const pending = pendingConfirmations.get(senderId + chatId)
    if (!pending || Date.now() > pending.expiresAt) {
      pendingConfirmations.delete(senderId + chatId)
      return await m.send('No pending alert to confirm, or it expired. Run the -alert <team1> vs <team2> request again.')
    }
    const alerts = await loadAlerts()
    const chatAlerts = alerts.filter(a => a.createdInChatId === chatId)
    if (chatAlerts.length >= MAX_ALERTS_PER_CHAT) {
      pendingConfirmations.delete(senderId + chatId)
      return await m.send(`This chat already has the maximum of ${MAX_ALERTS_PER_CHAT} alerts. Stop one first.`)
    }
    const id = generateAlertId('match', { home: pending.home, away: pending.away }, alerts.map(a => a.id))
    alerts.push({
      id,
      type: 'match',
      criteria: { home: pending.home, away: pending.away },
      chatId: pending.targetChatId,
      createdInChatId: chatId,
      createdBy: senderId,
      lastState: {},
      muted: false
    })
    await saveAlerts(alerts)
    pendingConfirmations.delete(senderId + chatId)
    return await m.send(`Confirmed. Following *${pending.home} vs ${pending.away}* — sending to ${pending.targetLabel} — id: ${id}`)
  }

  if (lower.startsWith('team ')) {
    const teamName = trimmed.slice(5).trim()
    if (!teamName) return await m.send('Give a team name, e.g. -alert team Arsenal')
    const alerts = await loadAlerts()
    const chatAlerts = alerts.filter(a => a.createdInChatId === chatId)
    if (chatAlerts.length >= MAX_ALERTS_PER_CHAT) {
      return await m.send(`This chat already has the maximum of ${MAX_ALERTS_PER_CHAT} alerts. Stop one first.`)
    }
    const id = generateAlertId('team', { team: teamName }, alerts.map(a => a.id))
    alerts.push({ id, type: 'team', criteria: { team: teamName }, chatId: targetChatId, createdInChatId: chatId, createdBy: senderId, lastState: {}, muted: false })
    await saveAlerts(alerts)
    return await m.send(`Following all *${teamName}* matches — sending to ${targetLabel} — id: ${id}`)
  }

  if (lower.startsWith('league ')) {
    const leagueName = trimmed.slice(7).trim()
    if (!leagueName) return await m.send('Give a league name, e.g. -alert league Premier League')
    const alerts = await loadAlerts()
    const chatAlerts = alerts.filter(a => a.createdInChatId === chatId)
    if (chatAlerts.length >= MAX_ALERTS_PER_CHAT) {
      return await m.send(`This chat already has the maximum of ${MAX_ALERTS_PER_CHAT} alerts. Stop one first.`)
    }
    const id = generateAlertId('league', { league: leagueName }, alerts.map(a => a.id))
    alerts.push({ id, type: 'league', criteria: { league: leagueName }, chatId: targetChatId, createdInChatId: chatId, createdBy: senderId, lastState: {}, muted: false })
    await saveAlerts(alerts)
    return await m.send(`Following *${leagueName}* — sending to ${targetLabel} — id: ${id}`)
  }

  if (lower.includes(' vs ')) {
    const [home, away] = trimmed.split(/\s+vs\s+/i).map(s => s.trim())
    if (!home || !away) return await m.send('Usage: -alert <team1> vs <team2>')

    await m.send('Checking if this match exists...')

    let foundMatch = null
    try {
      const matches = await getScoreMatchesFromPrexzy()
      const h = normalizeName(home)
      const a = normalizeName(away)
      foundMatch = matches.find(mt => {
        const mh = normalizeName(mt.homeTeam || '')
        const ma = normalizeName(mt.awayTeam || '')
        const forward = (mh.includes(h) || h.includes(mh)) && (ma.includes(a) || a.includes(ma))
        const reverse = (mh.includes(a) || a.includes(mh)) && (ma.includes(h) || h.includes(ma))
        return forward || reverse
      }) || null
    } catch (e) {
      console.error('alert vs-lookup failed', e.message)
    }

    pendingConfirmations.set(senderId + chatId, { home, away, targetChatId, targetLabel, expiresAt: Date.now() + 120000 })

    if (foundMatch) {
      return await m.send(`Found it: *${foundMatch.homeTeam}* vs *${foundMatch.awayTeam}*\n${foundMatch.league}\n${foundMatch.date || ''} ${foundMatch.time || ''}\n\nFollow this match, sending to ${targetLabel}? Reply "${prefix}match -alert confirm" within 2 minutes to confirm.`)
    }

    return await m.send(`Couldn't find "${home} vs ${away}" in today's matches — it may be on a different day, or a name might not match exactly.\n\nYou can still confirm and the alert will activate automatically once this fixture shows up in the live data. Reply "${prefix}match -alert confirm" within 2 minutes to confirm anyway, or check your spelling and try again.`)
  }

  return await m.send('Unrecognized alert command. Use -alert with no arguments to see usage.')
}

function getStructuredPlayerName(inc) {
  return (inc.athletesInvolved && inc.athletesInvolved[0] && inc.athletesInvolved[0].displayName)
    || (inc.participants && inc.participants[0] && inc.participants[0].athlete && inc.participants[0].athlete.displayName)
    || null
}

function getIncidentTeamName(inc) {
  return (inc.team && (inc.team.displayName || inc.team.name)) || null
}

function resolveGoalSide(inc, mt, tickSide) {
  const teamName = getIncidentTeamName(inc)
  if (teamName) {
    const it = normalizeName(teamName)
    const h = normalizeName(mt.homeTeam || '')
    const a = normalizeName(mt.awayTeam || '')
    if (it.includes(h) || h.includes(it)) return 'home'
    if (it.includes(a) || a.includes(it)) return 'away'
  }
  return tickSide || null
}

function buildGoalLine(homeScore, awayScore, scoringSide, minuteLabel, scorer) {
  const home = scoringSide === 'home' ? `[${homeScore}]` : `${homeScore}`
  const away = scoringSide === 'away' ? `[${awayScore}]` : `${awayScore}`
  let line = `${minuteLabel ? minuteLabel + ' ' : ''}Goal! ${home}-${away}`
  if (scorer) line += ` ${scorer}`
  return line
}

function buildHeader(mt, curr) {
  return `*${mt.homeTeam}*  ${curr.homeScore} - ${curr.awayScore}  *${mt.awayTeam}*\n${mt.league}\n\n`
}

async function sendAlertMessage(alert, text) {
  try {
    if (alert.chatId === 'ALL_GROUPS') {
      const groups = await cachedClient.groupFetchAllParticipating()
      const jids = Object.keys(groups || {})
      for (const jid of jids) {
        try {
          await cachedClient.sendMessage(jid, { text })
        } catch (e) {
          console.error('broadcast to group failed', jid, e.message)
        }
        await delay(2500)
      }
      return null
    }

    return await cachedClient.sendMessage(alert.chatId, { text })
  } catch (e) {
    console.error('alert send failed', e.message)
    return null
  }
}

function extractMinute(text) {
  const m = text.match(/^(\d+)'/)
  return m ? parseInt(m[1], 10) : null
}

function sortEventTextsByMinute(texts) {
  return [...texts].sort((a, b) => {
    const am = extractMinute(a)
    const bm = extractMinute(b)
    if (am !== null && bm !== null) return am - bm
    return 0
  })
}

async function processFixtureForAlert(alert, mt) {
  const fixtureKey = `${mt.homeTeam}|${mt.awayTeam}|${mt.date}`
  const prev = alert.lastState[fixtureKey]
  const curr = {
    status: mt.status,
    homeScore: mt.homeScore || '0',
    awayScore: mt.awayScore || '0',
    seenIncidentKeys: (prev && prev.seenIncidentKeys) || [],
    eventLog: (prev && prev.eventLog) || [],
    lastSentIndex: (prev && typeof prev.lastSentIndex === 'number') ? prev.lastSentIndex : 0,
    pendingGoalIndex: (prev && typeof prev.pendingGoalIndex === 'number') ? prev.pendingGoalIndex : null
  }

  let autoStop = alert.type === 'match' && /full[ -]?time|after extra time|after penalties|finished|ended/i.test(curr.status)

  if (!prev && !/not started/i.test(curr.status)) {
    const pushLine = (text) => {
      curr.eventLog.push({ text, pending: false, pendingSince: null, backfill: true })
    }

    pushLine(`Following from: ${curr.status}, ${curr.homeScore}-${curr.awayScore}`)

    const espnSlug = getEspnLeagueSlug(mt.league)
    if (espnSlug) {
      try {
        const espnEvents = await getEspnScoreboard(espnSlug)
        const espnEvent = findEspnEvent(mt.homeTeam, mt.awayTeam, espnEvents)
        if (espnEvent) {
          const incidents = await getEspnIncidents(espnSlug, espnEvent.id)
          const withTime = incidents.map(inc => {
            const timeLabel = (inc.clock && inc.clock.displayValue) || ''
            const minuteMatch = timeLabel.match(/^(\d+)/)
            return { inc, timeLabel, sortMinute: minuteMatch ? parseInt(minuteMatch[1], 10) : 0 }
          }).sort((a, b) => a.sortMinute - b.sortMinute)

          let runningHome = 0
          let runningAway = 0

          for (const { inc, timeLabel } of withTime) {
            const typeText = (inc.type && (inc.type.text || inc.type.id)) || ''
            const typeLower = String(typeText).toLowerCase()
            if (!typeLower.includes('goal') && !typeLower.includes('card')) continue

            const identity = getStructuredPlayerName(inc) || getIncidentTeamName(inc) || ''
            const incKey = `${timeLabel}-${typeLower}-${normalizeName(identity)}`
            curr.seenIncidentKeys.push(incKey)

            if (typeLower.includes('goal')) {
              const side = resolveGoalSide(inc, mt, null)
              if (side === 'home') runningHome++
              else if (side === 'away') runningAway++
              const scorer = getStructuredPlayerName(inc)
              pushLine(buildGoalLine(String(runningHome), String(runningAway), side, timeLabel, scorer))
            } else if (typeLower.includes('card')) {
              const teamName = getIncidentTeamName(inc)
              const cardLabel = typeLower.includes('red') ? 'Red card' : 'Yellow card'
              pushLine(`${timeLabel} ${cardLabel}${teamName ? ' — ' + teamName : ''}`)
            }
          }
        }
      } catch (e) {
        console.error('alert backfill espn lookup failed', e.message)
      }
    }
  }

  if (prev) {
    const pushLine = (text, pending) => {
      curr.eventLog.push({ text, pending: !!pending, pendingSince: pending ? Date.now() : null })
      return curr.eventLog.length - 1
    }

    if (prev.status !== curr.status) {
      if (/1st half/i.test(curr.status) && /not started/i.test(prev.status)) pushLine(`Kickoff. ${curr.homeScore}-${curr.awayScore}`)
      if (/2nd half/i.test(curr.status) && /half time/i.test(prev.status)) pushLine(`Second half started. ${curr.homeScore}-${curr.awayScore}`)
      if (/half time/i.test(curr.status)) pushLine(`Half-time. ${curr.homeScore}-${curr.awayScore}`)
      if (/full time/i.test(curr.status)) pushLine(`Full-time. ${curr.homeScore}-${curr.awayScore}`)
    }

    const scoreChanged = prev.homeScore !== curr.homeScore || prev.awayScore !== curr.awayScore
    const tickSide = scoreChanged ? (parseInt(curr.homeScore, 10) > parseInt(prev.homeScore, 10) ? 'home' : 'away') : null
    let espnHandledGoal = false

    const espnSlug = getEspnLeagueSlug(mt.league)
    if (espnSlug) {
      try {
        const espnEvents = await getEspnScoreboard(espnSlug)
        const espnEvent = findEspnEvent(mt.homeTeam, mt.awayTeam, espnEvents)
        if (espnEvent) {
          const incidents = await getEspnIncidents(espnSlug, espnEvent.id)
          for (const inc of incidents) {
            const typeText = (inc.type && (inc.type.text || inc.type.id)) || ''
            const typeLower = String(typeText).toLowerCase()
            if (!typeLower.includes('goal') && !typeLower.includes('card')) continue

            const timeLabel = (inc.clock && inc.clock.displayValue) || ''
            const identity = getStructuredPlayerName(inc) || getIncidentTeamName(inc) || ''
            const incKey = `${timeLabel}-${typeLower}-${normalizeName(identity)}`
            if (curr.seenIncidentKeys.includes(incKey)) continue
            curr.seenIncidentKeys.push(incKey)

            if (typeLower.includes('goal')) {
              const scorer = getStructuredPlayerName(inc)
              const side = resolveGoalSide(inc, mt, tickSide)
              const enrichedText = buildGoalLine(curr.homeScore, curr.awayScore, side, timeLabel, scorer)

              const pendingEntry = curr.pendingGoalIndex !== null ? curr.eventLog[curr.pendingGoalIndex] : null
              if (pendingEntry && pendingEntry.pending) {
                curr.eventLog[curr.pendingGoalIndex] = { text: enrichedText, pending: false, pendingSince: null }
                curr.pendingGoalIndex = null
              } else {
                pushLine(enrichedText, false)
              }
              espnHandledGoal = true
            } else if (typeLower.includes('card')) {
              const teamName = getIncidentTeamName(inc)
              const cardLabel = typeLower.includes('red') ? 'Red card' : 'Yellow card'
              pushLine(`${timeLabel} ${cardLabel}${teamName ? ' — ' + teamName : ''}`, false)
            }
          }
        }
      } catch (e) {
        console.error('alert espn lookup failed', e.message)
      }
    }

    if (scoreChanged && !espnHandledGoal) {
      const bareLine = buildGoalLine(curr.homeScore, curr.awayScore, tickSide, mt.minute ? `${mt.minute}'` : '')
      curr.pendingGoalIndex = pushLine(bareLine, true)
    }

    let readyUpTo = curr.lastSentIndex
    for (let i = curr.lastSentIndex; i < curr.eventLog.length; i++) {
      const entry = curr.eventLog[i]
      if (!entry.pending) {
        readyUpTo = i + 1
      } else if (entry.pendingSince && (Date.now() - entry.pendingSince) > 300000) {
        readyUpTo = i + 1
      } else {
        break
      }
    }

    if (readyUpTo > curr.lastSentIndex) {
      const hasFreshContent = curr.eventLog.slice(curr.lastSentIndex, readyUpTo).some(e => !e.backfill)
      if (hasFreshContent && !alert.muted) {
        const linesToShow = sortEventTextsByMinute(curr.eventLog.slice(0, readyUpTo).map(e => e.text))
        await sendAlertMessage(alert, buildHeader(mt, curr) + linesToShow.join('\n'))
        curr.lastSentIndex = readyUpTo
      }
    }

    if (alert.type === 'match' && /full[ -]?time|after extra time|after penalties|finished|ended/i.test(curr.status)) {
      autoStop = true
    }
  }

  alert.lastState[fixtureKey] = curr
  return autoStop
}


async function pollAlerts() {
  if (!cachedClient) {
  //  console.log('pollAlerts: skipped, no client reference yet — run a match command first')
    return
  }

  const alerts = await loadAlerts()
  if (alerts.length === 0) {
   // console.log('pollAlerts: no alerts in storage')
    return
  }

  let scoreMatches = []
  let prexzyFailed = false

  try {
    scoreMatches = await getScoreMatchesFromPrexzy()
    if (scoreMatches.length === 0) prexzyFailed = true
  } catch (e) {
    prexzyFailed = true
    console.error('pollAlerts: prexzy fetch failed', e.message)
  }

  if (scoreMatches.length === 0 && prexzyFailed) {
    scoreMatches = await getScoreMatchesFromEspnFallback()
    if (scoreMatches.length > 0) {
      console.log(`pollAlerts: prexzy unavailable, using ESPN fallback (${scoreMatches.length} matches)`)
    }
  }

  lastPollAt = Date.now()

  if (scoreMatches.length === 0) return

  let changed = false
  const survivingAlerts = []

  for (const alert of alerts) {
    if (!alert.lastState) alert.lastState = {}

    let relevantMatches = []
    if (alert.type === 'team') {
      const t = normalizeName(alert.criteria.team)
      relevantMatches = scoreMatches.filter(mt => {
        const h = normalizeName(mt.homeTeam || '')
        const a = normalizeName(mt.awayTeam || '')
        return h.includes(t) || t.includes(h) || a.includes(t) || t.includes(a)
      })
    } else if (alert.type === 'league') {
      const l = alert.criteria.league.toLowerCase()
      relevantMatches = scoreMatches.filter(mt => (mt.league || '').toLowerCase().includes(l))
    } else if (alert.type === 'match') {
      const h = normalizeName(alert.criteria.home)
      const a = normalizeName(alert.criteria.away)
      relevantMatches = scoreMatches.filter(mt => {
        const mh = normalizeName(mt.homeTeam || '')
        const ma = normalizeName(mt.awayTeam || '')
        return (mh.includes(h) || h.includes(mh)) && (ma.includes(a) || a.includes(ma))
      })
    }

    let autoStop = false
    try {
      for (const mt of relevantMatches) {
        const stopped = await processFixtureForAlert(alert, mt)
        if (stopped) autoStop = true
      }
    } catch (e) {
      console.error(`pollAlerts: error processing alert ${alert.id}, skipping it this cycle`, e.message)
      survivingAlerts.push(alert)
      await delay(2000)
      continue
    }
    changed = true

    if (autoStop) {
      if (!alert.muted) {
        await sendAlertMessage(alert, `This match has ended. Alert "${alert.id}" has been automatically stopped.`)
      }
      changed = true
      continue
    }

    survivingAlerts.push(alert)
    await delay(2000)
  }

  if (changed) await saveAlerts(survivingAlerts)
}

function prexzyStatusToText(rawStatus, periodType) {
  if (rawStatus === 'FIXTURE') return 'Not Started'
  if (rawStatus === 'POSTPONED') return 'Postponed'
  if (rawStatus === 'RESULT') return 'Full Time'
  if (rawStatus === 'LIVE') {
    if (periodType === 'FIRST_HALF') return '1st Half'
    if (periodType === 'HALF_TIME') return 'Half Time'
    if (periodType === 'SECOND_HALF') return '2nd Half'
    return 'Live'
  }
  return rawStatus || 'Unknown'
}

function prexzyMinuteLabel(period) {
  if (!period || period.minute == null) return null
  return period.extra ? `${period.minute}+${period.extra}` : `${period.minute}`
}

async function getScoreMatchesFromPrexzy() {
  const data = await cachedGet('prexzy-goallivescore', 'https://prexzyapis.com/sports/goallivescore', { timeout: 10000 }, 50000)
  const competitions = (data && data.data) || []
  const matches = []

  for (const comp of competitions) {
    const league = comp.area ? `${comp.area}: ${comp.competition}` : comp.competition
    const compMatches = comp.matches || []
    for (const mt of compMatches) {
      if (!mt.homeTeam || !mt.awayTeam) continue

      const dateObj = mt.startTime ? new Date(mt.startTime) : null

      matches.push({
        homeTeam: mt.homeTeam,
        awayTeam: mt.awayTeam,
        homeScore: mt.homeScore != null ? String(mt.homeScore) : '0',
        awayScore: mt.awayScore != null ? String(mt.awayScore) : '0',
        status: prexzyStatusToText(mt.rawStatus, mt.period && mt.period.type),
        league: league || 'Unknown League',
        date: dateObj ? dateObj.toISOString().slice(0, 10) : '',
        time: dateObj ? dateObj.toTimeString().slice(0, 5) : '',
        minute: prexzyMinuteLabel(mt.period)
      })
    }
  }

  return matches
}

kord({
  cmd: "match",
  desc: "Get live football match scores and details",
  fromMe: wtype,
  type: "user"
}, async (m, text) => {
  try {
    cachedClient = m.client

    if (text && text.trim().toLowerCase().startsWith('-alert')) {
      const alertArgs = text.trim().slice(6)
      return await handleAlertCommand(m, alertArgs)
    }

    if (!text) {
      return await m.send(`Match Command Usage:

Usage:
${prefix}match <team/country>
${prefix}match <team1> vs <team2>
${prefix}match <team1> vs <team2> --events
${prefix}match -alert (see alert options)`)
    }

    let showEvents = false
    let cleanedText = text
    if (/--events\b/i.test(cleanedText)) {
      showEvents = true
      cleanedText = cleanedText.replace(/--events\b/i, '').trim()
    }

    const input = cleanedText.toLowerCase()
    let teamFilter = input
    let isSpecificMatch = false

    if (input.includes(' vs ') || input.includes(' vs. ') || input.includes(' versus ')) {
      isSpecificMatch = true
      const vsIndex = input.indexOf(' vs ')
      teamFilter = input.substring(0, vsIndex).trim()
    }

    const senderId = m.sender || m.participant || m.from || m.chat

    if (isOnCooldown(senderId)) {
      return await m.send('Please wait a few seconds before searching again.')
    }

    await m.send('Searching for matches...')

    let scoreMatches = []
    let usingEspnFallback = false
    let prexzyFailed = false

    try {
      scoreMatches = await getScoreMatchesFromPrexzy()
      if (scoreMatches.length === 0) prexzyFailed = true
    } catch (e) {
      prexzyFailed = true
      console.error('prexzy fetch failed', e.message)
    }

    if (scoreMatches.length === 0 && prexzyFailed) {
      console.log('prexzy unavailable, falling back to ESPN scoreboards')
      scoreMatches = await getScoreMatchesFromEspnFallback()
      if (scoreMatches.length > 0) {
        usingEspnFallback = true
        console.log(`ESPN fallback active: ${scoreMatches.length} matches loaded`)
      }
    }

    if (scoreMatches.length === 0) {
      if (prexzyFailed) {
        return await m.send('Live score service is temporarily unavailable. Please try again in a minute.')
      }
      return await m.send(`No matches found for ${text}

Check spelling
Use ${prefix}match help for usage`)
    }

    if (isSpecificMatch) {
      const searchTeams = input.split(/\s+(?:vs|vs\.|versus)\s+/)
      if (searchTeams.length === 2) {
        const term1 = normalizeName(searchTeams[0])
        const term2 = normalizeName(searchTeams[1])
        const exactMatch = scoreMatches.find(match => {
          const home = normalizeName(match.homeTeam || '')
          const away = normalizeName(match.awayTeam || '')
          const forwardMatch = (home.includes(term1) || term1.includes(home)) && (away.includes(term2) || term2.includes(away))
          const reverseMatch = (home.includes(term2) || term2.includes(home)) && (away.includes(term1) || term1.includes(away))
          return forwardMatch || reverseMatch
        })
        if (exactMatch) {
          return await formatSingleMatch(exactMatch, m, showEvents)
        }
      }
    }

    const filteredMatches = scoreMatches.filter(match =>
      (match.homeTeam && match.homeTeam.toLowerCase().includes(teamFilter)) ||
      (match.awayTeam && match.awayTeam.toLowerCase().includes(teamFilter)) ||
      (match.league && match.league.toLowerCase().includes(teamFilter))
    )

    if (filteredMatches.length === 0) {
      return await m.send(`No matches found for ${text}

Check spelling
Use ${prefix}match help for usage`)
    }

    if (filteredMatches.length === 1) {
      return await formatSingleMatch(filteredMatches[0], m, showEvents)
    } else {
      return await formatMultipleMatches(filteredMatches, teamFilter, m)
    }

  } catch (error) {
    console.error('Match plugin error:', error)
    return await m.send('Error fetching match data. Please try again later.')
  }
})

const DIACRITIC_MAP = {
  'ø': 'o', 'æ': 'ae', 'å': 'a', 'ö': 'o', 'ü': 'u', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u',
  'ñ': 'n', 'ç': 'c', 'š': 's', 'ž': 'z', 'ć': 'c', 'č': 'c', 'đ': 'd'
}

const ABBREVIATION_MAP = [
  [/\bman\b/g, 'manchester'],
  [/\butd\b/g, 'united'],
  [/\bath\b/g, 'athletic'],
  [/\bintl\b/g, 'international'],
  [/\bfc\b/g, ''],
  [/\bcf\b/g, ''],
  [/\bsc\b/g, ''],
  [/\bac\b/g, '']
]

function normalizeName(name) {
  let s = name.toLowerCase().split('').map(ch => DIACRITIC_MAP[ch] || ch).join('')
  for (const [pattern, replacement] of ABBREVIATION_MAP) {
    s = s.replace(pattern, replacement)
  }
  return s.replace(/[^a-z0-9]/g, '')
}

async function getTheSportsDbLogo(teamName) {
  try {
    const data = await cachedGet(`tsdb-team-${normalizeName(teamName)}`, `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(teamName)}`, { timeout: 8000 }, 3600000)
    const teams = (data && data.teams) || []
    if (teams.length > 0 && teams[0].strBadge) {
      return teams[0].strBadge
    }
  } catch (e) {
    console.error('thesportsdb logo lookup failed', e.message)
  }
  return null
}

async function getLogosWithFallback(match) {
  const [homeBadge, awayBadge] = await Promise.all([
    getTheSportsDbLogo(match.homeTeam),
    getTheSportsDbLogo(match.awayTeam)
  ])

  if (homeBadge && awayBadge) {
    return { homeLogo: homeBadge, awayLogo: awayBadge }
  }

  return null
}

const ESPN_LEAGUE_MAP = [
  { match: 'premier league', country: 'england', slug: 'eng.1', label: 'ENGLAND: Premier League' },
  { match: 'la liga', slug: 'esp.1', label: 'SPAIN: La Liga' },
  { match: 'serie a', country: 'italy', slug: 'ita.1', label: 'ITALY: Serie A' },
  { match: 'bundesliga', country: 'germany', slug: 'ger.1', label: 'GERMANY: Bundesliga' },
  { match: 'ligue 1', slug: 'fra.1', label: 'FRANCE: Ligue 1' },
  { match: 'eredivisie', slug: 'ned.1', label: 'NETHERLANDS: Eredivisie' },
  { match: 'liga portugal', slug: 'por.1', label: 'PORTUGAL: Liga Portugal' },
  { match: 'mls', slug: 'usa.1', label: 'USA: MLS' },
  { match: 'champions league', slug: 'uefa.champions', label: 'EUROPE: Champions League' },
  { match: 'europa league', slug: 'uefa.europa', label: 'EUROPE: Europa League' },
  { match: 'world cup', slug: 'fifa.world', label: 'WORLD: World Cup' },
  { match: 'league cup', country: 'england', slug: 'eng.league_cup', label: 'ENGLAND: League Cup' },
  { match: 'fa cup', country: 'england', slug: 'eng.fa', label: 'ENGLAND: FA Cup' },
  { match: 'efl trophy', slug: 'eng.trophy', label: 'ENGLAND: EFL Trophy' },
  { match: 'copa del rey', slug: 'esp.copa_del_rey', label: 'SPAIN: Copa del Rey' },
  { match: 'premier league', country: 'scotland', slug: 'sco.1', label: 'SCOTLAND: Premier League' },
  { match: 'premier league', country: 'russia', slug: 'rus.1', label: 'RUSSIA: Premier League' },
  { match: 'first division a', country: 'belgium', slug: 'bel.1', label: 'BELGIUM: First Division A' },
  { match: 'super lig', country: 'turkey', slug: 'tur.1', label: 'TURKEY: Super Lig' },
  { match: 'pro league', country: 'saudi', slug: 'ksa.1', label: 'SAUDI ARABIA: Pro League' },
  { match: 'serie a', country: 'brazil', slug: 'bra.1', label: 'BRAZIL: Serie A' },
  { match: 'liga profesional', country: 'argentina', slug: 'arg.1', label: 'ARGENTINA: Liga Profesional' },
  { match: 'libertadores', slug: 'conmebol.libertadores', label: 'CONMEBOL: Libertadores' },
  { match: 'sudamericana', slug: 'conmebol.sudamericana', label: 'CONMEBOL: Sudamericana' },
  { match: 'coppa italia', slug: 'ita.coppa_italia', label: 'ITALY: Coppa Italia' },
  { match: 'dfb', slug: 'ger.dfb_pokal', label: 'GERMANY: DFB Pokal' },
  { match: 'coupe de france', slug: 'fra.coupe_de_france', label: 'FRANCE: Coupe de France' },
  { match: 'liga bbva mx', slug: 'mex.1', label: 'MEXICO: Liga MX' },
  { match: 'knvb beker', slug: 'ned.cup', label: 'NETHERLANDS: KNVB Beker' },
  { match: 'scottish cup', slug: 'sco.tennents', label: 'SCOTLAND: Scottish Cup' },
  { match: 'scottish league cup', slug: 'sco.cis', label: 'SCOTLAND: League Cup' }
]

function espnStatusToText(status) {
  if (!status || !status.type) return 'Unknown'
  const state = status.type.state
  if (state === 'pre') return 'Not Started'
  if (state === 'post') return 'Full Time'
  if (state === 'in') {
    const typeName = ((status.type.name || '') + ' ' + (status.type.description || '')).toLowerCase()
    if (typeName.includes('halftime') || typeName.includes('half time')) return 'Half Time'
    const period = status.period
    if (period === 1) return '1st Half'
    if (period === 2) return '2nd Half'
    return 'Live'
  }
  return status.type.description || 'Live'
}

async function getScoreMatchesFromEspnFallback() {
  const allMatches = []
  const seenSlugs = new Set()

  for (const entry of ESPN_LEAGUE_MAP) {
    if (seenSlugs.has(entry.slug)) continue
    seenSlugs.add(entry.slug)

    try {
      const events = await getEspnScoreboard(entry.slug)
      for (const ev of events) {
        const competitors = (ev.competitions && ev.competitions[0] && ev.competitions[0].competitors) || []
        const home = competitors.find(c => c.homeAway === 'home')
        const away = competitors.find(c => c.homeAway === 'away')
        if (!home || !away || !home.team || !away.team) continue

        const dateObj = ev.date ? new Date(ev.date) : null

        allMatches.push({
          homeTeam: home.team.displayName || home.team.name,
          awayTeam: away.team.displayName || away.team.name,
          homeScore: home.score || '0',
          awayScore: away.score || '0',
          status: espnStatusToText(ev.status),
          league: entry.label,
          date: dateObj ? dateObj.toISOString().slice(0, 10) : '',
          time: dateObj ? dateObj.toTimeString().slice(0, 5) : '',
          minute: null
        })
      }
    } catch (e) {
      console.error(`espn fallback scoreboard failed for ${entry.slug}`, e.message)
    }
  }

  return allMatches
}

let dynamicLeagueMap = null

async function getDynamicLeagueMap() {
  if (dynamicLeagueMap) return dynamicLeagueMap

  try {
    const data = await cachedGet('espn-all-leagues', 'https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=500', { timeout: 10000 }, 86400000)
    const items = (data && data.items) || []

    const usable = items.filter(it => it && it.abbreviation && it.name && !it.$ref)

    if (usable.length > 0) {
      dynamicLeagueMap = usable.map(it => ({
        match: it.name.toLowerCase(),
        slug: it.abbreviation
      }))
      console.log(`espn dynamic league list loaded: ${dynamicLeagueMap.length} leagues`)
      return dynamicLeagueMap
    }

    console.log('espn leagues endpoint returned ref-only or unusable data, keeping curated list')
  } catch (e) {
    console.error('espn dynamic league fetch failed, keeping curated list', e.message)
  }

  dynamicLeagueMap = []
  return dynamicLeagueMap
}

getDynamicLeagueMap().catch(e => console.error('initial espn league fetch error', e.message))

// The primary score feed uses localized country labels; ESPN uses English slugs.
const ESPN_COUNTRY_ALIASES = {
  england: ['england', 'inggris raya', 'inggris'],
  italy: ['italy', 'italia'],
  germany: ['germany', 'jerman'],
  scotland: ['scotland', 'skotlandia'],
  russia: ['russia', 'rusia'],
  belgium: ['belgium', 'belgia'],
  turkey: ['turkey', 'turkiye', 'turki'],
  brazil: ['brazil', 'brasil']
}

function getEspnLeagueSlug(leagueName) {
  if (!leagueName) return null
  const lower = leagueName.toLowerCase()
  const compact = normalizeName(leagueName)

  for (const entry of ESPN_LEAGUE_MAP) {
    const entryMatches = lower.includes(entry.match) || compact.includes(normalizeName(entry.match))
    const countryAliases = ESPN_COUNTRY_ALIASES[entry.country] || [entry.country]
    const countryMatches = !entry.country || countryAliases.some(country =>
      lower.includes(country) || compact.includes(normalizeName(country)))
    if (entryMatches && countryMatches) {
      return entry.slug
    }
  }

  if (dynamicLeagueMap) {
    for (const entry of dynamicLeagueMap) {
      const entryCompact = normalizeName(entry.match)
      if (lower.includes(entry.match) || entry.match.includes(lower) || compact.includes(entryCompact) || entryCompact.includes(compact)) {
        return entry.slug
      }
    }
  }

  return null
}

async function getEspnScoreboard(slug) {
  try {
    const data = await cachedGet(`espn-scoreboard-${slug}`, `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`, { timeout: 8000 }, 15000)
    return (data && data.events) || []
  } catch (e) {
    console.error(`espn scoreboard fetch failed for ${slug}`, e.message)
    return []
  }
}

function findEspnEvent(homeTeam, awayTeam, events) {
  const h = normalizeName(homeTeam)
  const a = normalizeName(awayTeam)
  return events.find(ev => {
    const competitors = (ev.competitions && ev.competitions[0] && ev.competitions[0].competitors) || []
    const home = competitors.find(c => c.homeAway === 'home')
    const away = competitors.find(c => c.homeAway === 'away')
    const eh = normalizeName((home && home.team && home.team.displayName) || '')
    const ea = normalizeName((away && away.team && away.team.displayName) || '')
    return (eh.includes(h) || h.includes(eh)) && (ea.includes(a) || a.includes(ea))
  }) || null
}

function computeEspnClock(event) {
  if (!event || !event.status || !event.status.type) return null
  if (event.status.type.state !== 'in') return null
  return event.status.type.detail || event.status.type.shortDetail || null
}

async function getEspnIncidents(slug, eventId) {
  try {
    const data = await cachedGet(`espn-summary-${slug}-${eventId}`, `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${eventId}`, { timeout: 8000 }, 10000)
    return (data && data.keyEvents) || []
  } catch (e) {
    console.error('espn summary fetch failed', e.message)
    return []
  }
}

function formatEventsTimeline(incidents) {
  if (!incidents || incidents.length === 0) return ''

  const lines = []
  for (const inc of incidents) {
    const typeText = (inc.type && (inc.type.text || inc.type.id)) || ''
    const typeLower = String(typeText).toLowerCase()
    if (!typeLower.includes('goal') && !typeLower.includes('card') && !typeLower.includes('substitution')) continue

    const timeLabel = (inc.clock && inc.clock.displayValue) || ''

    let description = inc.text || typeText
    if (!inc.text) {
      const player = (inc.athletesInvolved && inc.athletesInvolved[0] && inc.athletesInvolved[0].displayName)
        || (inc.participants && inc.participants[0] && inc.participants[0].athlete && inc.participants[0].athlete.displayName)
        || ''
      if (player) description += ` — ${player}`
    }

    lines.push({ timeLabel, description })
  }

  if (lines.length === 0) return ''

  let text = '\n*Match Events*\n'
  for (const line of lines) {
    text += `*${line.timeLabel}*  →  ${line.description}\n`
  }

  return text
}

function buildMatchText(match, liveClock, incidentsText) {
  const homeScore = match.homeScore || '0'
  const awayScore = match.awayScore || '0'
  const minute = liveClock ? ` ${liveClock}` : (match.minute ? ` ${match.minute}'` : '')

  let message = `*${match.homeTeam}*  ${homeScore} - ${awayScore}  *${match.awayTeam}*\n\n`
  message += `*Status:* ${match.status}${minute}\n`
  message += `*League:* ${match.league}\n`

  if (match.date && match.time) {
    message += `*Date:* ${match.date} | *Time:* ${match.time}\n`
  } else if (match.startTime) {
    const startDate = new Date(match.startTime)
    message += `*Kickoff:* ${startDate.toLocaleString()}\n`
  }

  if (match.halfTimeScore && match.halfTimeScore !== '0 - 0') {
    message += `*Half Time:* ${match.halfTimeScore}\n`
  }

  if (incidentsText) {
    message += incidentsText
  }

  message += `\n_Updated: ${new Date().toLocaleTimeString()}_`

  return message
}

async function buildComposite(homeUrl, awayUrl) {
  const [homeRes, awayRes] = await Promise.all([
    axios.get(homeUrl, { responseType: 'arraybuffer', timeout: 10000 }),
    axios.get(awayUrl, { responseType: 'arraybuffer', timeout: 10000 })
  ])

  const size = 220
  const gap = 60
  const canvasWidth = size * 2 + gap
  const canvasHeight = size

  const homeBuf = await sharp(Buffer.from(homeRes.data))
    .resize(size, size, { fit: 'contain', withoutEnlargement: true, background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()

  const awayBuf = await sharp(Buffer.from(awayRes.data))
    .resize(size, size, { fit: 'contain', withoutEnlargement: true, background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()

  const homeMeta = await sharp(homeBuf).metadata()
  const awayMeta = await sharp(awayBuf).metadata()

  const homeLeft = Math.round((size - homeMeta.width) / 2)
  const homeTop = Math.round((size - homeMeta.height) / 2)
  const awayLeft = size + gap + Math.round((size - awayMeta.width) / 2)
  const awayTop = Math.round((size - awayMeta.height) / 2)

  const vsSvg = Buffer.from(
    `<svg width="${gap}" height="${canvasHeight}"><text x="50%" y="50%" font-size="26" font-family="sans-serif" font-weight="bold" fill="#333333" text-anchor="middle" dominant-baseline="middle">VS</text></svg>`
  )

  const composite = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      { input: homeBuf, left: homeLeft, top: homeTop },
      { input: vsSvg, left: size, top: 0 },
      { input: awayBuf, left: awayLeft, top: awayTop }
    ])
    .png()
    .toBuffer()

  return composite
}

async function formatSingleMatch(match, m, showEvents) {
  let liveClock = null
  let incidentsText = ''

  const espnSlug = getEspnLeagueSlug(match.league)
  if (espnSlug) {
    const espnEvents = await getEspnScoreboard(espnSlug)
    const espnEvent = findEspnEvent(match.homeTeam, match.awayTeam, espnEvents)
    if (espnEvent) {
      liveClock = computeEspnClock(espnEvent)
      console.log(`espn match lookup for "${match.homeTeam}" vs "${match.awayTeam}": found id ${espnEvent.id}`)
      if (showEvents) {
        const incidents = await getEspnIncidents(espnSlug, espnEvent.id)
        incidentsText = formatEventsTimeline(incidents)
      }
    } else {
      console.log(`espn match lookup for "${match.homeTeam}" vs "${match.awayTeam}": not found in ${espnSlug} scoreboard`)
    }
  }

  const message = buildMatchText(match, liveClock, incidentsText)
  const logos = await getLogosWithFallback(match)

  if (!logos) {
    console.log(`logo lookup for "${match.homeTeam}" vs "${match.awayTeam}": no match found in logo source`)
  } else {
    console.log(`logo lookup for "${match.homeTeam}" vs "${match.awayTeam}": found (sharp ${sharp ? 'loaded' : 'NOT loaded'})`)
  }

  if (logos && logos.homeLogo && logos.awayLogo && sharp) {
    try {
      const composite = await getCachedComposite(logos.homeLogo, logos.awayLogo)
      return await m.send(composite, { mimetype: 'image/png', caption: message }, "image")
    } catch (e) {
      console.error('composite failed', e)
    }
  }

  if (logos && logos.homeLogo) {
    try {
      const response = await axios.get(logos.homeLogo, { responseType: 'arraybuffer', timeout: 10000 })
      const buffer = Buffer.from(response.data)
      return await m.send(buffer, { mimetype: 'image/png', caption: message }, "image")
    } catch (e) {
      console.error('single logo send failed', e)
      return await m.send(message)
    }
  }

  return await m.send(message)
}

async function formatMultipleMatches(matches, searchTerm, m) {
  const limitedMatches = matches.slice(0, 5)

  let message = `Found ${matches.length} matches for "${searchTerm}"\n\n`

  for (let index = 0; index < limitedMatches.length; index++) {
    const match = limitedMatches[index]
    const homeScore = match.homeScore || '0'
    const awayScore = match.awayScore || '0'

    let liveClock = null
    const espnSlug = getEspnLeagueSlug(match.league)
    if (espnSlug) {
      const espnEvents = await getEspnScoreboard(espnSlug)
      const espnEvent = findEspnEvent(match.homeTeam, match.awayTeam, espnEvents)
      liveClock = computeEspnClock(espnEvent)
    }
    const minute = liveClock ? ` ${liveClock}` : (match.minute ? ` ${match.minute}'` : '')

    message += `${index + 1}. *${match.homeTeam}* ${homeScore} - ${awayScore} *${match.awayTeam}*\n`
    message += `   ${match.status}${minute}\n`
    message += `   ${match.league}\n`
    if (match.date && match.time) {
      message += `   ${match.date} ${match.time}\n`
    }
    message += '\n'
  }

  if (matches.length > 5) {
    message += `Showing 5 of ${matches.length} matches\n`
    message += `Use more specific search (e.g., "${prefix}match Nigeria vs Ghana")`
  } else {
    message += `Use "${prefix}match <team1> vs <team2>" for specific match details, or add --events for goals, cards, and subs`
  }

  return await m.send(message)
}