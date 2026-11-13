window.renderPortfolio=()=>{
window.unmountWorkVideo?.();window.unmountWorkVideo=null;
window.unmountScoreReader?.();
window.unmountWorkGallery?.();window.unmountWorkGallery=null;
window.restoreCatalogView=null;
window.unmountCatalogSelects?.();
const works=window.portfolioWorks||[];
const {byTitle,byNewest,byOldest,formatDate}=window.portfolioWorkOrder;
const categories=['歌曲','艺术歌曲','合唱作品','纯音乐','器乐作品','室内乐','管弦乐','电子音乐','影视配乐','其他'];
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const detailURL=work=>'work.html?id='+encodeURIComponent(work.id);
function playable(value){try{return !!value&&['http:','https:'].includes(new URL(value,location.href).protocol);}catch{return false;}}
const viewCount=id=>`<span class="work-view-count" data-work-views="${escapeHTML(id)}" data-state="loading" aria-label="浏览量正在载入"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span data-view-count>—</span><span>浏览</span></span>`;
function row(work,index){return `<div class="catalog-item"><a class="catalog-row" href="${detailURL(work)}" data-work-id="${escapeHTML(work.id)}"><span class="catalog-number">${String(index+1).padStart(2,'0')}</span><span class="catalog-title"><span class="catalog-title-name">${escapeHTML(work.title)}</span><span class="catalog-subline"><small>${escapeHTML(work.instrumentation||'')}</small>${viewCount(work.id)}</span></span><span class="catalog-category">${escapeHTML(work.category||'其他')}</span><span class="catalog-year">${escapeHTML(formatDate(work))}</span><span class="catalog-duration">${escapeHTML(work.duration||'—')}</span><span aria-hidden="true">↗</span></a>${playable(work.audio)?`<button class="catalog-play" data-play-work="${escapeHTML(work.id)}" data-work-title="${escapeHTML(work.title)}" aria-label="播放${escapeHTML(work.title)}">▷</button>`:''}</div>`;}
const selected=document.querySelector('#selected-list');
if(selected){const featured=works.filter(work=>work.selected).sort(byNewest).slice(0,6);selected.innerHTML=featured.length?featured.map(row).join(''):'<div class="empty-state"><span class="empty-symbol" aria-hidden="true">≈</span><h3>留一片天地，给即将到来的声音。</h3><p>代表作品待收录，未来将在这里精选呈现。</p></div>';}
const library=document.querySelector('#catalog-list');let restoredCatalog=false;
if(library){const search=document.querySelector('#work-search'),category=document.querySelector('#category-filter'),year=document.querySelector('#year-filter'),sort=document.querySelector('#sort-filter');
categories.forEach(value=>category.add(new Option(value,value)));
const note=document.querySelector('.library-note>p');if(note&&works.length)note.textContent='每部作品的录音、影像与乐谱集中呈现。更多作品陆续收录中。';
[...new Set(works.map(work=>work.year).filter(Boolean))].sort((a,b)=>b-a).forEach(value=>year.add(new Option(value,value)));
function render(){const query=search.value.trim().toLocaleLowerCase();let filtered=works.filter(work=>(!category.value||work.category===category.value)&&(!year.value||String(work.year)===year.value)&&(!query||[work.title,work.instrumentation,work.description].join(' ').toLocaleLowerCase().includes(query)));filtered.sort(sort.value==='title'?byTitle:sort.value==='oldest'?byOldest:byNewest);document.querySelector('#result-count').textContent=`${filtered.length} / ${works.length} 部作品`;library.innerHTML=filtered.length?filtered.map(row).join(''):`<div class="empty-state"><span class="empty-symbol" aria-hidden="true">≈</span><h2>${works.length?'没有找到匹配的作品':'作品陆续收录中'}</h2><p>${works.length?'试试其他关键词，或重置筛选。':'完整作品目录将在这里展开，录音、影像与乐谱归于每一部作品。'}</p></div>`;window.portfolioViews?.refresh();}
[search,category,year,sort].forEach(control=>control.addEventListener('input',()=>{render();window.syncCatalogSelects?.();window.decorateMotionIcons?.(library);window.sitePlayer?.sync();window.catalogView?.capture();}));document.querySelector('#reset-filters').addEventListener('click',()=>{search.value='';category.value='';year.value='';sort.value='newest';render();window.syncCatalogSelects?.();window.decorateMotionIcons?.(library);window.sitePlayer?.sync();window.catalogView?.capture();});
window.restoreCatalogView=()=>{window.catalogView?.restoreControls();render();window.syncCatalogSelects?.();window.decorateMotionIcons?.(library);window.sitePlayer?.sync();return window.catalogView?.restoreScroll()||false;};
restoredCatalog=window.restoreCatalogView();window.enhanceCatalogSelects?.(document.querySelector('.catalog-controls'));}
const detail=document.querySelector('#work-detail');
if(detail){const params=new URLSearchParams(location.search),preview=params.get('preview')==='1',work=works.find(item=>item.id===params.get('id'));
if(!preview&&!work){detail.innerHTML='<div class="empty-state"><h1>暂未收录这部作品</h1><p>你可以返回作品库，浏览其他作品。</p><a class="text-link" href="works.html">返回完整作品库 ↗</a></div>';}
else {
 const item=work||{title:'作品详情预览',category:'待补充',year:'—',instrumentation:'待补充',duration:'—'};
 function safeURL(value){if(!value)return null;try{const parsed=new URL(value,location.href);return ['http:','https:'].includes(parsed.protocol)?parsed.href:null;}catch{return null;}}
 const media={audio:safeURL(item.audio),video:safeURL(item.video),score:safeURL(item.score),image:safeURL(item.image)};
 const pictures=(Array.isArray(item.images)?item.images:[]).map(picture=>({...picture,image:safeURL(picture.image)})).filter(picture=>picture.image);
 if(!pictures.length&&media.image)pictures.push({image:media.image});
 const archiveTitle=item.imageTitle||'创作手稿',multiplePictures=pictures.length>1;
 const hasMedia=!!(media.audio||media.video||media.score);
 const mediaTitle=media.audio&&media.video?'聆听与观看':media.audio?'聆听':media.video?'观看':'阅读';
 const audioBlock=media.audio?'<div id="audio-area"><span class="media-label">01 / 录音</span></div>':'';
 const videoBlock=media.video?'<div id="video-area"><span class="media-label">02 / 影像</span></div>':'';
 const scoreLink=media.score?'<a class="score-jump" href="#score-reader">阅读乐谱 ↓</a>':'';
 const mediaBlock=hasMedia?`<div class="detail-media"><h2>${mediaTitle}</h2>${audioBlock}${videoBlock}${scoreLink}</div>`:'';
 const scoreBlock=media.score?'<section id="score-reader" class="score-section" aria-label="作品乐谱"></section>':'';
 const galleryButton=(direction,path)=>`<button type="button" class="portrait-nav portrait-nav--${direction==='previous'?'previous':'next'}" data-portrait-${direction} aria-label="${direction==='previous'?'上一张':'下一张'}作品图片"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg></button>`;
 const pictureBlock=multiplePictures?`<figure class="portrait-gallery work-photo-gallery" id="work-photo-gallery" role="group" aria-roledescription="照片切换" aria-label="${escapeHTML(archiveTitle)}"><div class="portrait-deck">${galleryButton('previous','m15 5-10 7 10 7Z')}<div class="portrait-stage">${pictures.map((picture,index)=>`<div class="portrait-card ${index===0?'is-front':index===1?'is-back':'is-stowed'}" data-portrait-card data-caption="${escapeHTML(picture.caption||archiveTitle)}" aria-hidden="${index!==0}"><button type="button" class="archive-preview" data-photo-open="${index}" aria-label="放大查看${escapeHTML(picture.caption||archiveTitle)}"><img src="${escapeHTML(picture.image)}" alt="${escapeHTML(item.title+' · '+(picture.caption||archiveTitle))}" loading="lazy" decoding="async" draggable="false"></button></div>`).join('')}</div>${galleryButton('next','m9 5 10 7-10 7Z')}</div><figcaption><span data-photo-caption>${escapeHTML(pictures[0].caption||archiveTitle)}</span><span class="portrait-position" data-portrait-position aria-hidden="true">01 / ${String(pictures.length).padStart(2,'0')}</span></figcaption><span class="portrait-status" data-portrait-status role="status" aria-live="polite"></span><small class="gallery-hint">点击照片查看大图 ↗</small></figure>`:pictures.length?`<figure><button type="button" class="archive-preview" id="manuscript-open" aria-label="放大查看${escapeHTML(archiveTitle)}"><img src="${escapeHTML(pictures[0].image)}" alt="${escapeHTML(item.title+'的'+archiveTitle)}" loading="lazy" decoding="async"></button><figcaption>点击查看大图 ↗</figcaption></figure>`:'';
 const extrasBlock=pictures.length||item.imageCaption?`<section class="work-archive" id="other-info" aria-labelledby="other-info-title"><p class="eyebrow">NOTES & ORIGINS</p><h2 id="other-info-title">其他信息</h2><div class="archive-grid${multiplePictures?' archive-grid--gallery':''}">${pictureBlock}<div class="archive-copy">${pictures.length?`<h3>${escapeHTML(archiveTitle)}</h3>`:''}${item.imageCaption?`<p>${escapeHTML(item.imageCaption)}</p>`:''}</div></div>${pictures.length?`<dialog class="archive-dialog" id="manuscript-dialog" aria-label="${escapeHTML(archiveTitle)}大图"><header><span>${escapeHTML(archiveTitle+' / '+item.title)}</span><button type="button" id="manuscript-close" aria-label="关闭${escapeHTML(archiveTitle)}大图">×</button></header><img src="${escapeHTML(pictures[0].image)}" alt="${escapeHTML(item.title+'的'+archiveTitle+'大图')}" loading="lazy" decoding="async"></dialog>`:''}</section>`:'';
 document.title=item.title+' — 罗挺';
 detail.innerHTML=`${preview?'<p class="preview-notice">页面结构预览 · 非真实作品</p>':''}<p class="eyebrow">COMPOSITION / LUO TING${!preview?viewCount(item.id):''}</p><div class="detail-title-wrap"><a class="detail-back" href="works.html" aria-label="返回上一级：完整作品库" title="返回上一级"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></a><h1 class="detail-title">${escapeHTML(item.title)}</h1></div><dl class="detail-meta"><div><dt>作品类型</dt><dd>${escapeHTML(item.category||'—')}</dd></div><div><dt>创作时间</dt><dd>${escapeHTML(formatDate(item))}</dd></div><div><dt>编制</dt><dd>${escapeHTML(item.instrumentation||'—')}</dd></div><div><dt>时长</dt><dd>${escapeHTML(item.duration||'—')}</dd></div></dl><div class="detail-grid${hasMedia?'':' detail-grid--text-only'}"><div class="detail-description"><p class="eyebrow">ABOUT THE WORK</p><h2>创作说明</h2><p>${escapeHTML(item.description||'创作背景、音乐构思与作品说明待补充。')}</p></div>${mediaBlock}</div>${scoreBlock}${extrasBlock}<a class="text-link" href="works.html">← 返回完整作品库</a>`;
 if(media.audio){
  const versions=Array.isArray(item.audioVersions)?item.audioVersions.filter(version=>safeURL(version.audio)):[];
  const multipleVersions=versions.length>1;
  const recordings=versions.length?versions:[{audio:media.audio,duration:item.duration}];
  const area=document.querySelector('#audio-area');
  area.className='audio-versions';
  recordings.forEach((version,index)=>{
    const row=document.createElement('div');row.className='recording-version';
    const caption=document.createElement('div');caption.className='recording-caption';
    const name=document.createElement('span');name.textContent=multipleVersions?(version.label||'版本 '+(index+1)):item.title;
    const note=document.createElement('small');note.textContent=[multipleVersions&&index===0?'默认版本':'',version.duration||(index===0?item.duration:'')].filter(Boolean).join(' · ');caption.append(name,note);
    if(version.note){const credits=document.createElement('small');credits.className='recording-version-note';credits.textContent=version.note;caption.append(credits);}
    const play=document.createElement('button');play.className='work-play';play.dataset.playWork=item.id;if(version.id)play.dataset.playVersion=version.id;play.dataset.workTitle=multipleVersions?item.title+' · '+name.textContent:item.title;play.textContent='▷';play.setAttribute('aria-label','播放'+play.dataset.workTitle);play.setAttribute('aria-pressed','false');
    row.append(caption,play);area.append(row);
  });
 }
 if(media.video){
  const video=document.createElement('video');video.controls=true;video.setAttribute('controlslist','nodownload');video.preload='metadata';video.src=media.video;video.setAttribute('aria-label',item.title+'影像');const area=document.querySelector('#video-area');area.append(video);window.unmountWorkVideo=window.enhanceWorkVideo?.(video,area,item.title);
 }
 if(media.score)window.mountScoreReader?.(document.querySelector('#score-reader'),{url:media.score,title:item.title,demo:item.scoreDemo===true});
 if(pictures.length){
  const dialog=document.querySelector('#manuscript-dialog');
  if(multiplePictures){
   const gallery=document.querySelector('#work-photo-gallery');
   window.unmountWorkGallery=window.createPhotoGallery?.(gallery,{label:archiveTitle});
   gallery.querySelectorAll('[data-photo-open]').forEach(button=>button.addEventListener('click',()=>{
    const picture=pictures[Number(button.dataset.photoOpen)],image=dialog.querySelector('img');
    image.src=picture.image;image.alt=item.title+' · '+(picture.caption||archiveTitle);dialog.showModal();
   }));
  }else document.querySelector('#manuscript-open').addEventListener('click',()=>dialog.showModal());
  document.querySelector('#manuscript-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 }
}}


window.decorateMotionIcons?.();
window.portfolioViews?.refresh();
return {restoredCatalog};
};
window.renderPortfolio();
