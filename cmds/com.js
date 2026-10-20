const { kord, wtype, prefix, isBotAdmin, isadminn, isAdmin, extractUrlsFromString, config, sleep, storeData, getData } = require("../core");
const fs = require('fs')
const path = require('path')
const { Jimp } = require('jimp');
const WebP = require("node-webpmux");  
 
const ffmpeg = require('fluent-ffmpeg');
kord({
   cmd: "call-link|createcall-link",
   desc: "To create whatsapp call link audio/video",
   fromMe: true,
   type: "user",
}, async (m, text, cmd) => {
    try {
        const futureTime = Math.floor((Date.now() + 3600000)/1000);

   if (!text) {
    return await m.send(`Usage: ${cmd} video/audio`)
   }
   const opt = text.toLowerCase().trim();
   let type;
   if (opt === "video") {
    type = "video"
   }
   else if (opt === "audio" || opt === "voice") {
    type = "audio"
   }
   else {
            return await m.send("Invalid type. Please choose 'video' or 'audio'.");
        }
   const call = await m.client.createCallLink(type, { 
    startTime: futureTime 
    }, 10000
)
     const linkPath = type === "audio" ? "voice" : "video";
     return await m.send(`https://call.whatsapp.com/${linkPath}/${call}`);
    }
 catch (err) {
 console.log("call Error", err)
 await m.sendErr("Call Error", err)
 }
})




const normalizeCommunityJid = jid => typeof jid === 'string' ? jid.replace(/:\d+(?=@)/, '') : '';
async function communityAliases(m, values) {
  const aliases = new Set(values.map(normalizeCommunityJid).filter(Boolean));
  const mapping = m.client.signalRepository?.lidMapping;
  for (const jid of [...aliases]) {
    try {
      const other = jid.endsWith('@lid') ? await mapping?.getPNForLID(jid) : await mapping?.getLIDForPN(jid);
      if (other) aliases.add(normalizeCommunityJid(other));
    } catch {}
  }
  return aliases;
}
function communityIsAdmin(meta, aliases) {
  return (meta.participants || []).some(p => ['admin', 'superadmin'].includes(p.admin) &&
    [p.id, p.jid, p.phoneNumber, p.lid].some(jid => aliases.has(normalizeCommunityJid(jid))));
}
async function communityContext(m, needsAdmin = true) {
  if (!m.isGroup) { await m.send('_Community Only Command.._'); return null; }
  const announce = await m.client.groupMetadata(m.chat);
  if (!announce.isCommunityAnnounce || !announce.linkedParent) {
    await m.send('_Use this in a community announcement group._'); return null;
  }
  const chat = announce.linkedParent;
  const meta = await m.client.communityMetadata(chat);
  if (needsAdmin) {
    const bot = await communityAliases(m, [m.user?.jid, m.client.user?.id, m.client.user?.lid]);
    if (!communityIsAdmin(meta, bot)) { await m.send('_Bot needs to be a community admin._'); return null; }
    const sender = await communityAliases(m, [m.sender, m.lid, m.key?.participant, m.key?.participantAlt]);
    if (!communityIsAdmin(meta, sender)) { await m.send('_Community admin only._'); return null; }
  }
  return { chat, meta };
}
function communityTarget(m, text) {
  const input = m.mentionedJid?.[0] || m.quoted?.sender || String(text || '').trim();
  if (!input) return null;
  const jid = input.includes('@') ? input : `${input.replace(/\D/g, '')}@s.whatsapp.net`;
  return /^\d+@(s\.whatsapp\.net|lid)$/.test(jid) ? jid : null;
}

kord({cmd:'commname|setcommname',desc:'set a community name',gc:true,adminOnly:true,fromMe:wtype,type:'community'}, async (m,text,cmd) => {
  try {
    const name = String(text || m.quoted?.text || '').trim();
    if (!name) return m.send(`Usage: ${cmd} New Community Name`);
    const ctx = await communityContext(m);
    if (!ctx) return;
    await m.client.communityUpdateSubject(ctx.chat,name);
    return m.send('✓ Community name updated.');
  } catch (e) { return m.sendErr(e); }
});

