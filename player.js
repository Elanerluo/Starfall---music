(()=>{
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${({play:'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',pause:'<path d="M9 5v14M15 5v14" stroke-width="2.5"/>',previous:'<path d="M5 5v14M19 5 8 12l11 7Z"/>',next:'<path d="M19 5v14M5 5l11 7-11 7Z"/>',sound:'<path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',muted:'<path d="M11 5 6 9H3v6h3l5 4ZM16 9l6 6M22 9l-6 6"/>',queue:'<path d="M4 6h16M4 12h11M4 18h7M19 11v9m-3-3 3 3 3-3"/>',signal:'<path class="signal-bar" d="M4 3v18"/><path class="signal-bar" d="M8 3v18"/><path class="signal-bar" d="M12 3v18"/><path class="signal-bar" d="M16 3v18"/><path class="signal-bar" d="M20 3v18"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'})[name]}</svg>`;
const urlFor=value=>{try{if(!value)return null;const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}};
const orderedWorks=[...(window.portfolioWorks||[])].sort(window.portfolioWorkOrder.byNewest);
const allTracks=orderedWorks.flatMap(work=>{
 const versions=Array.isArray(work.audioVersions)?work.audioVersions.filter(version=>urlFor(version.audio)):[];
 if(versions.length)return versions.map((version,position)=>({...work,...version,waveform:version.waveform||null,id:work.id+':'+version.id,workId:String(work.id),versionId:String(version.id),isDefault:position===0,title:versions.length>1?work.title+' · '+version.label:work.title}));
 return urlFor(work.audio)?[{...work,workId:String(work.id),versionId:'',isDefault:true}]:[];
});
const configuredBackground=window.portfolioMusic?.background;
const hasBackground=!!(configuredBackground?.workId&&configuredBackground?.versionId);
const backgroundTrack=hasBackground?allTracks.find(track=>track.workId===String(configuredBackground.workId)&&track.versionId===String(configuredBackground.versionId)):null;
const backgroundTracks=hasBackground?(backgroundTrack?[backgroundTrack]:[]):null;
let tracks=backgroundTracks||allTracks;
const DEFAULT_VOLUME=.4;
const audio=document.createElement('audio');audio.id='site-audio';audio.preload='auto';audio.controls=false;audio.setAttribute('controlslist','nodownload');
const bar=document.createElement('aside');bar.className='persistent-player';bar.setAttribute('aria-label','全站音乐播放器');
bar.innerHTML=`<div class="player-track"><span class="player-art" aria-hidden="true">≈</span><div><h2 id="player-title">作品录音待收录</h2><p id="player-subtitle">LUO TING / 山海之间</p></div></div><div class="player-controls"><button id="player-prev" aria-label="上一首">Ⅰ‹</button><button id="player-toggle" class="player-toggle" aria-label="播放">▷</button><button id="player-next" aria-label="下一首">›Ⅰ</button></div><div class="player-timeline"><span class="player-time" id="player-elapsed">00:00</span><label class="player-sr" for="player-progress">播放进度</label><input id="player-progress" class="player-progress" type="range" min="0" max="1000" value="0" step="1"><span class="player-time" id="player-duration">00:00</span></div><div class="player-extra"><button id="player-mute" aria-label="静音" aria-pressed="false">♫</button><label class="player-sr" for="player-volume">音量</label><input class="player-volume" id="player-volume" type="range" min="0" max="1" step="0.01" value="${DEFAULT_VOLUME}"><button id="player-queue-toggle" aria-label="播放列表" aria-expanded="false" aria-controls="player-queue">☷</button></div><p class="player-message" role="status" aria-live="polite"></p><section class="player-queue" id="player-queue" aria-label="播放列表" hidden><div class="queue-heading"><span>播放列表 / <span id="queue-count"></span></span><button id="queue-close" aria-label="关闭播放列表">×</button></div><div class="queue-list"></div></section>`;
document.body.append(audio,bar);
// Keep ordinary save/print actions out of the listening controls. This is not DRM.
bar.addEventListener('contextmenu',event=>event.preventDefault());
bar.addEventListener('dragstart',event=>event.preventDefault());
bar.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&['s','p'].includes(event.key.toLowerCase()))event.preventDefault();});
bar.querySelector('.player-art').innerHTML=icon('signal');
bar.querySelector('.player-art').className='player-signal';
bar.querySelector('#player-progress').outerHTML='<span class="waveform-wrap"><canvas id="player-waveform" aria-hidden="true"></canvas><input id="player-progress" class="player-progress" type="range" min="0" max="1000" value="0" step="1" aria-describedby="waveform-status"><span class="player-sr" id="waveform-status" role="status" aria-live="polite"></span></span>';
// Selected "Focus" design: a compact central pulse with quieter side peaks.
// The pale path stays complete; volume clips the dark copy from left to right.
const volumeContour='M2 16L24 16L28 14L31 18L34 13L38 19L42 5L47 27L52 14L55 19L58 15L62 17L66 16L86 16';
bar.querySelector('#player-volume').outerHTML=`<span class="volume-waveform"><svg viewBox="0 0 88 32" preserveAspectRatio="none" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="5" aria-hidden="true" focusable="false"><defs><clipPath id="player-volume-clip" clipPathUnits="userSpaceOnUse"><rect id="player-volume-level" width="${DEFAULT_VOLUME*88}" height="32"/></clipPath></defs><path class="volume-wave-base" d="${volumeContour}" vector-effect="non-scaling-stroke"/><path class="volume-wave-fill" d="${volumeContour}" vector-effect="non-scaling-stroke" clip-path="url(#player-volume-clip)"/></svg><input class="player-volume" id="player-volume" type="range" min="0" max="1" step="0.01" value="${DEFAULT_VOLUME}"><span class="volume-value" aria-hidden="true">${Math.round(DEFAULT_VOLUME*100)}%</span></span>`;
for(const [id,name] of [['player-prev','previous'],['player-next','next'],['player-queue-toggle','queue'],['queue-close','close']])bar.querySelector('#'+id).innerHTML=icon(name);
const waveform=window.createAudioWaveform(document.getElementById('player-waveform'),document.getElementById('waveform-status'));
const get=id=>document.getElementById(id),toggle=get('player-toggle'),previous=get('player-prev'),next=get('player-next'),progress=get('player-progress'),volume=get('player-volume'),queue=get('player-queue'),queueToggle=get('player-queue-toggle'),message=bar.querySelector('.player-message');
let index=-1,lastAudibleVolume=DEFAULT_VOLUME,pendingAutoplay=false,playAttempt=0,autoplayTimer=0;
function cancelAutoplay(){clearTimeout(autoplayTimer);autoplayTimer=0;pendingAutoplay=false;}
const playbackModes=[{id:'random',label:'随机播放',drawing:'<path d="M3 7h3c4 0 5 10 9 10h6m-4-4 4 4-4 4M3 17h3c1.3 0 2.5-1.1 3.6-2.6M14.4 9.6C15.6 8 17 7 19 7h2m-4-4 4 4-4 4"/>'},{id:'single',label:'单曲循环',drawing:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-3v4a3 3 0 0 1-3 3H3m8-8 1-1v6m-1 0h2"/>'},{id:'sequence',label:'顺序播放',drawing:'<path d="M4 6h15m-4-3 4 3-4 3M4 12h12M4 18h15m-4-3 4 3-4 3"/>'}];
let modeIndex=hasBackground?1:0,playHistory=[],historyCursor=-1;
const modeButton=document.createElement('button');modeButton.id='player-mode';modeButton.className='player-mode';modeButton.type='button';modeButton.setAttribute('aria-describedby','player-mode-status');
const modeStatus=document.createElement('span');modeStatus.id='player-mode-status';modeStatus.className='player-sr';modeStatus.setAttribute('role','status');modeStatus.setAttribute('aria-live','polite');
bar.querySelector('.player-timeline').append(modeButton,modeStatus);
function syncMode(announce=false){
 const mode=playbackModes[modeIndex],following=playbackModes[(modeIndex+1)%playbackModes.length];
 audio.loop=mode.id==='single';modeButton.disabled=!tracks.length;modeButton.dataset.mode=mode.id;
 modeButton.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${mode.drawing}</svg>`;
 modeButton.setAttribute('aria-label',`播放模式：${mode.label}，切换为${following.label}`);
 modeButton.title=`${mode.label} · 点击切换为${following.label}`;
 if(announce)modeStatus.textContent='已切换为'+mode.label;
}
modeButton.addEventListener('click',()=>{modeIndex=(modeIndex+1)%playbackModes.length;syncMode(true);});syncMode();
const volumeWave=bar.querySelector('.volume-waveform'),volumeLevel=get('player-volume-level'),volumeValue=bar.querySelector('.volume-value');
function syncVolume(){
 const percent=Math.round(audio.volume*100),silent=audio.muted||audio.volume===0;
 if(audio.volume>0)lastAudibleVolume=audio.volume;
 volume.value=audio.volume;
 volume.setAttribute('aria-valuetext',audio.muted?`已静音，设定音量 ${percent}%`:`${percent}%`);
 volumeLevel.setAttribute('width',silent?0:audio.volume*88);
 volumeValue.textContent=silent?'0%':`${percent}%`;
 volumeWave.title=`${audio.muted?'已静音':`音量 ${percent}%`} · 点击或拖动调节`;
 const mute=get('player-mute');
 mute.setAttribute('aria-pressed',String(silent));
 mute.setAttribute('aria-label',silent?'取消静音':'静音');
 mute.innerHTML=icon(silent?'muted':'sound');
}
const time=seconds=>{if(!Number.isFinite(seconds)||seconds<0)return '00:00';const n=Math.floor(seconds);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
function queueState(open){queue.hidden=!open;queueToggle.setAttribute('aria-expanded',String(open));}
function sync(){const track=tracks[index],ready=Number.isFinite(audio.duration)&&audio.duration>0;toggle.disabled=!tracks.length;previous.disabled=!tracks.length;next.disabled=!tracks.length;volume.disabled=!tracks.length;get('player-mute').disabled=!tracks.length;progress.disabled=!track||!ready;get('player-title').textContent=track?.title||(tracks.length?'选择一部作品，开始聆听':hasBackground?'背景音乐暂不可用':'作品录音待收录');get('player-subtitle').textContent=track?[track.category,track.instrumentation].filter(Boolean).join(' / '):'LUO TING / 山海之间';toggle.innerHTML=icon(audio.paused?'play':'pause');bar.dataset.playing=String(!audio.paused);toggle.setAttribute('aria-label',audio.paused?'播放':'暂停');get('player-elapsed').textContent=time(audio.currentTime);get('player-duration').textContent=time(audio.duration);progress.value=ready?Math.round(audio.currentTime/audio.duration*1000):0;progress.setAttribute('aria-valuetext',time(audio.currentTime)+' / '+time(audio.duration));syncVolume();waveform.update(ready?audio.currentTime/audio.duration:0);bar.querySelectorAll('[data-queue-index]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.queueIndex)===index)));document.querySelectorAll('[data-play-work]').forEach(button=>{const sameVersion=button.dataset.playVersion?track?.versionId===button.dataset.playVersion:track?.isDefault;const active=track&&button.dataset.playWork===track.workId&&sameVersion&&!audio.paused;if(button.dataset.active!==String(!!active)||!button.querySelector('.ui-icon')){button.dataset.active=String(!!active);if(window.motionIcon)button.innerHTML=window.motionIcon(active?'equalizer':'play');else button.textContent=active?'Ⅱ':'▷';}button.setAttribute('aria-label',(active?'暂停':'播放')+(button.dataset.workTitle||''));if(button.dataset.playVersion)button.setAttribute('aria-pressed',String(!!active));});}
async function start(automatic=false){if(!automatic)cancelAutoplay();const attempt=++playAttempt;pendingAutoplay=false;message.textContent='';if(audio.error)audio.load();try{await audio.play();}catch(error){if(attempt!==playAttempt)return;if(error.name!=='AbortError'){pendingAutoplay=automatic&&error.name==='NotAllowedError';message.textContent=error.name==='NotAllowedError'?(automatic?'浏览器限制自动播放，点击播放开启背景音乐。':'请点击播放，开始聆听。'):'音频暂时无法播放，请稍后重试。';}}if(attempt===playAttempt)sync();}
function rememberTrack(position){
 if(playHistory[historyCursor]===position)return;
 playHistory=playHistory.slice(0,historyCursor+1);playHistory.push(position);
 if(playHistory.length>200)playHistory.shift();historyCursor=playHistory.length-1;
}
function selectTrack(position,autoplay=true,automatic=false,remember=true){if(!tracks[position])return;playAttempt++;pendingAutoplay=false;audio.pause();index=position;if(remember)rememberTrack(position);audio.src=urlFor(tracks[index].audio);audio.load();waveform.load(tracks[index]);message.textContent='';sync();if(autoplay)start(automatic);}
function chooseTrack(track){
 const chosen=backgroundTrack&&track.id===backgroundTrack.id?backgroundTracks:allTracks;
 if(tracks!==chosen){tracks=chosen;index=-1;playHistory=[];historyCursor=-1;renderQueue();syncMode();}
 selectTrack(tracks.findIndex(item=>item.id===track.id));
}
function stepTrack(direction){
 cancelAutoplay();if(!tracks.length)return;
 if(playbackModes[modeIndex].id==='random'){
  if(direction<0){
   if(historyCursor>0){historyCursor--;selectTrack(playHistory[historyCursor],true,false,false);return;}
   const position=(index-1+tracks.length)%tracks.length;playHistory.unshift(position);if(playHistory.length>200)playHistory.pop();historyCursor=0;selectTrack(position,true,false,false);return;
  }
  if(historyCursor<playHistory.length-1){historyCursor++;selectTrack(playHistory[historyCursor],true,false,false);return;}
  selectTrack(randomTrack(index));return;
 }
 selectTrack((index+direction+tracks.length)%tracks.length);
}
window.sitePlayer={play(id,versionId){cancelAutoplay();const track=allTracks.find(work=>work.workId===String(id)&&(versionId?work.versionId===String(versionId):work.isDefault));if(!track)return;if(tracks[index]?.id===track.id){if(audio.paused)start();else{playAttempt++;audio.pause();}}else chooseTrack(track);},sync};
toggle.addEventListener('click',()=>{cancelAutoplay();if(index<0)selectTrack(0);else if(audio.paused)start();else{playAttempt++;audio.pause();}});
previous.addEventListener('click',()=>stepTrack(-1));next.addEventListener('click',()=>stepTrack(1));
progress.addEventListener('input',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Number(progress.value)/1000*audio.duration;sync();}});
volume.addEventListener('input',()=>{audio.volume=Number(volume.value);if(audio.volume>0)audio.muted=false;sync();});
get('player-mute').addEventListener('click',()=>{if(audio.muted||audio.volume===0){if(audio.volume===0)audio.volume=lastAudibleVolume;audio.muted=false;}else audio.muted=true;sync();});
queueToggle.addEventListener('click',()=>queueState(queue.hidden));get('queue-close').addEventListener('click',()=>{queueState(false);queueToggle.focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!queue.hidden){queueState(false);queueToggle.focus();}});
document.addEventListener('click',event=>{if(!queue.hidden&&!queue.contains(event.target)&&!queueToggle.contains(event.target))queueState(false);const button=event.target.closest('[data-play-work]');if(button){event.preventDefault();window.sitePlayer.play(button.dataset.playWork,button.dataset.playVersion);}});
const list=bar.querySelector('.queue-list');
function renderQueue(){
 list.replaceChildren();get('queue-count').textContent=tracks.length+' 首';
 if(!tracks.length){const empty=document.createElement('p');empty.textContent=hasBackground?'当前背景音乐暂不可用。可以从作品页选择录音试听。':'尚未上传作品录音。添加音频后，会在这里显示可播放的作品。';list.append(empty);}
 tracks.forEach((work,position)=>{const button=document.createElement('button');button.dataset.queueIndex=position;const title=document.createElement('span');title.textContent=work.title;const meta=document.createElement('small');meta.textContent=work.category||'作品';button.append(title,meta);button.onclick=()=>chooseTrack(work);list.append(button);});
}
renderQueue();
audio.volume=DEFAULT_VOLUME;audio.muted=false;
audio.addEventListener('loadedmetadata',sync);
for(const event of ['play','pause','durationchange','volumechange','seeked'])audio.addEventListener(event,()=>{sync();});
audio.addEventListener('timeupdate',sync);
function randomTrack(except=-1){const count=tracks.length;if(count<=1)return count?0:-1;const pick=Math.floor(Math.random()*(count-(except>=0?1:0)));return except>=0&&pick>=except?pick+1:pick;}
audio.addEventListener('ended',()=>{if(playbackModes[modeIndex].id==='single'){audio.currentTime=0;start();}else stepTrack(1);});
audio.addEventListener('error',()=>{message.textContent='这段录音暂时无法加载，请重试或选择其他作品。';sync();});
document.addEventListener('play',event=>{if(event.target instanceof HTMLVideoElement&&!event.target.hasAttribute('data-background-video')){cancelAutoplay();playAttempt++;message.textContent='';audio.pause();}if(event.target===audio)document.querySelectorAll('video:not([data-background-video])').forEach(video=>video.pause());},true);
document.addEventListener('input',event=>{if(event.target.closest('main'))sync();});
function resumeAutoplay(event){if(!pendingAutoplay||event.defaultPrevented||event.isTrusted===false)return;if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(event.target.closest('.persistent-player,.work-video-heading,.work-video-shell,[data-play-work],video,audio,input,textarea,select,[contenteditable]'))return;start(true);}
document.addEventListener('click',resumeAutoplay,true);document.addEventListener('keydown',resumeAutoplay,true);
audio.addEventListener('play',cancelAutoplay);
if(index<0&&tracks.length){selectTrack(randomTrack(),false);autoplayTimer=setTimeout(()=>{autoplayTimer=0;if(audio.paused)start(true);},5000);}
sync();

// Keep one audio element alive while replacing only the site's page content.
const pageNames=new Set(['index.html','works.html','work.html']);let navigation=0;
const pageName=url=>url.pathname.split('/').pop()||'index.html';
function internal(url){return url.origin===location.origin&&pageNames.has(pageName(url))&&url.pathname.slice(0,url.pathname.lastIndexOf('/')+1)===location.pathname.slice(0,location.pathname.lastIndexOf('/')+1);}
let currentURL=new URL(location.href);
const motionAllowed=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('still');
const curtain=document.createElement('div');
curtain.className='page-curtain';curtain.setAttribute('aria-hidden','true');document.body.append(curtain);
let curtainAnimation=null,navigationRequest=null;
history.scrollRestoration='manual';

// Reuse one curtain so an interrupted navigation always reveals the latest page.
async function fadeCurtain(covered){
 const from=getComputedStyle(curtain).opacity,to=motionAllowed()&&covered?1:0;
 curtain.style.opacity=from;curtainAnimation?.cancel();curtainAnimation=null;
 if(!motionAllowed()||Number(from)===to){curtain.style.opacity=String(to);return;}
 const animation=curtain.animate([{opacity:from},{opacity:to}],{
  duration:covered?180:280,easing:covered?'ease-in':'ease-out',fill:'forwards'
 });
 curtainAnimation=animation;
 try{await animation.finished;}catch{/* A newer navigation takes over the curtain. */}
 if(curtainAnimation===animation){curtain.style.opacity=String(to);animation.cancel();curtainAnimation=null;}
}
function scrollToPage(url,smooth=false){
 let target=null;
 try{target=url.hash?document.getElementById(decodeURIComponent(url.hash.slice(1))):null;}catch{}
 const behavior=smooth&&motionAllowed()?'smooth':'instant';
 if(target)target.scrollIntoView({behavior,block:'start'});else window.scrollTo({top:0,behavior});
}
async function loadPage(url,signal){
 const response=await fetch(url.pathname+url.search,{credentials:'same-origin',signal});
 if(!response.ok)throw Error('Page unavailable');
 const doc=new DOMParser().parseFromString(await response.text(),'text/html');
 if(!doc.querySelector('main')||!doc.querySelector('.site-header')||!doc.querySelector('footer'))throw Error('Invalid page');
 return doc;
}
function finishNavigation(){
 document.documentElement.removeAttribute('aria-busy');
 document.documentElement.classList.remove('is-navigating');
}
async function navigate(url,push=true){
 if(push)window.catalogView?.capture({focusWorkId:pageName(url)==='work.html'?url.searchParams.get('id'):null});
 const serial=++navigation;
 navigationRequest?.abort();navigationRequest=null;
 if(pageName(url)===pageName(currentURL)&&url.search===currentURL.search){
  if(push&&url.href!==currentURL.href)history.pushState({},'',url);
  currentURL=url;
  const restored=pageName(url)==='works.html'&&window.restoreCatalogView?.();
  if(!restored)scrollToPage(url,true);
  await fadeCurtain(false);
  if(serial===navigation)finishNavigation();
  return;
 }
 const request=new AbortController();navigationRequest=request;
 const timeout=setTimeout(()=>request.abort(),10000);
 document.documentElement.setAttribute('aria-busy','true');
 document.documentElement.classList.add('is-navigating');
 try{
  // Fetch during the fade; replace and position the page only under the black curtain.
  const [doc]=await Promise.all([loadPage(url,request.signal),fadeCurtain(true)]);
  if(serial!==navigation)return;
  document.querySelector('.site-header').replaceWith(doc.querySelector('.site-header'));
  document.querySelector('main').replaceWith(doc.querySelector('main'));
  document.querySelector('footer').replaceWith(doc.querySelector('footer'));
  document.body.classList.toggle('inner-page',doc.body.classList.contains('inner-page'));
  document.title=doc.title;
  if(push)history.pushState({},'',url);
  currentURL=url;
  const view=window.renderPortfolio?.();window.bindHomeControls?.();sync();queueState(false);
  document.querySelector('main').classList.remove('page-arrival');
  if(!view?.restoredCatalog)scrollToPage(url);
  const heading=document.querySelector('main h1,main h2');
  if(heading&&!view?.restoredCatalog){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  message.textContent='';
  if(motionAllowed())await new Promise(requestAnimationFrame);
 }catch{
  if(serial!==navigation)return;
  message.textContent='页面暂时无法打开，请稍后重试；音乐继续播放。';
  if(!push)history.replaceState({},'',currentURL);
 }finally{
  clearTimeout(timeout);
  if(serial===navigation){
   navigationRequest=null;
   await fadeCurtain(false);
   if(serial===navigation)finishNavigation();
  }
 }
}
document.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const link=event.target.closest('a[href]');if(!link||link.target||link.hasAttribute('download'))return;const url=new URL(link.href,location.href);if(!internal(url))return;event.preventDefault();navigate(url);});
window.addEventListener('popstate',()=>navigate(new URL(location.href),false));
})();
