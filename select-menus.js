// Keep native values for filtering and history restoration; present a matching menu.
(()=>{
 let controls=[],opened=null;
 const chevron='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
 const check='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>';
 function enhance(select){
  const label=select.labels[0],labelText=label?.textContent.trim()||'筛选',oldTabindex=select.getAttribute('tabindex');
  const wrapper=document.createElement('div');wrapper.className='catalog-select';select.before(wrapper);
  const trigger=document.createElement('button');trigger.type='button';trigger.className='catalog-select-trigger';trigger.id=select.id+'-trigger';
  trigger.setAttribute('role','combobox');trigger.setAttribute('aria-label',labelText);trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',select.id+'-options');
  const value=document.createElement('span');value.className='catalog-select-value';trigger.append(value);trigger.insertAdjacentHTML('beforeend',chevron);
  const menu=document.createElement('div');menu.id=select.id+'-options';menu.className='catalog-select-menu';menu.hidden=true;menu.setAttribute('role','listbox');menu.setAttribute('aria-label',labelText);
  const options=Array.from(select.options),items=[];let active=-1,letters='',letterTimer;
  select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');if(label)label.htmlFor=trigger.id;
  wrapper.append(select,trigger);document.body.append(menu);
  function position(){
   const rect=trigger.getBoundingClientRect(),width=Math.min(Math.max(160,rect.width),window.innerWidth-24);
   const bottomLimit=window.innerHeight-12,below=bottomLimit-rect.bottom-7,above=rect.top-19;
   const wanted=Math.min(280,menu.scrollHeight),up=below<wanted&&above>below,room=Math.max(60,up?above:below),height=Math.min(wanted,room);
   menu.style.width=width+'px';menu.style.maxHeight=height+'px';menu.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';menu.style.top=(up?Math.max(12,rect.top-height-7):rect.bottom+7)+'px';
  }
  function setActive(index,scroll=true){
   active=index;items.forEach((item,i)=>item.classList.toggle('is-active',i===index));
   if(items[index]){trigger.setAttribute('aria-activedescendant',items[index].id);if(scroll)items[index].scrollIntoView({block:'nearest'});}
  }
  function close(focus=false){
   menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');if(opened===control)opened=null;
   clearTimeout(letterTimer);letters='';if(focus)trigger.focus({preventScroll:true});
  }
  function open(index=select.selectedIndex){
   if(select.disabled)return;if(opened&&opened!==control)opened.close();opened=control;
   menu.hidden=false;trigger.setAttribute('aria-expanded','true');position();
   const enabled=options.findIndex(option=>!option.disabled);setActive(options[index]&&!options[index].disabled?index:enabled);
  }
  function sync(){
   value.textContent=options[select.selectedIndex]?.textContent||'';trigger.disabled=select.disabled;
   items.forEach((item,i)=>{const selected=i===select.selectedIndex;item.setAttribute('aria-selected',String(selected));item.classList.toggle('is-selected',selected);});
   if(opened===control)position();
  }
  function choose(index){
   if(!options[index]||options[index].disabled)return;
   const changed=select.selectedIndex!==index;select.value=options[index].value;sync();close(true);
   if(changed){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  options.forEach((option,index)=>{
   const item=document.createElement('div');item.id=menu.id+'-'+index;item.className='catalog-select-option';item.setAttribute('role','option');item.setAttribute('aria-disabled',String(option.disabled));
   const surface=document.createElement('span');surface.className='catalog-select-option-surface';
   const text=document.createElement('span');text.textContent=option.textContent;surface.append(text);surface.insertAdjacentHTML('beforeend',check);item.append(surface);
   item.addEventListener('pointermove',()=>{if(!option.disabled)setActive(index,false);});item.addEventListener('click',()=>choose(index));menu.append(item);items.push(item);
  });
  const control={trigger,menu,wrapper,sync,close,destroy(){close();select.removeEventListener('input',sync);select.removeEventListener('change',sync);select.hidden=false;select.removeAttribute('aria-hidden');if(oldTabindex===null)select.removeAttribute('tabindex');else select.setAttribute('tabindex',oldTabindex);if(label)label.htmlFor=select.id;wrapper.replaceWith(select);menu.remove();}};
  trigger.addEventListener('click',()=>opened===control?close():open());
  trigger.addEventListener('keydown',event=>{
   const key=event.key;if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
   if(key==='Tab'){close();return;}
   if(key==='Escape'){if(opened===control){event.preventDefault();close(true);}return;}
   if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)){
    event.preventDefault();const enabled=options.map((option,i)=>option.disabled?-1:i).filter(i=>i>=0);if(!enabled.length)return;
    if(opened!==control){open(key==='Home'?enabled[0]:key==='End'?enabled.at(-1):select.selectedIndex);return;}
    if(key==='Enter'||key===' '){choose(active);return;}
    const position=enabled.indexOf(active),next=key==='Home'?enabled[0]:key==='End'?enabled.at(-1):enabled[(position+(key==='ArrowDown'?1:-1)+enabled.length)%enabled.length];setActive(next);return;
   }
   if(key.length===1){
    event.preventDefault();letters+=key.toLocaleLowerCase();clearTimeout(letterTimer);letterTimer=setTimeout(()=>{letters='';},650);
    const index=options.findIndex(option=>!option.disabled&&option.textContent.trim().toLocaleLowerCase().startsWith(letters));
    if(index>=0){if(opened!==control)open(index);else setActive(index);}
   }
  });
  select.addEventListener('input',sync);select.addEventListener('change',sync);sync();return control;
 }
 window.unmountCatalogSelects=()=>{controls.forEach(control=>control.destroy());controls=[];};
 window.enhanceCatalogSelects=root=>{window.unmountCatalogSelects();controls=Array.from(root.querySelectorAll('select')).map(enhance);};
 window.syncCatalogSelects=()=>controls.forEach(control=>control.sync());
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.wrapper.contains(event.target)&&!opened.menu.contains(event.target))opened.close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened){event.preventDefault();opened.close(true);}});
 window.addEventListener('resize',()=>opened?.close());
 window.addEventListener('scroll',event=>{if(opened&&event.target!==opened.menu&&!opened.menu.contains(event.target))opened.close();},true);
 window.addEventListener('popstate',()=>opened?.close());
})();
