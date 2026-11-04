(()=>{
 const clampPage=(number,total)=>Math.max(1,Math.min(total,Math.round(number)||1));
 function firstPage(number,total,mode){const page=clampPage(number,total);return mode==='spread'?Math.floor((page-1)/2)*2+1:page;}
 function groups(total){return Array.from({length:Math.ceil(total/2)},(_,index)=>({first:index*2+1,last:Math.min(total,index*2+2)}));}
 function fitScale({mode,zoom,width,height,pages}){
  if(!['width','page'].includes(zoom))return Math.max(.05,Number(zoom)||1);
  const availableWidth=Math.max(1,width-48),availableHeight=Math.max(1,height-48);
  const tallest=Math.max(...pages.map(page=>page.height));
  let widthScale;
  if(mode==='spread'){
   widthScale=Math.min(...groups(pages.length).map(({first,last})=>{
    const pair=pages.slice(first-1,last),gap=pair.length===2?12:0;
    return Math.max(1,availableWidth-gap)/pair.reduce((sum,page)=>sum+page.width,0);
   }));
  }else widthScale=availableWidth/Math.max(...pages.map(page=>page.width));
  return Math.max(.05,mode==='spread'||zoom==='page'?Math.min(widthScale,availableHeight/tallest):widthScale);
 }
 function wheelPixels(delta,deltaMode,width){return Number.isFinite(delta)?delta*(deltaMode===1?16:deltaMode===2?Math.max(1,width*.85):1):0;}
 window.portfolioScoreLayout={firstPage,groups,fitScale,wheelPixels};
})();