async function changeCommunityAdmin(m,text,action) {
  const jid = communityTarget(m,text);
  if (!jid) return m.send('_Reply to, mention, or provide a member._');
  const ctx = await communityContext(m);
  if (!ctx) return;
  const aliases = await communityAliases(m,[jid]);
  const member = (ctx.meta.participants || []).find(p => [p.id,p.jid,p.phoneNumber,p.lid].some(j => aliases.has(normalizeCommunityJid(j))));
  if (!member) return m.send('_Member is not in this community._');
  const isAdmin = communityIsAdmin(ctx.meta,aliases);
  if (action === 'promote' && isAdmin) return m.send('_Member is already an admin._');
  if (action === 'demote' && !isAdmin) return m.send('_Member is not an admin._');
  const results = await m.client.communityParticipantsUpdate(ctx.chat,[member.id || member.jid || member.phoneNumber || jid],action);
  if (!Array.isArray(results) || !results.length || results.some(r => String(r.status) !== '200')) {
    return m.send('_Community update was rejected. Check the bot permissions._');
  }
  return m.send(`✓ @${jid.split('@')[0]} ${action === 'promote' ? 'promoted' : 'demoted'}.`,{mentions:[jid]});
}
kord({cmd:'cdemote|commdemote',desc:'demote a community admin',fromMe:wtype,gc:true,adminOnly:true,type:'community'}, async(m,text) => {
  try { return await changeCommunityAdmin(m,text,'demote'); } catch(e) { return m.sendErr(e); }
});
kord({cmd:'cpromote|commpromote',desc:'promote a community member',fromMe:wtype,gc:true,adminOnly:true,type:'community'}, async(m,text) => {
  try { return await changeCommunityAdmin(m,text,'promote'); } catch(e) { return m.sendErr(e); }
});
kord({cmd:'createcomm',desc:'create a community',fromMe:true,type:'community'}, async(m,text) => {
  if (!String(text || '').trim()) return m.send('_Provide a community name._');
  try {
    const community = await m.client.communityCreate(text.trim(),'New community');
    if (!community?.id) return m.send('_Community creation did not return an ID._');
    const code = await m.client.communityInviteCode(community.id);
    return m.send(code ? `✓ Community created\nhttps://chat.whatsapp.com/${code}` : `✓ Community created\nID: ${community.id}`);
  } catch(e) { return m.sendErr(e); }
});
async function changeLinkedGroups(m,text,unlink) {
  const groups = [...new Set(String(text || '').split(',').map(j => j.trim()).filter(Boolean))];
  if (!groups.length || groups.some(jid => !/^\d+(?:-\d+)?@g\.us$/.test(jid))) return m.send('_Provide group JIDs separated by commas._');
  const ctx = await communityContext(m);
  if (!ctx) return;
  const results = [];
  for (const jid of groups) {
    try {
      if (unlink) await m.client.communityUnlinkGroup(jid,ctx.chat);
      else await m.client.communityLinkGroup(jid,ctx.chat);
      results.push(`✓ ${jid}: ${unlink ? 'unlinked' : 'linked'}`);
    } catch(e) { results.push(`✘ ${jid}: ${e.message || 'update failed'}`); }
  }
  return m.send(results.join('\n'));
}
kord({cmd:'linkgc|linkgroup',desc:'link groups to a community',gc:true,adminOnly:true,fromMe:true,type:'community'},async(m,text) => {
  try { return await changeLinkedGroups(m,text,false); } catch(e) { return m.sendErr(e); }
});
kord({cmd:'unlinkgc|unlinkgroup',desc:'unlink groups from a community',gc:true,adminOnly:true,fromMe:true,type:'community'},async(m,text) => {
  try { return await changeLinkedGroups(m,text,true); } catch(e) { return m.sendErr(e); }
});
kord({cmd:'cinfo|comminfo',desc:'get community information',gc:true,fromMe:wtype,type:'community'},async(m,text) => {
  try {
    let ctx = await communityContext(m,false);
    if (!ctx) return;
    const input = String(text || '').trim();
    if (input) {
      const match = input.match(/^https:\/\/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})(?:\?[^\s]*)?$/i);
      if (!match) return m.send('_Provide a valid WhatsApp community invite link._');
      const invite = await m.client.groupGetInviteInfo(match[1]);
      const chat = invite.linkedParent || invite.id;
      ctx = {chat,meta:await m.client.communityMetadata(chat)};
    }
    const linked = await m.client.communityFetchLinkedGroups(ctx.chat);
    const groups = linked.linkedGroups || [];
    const meta = ctx.meta;
    const lines = ['*COMMUNITY INFORMATION*',`Name: ${meta.subject || 'Unknown'}`,`ID: ${ctx.chat}`,`Members: ${meta.size || meta.participants?.length || 0}`,`Groups: ${groups.length}`];
    if (meta.owner) lines.push(`Owner: @${meta.owner.split('@')[0]}`);
    if (meta.creation) lines.push(`Created: ${new Date(meta.creation * 1000).toLocaleString()}`);
    if (meta.desc) lines.push(`Description: ${meta.desc}`);
    lines.push(...groups.map(g => `${g.subject || 'Group'}: ${g.id || 'Unknown'}`));
    return m.send(lines.join('\n'),{mentions:meta.owner ? [meta.owner] : []});
  } catch(e) { return m.sendErr(e); }
});

