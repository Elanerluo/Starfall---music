// Keep catalogue context per history entry, with a tab-local fallback for return links.
(()=>{
 const key='luoting.catalog-view:'+new URL('.',location.href).pathname;
 let last=null,prepared=null,restoring=false,timer;
 const library=()=>document.querySelector('#catalog-list');
 const rows=()=>Array.from(library()?.querySelectorAll('.catalog-row[data-work-id]')||[]);
 const onCatalogue=()=>/\/works\.html$/.test(location.pathname)&&!!library();
 function valid(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Number.isFinite(value.scrollY)?value:null;}
 function saved(){
  try{const entry=valid(history.state?.catalogView);if(entry)return entry;}catch{}
  if(last)return last;
  try{return valid(JSON.parse(sessionStorage.getItem(key)));}catch{return null;}
 }
 function capture({focusWorkId=null,force=false}={}){
  if(!onCatalogue()||!force&&(restoring||document.documentElement.classList.contains('is-navigating')))return null;
  const links=rows(),anchor=links.find(row=>row.dataset.workId===focusWorkId)||links.find(row=>{const rect=row.getBoundingClientRect();return rect.bottom>0&&rect.top<window.innerHeight;});
  const value={search:document.querySelector('#work-search').value,category:document.querySelector('#category-filter').value,year:document.querySelector('#year-filter').value,sort:document.querySelector('#sort-filter').value,scrollY:Math.max(0,window.scrollY||0),focusWorkId,
   anchor:anchor?{id:anchor.dataset.workId,offset:anchor.getBoundingClientRect().top}:null};
  last=value;
  try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}
  try{history.replaceState({...history.state,catalogView:value},'');}catch{}
  return value;
 }
 function restoreControls(){
  prepared=saved();restoring=true;
  if(!prepared)return;
  document.querySelector('#work-search').value=typeof prepared.search==='string'?prepared.search:'';
  for(const [id,name,fallback] of [['category-filter','category',''],['year-filter','year',''],['sort-filter','sort','newest']]){
   const control=document.getElementById(id),value=prepared[name];
   control.value=Array.from(control.options).some(option=>option.value===value)?value:fallback;
  }
 }
 function restoreScroll(){
  const value=prepared;prepared=null;
  if(!onCatalogue()||!value||location.hash){restoring=false;return false;}
  const links=rows(),anchor=links.find(row=>row.dataset.workId===value.anchor?.id);
  const top=anchor&&Number.isFinite(value.anchor.offset)?window.scrollY+anchor.getBoundingClientRect().top-value.anchor.offset:value.scrollY;
  window.scrollTo({top:Math.max(0,top),behavior:'instant'});
  links.find(row=>row.dataset.workId===value.focusWorkId)?.focus({preventScroll:true});
  restoring=false;capture({focusWorkId:value.focusWorkId,force:true});return true;
 }
 window.catalogView={capture,restoreControls,restoreScroll};
 window.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>capture(),150);},{passive:true});
 window.addEventListener('pagehide',()=>capture());
 window.addEventListener('popstate',()=>{clearTimeout(timer);restoring=true;});
})();
