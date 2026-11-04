(()=>{
// Use each visitor's own clock. A manual choice lasts until the page is reloaded.
const themes=[
 {id:'dawn',label:'晨光',icon:'sunrise',color:'#e9e6df',description:'晨光洒向沙丘与海洋，远山隐入暖金色的薄雾'},
 {id:'day',label:'晴昼',icon:'sun',color:'#dce9ed',description:'清朗日光下的沙丘与海洋，远山延伸至浅蓝色的天际'},
 {id:'dusk',label:'暮色',icon:'sunset',color:'#684854',description:'落日余晖染暖海岸，沙丘与远山融入柔和的暮色'},
 {id:'night',label:'星夜',icon:'moon',color:'#13212e',description:'深蓝夜色中的沙丘与海洋，月光映照宁静的远山'}
];
let manualTheme=null;
function localTheme(){
 const hour=new Date().getHours();
 if(hour>=6&&hour<10)return themes[0];
 if(hour>=10&&hour<17)return themes[1];
 if(hour>=17&&hour<19)return themes[2];
 return themes[3];
}
function applyTheme(){
 const theme=manualTheme??localTheme(),night=theme.id==='night';
 document.documentElement.dataset.theme=theme.id;
 document.documentElement.classList.toggle('night',night);
 document.body?.classList.toggle('night',night);
 const button=document.querySelector('.theme-toggle');
 if(button){
  const next=themes[(themes.indexOf(theme)+1)%themes.length];
  button.querySelector('.theme-label').textContent=theme.label;
  button.dataset.themeIcon=theme.icon;
  button.setAttribute('aria-label',`当前${theme.label}，切换为${next.label}氛围`);
  button.setAttribute('title',`当前：${theme.label} · 点击切换为${next.label}`);
  button.removeAttribute('aria-pressed');
  if(window.motionIcon)button.querySelector('.sun').innerHTML=window.motionIcon(theme.icon);
 }
 document.querySelector('.landscape')?.setAttribute('aria-label',theme.description);
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme.color);
}

// This script runs in the head so the first visible frame already has the right theme.
applyTheme();
window.bindHomeControls=function(){
 const body=document.body;
 applyTheme();
 const themeButton=document.querySelector('.theme-toggle');
 if(themeButton)themeButton.onclick=()=>{
  const current=themes.findIndex(theme=>theme.id===document.documentElement.dataset.theme);
  manualTheme=themes[(current+1)%themes.length];
  applyTheme();
 };
 window.bindOcean?.();
 const motionButton=document.querySelector('.motion-toggle');
 if(!motionButton)return;
 function setMotion(paused){body.classList.toggle('still',paused);motionButton.setAttribute('aria-pressed',String(paused));motionButton.querySelector('.motion-mark').textContent=paused?'▷':'Ⅱ';motionButton.querySelector('.motion-label').textContent=paused?'开启动效':'暂停动效';}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)body.classList.add('still');
 setMotion(body.classList.contains('still'));
 motionButton.onclick=()=>setMotion(!body.classList.contains('still'));
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.bindHomeControls,{once:true});
else window.bindHomeControls();

// Recheck after sleep/backgrounding as well as during a long listening session.
setInterval(applyTheme,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyTheme();});
window.addEventListener('pageshow',applyTheme);
})();
