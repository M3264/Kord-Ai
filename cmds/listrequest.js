const { kord, prefix, isBotAdmin, wtype, getMeta, } = require('../core')

const isApprovalOn = async (client, groupJid) => {
  const meta = await client.groupMetadata(groupJid)
  return meta.joinApprovalMode === true   
}


kord({
  cmd: 'listrequest',
  desc: 'fetch all pending join requests for group',
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: 'group'
}, async (m) => {
  try {
    const botAd = await isBotAdmin(m)
    if (!botAd) return await m.send('_*Bot needs to be admin!*_')


    const approval = await isApprovalOn(m.client, m.chat)
    if (!approval) return await m.send('_*Admin approval is not turned on in this group.*_')

    
const list = await m.client.groupRequestParticipantsList(m.chat)
    if (!list.length) return await m.send('_*No pending requests.*_')

    let text = '*Pending join requests:*\n'
    list.forEach(r => {
      text += `\n• ${r.phone_number.replace('@s.whatsapp.net', '')}`
      if (r.requestReason) text += ` – _${r.requestReason}_`
    })
    await m.send(text)


  } catch (e) {
    console.error('listrequest error', e)
    await m.send('Could not fetch requests.')
  }
});



kord({
  cmd: 'approve',
  desc: 'approve join request(s) in group',
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: 'group'
}, async (m, text) => {
  try {
    const botAd = await isBotAdmin(m)
    if (!botAd) return await m.send('_*Bot needs to be admin!*_')
    if (!text) return await m.send(`*Usage:*\n${prefix}approve all\n${prefix}approve 234xxxxxxxx,234xxxxxxxx`)


    const approval = await isApprovalOn(m.client, m.chat)
    if (!approval) return await m.send('_*Admin approval is not turned on in this group.*_')


    if (text.toLowerCase() === 'all') {
      const pending = await m.client.groupRequestParticipantsList(m.chat)
      if (!pending.length) return await m.send('_No pending requests._')
      const jids = pending.map(p => p.phone_number)
      await m.client.groupRequestParticipantsUpdate(m.chat, jids, 'approve')
      return await m.send(` _*Approved ${jids.length} request(s)*_`)
    }


    const raw   = text.split(',').map(n => n.trim().replace(/[^0-9]/g, ''))
    const wantJids = raw.map(n => `${n}@s.whatsapp.net`)

    const pending = await m.client.groupRequestParticipantsList(m.chat)
    const haveJids = new Set(pending.map(p => p.phone_number))

    const okJids   = wantJids.filter(j => haveJids.has(j))
    const missJids = wantJids.filter(j => !haveJids.has(j))

    if (!okJids.length) {
      return await m.send('Number(s) not found in request list: ' + missJids.map(j => j.replace('@s.whatsapp.net', '')).join(', '))
    }

    await m.client.groupRequestParticipantsUpdate(m.chat, okJids, 'approve')
    let reply = ` _*Approved *${okJids.length} request(s)*_`
    if (missJids.length) {
      reply += '\n Not in list: ' + missJids.map(j => j.replace('@s.whatsapp.net', '')).join(', ')
    }
    await m.send(reply)
  } catch (e) {
    console.error('approve error', e)
    await m.send('Could not approve')
  }
});


kord({
  cmd: 'reject',
  desc: 'reject join request(s) in groups',
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: 'group'
}, async (m, text) => {
  try {
    const botAd = await isBotAdmin(m)
    if (!botAd) return await m.send('_*Bot needs to be admin!*_')
    if (!text) return await m.send(`*Usage:*\n${prefix}reject all\n${prefix}reject 234xxxxxxxx,234xxxxxxxx`)


    const approval = await isApprovalOn(m.client, m.chat)
    if (!approval) return await m.send('_*Admin approval is not turned on in this group.*_')


    if (text.toLowerCase() === 'all') {
      const pending = await m.client.groupRequestParticipantsList(m.chat)
      if (!pending.length) return await m.send('_No pending requests._')
      const jids = pending.map(p => p.phone_number)
      await m.client.groupRequestParticipantsUpdate(m.chat, jids, 'reject')
      return await m.send(` _*Rejected ${jids.length} request(s)*_`)
    }


    const raw   = text.split(',').map(n => n.trim().replace(/[^0-9]/g, ''))
    const wantJids = raw.map(n => `${n}@s.whatsapp.net`)

    const pending = await m.client.groupRequestParticipantsList(m.chat)
    const haveJids = new Set(pending.map(p => p.phone_number))

    const okJids   = wantJids.filter(j => haveJids.has(j))
    const missJids = wantJids.filter(j => !haveJids.has(j))

    if (!okJids.length) {
      return await m.send('Number(s) not found in request list: ' + missJids.map(j => j.replace('@s.whatsapp.net', '')).join(', '))
    }

    await m.client.groupRequestParticipantsUpdate(m.chat, okJids, 'reject')
    let reply = ` _*Rejected ${okJids.length} request(s)*_.`
    if (missJids.length) {
      reply += '\n Not in list: ' + missJids.map(j => j.replace('@s.whatsapp.net', '')).join(', ')
    }
    await m.send(reply)
  } catch (e) {
    console.error('reject error', e)
    await m.send('Could not reject')
  }
});