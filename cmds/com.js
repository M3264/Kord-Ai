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

kord({   
  cmd: "mute-user",   
  desc: "mute a user or a sticker. Use -t <duration> for timed mute (e.g. -t 10m, -t 1h)",   
  fromMe: true,   
  type: "bot",   
  gc: true,   
  adminOnly: true, 
}, async (m, text) => {   
  var botAd = await isBotAdmin(m);   
  if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");    

  var _b = await getData("blacklisted") || {};   
  if (!_b[m.chat]) _b[m.chat] = { users: [], stk: [], timers: {} };   
  if (!_b[m.chat].timers) _b[m.chat].timers = {};    
  let bl = _b[m.chat];    

  let duration = null;   
  let durationLabel = null;    

  const timerMatch = text.match(/-t\s*(\d+[smhd])/);   
  if (timerMatch) {     
    durationLabel = timerMatch[1];     
    duration = parseDuration(durationLabel);     
    text = text.replace(timerMatch[0], '').trim();   
  } else {     
    const bareMatch = text.match(/\b(\d+[smhd])(\s|$)/);     
    if (bareMatch) {       
      durationLabel = bareMatch[1];       
      duration = parseDuration(durationLabel);       
      text = text.replace(bareMatch[0], '').trim();     
    }   
  }    


  if (text.includes("-s")) {     
    if (!m.quoted?.sticker) return await m.send("_reply to the sticker to mute_");     
    
    var hash = await getStickerHash(await m.quoted.download());
    if (bl.stk.includes(hash)) return await m.send("_sticker is already muted_");      
    bl.stk.push(hash);      

    if (duration) {       
      const timerKey = `${m.chat}::stk_${hash}`;       
      if (muteTimers.has(timerKey)) clearTimeout(muteTimers.get(timerKey));       
      
      bl.timers[`stk_${hash}`] = Date.now() + duration;       
      const handle = setTimeout(async () => {         
        muteTimers.delete(timerKey);         
        var _fresh = await getData("blacklisted") || {};         
        if (!_fresh[m.chat]) return;         
        _fresh[m.chat].stk = (_fresh[m.chat].stk || []).filter(h => h !== hash);         
        delete _fresh[m.chat].timers?.[`stk_${hash}`];         
        await storeData("blacklisted", _fresh);         
        await m.send(`_sticker auto-unmuted after timer_`);       
      }, duration);       
      muteTimers.set(timerKey, handle);     
    }      
    await storeData("blacklisted", _b);     
    return await m.send(duration ? `_sticker muted for ${durationLabel}_` : "_sticker muted_");   
  }    


  let input = m.mentionedJid?.[0] || m.quoted?.sender || text;   
  if (!input) return await m.send('need user...');   
  let user = (input.includes('@') ? input.split('@')[0] : input).replace(/\D/g, '') + '@s.whatsapp.net';   
  
  if (await isadminn(m, user)) return await m.send("User is an admin");   
  if (bl.users.includes(user)) return await m.send("_User is already muted_");    

  bl.users.push(user);    

  if (duration) {     
    const timerKey = `${m.chat}::${user}`;     
    if (muteTimers.has(timerKey)) clearTimeout(muteTimers.get(timerKey));     
    
    bl.timers[user] = Date.now() + duration;     
    const handle = setTimeout(async () => {       
      muteTimers.delete(timerKey);       
      var _fresh = await getData("blacklisted") || {};       
      if (!_fresh[m.chat]) return;       
      _fresh[m.chat].users = (_fresh[m.chat].users || []).filter(u => u !== user);       
      delete _fresh[m.chat].timers?.[user];       
      await storeData("blacklisted", _fresh);       
      await m.send(`@${user.split("@")[0]} has been auto-unmuted`, { mentions: [user] });     
    }, duration);     
    muteTimers.set(timerKey, handle);   
  }    
  await storeData("blacklisted", _b);   
  return await m.send(duration ? `@${user.split("@")[0]} has been muted for ${durationLabel}` : `@${user.split("@")[0]} has been muted`, { mentions: [user] }); 
});   

kord({   
  cmd: "unmute-user",   
  desc: "unmute a user or sticker",   
  fromMe: true,   
  type: "bot",   
  gc: true,   
  adminOnly: true, 
}, async (m, text) => {   
  var botAd = await isBotAdmin(m);   
  if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");    

  var _b = await getData("blacklisted") || {};   
  if (!_b[m.chat]) return await m.send("_no one muted here_");    

  let bl = _b[m.chat];   
  if (!bl.timers) bl.timers = {};    

  if (text.includes("-s")) {     
    if (!m.quoted?.sticker) return await m.send("_reply to the sticker to unmute_");     
    
    var hash = await getStickerHash(await m.quoted.download());     
    if (!bl.stk.includes(hash)) return await m.send("_sticker is not muted_");      

    const timerKey = `${m.chat}::stk_${hash}`;     
    if (muteTimers.has(timerKey)) clearTimeout(muteTimers.get(timerKey));      

    bl.stk = bl.stk.filter(h => h !== hash);     
    delete bl.timers[`stk_${hash}`];     
    await storeData("blacklisted", _b);     
    return await m.send("_sticker unmuted_");   
  }    

  let input = m.mentionedJid?.[0] || m.quoted?.sender || text;   
  if (!input) return await m.send('need user...');   
  let user = (input.includes('@') ? input.split('@')[0] : input).replace(/\D/g, '') + '@s.whatsapp.net';   
  
  if (!bl.users.includes(user)) return await m.send("_User is not muted_");    

  const timerKey = `${m.chat}::${user}`;   
  if (muteTimers.has(timerKey)) clearTimeout(muteTimers.get(timerKey));    

  bl.users = bl.users.filter(u => u !== user);   
  delete bl.timers[user];   
  await storeData("blacklisted", _b);   
  return await m.send(`@${user.split("@")[0]} has been unmuted`, { mentions: [user] }); 
});  
