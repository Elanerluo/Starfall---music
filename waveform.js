(()=>{
const cache=new Map();
function validURL(value){if(!value)return null;try{const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;}}
function validPeaks(peaks){return Array.isArray(peaks)&&peaks.length>=2&&peaks.length<=20000&&peaks.every(value=>Number.isFinite(value)&&value>=0&&value<=1);}
async function fromAudio(url){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw Error('No decoder');const response=await fetch(url);if(!response.ok)throw Error('Audio unavailable');const context=new AudioContext();try{const buffer=await context.decodeAudioData(await response.arrayBuffer()),bins=2048,peaks=[];for(let bin=0;bin<bins;bin++){let sum=0,max=0,count=0;for(let channel=0;channel<buffer.numberOfChannels;channel++){const data=buffer.getChannelData(channel);const start=Math.floor(bin*data.length/bins),end=Math.floor((bin+1)*data.length/bins);for(let i=start;i<end;i++){sum+=data[i]*data[i];max=Math.max(max,Math.abs(data[i]));count++;}}peaks.push(.75*Math.sqrt(sum/Math.max(1,count))+.25*max);}const max=Math.max(...peaks,1e-9);return peaks.map(value=>Math.pow(value/max,.8));}finally{await context.close().catch(()=>{});}}
async function read(work){const audioURL=validURL(work.audio),waveURL=validURL(work.waveform);if(!audioURL)throw Error('No audio');const key=audioURL+'|'+waveURL;if(!cache.has(key)){cache.set(key,(async()=>{if(waveURL){try{const response=await fetch(waveURL);if(!response.ok)throw Error('No peaks');const data=await response.json();if(!validPeaks(data.peaks))throw Error('Invalid peaks');return {peaks:data.peaks,source:'precomputed'};}catch{}}return {peaks:await fromAudio(audioURL),source:'decoded'};})().catch(error=>{cache.delete(key);throw error;}));}return cache.get(key);}
// A stable, song-wide midpoint keeps quiet sections quieter and strong ones
// stronger. Nearly uniform recordings keep their original range.
function contrastFor(peaks){
 const sorted=[...peaks].sort((a,b)=>a-b);
 function percentile(fraction){const position=(sorted.length-1)*fraction,index=Math.floor(position);return sorted[index]+(sorted[Math.min(index+1,sorted.length-1)]-sorted[index])*(position-index);}
 return {enabled:percentile(.95)-percentile(.05)>=.12,pivot:Math.max(.05,Math.min(.95,percentile(.5)))};
}
function displayLevel(value,contrast){
 if(!contrast.enabled)return value;
 const pivot=contrast.pivot;
 // Both halves meet with the same slope; the endpoints remain exactly 0 and 1.
 return value<=pivot?pivot*Math.pow(value/pivot,1.8):1-(1-pivot)*Math.pow((1-value)/(1-pivot),1.8);
}
// Keep the approved bar width and spacing; enhance only their display heights.
function barsFor(peaks,width,height,contrast){
 const count=Math.min(peaks.length,Math.max(1,Math.floor(width/3))),step=width/count,barWidth=Math.min(1.5,step*.55),bars=[];
 for(let i=0;i<count;i++){
  const start=Math.floor(i*peaks.length/count),end=Math.floor((i+1)*peaks.length/count);let sum=0;
  for(let index=start;index<end;index++)sum+=peaks[index];
  const value=displayLevel(sum/(end-start),contrast),barHeight=Math.min(height,Math.max(2,value*Math.max(0,height-8)));
  bars.push([(i+.5)*step-barWidth/2,(height-barHeight)/2,barWidth,barHeight]);
 }
 return {width,height,bars,barWidth};
}
window.createAudioWaveform=(canvas,status)=>{
 const ctx=canvas.getContext('2d');let peaks=null,ratio=0,serial=0,geometry=null,contrast=null;
 canvas.dataset.waveStyle='bars';
 function draw(){
  if(!ctx)return;
  const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;
  const width=rect.width,height=rect.height,dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const style=getComputedStyle(canvas),base=style.getPropertyValue('--player-wave-base').trim()||'#aabec8',active=style.getPropertyValue('--player-wave-active').trim()||'#357b8c',cursor=style.getPropertyValue('--player-wave-cursor').trim()||active;
  if(!peaks){ctx.lineWidth=1;ctx.strokeStyle=base;ctx.beginPath();ctx.moveTo(0,height/2);ctx.lineTo(width,height/2);ctx.stroke();return;}
  if(!geometry||geometry.width!==width||geometry.height!==height){geometry=barsFor(peaks,width,height,contrast);canvas.dataset.barCount=geometry.bars.length;canvas.dataset.lineWidth=geometry.barWidth;}
  function paint(color){ctx.fillStyle=color;for(const bar of geometry.bars)ctx.fillRect(...bar);}
  paint(base);
  const played=ratio*width;
  if(ratio>0){ctx.save();ctx.beginPath();ctx.rect(0,0,played,height);ctx.clip();paint(active);ctx.restore();}
  if(ratio>0&&ratio<1){ctx.fillStyle=cursor;ctx.fillRect(Math.min(width-1,Math.round(played)),2,1,Math.max(0,height-4));}
 }
 const observer=new ResizeObserver(draw);observer.observe(canvas);
 // Repaint paused tracks when the atmosphere or score-reader palette changes.
 const themeObserver=new MutationObserver(draw);
 themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 themeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 return {
  update(value){ratio=Math.max(0,Math.min(1,Number(value)||0));draw();},
  async load(work){
   const token=++serial;peaks=null;ratio=0;geometry=null;contrast=null;
   canvas.dataset.waveState=work?'loading':'empty';
   for(const name of ['peakCount','waveSource','barCount','lineWidth','pointCount','contourSeed','waveContrast'])delete canvas.dataset[name];
   status.textContent=work?'正在读取音频波形':'选择作品后显示音频波形';draw();
   if(!work)return;
   try{
    const result=await read(work);if(token!==serial)return;
    peaks=result.peaks;contrast=contrastFor(peaks);geometry=null;
    canvas.dataset.waveContrast=contrast.enabled?'medium':'neutral';
    canvas.dataset.waveState='ready';canvas.dataset.peakCount=peaks.length;canvas.dataset.waveSource=result.source;
    status.textContent='音频波形，可点击或拖动定位';draw();
   }catch{
    if(token!==serial)return;
    canvas.dataset.waveState='error';status.textContent='波形暂不可用，仍可拖动定位播放进度';draw();
   }
  }
 };
};
})();
