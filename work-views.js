// Public, shared view counters. Listing a work only reads its counter.
(()=>{
 const endpoint='https://countapi.mileshilliard.com/api/v1';
 const namespace='luoting_elanerluo_starfall_music_views_v1_';
 const productionOrigin='https://elanerluo.github.io',productionBase='/Starfall---music/';
 const cache=new Map(),pending=new Map(),tasks=[];
 let active=0,lastPage=null;
 const nodes=()=>Array.from(document.querySelectorAll('[data-work-views]'));
 const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
 const format=new Intl.NumberFormat('zh-CN');
 function paint(id,value,error=false){
  for(const node of nodes()){
   if(node.dataset.workViews!==id)continue;
   node.dataset.state=error?'error':'ready';
   node.querySelector('[data-view-count]').textContent=value===null?'—':format.format(value);
   node.setAttribute('aria-label',value===null?'浏览量暂时无法获取':`累计浏览 ${value} 次`);
   node.title=error?'浏览量暂时无法获取，稍后再试':'作品详情的累计浏览量，从启用统计后开始记录';
  }
 }
 function pump(){
  while(active<3&&tasks.length){
   const {run,resolve,reject}=tasks.shift();active++;
   Promise.resolve().then(run).then(resolve,reject).finally(()=>{active--;pump();});
  }
 }
 function schedule(run){return new Promise((resolve,reject)=>{tasks.push({run,resolve,reject});pump();});}
 async function request(id,increment){
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),7000);
  try{
   const response=await fetch(`${endpoint}/${increment?'hit':'get'}/${encodeURIComponent(namespace+id)}`,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:abort.signal});
   const result=await response.json();
   if(!increment&&response.status===404&&typeof result.error==='string'&&/key.*not found/i.test(result.error))return 0;
   if(!response.ok)throw Error('Counter unavailable');
   const raw=result.value;
   if(!(typeof raw==='number'||typeof raw==='string'&&/^\d+$/.test(raw)))throw Error('Invalid counter');
   const value=Number(raw);
   if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid counter');
   return value;
  }finally{clearTimeout(timer);}
 }
 function query(id,increment=false){
  if(!validId(id))return Promise.resolve();
  if(!increment&&pending.has(id))return pending.get(id);
  const saved=cache.get(id);
  if(!increment&&saved&&Date.now()-saved.at<60000){paint(id,saved.value);return Promise.resolve(saved.value);}
  // Serialize a work's read and increment so a late read cannot replace the newer value.
  const previous=pending.get(id);
  const operation=(previous?previous.catch(()=>{}):Promise.resolve()).then(()=>schedule(()=>request(id,increment))).then(value=>{
   cache.set(id,{value,at:Date.now()});paint(id,value);return value;
  }).catch(()=>{paint(id,cache.get(id)?.value??null,true);});
  pending.set(id,operation);
  operation.finally(()=>{if(pending.get(id)===operation)pending.delete(id);});
  return operation;
 }
 function refresh(){
  const current=new URL(location.href),name=current.pathname.split('/').pop()||'index.html';
  const id=current.searchParams.get('id');
  const published=(window.portfolioWorks||[]).some(work=>String(work.id)===id);
  const detail=name==='work.html'&&published&&validId(id)&&!current.searchParams.has('preview');
  const page=detail?'work:'+id:current.pathname;
  const increment=detail&&page!==lastPage&&current.origin===productionOrigin&&current.pathname.startsWith(productionBase)&&document.visibilityState!=='hidden';
  if(!detail||document.visibilityState!=='hidden')lastPage=page;
  const visible=new Set(nodes().map(node=>node.dataset.workViews).filter(validId));
  for(const visibleId of visible){
   const saved=cache.get(visibleId);if(saved)paint(visibleId,saved.value);
   query(visibleId,increment&&visibleId===id);
  }
 }
 window.portfolioViews={refresh};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
})();
