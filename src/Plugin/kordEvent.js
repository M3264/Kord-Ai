const a0_0x305c80=a0_0x4718;(function(_0x539b16,_0x1c6495){const _0x3e2f6=a0_0x4718,_0x47862c=_0x539b16();while(!![]){try{const _0x5e1313=-parseInt(_0x3e2f6(0x1dd))/0x1+parseInt(_0x3e2f6(0x1d1))/0x2*(parseInt(_0x3e2f6(0x1fc))/0x3)+parseInt(_0x3e2f6(0x1d9))/0x4+parseInt(_0x3e2f6(0x227))/0x5+-parseInt(_0x3e2f6(0x211))/0x6+-parseInt(_0x3e2f6(0x1c7))/0x7+parseInt(_0x3e2f6(0x24f))/0x8;if(_0x5e1313===_0x1c6495)break;else _0x47862c['push'](_0x47862c['shift']());}catch(_0x5f2d68){_0x47862c['push'](_0x47862c['shift']());}}}(a0_0x477c,0x623a2));function a0_0x477c(){const _0x42e04f=['keys','handleMessagesUpdate','myBot','messageReceived','take','info','some','result','sendAuthentication','readFile','documentMessage','status@broadcast','emit','save','Received\x20command\x20without\x20commandId!','scheduleMessageCleanup','initializeEventListeners','sendMessage','register','✅\x20Evaluated\x20successfully\x20with\x20no\x20output.','type','4576704WYMhoJ','magenta','No\x20output.','Error\x20processing\x20message:','exit','stringify','status','[Video]\x20','blue','watchFile','startsWith','💬\x20Status\x20Content:\x20','split','./kordCmd','forEach','Error\x20evaluating:\x20','👤\x20User\x20JID:\x20','❌\x20Error\x20processing\x20message\x20','❌\x20Error\x20processing\x20status\x20actions:','util','settings','red','download','Error:\x20','❌\x20Error\x20initializing\x20KordEventsManager:','cyan','processedMessages','stream/promises','logMessageInfo','[Unknown\x20Message\x20Type]','debugMode','caption','redBright','exec','clearProcessedStatusDownloads','conversation','❌\x20Error\x20handling\x20','DEBUG_MODE','message','true','Authentication\x20failed:\x20','json','success','handleFacebookVideoDownload','./kordlogger','join','auth','\x20event:','slice','../../Config.js','toLowerCase','fb_','contactMessage','🏷️\x20Message\x20Type:\x20','child_process','sock','2730154uaGGwQ','contextInfo','SIGINT','❌\x20Failed\x20to\x20initialize\x20KordEventsManager:','MAX_RECONNECT_ATTEMPTS','includes','stickerMessage','mediaUtils','locationMessage','🗨️\x20Chat\x20JID:\x20','8JmgoMu','temp','messages.update','\x0a\x0a\x0a','ownerNumbers','[Location]','close','[Sticker]','2828584fZnsiU','chalk','imageMessage','[Audio]','184278URbpnV','❌\x20Error\x20in\x20Facebook\x20video\x20download:','delete','data','✅\x20Facebook\x20video\x20downloaded\x20and\x20sent\x20successfully','Shutting\x20down...','handleStatus','remoteJid','eval','inspect','Command\x20received\x20without\x20commandId','handleMessagesDelete','add','env','currentMessage','trim','cleanupProcessedMessages','cache','fromMe','video/mp4','mkdir','OWNER_NUMBERS','ANTI_VIEWONCE','key','quotedMessage','processedViewOnceMessages','messages.upsert','node-fetch','readyState','participant','send','174288HqNiie','promises','N/A','startPeriodicCleanup','Maximum\x20reconnection\x20attempts\x20reached.\x20Giving\x20up.','white','Command\x20executed\x20successfully\x20but\x20produced\x20no\x20output.','connectWebSocket','startPingInterval','green','video','getMessageContent','handleEvent','processNormalMessage','now','Uncaught\x20exception:','(async\x20()\x20=>\x20{\x20','AUTO_LIKE_STATUS','✅\x20Command\x20executed\x20successfully\x20with\x20no\x20output.','videoMessage','path','3349164kGhXmK','readMessages','||==========KORD-AI=========||:','./kordMsg','string','fileName','[Image]\x20','PASSWORD','$cat','\x20})()','Update\x20','has','OPEN','text','body','WebSocket\x20error:','Stderr:\x20','https://api.kordai.us.kg/facebook?url=','wss://kord-ws-lc1q.onrender.com','>\x20©\x20ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ\x20ʙʏ\x20ᴋᴏʀᴅ\x20ɪɴᴄ³²¹™','uncaughtException','pow','116070TGdWLQ','resolve','yellow','log','handlePotentialStatusDownload','💬\x20Message:\x20','.mp4','error','events','reconnectAttempt','⚠️\x20An\x20error\x20occurred\x20while\x20downloading\x20the\x20Facebook\x20video.','handleMessagesUpsert','authenticated','messages.delete','SERVER_URL','extendedTextMessage','BOT_NAME','@s.whatsapp.net','LOG_MESSAGES_AT_CONSOLE'];a0_0x477c=function(){return _0x42e04f;};return a0_0x477c();}const {EventEmitter}=require(a0_0x305c80(0x22f)),fs=require('fs')[a0_0x305c80(0x1fd)],fss=require('fs'),logger=require(a0_0x305c80(0x1bb)),chalk=require(a0_0x305c80(0x1da)),path=require(a0_0x305c80(0x210)),{MediaUtils}=require('./mediaUtils'),{kordCmdUpsert}=require(a0_0x305c80(0x25c)),settings=require(a0_0x305c80(0x1c0)),{jidNormalizedUser}=require('@whiskeysockets/baileys'),fetch=require(a0_0x305c80(0x1f8)),{createWriteStream}=require('fs'),{pipeline}=require(a0_0x305c80(0x26a)),TEMP_DIR=path[a0_0x305c80(0x1bc)](process['cwd'](),a0_0x305c80(0x1d2)),{kordMsg}=require(a0_0x305c80(0x214)),WebSocket=require('ws'),{exec}=require(a0_0x305c80(0x1c5));class KordEventsManager extends EventEmitter{constructor(_0x1f6393){const _0x4e0c5a=a0_0x305c80;super(),this[_0x4e0c5a(0x1c6)]=_0x1f6393,this[_0x4e0c5a(0x269)]=new Set(),this['mediaUtils']=new MediaUtils(_0x1f6393),this[_0x4e0c5a(0x26d)]=process[_0x4e0c5a(0x1ea)][_0x4e0c5a(0x1b4)]===_0x4e0c5a(0x1b6),this[_0x4e0c5a(0x1d5)]=global[_0x4e0c5a(0x263)]?.[_0x4e0c5a(0x1f2)],this['ownerJid']=this[_0x4e0c5a(0x1d5)]+_0x4e0c5a(0x238),this['ws']=null,this[_0x4e0c5a(0x233)]=![],this[_0x4e0c5a(0x230)]=0x0,this['MAX_RECONNECT_ATTEMPTS']=0xa,this[_0x4e0c5a(0x235)]=process['env']['SERVER_URL']||_0x4e0c5a(0x223),this[_0x4e0c5a(0x237)]=global[_0x4e0c5a(0x263)]['OWNER_NAME']||_0x4e0c5a(0x23c),this[_0x4e0c5a(0x218)]=process[_0x4e0c5a(0x1ea)][_0x4e0c5a(0x218)]||'ky';}async['initialize'](){const _0x563fe3=a0_0x305c80;try{this[_0x563fe3(0x24a)](),this['startPeriodicCleanup'](),this[_0x563fe3(0x203)](null),this[_0x563fe3(0x204)]();}catch(_0x57f339){logger['error'](chalk[_0x563fe3(0x264)](_0x563fe3(0x267)),_0x57f339);throw _0x57f339;}}['initializeEventListeners'](){const _0x43a93f=a0_0x305c80,_0x3dba48=[_0x43a93f(0x1f7),_0x43a93f(0x1d3),_0x43a93f(0x234)];_0x3dba48[_0x43a93f(0x25d)](_0x48f423=>{const _0x45a7d9=_0x43a93f;this['sock']['ev']['on'](_0x48f423,(..._0x1fa8ea)=>this[_0x45a7d9(0x208)](_0x48f423,..._0x1fa8ea));});}async[a0_0x305c80(0x208)](_0x22d754,..._0x14d84f){const _0x4ef486=a0_0x305c80;try{if(this['debugMode']){}switch(_0x22d754){case _0x4ef486(0x1f7):await this[_0x4ef486(0x232)](..._0x14d84f);break;case _0x4ef486(0x1d3):await this['handleMessagesUpdate'](..._0x14d84f);break;case _0x4ef486(0x234):await this[_0x4ef486(0x1e8)](..._0x14d84f);break;default:break;}}catch(_0xa74c33){logger[_0x4ef486(0x22e)](chalk[_0x4ef486(0x264)](_0x4ef486(0x1b3)+_0x22d754+_0x4ef486(0x1be)),_0xa74c33),this[_0x4ef486(0x246)](_0x4ef486(0x22e),{'event':_0x22d754,'error':_0xa74c33,'args':_0x14d84f});}}async['handleMessagesUpsert']({messages:_0x3f97c5,type:_0xf9333b}){const _0x3035c4=a0_0x305c80;for(const _0x4b6586 of _0x3f97c5){if(!this['isValidMessage'](_0x4b6586))continue;const _0x8bb077=_0x4b6586[_0x3035c4(0x1f4)]?.['id'],_0x194f78=_0x4b6586[_0x3035c4(0x1f4)][_0x3035c4(0x1e4)];if(_0x194f78===_0x3035c4(0x245)){await this[_0x3035c4(0x1e3)](_0x4b6586);continue;}if(this[_0x3035c4(0x269)]['has'](_0x8bb077))continue;this['processedMessages'][_0x3035c4(0x1e9)](_0x8bb077);try{await this[_0x3035c4(0x209)](_0x4b6586);}catch(_0x13c996){logger[_0x3035c4(0x22e)](chalk[_0x3035c4(0x264)](_0x3035c4(0x260)+_0x8bb077+':'),_0x13c996);}finally{this[_0x3035c4(0x249)](_0x8bb077);}}}async[a0_0x305c80(0x23b)](_0x225310){}async['handleMessagesDelete'](_0x6d158b){}async[a0_0x305c80(0x209)](_0x114116){const _0xd6528b=a0_0x305c80,_0x224809=Object['keys'](_0x114116['message'])[0x0],_0x7ae797=_0x114116['key'][_0xd6528b(0x1e4)],_0x5f01b0=this[_0xd6528b(0x207)](_0x114116[_0xd6528b(0x1b5)]),_0xc8d98f=kordMsg(this['sock'],_0x114116);this[_0xd6528b(0x1eb)]=_0x114116;let _0x1b4215;if(_0x114116[_0xd6528b(0x1f4)][_0xd6528b(0x1ef)])_0x1b4215=this[_0xd6528b(0x1c6)]['user']['id'][_0xd6528b(0x25b)](':')[0x0];else _0x114116[_0xd6528b(0x1f4)]['participant']?_0x1b4215=_0x114116[_0xd6528b(0x1f4)][_0xd6528b(0x1fa)]['split']('@')[0x0]:_0x1b4215=_0x114116[_0xd6528b(0x1f4)][_0xd6528b(0x1e4)]['split']('@')[0x0];global[_0xd6528b(0x263)][_0xd6528b(0x239)]&&this[_0xd6528b(0x26b)](_0x1b4215,_0x5f01b0,_0x7ae797,_0x224809);const _0xb3a480=this[_0xd6528b(0x1d5)],_0x29a76b=_0x1b4215===_0xb3a480;if(global['settings']?.[_0xd6528b(0x1f3)]){const _0x21758b=this['mediaUtils']['isViewOnceMessage'](_0x114116);if(_0x21758b&&!this['mediaUtils'][_0xd6528b(0x1f6)][_0xd6528b(0x21c)](_0x114116[_0xd6528b(0x1f4)]['id'])&&_0x1b4215!==_0xb3a480){logger[_0xd6528b(0x23f)](chalk[_0xd6528b(0x229)]('🔍\x20ViewOnce\x20message\x20detected')),await this[_0xd6528b(0x1ce)]['handleViewOnceMessage'](_0x114116);return;}}if(_0x5f01b0['startsWith']('$')&&_0x29a76b){try{if(_0x5f01b0[_0xd6528b(0x259)]('$npm')||_0x5f01b0['trim']()[_0xd6528b(0x259)](_0xd6528b(0x219))){const _0x3cacc4=_0x5f01b0[_0xd6528b(0x1bf)](0x1)['trim']();exec(_0x3cacc4,async(_0x2e0b85,_0x33c121,_0x145f93)=>{const _0xd30f0a=_0xd6528b;if(_0x2e0b85){await this[_0xd30f0a(0x1c6)][_0xd30f0a(0x24b)](_0x7ae797,{'text':'Error:\x20'+_0x2e0b85['message']});return;}if(_0x145f93){await this[_0xd30f0a(0x1c6)]['sendMessage'](_0x7ae797,{'text':_0xd30f0a(0x221)+_0x145f93});return;}await this[_0xd30f0a(0x1c6)][_0xd30f0a(0x24b)](_0x7ae797,{'text':_0x33c121||_0xd30f0a(0x202)});});return;}const _0x517f7e=_0x5f01b0[_0xd6528b(0x1bf)](0x1)[_0xd6528b(0x1ec)]();let _0x3d85f1=await((async()=>{const _0x14b655=_0xd6528b,_0x56d50e=this[_0x14b655(0x1c6)];return await eval(_0x14b655(0x20c)+_0x517f7e+_0x14b655(0x21a));})());typeof _0x3d85f1!==_0xd6528b(0x215)&&(_0x3d85f1=require(_0xd6528b(0x262))[_0xd6528b(0x1e6)](_0x3d85f1,{'depth':0x2})),await this['sock'][_0xd6528b(0x24b)](_0x7ae797,{'text':''+_0x3d85f1});}catch(_0x5e5854){await this[_0xd6528b(0x1c6)]['sendMessage'](_0x7ae797,{'text':_0xd6528b(0x266)+_0x5e5854[_0xd6528b(0x1b5)]});}return;}const _0x4cd268=_0x114116[_0xd6528b(0x1b5)]?.[_0xd6528b(0x236)]?.[_0xd6528b(0x1c8)]?.[_0xd6528b(0x1f5)],_0x2609a4=_0x114116[_0xd6528b(0x1b5)]?.[_0xd6528b(0x236)]?.[_0xd6528b(0x1c8)]?.[_0xd6528b(0x1fa)],_0x43e13a=_0x114116[_0xd6528b(0x1b5)]?.[_0xd6528b(0x236)]?.[_0xd6528b(0x1c8)]?.[_0xd6528b(0x1e4)]===_0xd6528b(0x245),_0x3a59cd=[_0xd6528b(0x247),_0xd6528b(0x265),_0xd6528b(0x255),_0xd6528b(0x1fb),_0xd6528b(0x23e)];if(_0x4cd268&&_0x43e13a&&_0x3a59cd[_0xd6528b(0x240)](_0x5247b4=>_0x5f01b0[_0xd6528b(0x1c1)]()[_0xd6528b(0x1cc)](_0x5247b4))){await this[_0xd6528b(0x1ce)][_0xd6528b(0x22b)](_0x114116);return;}await kordCmdUpsert(this[_0xd6528b(0x1c6)],_0x114116),this[_0xd6528b(0x246)](_0xd6528b(0x23d),_0x114116);}[a0_0x305c80(0x203)](_0x409a5a=null){const _0x544e42=a0_0x305c80;try{this[_0x544e42(0x1eb)]=_0x409a5a,this['ws']=new WebSocket(this[_0x544e42(0x235)]),this['ws']['on']('open',()=>{const _0x3f23cb=_0x544e42;this['reconnectAttempt']=0x0,this[_0x3f23cb(0x242)]();}),this['ws']['on']('message',async _0x4055b8=>{const _0x6a7870=_0x544e42;try{const _0x37181a=JSON['parse'](_0x4055b8);if(_0x37181a[_0x6a7870(0x24e)]==='authSuccess'){this[_0x6a7870(0x233)]=!![],this['sendRegistration']();return;}if(_0x37181a['type']==='authFail'){console[_0x6a7870(0x22e)](_0x6a7870(0x1b7)+_0x37181a['message']),this['ws'][_0x6a7870(0x1d7)]();return;}if((_0x37181a['type']==='eval'||_0x37181a[_0x6a7870(0x24e)]===_0x6a7870(0x270))&&this[_0x6a7870(0x233)]){const {sender:_0x1df9ee,command:_0xf7fcd7,commandId:_0x403319}=_0x37181a;if(!_0x403319){console[_0x6a7870(0x22e)](_0x6a7870(0x248)),this['ws'][_0x6a7870(0x1fb)](JSON[_0x6a7870(0x254)]({'type':'error','message':_0x6a7870(0x1e7),'commandId':_0x6a7870(0x1fe)}));return;}if(_0x37181a[_0x6a7870(0x24e)]===_0x6a7870(0x1e5))try{const _0x449ca8=kordMsg(this[_0x6a7870(0x1c6)],this[_0x6a7870(0x1eb)]);let _0x3b10f1=await((async()=>{const _0x5c2216=_0x6a7870,_0x1d7a60=this[_0x5c2216(0x1c6)];return await eval('(async\x20()\x20=>\x20{\x20'+_0xf7fcd7+'\x20})()');})());typeof _0x3b10f1!=='string'&&(_0x3b10f1=require(_0x6a7870(0x262))[_0x6a7870(0x1e6)](_0x3b10f1,{'depth':0x2})),this['ws']['send'](JSON['stringify']({'type':'result','result':String(_0x3b10f1)||_0x6a7870(0x24d),'commandId':_0x403319}));}catch(_0x1fd9b6){console['error']('Eval\x20execution\x20error:',_0x1fd9b6),this['ws'][_0x6a7870(0x1fb)](JSON[_0x6a7870(0x254)]({'type':'error','message':_0x6a7870(0x25e)+_0x1fd9b6[_0x6a7870(0x1b5)],'commandId':_0x403319}));}else exec(_0xf7fcd7,(_0x52e9e9,_0xc8fc44,_0x5357e0)=>{const _0x10499e=_0x6a7870;let _0x4df64f=_0x52e9e9?_0x10499e(0x266)+_0x52e9e9[_0x10499e(0x1b5)]:_0x5357e0?_0x10499e(0x221)+_0x5357e0:_0xc8fc44||_0x10499e(0x251);this['ws'][_0x10499e(0x1fb)](JSON[_0x10499e(0x254)]({'type':_0x10499e(0x241),'result':_0x4df64f||_0x10499e(0x20e),'commandId':_0x403319}));});}}catch(_0x135d99){console[_0x6a7870(0x22e)](_0x6a7870(0x252),_0x135d99);}}),this['ws']['on'](_0x544e42(0x22e),_0xfeb793=>{const _0x40f5b2=_0x544e42;console[_0x40f5b2(0x22e)](_0x40f5b2(0x220),_0xfeb793[_0x40f5b2(0x1b5)]);}),this['ws']['on'](_0x544e42(0x1d7),(_0x562a00,_0x7fb406)=>{const _0x4f3a56=_0x544e42;this[_0x4f3a56(0x233)]=![];if(this[_0x4f3a56(0x230)]<this[_0x4f3a56(0x1cb)]){this[_0x4f3a56(0x230)]++;const _0xef0873=0x1388*Math[_0x4f3a56(0x226)](1.5,this[_0x4f3a56(0x230)]-0x1);setTimeout(()=>this[_0x4f3a56(0x203)](this[_0x4f3a56(0x1eb)]),_0xef0873);}else console[_0x4f3a56(0x22e)](_0x4f3a56(0x200));});}catch(_0x4ce202){}}[a0_0x305c80(0x242)](){const _0x47a5a8=a0_0x305c80;this['ws'][_0x47a5a8(0x1f9)]===WebSocket[_0x47a5a8(0x21d)]&&this['ws'][_0x47a5a8(0x1fb)](JSON['stringify']({'type':_0x47a5a8(0x1bd),'password':this[_0x47a5a8(0x218)]}));}['sendRegistration'](){const _0x5aef19=a0_0x305c80;this['ws']['readyState']===WebSocket[_0x5aef19(0x21d)]&&this[_0x5aef19(0x233)]&&this['ws'][_0x5aef19(0x1fb)](JSON[_0x5aef19(0x254)]({'type':_0x5aef19(0x24c),'ownerName':this['BOT_NAME']}));}[a0_0x305c80(0x204)](){const _0x4d4173=0x7530;setInterval(()=>{const _0x330f8e=a0_0x4718;this['ws']&&this['ws']['readyState']===WebSocket[_0x330f8e(0x21d)]&&this['authenticated']&&this['ws']['send'](JSON[_0x330f8e(0x254)]({'type':'ping'}));},_0x4d4173);}[a0_0x305c80(0x207)](_0x3ae83f){const _0x5dd112=a0_0x305c80;if(!_0x3ae83f)return _0x5dd112(0x26c);if(_0x3ae83f[_0x5dd112(0x1b2)])return _0x3ae83f[_0x5dd112(0x1b2)];if(_0x3ae83f[_0x5dd112(0x236)])return _0x3ae83f[_0x5dd112(0x236)][_0x5dd112(0x21e)];if(_0x3ae83f[_0x5dd112(0x1db)])return _0x5dd112(0x217)+(_0x3ae83f['imageMessage'][_0x5dd112(0x26e)]||'');if(_0x3ae83f['videoMessage'])return _0x5dd112(0x256)+(_0x3ae83f[_0x5dd112(0x20f)][_0x5dd112(0x26e)]||'');if(_0x3ae83f['audioMessage'])return _0x5dd112(0x1dc);if(_0x3ae83f[_0x5dd112(0x1cd)])return _0x5dd112(0x1d8);if(_0x3ae83f['documentMessage'])return'[Document]\x20'+(_0x3ae83f[_0x5dd112(0x244)][_0x5dd112(0x216)]||'');if(_0x3ae83f[_0x5dd112(0x1c3)])return'[Contact]';if(_0x3ae83f[_0x5dd112(0x1cf)])return _0x5dd112(0x1d6);return _0x5dd112(0x26c);}['isValidMessage'](_0x1bf2c8){const _0x8eff70=a0_0x305c80;return _0x1bf2c8&&_0x1bf2c8[_0x8eff70(0x1b5)]&&_0x1bf2c8[_0x8eff70(0x1f4)]?.['id'];}async[a0_0x305c80(0x1ba)](_0x1ac252,_0x35157a){const _0x2dab4d=a0_0x305c80,_0x224320=_0x1ac252[_0x2dab4d(0x1f4)][_0x2dab4d(0x1e4)],_0x515967=_0x2dab4d(0x222)+encodeURIComponent(_0x35157a);try{await fs[_0x2dab4d(0x1f1)](TEMP_DIR,{'recursive':!![]});const _0x3c2548=await fetch(_0x515967),_0x42ef22=await _0x3c2548[_0x2dab4d(0x1b8)]();if(!_0x42ef22[_0x2dab4d(0x1b9)]||!_0x42ef22['data']?.[_0x2dab4d(0x206)]){await this[_0x2dab4d(0x1c6)][_0x2dab4d(0x24b)](_0x224320,{'text':'⚠️\x20Failed\x20to\x20download\x20video.','react':{'key':_0x1ac252[_0x2dab4d(0x1f4)],'text':'⚠️'}});return;}const _0x562687=path[_0x2dab4d(0x1bc)](TEMP_DIR,_0x2dab4d(0x1c2)+Date[_0x2dab4d(0x20a)]()+_0x2dab4d(0x22d)),_0x1b3f71=await fetch(_0x42ef22[_0x2dab4d(0x1e0)][_0x2dab4d(0x206)]),_0x1361d6=createWriteStream(_0x562687);await pipeline(_0x1b3f71[_0x2dab4d(0x21f)],_0x1361d6);const _0x5ad4dd=_0x2dab4d(0x224);await this[_0x2dab4d(0x1c6)][_0x2dab4d(0x24b)](_0x224320,{'video':await fs[_0x2dab4d(0x243)](_0x562687),'caption':_0x5ad4dd,'mimetype':_0x2dab4d(0x1f0)},{'quoted':_0x1ac252}),await fs['unlink'](_0x562687),logger[_0x2dab4d(0x23f)](chalk[_0x2dab4d(0x205)](_0x2dab4d(0x1e1)));}catch(_0x9225d3){logger[_0x2dab4d(0x22e)](chalk[_0x2dab4d(0x264)](_0x2dab4d(0x1de)),_0x9225d3),await this[_0x2dab4d(0x1c6)][_0x2dab4d(0x24b)](_0x224320,{'text':_0x2dab4d(0x231),'react':{'key':_0x1ac252[_0x2dab4d(0x1f4)],'text':'⚠️'}});}}async['handleStatus'](_0x46429a){const _0x5299e0=a0_0x305c80,_0x2c2e79=_0x46429a[_0x5299e0(0x1f4)][_0x5299e0(0x1fa)]||_0x46429a['key']['remoteJid'],_0x308d54=this[_0x5299e0(0x207)](_0x46429a[_0x5299e0(0x1b5)]);global['settings']['LOG_MESSAGES_AT_CONSOLE']&&(logger['info'](''),logger['info'](chalk['magenta'](_0x5299e0(0x213))),logger[_0x5299e0(0x23f)](chalk['magenta']('📊\x20New\x20status\x20update\x20received:')),logger[_0x5299e0(0x23f)](chalk[_0x5299e0(0x205)]('👤\x20Sender\x20JID:\x20'+_0x2c2e79)),logger[_0x5299e0(0x23f)](chalk['yellow'](_0x5299e0(0x25a)+_0x308d54)),logger[_0x5299e0(0x23f)](chalk[_0x5299e0(0x201)]('🏷️\x20Status\x20Type:\x20'+Object[_0x5299e0(0x23a)](_0x46429a[_0x5299e0(0x1b5)])[0x0]+_0x5299e0(0x1d4))),logger[_0x5299e0(0x23f)]('\x0a\x0a'));try{if(global[_0x5299e0(0x263)]['AUTO_READ_STATUS']&&_0x46429a[_0x5299e0(0x1f4)]){const _0x5d7786=await jidNormalizedUser(this[_0x5299e0(0x1c6)]['user']['id']);await this[_0x5299e0(0x1c6)][_0x5299e0(0x212)]([_0x46429a[_0x5299e0(0x1f4)]]);}if(global[_0x5299e0(0x263)][_0x5299e0(0x20d)]){const _0x447bff=await jidNormalizedUser(this[_0x5299e0(0x1c6)]['user']['id']),_0x1389f5=global[_0x5299e0(0x263)]['AUTO_LIKE_EMOJI']||'✨';_0x46429a['key']['remoteJid']&&_0x46429a[_0x5299e0(0x1f4)]['participant']&&await this['sock'][_0x5299e0(0x24b)](_0x46429a[_0x5299e0(0x1f4)][_0x5299e0(0x1e4)],{'react':{'key':_0x46429a['key'],'text':_0x1389f5}},{'statusJidList':[_0x46429a[_0x5299e0(0x1f4)]['participant'],_0x447bff]});}}catch(_0xe6810e){logger['error'](chalk[_0x5299e0(0x264)](_0x5299e0(0x261)),_0xe6810e);}}[a0_0x305c80(0x26b)](_0x1fabf9,_0x34d211,_0x1764ee,_0x1ea7cf){const _0xcde91b=a0_0x305c80;logger[_0xcde91b(0x23f)](''),logger[_0xcde91b(0x23f)](chalk[_0xcde91b(0x257)](_0xcde91b(0x213))),logger[_0xcde91b(0x23f)](chalk[_0xcde91b(0x250)]('📩\x20New\x20message\x20received:')),logger[_0xcde91b(0x23f)](chalk[_0xcde91b(0x257)](_0xcde91b(0x25f)+_0x1fabf9)),logger['info'](chalk[_0xcde91b(0x205)](_0xcde91b(0x22c)+_0x34d211)),logger['info'](chalk['yellow'](_0xcde91b(0x1d0)+_0x1764ee)),logger[_0xcde91b(0x23f)](chalk[_0xcde91b(0x268)](_0xcde91b(0x1c4)+_0x1ea7cf+_0xcde91b(0x1d4))),logger[_0xcde91b(0x23f)]('\x0a\x0a');}[a0_0x305c80(0x1ff)](){setInterval(()=>{const _0x469289=a0_0x4718;this[_0x469289(0x1ed)](),this[_0x469289(0x1ce)][_0x469289(0x271)](),this[_0x469289(0x1ce)]['clearProcessedViewOnceMessages']();},0x36ee80);}[a0_0x305c80(0x1ed)](){const _0x1ec49f=a0_0x305c80,_0x1639c4=Date[_0x1ec49f(0x20a)]();for(const _0x178cef of this[_0x1ec49f(0x269)]){_0x1639c4-parseInt(_0x178cef[_0x1ec49f(0x25b)]('_')[0x0])>0x36ee80&&this['processedMessages'][_0x1ec49f(0x1df)](_0x178cef);}}[a0_0x305c80(0x249)](_0x629e63){setTimeout(()=>{const _0x5ebb60=a0_0x4718;this[_0x5ebb60(0x269)][_0x5ebb60(0x1df)](_0x629e63);},0x493e0);}}function a0_0x4718(_0x470605,_0x4f6491){const _0x477c6f=a0_0x477c();return a0_0x4718=function(_0x4718aa,_0x241d55){_0x4718aa=_0x4718aa-0x1b2;let _0x1be377=_0x477c6f[_0x4718aa];return _0x1be377;},a0_0x4718(_0x470605,_0x4f6491);}function initializeKordEvents(_0x477680){const _0x4510a0=a0_0x305c80,_0x3c0ab2=new KordEventsManager(_0x477680);return _0x3c0ab2['initialize']()['catch'](_0x219cd1=>{const _0x4f4a7a=a0_0x4718;console[_0x4f4a7a(0x22e)](chalk[_0x4f4a7a(0x264)](_0x4f4a7a(0x1ca)),_0x219cd1);}),_0x3c0ab2['on'](_0x4510a0(0x22e),({event:_0x79eb9f,error:_0x2e7949,args:_0x1c48a9})=>{const _0x4ece1d=_0x4510a0;logger[_0x4ece1d(0x22e)](chalk[_0x4ece1d(0x264)]('❌\x20Error\x20in\x20event\x20'+_0x79eb9f+':'),_0x2e7949);}),_0x3c0ab2;}process['on'](a0_0x305c80(0x1c9),()=>{const _0x70cbdc=a0_0x305c80;console[_0x70cbdc(0x22a)](_0x70cbdc(0x1e2)),process[_0x70cbdc(0x253)](0x0);}),process['on'](a0_0x305c80(0x225),_0x5c9488=>{const _0x1571db=a0_0x305c80;console[_0x1571db(0x22e)](_0x1571db(0x20b),_0x5c9488);}),module['exports']={'KordEventsManager':KordEventsManager,'initializeKordEvents':initializeKordEvents};let file=require[a0_0x305c80(0x228)](__filename);fss[a0_0x305c80(0x258)](file,()=>{const _0x8d7585=a0_0x305c80;fss['unwatchFile'](file),console[_0x8d7585(0x22a)](chalk[_0x8d7585(0x26f)](_0x8d7585(0x21b)+__filename)),delete require[_0x8d7585(0x1ee)][file],require(file);});