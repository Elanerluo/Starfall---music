(()=>{
 let cleanup=null,savedIndex=0;
 window.createPhotoGallery=(root,{initialIndex=0,onIndex=()=>{},label='个人照片'}={})=>{
  if(!root)return ()=>{};
  const cards=Array.from(root.querySelectorAll('[data-portrait-card]'));
  const previous=root.querySelector('[data-portrait-previous]'),next=root.querySelector('[data-portrait-next]');
  const position=root.querySelector('[data-portrait-position]'),status=root.querySelector('[data-portrait-status]');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const stage=root.querySelector('.portrait-stage');
  function fitPictures(){
   if(!root.classList.contains('work-photo-gallery'))return;
   cards.forEach(card=>{const image=card.querySelector('img');if(!image.naturalWidth)return;const ratio=image.naturalWidth/image.naturalHeight,width=Math.min(stage.clientWidth,stage.clientHeight*ratio),height=width/ratio;Object.assign(card.style,{width:width+'px',height:height+'px',left:(stage.clientWidth-width)/2+'px',top:(stage.clientHeight-height)/2+'px'});});
  }
  let resize;
  if(root.classList.contains('work-photo-gallery')){cards.forEach(card=>card.querySelector('img').addEventListener('load',fitPictures));resize=new ResizeObserver(fitPictures);resize.observe(stage);fitPictures();}
  let index=initialIndex%cards.length,busy=false,disposed=false,queued=0,animations=[];
  function apply(value,back=(value+1)%cards.length){
   index=value;onIndex(value);
   cards.forEach((card,n)=>{card.classList.toggle('is-front',n===index);card.classList.toggle('is-back',n===back&&n!==index);card.classList.toggle('is-stowed',n!==index&&n!==back);card.setAttribute('aria-hidden',String(n!==index));card.inert=n!==index;});
   root.dataset.portraitIndex=String(index);
   position.textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
  }
  function announce(){status.textContent=`${label}，第 ${index+1} 张，共 ${cards.length} 张`;const caption=root.querySelector('[data-photo-caption]');if(caption)caption.textContent=cards[index].dataset.caption||label;}
  function finish(){
   if(disposed)return;
   animations=[];busy=false;delete root.dataset.animating;announce();
   if(queued){const direction=queued;queued=0;turn(direction);}
  }
  async function turn(direction){
   if(disposed||cards.length<2)return;
   if(busy){queued=(queued+direction)%cards.length;return;}
   busy=true;
   const target=(index+direction+cards.length)%cards.length,outgoing=cards[index],incoming=cards[target];
   const image=incoming.querySelector('img');
   try{if(!image.complete||!image.naturalWidth)await image.decode();}
   catch{if(!disposed){busy=false;queued=0;status.textContent='这张照片暂时无法载入，请稍后重试。';}return;}
   if(disposed)return;
   const front=getComputedStyle(outgoing).transform,back=getComputedStyle(root.querySelector('.is-back')||incoming).transform;
   apply(target,index);
   if(motion.matches||document.body.classList.contains('still')||typeof outgoing.animate!=='function'){finish();return;}
   root.dataset.animating='true';
   const travel=Math.min(root.querySelector('.portrait-stage').clientWidth*.2,80);
   const outSide=`translate(${-direction*travel}px, 2px) rotate(${-direction*7}deg) scale(.94)`;
   const inSide=`translate(${direction*travel*.4}px, -6px) rotate(${direction*2}deg) scale(.96)`;
   const options={duration:680,easing:'cubic-bezier(.22,1,.36,1)'};
   animations=[
    outgoing.animate([{transform:front,opacity:1,zIndex:2},{transform:outSide,opacity:.9,zIndex:2,offset:.43},{transform:outSide,opacity:.75,zIndex:1,offset:.52},{transform:back,opacity:.72,zIndex:1}],options),
    incoming.animate([{transform:back,opacity:.72,zIndex:1},{transform:inSide,opacity:.82,zIndex:1,offset:.43},{transform:inSide,opacity:.9,zIndex:2,offset:.52},{transform:front,opacity:1,zIndex:2}],options)
   ];
   Promise.allSettled(animations.map(animation=>animation.finished)).then(finish);
  }
  const goPrevious=()=>turn(-1),goNext=()=>turn(1);
  function keyboard(event){if(event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();turn(event.key==='ArrowLeft'?-1:1);}}
  function reduce(){if(motion.matches)animations.forEach(animation=>animation.finish());}
  apply(index);announce();
  previous.addEventListener('click',goPrevious);next.addEventListener('click',goNext);root.addEventListener('keydown',keyboard);motion.addEventListener('change',reduce);
  return ()=>{disposed=true;resize?.disconnect();cards.forEach(card=>card.querySelector('img').removeEventListener('load',fitPictures));queued=0;animations.forEach(animation=>animation.cancel());previous.removeEventListener('click',goPrevious);next.removeEventListener('click',goNext);root.removeEventListener('keydown',keyboard);motion.removeEventListener('change',reduce);};
 };
 window.mountPortraitGallery=()=>{
  cleanup?.();cleanup=null;
  cleanup=window.createPhotoGallery(document.querySelector('[data-portrait-gallery]'),{initialIndex:savedIndex,onIndex:value=>savedIndex=value});
 };
})();
