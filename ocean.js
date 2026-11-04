(()=>{
let active=null;
function mount(node){
 const media=window.portfolioBackdrop;
 node.dataset.oceanState='static';
 // Keep the poster when no playable background clip is configured.
 if(!media?.video)return ()=>{delete node.dataset.oceanState;};
 const video=document.createElement('video');
 video.className='landscape-video';video.setAttribute('aria-hidden','true');
 video.setAttribute('data-background-video','');video.setAttribute('muted','');video.setAttribute('playsinline','');
 video.muted=true;video.defaultMuted=true;video.volume=0;video.loop=true;video.playsInline=true;
 video.preload='auto';video.poster=new URL(media.poster,document.baseURI).href;
 let disposed=false,visible=true,attempt=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function shouldPlay(){return !disposed&&visible&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('still');}
 function update(){
  if(disposed)return;
  const serial=++attempt;
  if(!shouldPlay()){video.pause();node.dataset.oceanState='paused';return;}
  video.play().catch(()=>{if(!disposed&&serial===attempt){node.classList.remove('ocean-ready');node.dataset.oceanState='static';}});
 }
 function onPlaying(){
  if(!shouldPlay()){video.pause();return;}
  node.classList.add('ocean-ready');node.dataset.oceanState='playing';
 }
 function onError(){node.classList.remove('ocean-ready');node.dataset.oceanState='static';}
 video.addEventListener('playing',onPlaying);video.addEventListener('error',onError);
 const bodyObserver=new MutationObserver(update);bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 const intersectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{rootMargin:'80px'});intersectionObserver.observe(node);
 document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
 video.src=new URL(media.video,document.baseURI).href;node.append(video);update();
 return ()=>{
  disposed=true;attempt++;video.pause();
  bodyObserver.disconnect();intersectionObserver.disconnect();
  document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);
  video.removeEventListener('playing',onPlaying);video.removeEventListener('error',onError);
  video.removeAttribute('src');video.load();video.remove();
  node.classList.remove('ocean-ready');delete node.dataset.oceanState;
 };
}
window.bindOcean=function(){
 const node=document.querySelector('.landscape');
 if(active?.node===node)return;
 active?.destroy();active=null;
 if(node)active={node,destroy:mount(node)};
};
})();