function parseDuration(str) {
  const match = String(str || '').match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const duration = Number(match[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2].toLowerCase()];
  return Number.isSafeInteger(duration) && duration > 0 && Number.isSafeInteger(Date.now() + duration) ? duration : null;
}

async function stickerHashes(mediaBuffer) {
  const img = new WebP.Image();
  await img.load(mediaBuffer);
  img.exif = null;
  const normalized = await img.save(null, {});
  return [require('crypto').createHash('sha256').update(normalized).digest('hex'), normalized.toString('hex').slice(0, 50)];
}
async function getStickerHash(mediaBuffer) { return (await stickerHashes(mediaBuffer))[0]; }

// Keep pending database writes serialized across command-folder hot reloads.
const muteRuntime = global.__kordMuteRuntime || (global.__kordMuteRuntime = { queue: Promise.resolve(), timers: new Map() });
const muteTimers = muteRuntime.timers;
for (const handle of muteTimers.values()) clearTimeout(handle);
muteTimers.clear();
function withMuteState(fn) {
  const result = muteRuntime.queue.then(fn);
  muteRuntime.queue = result.catch(() => {});
  return result;
}
function muteList(data, chat) {
  const bl = data[chat] || (data[chat] = {});
  if (!Array.isArray(bl.users)) bl.users = [];
  if (!Array.isArray(bl.stk)) bl.stk = [];
  if (!bl.timers || typeof bl.timers !== 'object') bl.timers = {};
  return bl;
}
function removeMute(bl, key) {
  if (key.startsWith('stk_')) bl.stk = bl.stk.filter(hash => hash !== key.slice(4));
  else bl.users = bl.users.filter(jid => jid !== key);
  delete bl.timers[key];
}
function cancelMuteTimer(chat, key) {
  const id = `${chat}::${key}`;
  clearTimeout(muteTimers.get(id));
  muteTimers.delete(id);
}
function scheduleMuteExpiry(chat, key, expires) {
  const id = `${chat}::${key}`;
  if (muteTimers.has(id)) return;
  const handle = setTimeout(() => {
    muteTimers.delete(id);
    withMuteState(async () => {
      const data = await getData('blacklisted') || {};
      if (!data[chat]) return;
      const bl = muteList(data, chat);
      if (bl.timers[key] !== expires) return;
      if (expires > Date.now()) return scheduleMuteExpiry(chat, key, expires);
      removeMute(bl, key);
      await storeData('blacklisted', data);
    }).catch(e => console.error('mute expiry error', e));
  }, Math.min(2147483647, Math.max(1, expires - Date.now())));
  handle.unref?.();
  muteTimers.set(id, handle);
}
async function refreshMuteTimers(data, chat) {
  const bl = muteList(data, chat);
  let changed = false;
  for (const [key, expires] of Object.entries(bl.timers)) {
    if (!Number.isFinite(expires) || expires <= Date.now()) {
      cancelMuteTimer(chat, key);
      removeMute(bl, key);
      changed = true;
    } else scheduleMuteExpiry(chat, key, expires);
  }
  if (changed) await storeData('blacklisted', data);
  return bl;
}
async function muteAliases(m, jid) {
  const aliases = await communityAliases(m, [jid]);
  const meta = await m.client.groupMetadata(m.chat);
  for (const p of meta.participants || []) {
    const ids = [p.id, p.jid, p.phoneNumber, p.lid].map(normalizeCommunityJid).filter(Boolean);
    if (ids.some(id => aliases.has(id))) ids.forEach(id => aliases.add(id));
  }
  return { aliases, meta };
}
async function changeMute(m, text, unmute) {
  if (!m.isGroup) return m.send('_Group only command._');
  if (!await isBotAdmin(m)) return m.send('_*✘Bot Needs To Be Admin!*_');
  text = String(text || '').trim();
  let duration = null, label = null;
  const timerMatch = text.match(/(?:^|\s)-t\s+(\S+)(?=\s|$)/) || text.match(/(?:^|\s)(\d+[smhd])(?=\s|$)/i);
  if (timerMatch) {
    label = timerMatch[1];
    duration = parseDuration(label);
    if (!duration || unmute) return m.send('_Invalid duration. Use -t 10m, -t 1h, or -t 1d._');
    text = text.replace(timerMatch[0], '').trim();
  } else if (/(?:^|\s)-t(?:\s|$)/.test(text)) return m.send('_Invalid duration. Use -t 10m._');
  const sticker = /(?:^|\s)-s(?=\s|$)/.test(text);
  let user, aliases, hashes;
  if (sticker) {
    if (!m.quoted?.sticker) return m.send(`_reply to the sticker to ${unmute ? 'unmute' : 'mute'}_`);
    hashes = await stickerHashes(await m.quoted.download());
  } else {
    user = communityTarget(m, text);
    if (!user) return m.send('_Reply to, mention, or provide a valid user._');
    const resolved = await muteAliases(m, user);
    aliases = resolved.aliases;
    if (!unmute && communityIsAdmin(resolved.meta, aliases)) return m.send('User is an admin');
  }
  return withMuteState(async () => {
    const data = await getData('blacklisted') || {};
    const bl = await refreshMuteTimers(data, m.chat);
    const matches = sticker ? bl.stk.filter(h => hashes.includes(h)) : bl.users.filter(jid => aliases.has(normalizeCommunityJid(jid)));
    if (unmute) {
      if (!matches.length) return m.send(sticker ? '_sticker is not muted_' : '_User is not muted_');
      for (const value of matches) {
        const key = sticker ? `stk_${value}` : value;
        cancelMuteTimer(m.chat, key);
        removeMute(bl, key);
      }
    } else {
      if (matches.length) return m.send(sticker ? '_sticker is already muted_' : '_User is already muted_');
      const value = sticker ? hashes[0] : user;
      const key = sticker ? `stk_${value}` : value;
      (sticker ? bl.stk : bl.users).push(value);
      cancelMuteTimer(m.chat, key);
      delete bl.timers[key];
      if (duration) bl.timers[key] = Date.now() + duration;
    }
    await storeData('blacklisted', data);
    for (const [key, expires] of Object.entries(bl.timers)) scheduleMuteExpiry(m.chat, key, expires);
    const action = unmute ? 'unmuted' : `muted${duration ? ` for ${label}` : ''}`;
    return m.send(sticker ? `_sticker ${action}_` : `@${user.split('@')[0]} has been ${action}`, sticker ? {} : { mentions: [user] });
  });
}
kord({ cmd: 'mute-user', desc: 'mute a user or sticker; optional -t 10m, -t 1h, -t 1d', fromMe: true, type: 'bot', gc: true, adminOnly: true }, async (m, text) => {
  try { return await changeMute(m, text, false); } catch (e) { return m.sendErr(e); }
});
kord({ cmd: 'unmute-user', desc: 'unmute a user or sticker', fromMe: true, type: 'bot', gc: true, adminOnly: true }, async (m, text) => {
  try { return await changeMute(m, text, true); } catch (e) { return m.sendErr(e); }
});
kord({ on: 'all', fromMe: false }, async m => {
  try {
    if (!m.isGroup || !m.key?.id || m.key.fromMe || m.fromMe || ['protocolMessage', 'reactionMessage', 'pollUpdateMessage', 'pollResultSnapshotMessage'].includes(m.mtype)) return;
    await withMuteState(async () => {
      const data = await getData('blacklisted') || {};
      if (!data[m.chat]) return;
      const bl = await refreshMuteTimers(data, m.chat);
      if (!bl.users.length && !bl.stk.length) return;
      if (!await isBotAdmin(m)) return;
      const sender = m.key.participant || m.sender;
      const { aliases, meta } = await muteAliases(m, sender);
      // Sender aliases must originate from the message or verified mappings, not its quote.
      if (communityIsAdmin(meta, aliases)) return;
      let blocked = bl.users.some(jid => aliases.has(normalizeCommunityJid(jid)));
      if (!blocked && m.sticker && bl.stk.length) {
        const hashes = await stickerHashes(await m.download());
        blocked = bl.stk.some(hash => hashes.includes(hash));
      }
      if (blocked) await m.client.sendMessage(m.chat, { delete: m.key });
    });
  } catch (e) { console.error('mute enforcement error', e); }
});
