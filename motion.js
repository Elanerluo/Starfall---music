(()=>{
const paths={
 wave:'<path d="M3 12h2l2-6 4 13 4-15 3 8h3"/>',
 orbit:'<circle cx="12" cy="12" r="7"/><g class="orbit-dot"><circle cx="12" cy="5" r="2" fill="currentColor" stroke="none"/></g>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="1"/><path class="mail-flap" d="m3 6 9 7 9-7"/>',
 phone:'<path d="m8 3 3 5-3 3c1 2 3 4 5 5l3-3 5 3c-1 4-3 6-6 4C9 18 6 15 4 9 2 6 4 4 8 3Z"/>',
 arrow:'<path d="M5 19 19 5M5 5h14v14"/>',
 down:'<path d="M12 3v17m-6-6 6 6 6-6"/>',
 up:'<path d="M12 21V4m-6 6 6-6 6 6"/>',
 sun:'<circle cx="12" cy="12" r="4"/><g class="sun-rays"><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></g>',
 sunrise:'<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M3 12h2m14 0h2M5 6l2 2m10 0 2-2M12 3v5m-2-3 2-2 2 2"/>',
 sunset:'<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M3 12h2m14 0h2M5 8l2 2m10 0 2-2M12 2v6m-2-2 2 2 2-2"/>',
 moon:'<path d="M20 14a8.5 8.5 0 0 1-10-10A8.5 8.5 0 1 0 20 14Z"/><path d="M18 2v4m-2-2h4"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
 play:'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
 equalizer:'<path class="eq-line" d="M4 9v6"/><path class="eq-line" d="M8 4v16"/><path class="eq-line" d="M12 7v10"/><path class="eq-line" d="M16 3v18"/><path class="eq-line" d="M20 8v8"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>'
};
window.motionIcon=name=>`<svg class="ui-icon motion-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.arrow}</svg>`;
function decorate(root=document){
 root.querySelectorAll('.site-header nav a').forEach((link,index)=>{if(!link.querySelector('.ui-icon'))link.insertAdjacentHTML('afterbegin',window.motionIcon(['wave','orbit','mail'][index]));});
 root.querySelectorAll('.round-arrow').forEach(item=>{item.innerHTML=window.motionIcon('arrow');});
 root.querySelectorAll('.scroll-cue>span').forEach(item=>{item.innerHTML=window.motionIcon('down');});
 root.querySelectorAll('.theme-toggle .sun').forEach(item=>{item.innerHTML=window.motionIcon(item.closest('.theme-toggle').dataset.themeIcon||'sun');});
 root.querySelectorAll('.section-kicker>span:last-child').forEach(item=>{if(!item.querySelector('.ui-icon'))item.insertAdjacentHTML('afterbegin',window.motionIcon('orbit'));});
 root.querySelectorAll('.contact-links a').forEach(link=>{const caption=link.querySelector('span');if(caption&&!caption.querySelector('.ui-icon'))caption.insertAdjacentHTML('afterbegin',window.motionIcon(link.protocol==='mailto:'?'mail':'phone'));const arrow=link.querySelector('b');if(arrow)arrow.innerHTML=window.motionIcon('arrow');});
 root.querySelectorAll('.catalog-play,.work-play').forEach(button=>{const active=button.dataset.active==='true';button.innerHTML=window.motionIcon(active?'equalizer':'play');});
 root.querySelectorAll('.catalog-row>span:last-child').forEach(item=>{item.innerHTML=window.motionIcon('arrow');});
 root.querySelectorAll('.search-field').forEach(item=>{if(!item.querySelector('.ui-icon'))item.insertAdjacentHTML('beforeend',window.motionIcon('search'));});
 root.querySelectorAll('footer>a:last-child').forEach(link=>{if(!link.querySelector('.ui-icon')){const icon=link.getAttribute('href')?.includes('works')?'arrow':'up';link.appendChild(document.createRange().createContextualFragment(window.motionIcon(icon)));}});
 const main=root.querySelector('main');if(main)main.classList.add('page-arrival');
 }
window.decorateMotionIcons=decorate;
decorate();
})();
