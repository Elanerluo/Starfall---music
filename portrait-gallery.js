(()=>{
 let cleanup=null,savedIndex=0;
 window.mountPortraitGallery=()=>{
  cleanup?.();cleanup=null;
  const root=document.querySelector('[data-portrait-gallery]');if(!root)return;
  const cards=Array.from(root.querySelectorAll('[data-portrait-card]'));
  const previous=root.querySelector('[data-portrait-previous]'),next=root.querySelector('[data-portrait-next]');
  const position=root.querySelector('[data-portrait-position]'),status=root.querySelector('[data-portrait-status]');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let index=savedIndex%cards.length,busy=false,disposed=false,queued=0,animations=[];
  function apply(value){
   index=value;savedIndex=value;
   cards.forEach((card,n)=>{card.classList.toggle('is-front',n===index);card.classList.toggle('is-back',n!==index);card.setAttribute('aria-hidden',String(n!==index));});
   root.dataset.portraitIndex=String(index);
   position.textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
  }
  function announce(){status.textContent=`个人照片，第 ${index+1} 张，共 ${cards.length} 张`;}
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
   const front=getComputedStyle(outgoing).transform,back=getComputedStyle(incoming).transform;
   apply(target);
   if(motion.matches||document.body.classList.contains('still')||typeof outgoing.animate!=='function'){finish();return;}
   root.dataset.animating='true';
   const options={duration:260,easing:'ease-out'};
   animations=[
    // Fade the old front away, then put it behind while it is invisible.
    outgoing.animate([{transform:front,opacity:1,zIndex:3},{transform:front,opacity:0,zIndex:3,offset:.58},{transform:back,opacity:0,zIndex:1,offset:.6},{transform:back,opacity:.72,zIndex:1}],options),
    incoming.animate([{transform:front,opacity:0,zIndex:2},{transform:front,opacity:1,zIndex:2}],options)
   ];
   Promise.allSettled(animations.map(animation=>animation.finished)).then(finish);
  }
  const goPrevious=()=>turn(-1),goNext=()=>turn(1);
  function keyboard(event){if(event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();turn(event.key==='ArrowLeft'?-1:1);}}
  function reduce(){if(motion.matches)animations.forEach(animation=>animation.finish());}
  apply(index);announce();
  previous.addEventListener('click',goPrevious);next.addEventListener('click',goNext);root.addEventListener('keydown',keyboard);motion.addEventListener('change',reduce);
  cleanup=()=>{disposed=true;queued=0;animations.forEach(animation=>animation.cancel());previous.removeEventListener('click',goPrevious);next.removeEventListener('click',goNext);root.removeEventListener('keydown',keyboard);motion.removeEventListener('change',reduce);};
 };
})();
