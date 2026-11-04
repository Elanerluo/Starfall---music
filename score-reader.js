(()=>{
const assets=new URL('.',document.currentScript.src);
const geometry=window.portfolioScoreLayout;
let library,active;
const glyph=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${({document:'<path d="M14 3H6v18h12V7Z"/><path d="M14 3v5h4M9 12h6M9 16h4"/>',previous:'<path d="m14 7-5 5 5 5"/>',next:'<path d="m10 7 5 5-5 5"/>',minus:'<path d="M6 12h12"/>',plus:'<path d="M6 12h12M12 6v12"/>',single:'<path d="M6 3h12v18H6ZM9 8h6M9 12h6M9 16h4"/>',spread:'<path d="M2 4h9v16H2ZM13 4h9v16h-9M5 8h3M5 12h3M16 8h3M16 12h3"/>',expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',collapse:'<path d="M3 8h5V3M21 8h-5V3M8 21v-5H3M16 21v-5h5"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>'})[name]}</svg>`;
function pdfLibrary(){
 return library??=import(new URL('vendor/pdfjs/pdf.min.mjs',assets).href).then(pdf=>{
  pdf.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.mjs',assets).href;
  return pdf;
 }).catch(error=>{library=null;throw error;});
}
window.unmountScoreReader=()=>{active?.();active=null;};
window.mountScoreReader=(root,{url,title,demo=false})=>{
 window.unmountScoreReader();
 root.dataset.scoreState='empty';
 root.innerHTML=`<div class="score-heading"><div><p class="eyebrow">03 / SCORE</p><h2>随声阅读</h2></div><p>让声音与音符，一同展开。</p></div>
 <div class="score-reader" role="region" aria-label="PDF 乐谱阅读器">
  <div class="score-toolbar"><div class="score-document-title">${glyph('document')}<span class="score-filename"></span></div><div class="score-navigation"><div class="score-pagination"><button type="button" data-previous aria-label="上一页" title="上一页">${glyph('previous')}</button><label><input data-page type="number" min="1" value="1" inputmode="numeric" aria-label="乐谱页码"><span class="score-page-end" data-page-end hidden></span><span class="score-page-divider">/</span><span data-total>—</span></label><button type="button" data-next aria-label="下一页" title="下一页">${glyph('next')}</button></div><span class="score-tool-divider" aria-hidden="true"></span><div class="score-zoom"><button type="button" data-out aria-label="缩小乐谱" title="缩小">${glyph('minus')}</button><select data-zoom aria-label="乐谱缩放"><option value="width">适合宽度</option><option value="page">整页显示</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="2">200%</option></select><button type="button" data-in aria-label="放大乐谱" title="放大">${glyph('plus')}</button></div></div><div class="score-tools"><button type="button" class="score-view-toggle" data-view-mode aria-label="切换为双页横向阅读" title="切换为双页横向阅读" aria-pressed="false">${glyph('single')}<span>单页</span></button><button type="button" data-reader-theme title="切换氛围" aria-label="切换氛围">${glyph('sun')}</button><button type="button" data-focus aria-label="专注读谱" title="专注读谱" aria-pressed="false">${glyph('expand')}</button></div><span class="score-progress" aria-hidden="true"></span></div>
  <p class="score-status" role="status" aria-live="polite"></p>
  <form class="score-password" hidden><label>PDF 打开密码 <input type="password" autocomplete="off" required></label><button type="submit">打开乐谱</button></form>
  <div class="score-viewport" tabindex="0" aria-label="乐谱页面，可滚动阅读"><div class="score-empty"><span aria-hidden="true">♮</span><h3>等待展开的乐谱</h3><p>这部作品的乐谱尚未收录。</p></div></div>
  <div class="score-footer"><span class="score-reader-note">${demo?'<span data-demo-note>演示文档 · 非本曲乐谱</span>':'滚动阅读 · ← → 翻页'}</span><span class="score-access"><i aria-hidden="true"></i>在线阅览</span></div>
 </div>`;
 const get=selector=>root.querySelector(selector);
 const viewport=get('.score-viewport'),pageInput=get('[data-page]'),total=get('[data-total]'),zoom=get('[data-zoom]'),status=get('.score-status'),filename=get('.score-filename'),focusButton=get('[data-focus]'),themeButton=get('[data-reader-theme]');
 const previous=get('[data-previous]'),next=get('[data-next]'),zoomIn=get('[data-in]'),zoomOut=get('[data-out]'),passwordForm=get('.score-password'),viewButton=get('[data-view-mode]'),pageEnd=get('[data-page-end]');
 const controls=[previous,next,pageInput,zoom,zoomIn,zoomOut,viewButton];
 let disposed=false,request=0,revision=0,loadingTask,documentPDF,renderTask,intersection,rendering=false,queue=new Set(),nodes=[],spreads=[],pagesHost,pageNumber=1,base={width:595,height:842},scale=1,frame=0,layoutFrame=0,playerObserver,savedScroll,updatePassword;
 let viewMode=window.portfolioScoreView==='spread'?'spread':'single',wheelFrame=0,wheelTarget=0;
 const sizes=new Map();
 filename.textContent=title+' · 乐谱';
 function syncView(){
  root.dataset.scoreView=viewMode;const horizontal=viewMode==='spread';
  viewButton.innerHTML=glyph(horizontal?'spread':'single')+'<span>'+(horizontal?'双页':'单页')+'</span>';
  viewButton.setAttribute('aria-pressed',String(horizontal));
  const label=horizontal?'当前双页横向，切换为单页竖向阅读':'当前单页竖向，切换为双页横向阅读';viewButton.setAttribute('aria-label',label);viewButton.title=label;
  zoom.options[0].textContent=horizontal?'适合双页':'适合宽度';
  viewport.setAttribute('aria-label',horizontal?'乐谱双页横向阅读，滚轮向下查看后页':'乐谱单页竖向阅读');
  if(!demo)get('.score-reader-note').textContent=horizontal?'滚轮向下看后页 · ← → 翻页':'竖向滚动 · ← → 翻页';
 }
 function ready(value){controls.forEach(control=>control.disabled=!value);if(value){previous.disabled=pageNumber<=1;next.disabled=pageNumber+(viewMode==='spread'?1:0)>=documentPDF.numPages;}}
 syncView();
 ready(false);
 function cancelWheel(){cancelAnimationFrame(wheelFrame);wheelFrame=0;}
 function cancelPages(){cancelWheel();revision++;intersection?.disconnect();renderTask?.cancel();queue.clear();}
 function unload(){cancelPages();loadingTask?.destroy().catch(()=>{});loadingTask=null;documentPDF=null;sizes.clear();nodes=[];spreads=[];pagesHost=null;passwordForm.hidden=true;updatePassword=null;}
 function setPage(number){
  if(!documentPDF)return;
  pageNumber=geometry.firstPage(number,documentPDF.numPages,viewMode);
  const last=Math.min(documentPDF.numPages,pageNumber+(viewMode==='spread'?1:0));
  pageEnd.hidden=last===pageNumber;pageEnd.textContent='–'+last;
  root.style.setProperty('--score-progress',`${last/documentPDF.numPages*100}%`);
  pageInput.value=pageNumber;ready(true);
 }
 function jump(number){
  if(!documentPDF)return;
  cancelWheel();
  setPage(number);
  const horizontal=viewMode==='spread',target=horizontal?spreads[Math.floor((pageNumber-1)/2)]:nodes[pageNumber-1];
  viewport.scrollTo({top:horizontal?0:target.offsetTop,left:horizontal?target.offsetLeft:0,behavior:'instant'});
 }
 function pageFromScroll(){
  frame=0;
  if(!nodes.length)return;
  const horizontal=viewMode==='spread',bounds=viewport.getBoundingClientRect();
  const leading=horizontal?bounds.left+Math.min(100,viewport.clientWidth/4):bounds.top+Math.min(100,viewport.clientHeight/4);
  const candidates=horizontal?spreads:nodes;
  const node=candidates.find(node=>node.getBoundingClientRect()[horizontal?'right':'bottom']>leading)||candidates.at(-1);
  if(document.activeElement!==pageInput)setPage(Number(horizontal?node.dataset.firstPage:node.dataset.page));
 }
 async function drain(){
  if(rendering||disposed)return;
  rendering=true;
  while(queue.size&&!disposed){
   const node=queue.values().next().value;queue.delete(node);
   const version=revision,pdf=documentPDF;
   if(!node.isConnected||node.dataset.near!=='true'||node.childElementCount||!pdf)continue;
   try{
    const number=Number(node.dataset.page),page=await pdf.getPage(number);
    if(disposed||version!==revision||!node.isConnected||node.dataset.near!=='true')continue;
    const natural=page.getViewport({scale:1}),before=sizes.get(number)||base;sizes.set(number,natural);
    if(Math.abs(before.width-natural.width)>.1||Math.abs(before.height-natural.height)>.1){resize();continue;}
    const view=page.getViewport({scale});
    node.style.width=view.width+'px';node.style.height=view.height+'px';
    const canvas=document.createElement('canvas');
    const density=Math.max(.5,Math.min(devicePixelRatio||1,2,Math.sqrt(12000000/(view.width*view.height))));
    canvas.width=Math.ceil(view.width*density);canvas.height=Math.ceil(view.height*density);
    canvas.style.width=view.width+'px';canvas.style.height=view.height+'px';
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${title}，第 ${number} 页，共 ${pdf.numPages} 页`);
    const task=page.render({canvas,canvasContext:canvas.getContext('2d'),viewport:view,transform:[density,0,0,density,0,0],background:'#fff'});renderTask=task;
    await task.promise;
    if(disposed||version!==revision||!node.isConnected||node.dataset.near!=='true')continue;
    node.replaceChildren(canvas);node.dataset.rendered='true';
   }catch(error){
    if(disposed||version!==revision||error.name==='RenderingCancelledException')continue;
    root.dataset.scoreState='error';status.textContent='这一页暂时无法显示，请尝试缩放或刷新页面。';
   }
  }
  rendering=false;
 }
 function layout(){
  layoutFrame=0;
  if(disposed||!documentPDF)return;
  const keep=pageNumber;
  cancelPages();
  const horizontal=viewMode==='spread',pageSizes=nodes.map((node,index)=>sizes.get(index+1)||base);
  scale=geometry.fitScale({mode:viewMode,zoom:zoom.value,width:viewport.clientWidth,height:viewport.clientHeight,pages:pageSizes});
  viewport.classList.toggle('score-horizontal',horizontal);pagesHost.replaceChildren();spreads=[];
  nodes.forEach((node,index)=>{
   const size=sizes.get(index+1)||base;
   node.replaceChildren();delete node.dataset.rendered;
   node.style.width=size.width*scale+'px';node.style.height=size.height*scale+'px';
  });
  if(horizontal){
   for(const {first,last} of geometry.groups(documentPDF.numPages)){
    const spread=document.createElement('div');spread.className='score-spread';spread.dataset.firstPage=first;
    spread.style.width=Math.max(viewport.clientWidth-48,pageSizes.slice(first-1,last).reduce((sum,size)=>sum+size.width*scale,0)+(last>first?12:0))+'px';
    spread.append(...nodes.slice(first-1,last));pagesHost.append(spread);spreads.push(spread);
   }
  }else pagesHost.append(...nodes);
  const version=revision;
  intersection=new IntersectionObserver(entries=>{
   if(version!==revision||disposed)return;
   for(const {target,isIntersecting} of entries){
    target.dataset.near=String(isIntersecting);
    if(isIntersecting){if(!target.childElementCount)queue.add(target);}
    else{queue.delete(target);target.replaceChildren();delete target.dataset.rendered;}
   }
   drain();
  },{root:viewport,rootMargin:horizontal?'0px 600px':'600px 0px'});
  nodes.forEach(node=>intersection.observe(node));
  jump(keep);
 }
 async function openPDF(source,name){
  const serial=++request;
  unload();ready(false);pageNumber=1;pageInput.value=1;total.textContent='—';
  root.dataset.scoreState='loading';root.style.setProperty('--score-progress','0%');
  filename.textContent=name;status.textContent='正在打开乐谱…';viewport.setAttribute('aria-busy','true');viewport.replaceChildren();
  try{
   const pdf=await pdfLibrary();
   if(disposed||serial!==request)return;
   const task=pdf.getDocument({url:source,cMapUrl:new URL('vendor/pdfjs/cmaps/',assets).href,cMapPacked:true,standardFontDataUrl:new URL('vendor/pdfjs/standard_fonts/',assets).href,wasmUrl:new URL('vendor/pdfjs/wasm/',assets).href,isEvalSupported:false});
   loadingTask=task;
   task.onPassword=(callback,reason)=>{if(disposed||serial!==request)return;updatePassword=callback;passwordForm.hidden=false;status.textContent=reason===2?'密码不正确，请重试。':'这份 PDF 需要打开密码。';passwordForm.querySelector('input').focus();};
   const loaded=await task.promise;
   if(disposed||serial!==request)return;
   documentPDF=loaded;passwordForm.hidden=true;
   const first=await loaded.getPage(1);
   if(disposed||serial!==request)return;
   base=first.getViewport({scale:1});sizes.set(1,base);
   const fragment=document.createDocumentFragment();
   nodes=Array.from({length:loaded.numPages},(_,index)=>{
    const node=document.createElement('div');node.className='score-page';node.dataset.page=index+1;
    node.setAttribute('aria-label',`第 ${index+1} 页`);fragment.append(node);return node;
   });
   pagesHost=document.createElement('div');pagesHost.className='score-pages';pagesHost.append(fragment);viewport.append(pagesHost);total.textContent=loaded.numPages;pageInput.max=loaded.numPages;
   root.dataset.scoreState='ready';viewport.removeAttribute('aria-busy');status.textContent=`已打开，共 ${loaded.numPages} 页。滚动阅读，或输入页码跳转。`;
   zoom.value='width';ready(true);layout();
  }catch(error){
   if(disposed||serial!==request)return;
   viewport.removeAttribute('aria-busy');passwordForm.hidden=true;
   root.dataset.scoreState='error';status.textContent=error.name==='InvalidPDFException'?'这份乐谱暂时无法解析，请稍后重试。':'乐谱暂时无法打开，请稍后重试。';
   ready(false);
  }
 }
 function resize(){cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(layout);}
 function focusMode(enabled){
  focusButton.setAttribute('aria-pressed',String(enabled));focusButton.innerHTML=glyph(enabled?'collapse':'expand');focusButton.setAttribute('aria-label',enabled?'退出专注':'专注读谱');focusButton.title=enabled?'退出专注 · Esc':'专注读谱';
  if(enabled){
   savedScroll={top:window.scrollY,left:window.scrollX};root.classList.add('score-focused');document.body.classList.add('score-reading');
   const player=document.querySelector('.persistent-player');
   const reserve=()=>root.style.setProperty('--score-player-height',(player?.getBoundingClientRect().height||114)+'px');reserve();
   if(player){playerObserver=new ResizeObserver(reserve);playerObserver.observe(player);}
  }else{
   root.classList.remove('score-focused');document.body.classList.remove('score-reading');playerObserver?.disconnect();
   if(savedScroll)window.scrollTo({...savedScroll,behavior:'instant'});
  }
  resize();
 }
 function stepZoom(factor){
  const value=String(Math.round(Math.max(.25,Math.min(3,scale*factor))*100)/100);
  if(![...zoom.options].some(option=>option.value===value)){zoom.querySelector('[data-custom]')?.remove();const option=new Option(Math.round(Number(value)*100)+'%',value);option.dataset.custom='true';zoom.add(option);}
  zoom.value=value;layout();
 }
 passwordForm.onsubmit=event=>{event.preventDefault();updatePassword?.(passwordForm.querySelector('input').value);passwordForm.querySelector('input').value='';status.textContent='正在打开乐谱…';};
 previous.onclick=()=>jump(pageNumber-(viewMode==='spread'?2:1));next.onclick=()=>jump(pageNumber+(viewMode==='spread'?2:1));
 pageInput.onchange=()=>jump(Number(pageInput.value));pageInput.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();jump(Number(pageInput.value));pageInput.blur();}};
 zoom.onchange=layout;zoomIn.onclick=()=>stepZoom(1.2);zoomOut.onclick=()=>stepZoom(1/1.2);
 viewButton.onclick=()=>{viewMode=viewMode==='single'?'spread':'single';window.portfolioScoreView=viewMode;syncView();layout();};
 focusButton.onclick=()=>focusMode(!root.classList.contains('score-focused'));
 function syncTheme(){const button=document.querySelector('.theme-toggle');themeButton.innerHTML=window.motionIcon?.(button?.dataset.themeIcon||'sun')||glyph('sun');themeButton.setAttribute('aria-label',button?.getAttribute('aria-label')||'切换氛围');themeButton.title=button?.title||'切换氛围';}
 themeButton.onclick=()=>document.querySelector('.theme-toggle')?.click();
 const themeObserver=new MutationObserver(syncTheme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});syncTheme();
 // Discourage ordinary save/print gestures; this is not DRM or file access control.
 root.oncontextmenu=event=>event.preventDefault();root.ondragstart=event=>event.preventDefault();
 function restrictSave(event){if((event.ctrlKey||event.metaKey)&&['s','p'].includes(event.key.toLowerCase())&&(root.contains(document.activeElement)||root.classList.contains('score-focused')))event.preventDefault();}
 document.addEventListener('keydown',restrictSave);
 viewport.onscroll=()=>{if(!frame)frame=requestAnimationFrame(pageFromScroll);};
 viewport.onkeydown=event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();jump(pageNumber+(event.key==='ArrowRight'?1:-1)*(viewMode==='spread'?2:1));}else if(viewMode==='spread'&&['PageDown','PageUp','Home','End'].includes(event.key)){event.preventDefault();jump(event.key==='Home'?1:event.key==='End'?documentPDF?.numPages:pageNumber+(event.key==='PageDown'?2:-2));}};
 function animateWheel(){
  if(disposed){wheelFrame=0;return;}
  const distance=wheelTarget-viewport.scrollLeft;
  if(Math.abs(distance)<.5){viewport.scrollLeft=wheelTarget;wheelFrame=0;return;}
  viewport.scrollLeft+=distance*.24;wheelFrame=requestAnimationFrame(animateWheel);
 }
 function wheel(event){
  if(viewMode!=='spread'||!documentPDF||event.ctrlKey||event.metaKey)return;
  if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){cancelWheel();return;}
  if(!event.deltaY)return;
  event.preventDefault();
  wheelTarget=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,(wheelFrame?wheelTarget:viewport.scrollLeft)+geometry.wheelPixels(event.deltaY,event.deltaMode,viewport.clientWidth)));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){cancelWheel();viewport.scrollLeft=wheelTarget;}
  else if(!wheelFrame)wheelFrame=requestAnimationFrame(animateWheel);
 }
 viewport.addEventListener('wheel',wheel,{passive:false});
 function escape(event){if(event.key==='Escape'&&root.classList.contains('score-focused')){focusMode(false);focusButton.focus();}}
 document.addEventListener('keydown',escape);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
 active=()=>{
  disposed=true;request++;unload();
  cancelAnimationFrame(frame);cancelAnimationFrame(layoutFrame);resizeObserver.disconnect();playerObserver?.disconnect();themeObserver.disconnect();viewport.removeEventListener('wheel',wheel);document.removeEventListener('keydown',escape);document.removeEventListener('keydown',restrictSave);root.classList.remove('score-focused');document.body.classList.remove('score-reading');
 };
 if(url)openPDF(url,demo?'PDF 阅读器演示文档':title+' · 乐谱');
};
})();
