(()=>{
const icon=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
window.enhanceWorkVideo=(video,area,title)=>{
 const make=(tag,className)=>{const node=document.createElement(tag);node.className=className;return node;};
 const events=new AbortController(),shell=make('div','work-video-shell'),placeholder=make('div','work-video-placeholder');
 const heading=make('div','work-video-heading'),toggle=make('button','work-video-button'),status=make('p','work-video-status');
 const toolbar=make('div','work-video-float-toolbar'),caption=make('span','work-video-float-title'),back=make('button','work-video-button'),close=make('button','work-video-button');
 toggle.type=back.type=close.type='button';
 toggle.innerHTML=icon('<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="6" height="5" rx=".5" fill="currentColor" stroke="none"/>');
 back.innerHTML=icon('<path d="M9 4H4v5m11 11h5v-5M4 4l6 6m10 10-6-6"/>');
 close.innerHTML=icon('<path d="m6 6 12 12M18 6 6 18"/>');
 back.setAttribute('aria-label','返回页面');back.title='返回页面，继续播放';
 close.setAttribute('aria-label','关闭悬浮窗');close.title='关闭悬浮窗并暂停';
 caption.textContent=title;toolbar.hidden=true;toolbar.append(caption,back,close);
 placeholder.hidden=true;placeholder.textContent='视频正在小窗中播放';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 heading.append(area.querySelector('.media-label'),toggle);
 const stage=make('div','work-video-stage'),controls=make('div','work-video-controls'),row=make('div','work-video-control-row');
 const play=make('button','work-video-control'),clock=make('span','work-video-clock'),mute=make('button','work-video-control'),volume=make('input','work-video-volume'),fullscreen=make('button','work-video-control'),more=make('button','work-video-control work-video-more'),seek=make('input','work-video-seek');
 const menu=make('div','work-video-menu'),mainMenu=make('div','work-video-menu-main'),rateMenu=make('div','work-video-menu-rates'),speed=make('button','work-video-menu-item'),pip=make('button','work-video-menu-item'),rateBack=make('button','work-video-menu-item'),rateButtons=[];
 for(const button of [play,mute,fullscreen,more,speed,pip,rateBack])button.type='button';
 more.innerHTML=icon('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>');more.setAttribute('aria-label','视频更多选项');more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-controls','work-video-menu');
 menu.id='work-video-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','视频选项');menu.hidden=true;rateMenu.hidden=true;
 speed.setAttribute('role','menuitem');pip.setAttribute('role','menuitem');rateBack.setAttribute('role','menuitem');rateBack.textContent='‹ 返回';
 pip.innerHTML=toggle.innerHTML+'<span>画中画</span>';pip.setAttribute('aria-label','画中画');
 for(const rate of [.5,.75,1,1.25,1.5,2]){const button=make('button','work-video-menu-item');button.type='button';button.setAttribute('role','menuitemradio');button.dataset.rate=String(rate);button.textContent=rate===1?'正常速度':rate+' 倍';rateButtons.push(button);}
 rateMenu.append(rateBack,...rateButtons);mainMenu.append(speed,pip);menu.append(mainMenu,rateMenu);
 seek.type=volume.type='range';seek.min='0';seek.max='1000';seek.step='1';seek.value='0';seek.setAttribute('aria-label','视频播放进度');
 volume.min='0';volume.max='1';volume.step='.01';volume.setAttribute('aria-label','视频音量');
 row.append(play,clock,mute,volume,fullscreen,more);controls.append(row,seek);
 area.insertBefore(heading,video);area.insertBefore(placeholder,video);area.insertBefore(shell,video);stage.append(video,controls,menu);shell.append(toolbar,stage);area.append(status);
 video.playsInline=true;
 const nativeSupported=!!document.pictureInPictureEnabled&&typeof video.requestPictureInPicture==='function';
 // Hide the browser's non-working menu item when the API is unavailable.
 if(!nativeSupported)video.disablePictureInPicture=true;
 let mode='none',disposed=false,pending=false,attempt=0,timer=null,observer=null;
 const listen=(target,name,handler,options={})=>target.addEventListener(name,handler,{...options,signal:events.signal});
 function clearTimer(){clearTimeout(timer);timer=null;}
 function sync(){area.dataset.pipMode=mode;toggle.disabled=pip.disabled=pending;toggle.setAttribute('aria-pressed',String(mode!=='none'));const label=mode==='none'?'画中画':mode==='inline'?'返回页面':'退出画中画';toggle.setAttribute('aria-label',label);pip.setAttribute('aria-label',label);pip.innerHTML=toggle.innerHTML+'<span>'+label+'</span>';toggle.title=mode==='none'?'画中画':mode==='inline'?'返回页面，继续播放':'退出画中画';}
 const time=value=>{const seconds=Math.max(0,Math.floor(Number.isFinite(value)?value:0));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};
 function syncMedia(){
  const ready=Number.isFinite(video.duration)&&video.duration>0,progress=ready?Math.max(0,Math.min(1,video.currentTime/video.duration)):0,silent=video.muted||video.volume===0;
  play.innerHTML=icon(video.paused?'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>':'<path d="M9 5v14M15 5v14" stroke-width="2.5"/>');play.setAttribute('aria-label',video.paused?'播放视频':'暂停视频');
  clock.textContent=time(video.currentTime)+' / '+time(video.duration);seek.disabled=!ready;seek.value=String(Math.round(progress*1000));seek.setAttribute('aria-valuetext',time(video.currentTime)+' / '+time(video.duration));seek.style.background=`linear-gradient(to right,#fff ${progress*100}%,#ffffff59 ${progress*100}%)`;
  mute.innerHTML=icon(silent?'<path d="M11 5 6 9H3v6h3l5 4ZM16 9l6 6M22 9l-6 6"/>':'<path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8"/>');mute.setAttribute('aria-label',silent?'取消视频静音':'视频静音');volume.value=String(video.volume);volume.setAttribute('aria-valuetext',silent?'已静音':Math.round(video.volume*100)+'%');
  const expanded=document.fullscreenElement===stage;fullscreen.innerHTML=icon(expanded?'<path d="M8 3v5H3m18 0h-5V3M3 16h5v5m8 0v-5h5"/>':'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>');fullscreen.setAttribute('aria-label',expanded?'退出视频全屏':'视频全屏');fullscreen.disabled=typeof stage.requestFullscreen!=='function'&&typeof video.webkitEnterFullscreen!=='function';
  speed.textContent='播放速度 · '+(video.playbackRate===1?'正常':video.playbackRate+' 倍');for(const button of rateButtons)button.setAttribute('aria-checked',String(Number(button.dataset.rate)===video.playbackRate));
 }
 function closeMenu(focus=false){menu.hidden=true;mainMenu.hidden=false;rateMenu.hidden=true;more.setAttribute('aria-expanded','false');if(focus)more.focus();}
 function toggleMenu(){if(!menu.hidden){closeMenu();return;}menu.hidden=false;mainMenu.hidden=false;rateMenu.hidden=true;more.setAttribute('aria-expanded','true');speed.focus();}
 function togglePlay(){if(video.paused)video.play().catch(()=>{status.textContent='视频暂时无法播放，请再试一次。';});else video.pause();}
 function position(){const player=document.querySelector('.persistent-player');shell.style.bottom=(Math.max(0,player?.getBoundingClientRect().height||0)+16)+'px';}
 function resume(wasPlaying){if(wasPlaying)video.play().catch(()=>{if(!disposed)status.textContent='请点击小窗中的播放按钮继续。';});}
 function exitNative(){if(document.pictureInPictureElement===video&&typeof document.exitPictureInPicture==='function')return document.exitPictureInPicture();return Promise.resolve();}
 function floatInline(){
  if(disposed)return;
  attempt++;pending=false;clearTimer();
  if(mode==='inline')return;
  const wasPlaying=!video.paused;
  placeholder.style.height=shell.getBoundingClientRect().height+'px';placeholder.hidden=false;
  mode='inline';shell.classList.add('is-floating');toolbar.hidden=false;document.body.append(shell);position();
  const player=document.querySelector('.persistent-player');
  if(typeof ResizeObserver==='function'&&player){observer?.disconnect();observer=new ResizeObserver(position);observer.observe(player);}
  sync();status.textContent='已开启网页悬浮窗，可边看视频边读谱。';resume(wasPlaying);back.focus({preventScroll:true});
 }
 function restore(pause=false){
  attempt++;pending=false;clearTimer();observer?.disconnect();observer=null;
  if(mode!=='inline')return;
  const wasPlaying=!video.paused&&!pause;if(pause)video.pause();
  mode='none';shell.classList.remove('is-floating');shell.style.bottom='';toolbar.hidden=true;
  area.insertBefore(shell,placeholder);placeholder.hidden=true;sync();status.textContent=pause?'悬浮窗已关闭。':'已返回页面。';resume(wasPlaying);toggle.focus({preventScroll:true});
 }
 async function toggleMode(){
  if(pending||disposed)return;
  if(document.fullscreenElement===stage)document.exitFullscreen().catch(()=>{});
  if(mode==='inline'){restore();return;}
  if(mode==='native'){attempt++;try{await exitNative();}catch{status.textContent='请使用系统小窗上的关闭按钮退出。';}return;}
  if(!video.videoWidth||video.readyState===0){status.textContent='请先播放视频，再开启画中画。';return;}
  if(!nativeSupported){floatInline();return;}
  const request=++attempt;pending=true;sync();
  // Some embedded browsers expose PiP but never complete the request.
  timer=setTimeout(()=>{if(!disposed&&pending&&request===attempt)floatInline();},1500);
  try{
   await video.requestPictureInPicture();
   if(disposed||request!==attempt||mode==='inline'){exitNative().catch(()=>{});return;}
   pending=false;clearTimer();mode='native';sync();status.textContent='已开启系统画中画。';
  }catch{
   if(!disposed&&request===attempt)floatInline();
  }
 }
 listen(toggle,'click',toggleMode);listen(back,'click',()=>restore());listen(close,'click',()=>restore(true));
 listen(play,'click',togglePlay);listen(video,'click',togglePlay);listen(more,'click',toggleMenu);
 listen(pip,'click',()=>{closeMenu();toggleMode();});
 listen(speed,'click',()=>{mainMenu.hidden=true;rateMenu.hidden=false;rateBack.focus();});listen(rateBack,'click',()=>{mainMenu.hidden=false;rateMenu.hidden=true;speed.focus();});
 for(const button of rateButtons)listen(button,'click',()=>{video.playbackRate=Number(button.dataset.rate);syncMedia();closeMenu(true);});
 listen(mute,'click',()=>{if(video.muted||video.volume===0){if(video.volume===0)video.volume=1;video.muted=false;}else video.muted=true;syncMedia();});
 listen(volume,'input',()=>{video.volume=Number(volume.value);if(video.volume>0)video.muted=false;syncMedia();});
 listen(seek,'input',()=>{if(Number.isFinite(video.duration)&&video.duration>0){video.currentTime=Number(seek.value)/1000*video.duration;syncMedia();}});
 listen(fullscreen,'click',async()=>{try{if(document.fullscreenElement===stage)await document.exitFullscreen();else if(typeof stage.requestFullscreen==='function')await stage.requestFullscreen();else video.webkitEnterFullscreen();}catch{status.textContent='当前浏览器无法打开视频全屏。';}});
 for(const event of ['loadedmetadata','timeupdate','play','pause','durationchange','volumechange','ratechange','ended'])listen(video,event,syncMedia);
 listen(document,'fullscreenchange',syncMedia);listen(document,'click',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!more.contains(event.target))closeMenu();});
 listen(video,'enterpictureinpicture',()=>{if(disposed||mode==='inline'){exitNative().catch(()=>{});return;}pending=false;clearTimer();mode='native';sync();status.textContent='已开启系统画中画。';});
 listen(video,'leavepictureinpicture',()=>{if(mode!=='native')return;attempt++;pending=false;clearTimer();mode='none';sync();status.textContent='已返回页面。';});
 listen(window,'resize',()=>{if(mode==='inline')position();});
 listen(document,'keydown',event=>{
  if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopImmediatePropagation();closeMenu(true);return;}
  if(event.key==='Escape'&&mode==='inline'&&!document.fullscreenElement){event.preventDefault();event.stopImmediatePropagation();restore();return;}
  if(!menu.hidden&&menu.contains(event.target)&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const items=mainMenu.hidden?[rateBack,...rateButtons]:[speed,pip],current=items.indexOf(document.activeElement);const next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowUp'?-1:1)+items.length)%items.length;items[next].focus();}
 },{capture:true});
 more.setAttribute('aria-expanded','false');video.controls=false;syncMedia();sync();
 return ()=>{
  disposed=true;attempt++;pending=false;clearTimer();observer?.disconnect();events.abort();video.pause();exitNative().catch(()=>{});shell.remove();placeholder.remove();heading.remove();status.remove();
 };
};
})();
