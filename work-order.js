// One ordering policy for the catalogue, featured works and playback queue.
(()=>{
 const collator=new Intl.Collator('zh-Hans-CN-u-co-pinyin',{usage:'sort',sensitivity:'base',numeric:true,ignorePunctuation:true});
 const name=work=>String(work.title||'').normalize('NFKC').replace(/^[\p{P}\p{S}\s]+/u,'');
 const group=value=>/^\p{Script=Han}/u.test(value)?0:/^[A-Za-z]/.test(value)?1:/^\d/.test(value)?2:3;
 const byTitle=(a,b)=>group(name(a))-group(name(b))||collator.compare(name(a),name(b));
 const year=work=>Number(work.year)||0;
 const month=work=>year(work)&&Number.isInteger(Number(work.month))&&Number(work.month)>=1&&Number(work.month)<=12?Number(work.month):0;
 const knownYearFirst=(a,b)=>Number(!year(a))-Number(!year(b));
 const byNewest=(a,b)=>knownYearFirst(a,b)||year(b)-year(a)||month(b)-month(a)||byTitle(a,b);
 const byOldest=(a,b)=>knownYearFirst(a,b)||year(a)-year(b)||Number(!month(a))-Number(!month(b))||month(a)-month(b)||byTitle(a,b);
 const formatDate=work=>year(work)?String(year(work))+(month(work)?'.'+String(month(work)).padStart(2,'0'):''):'—';
 window.portfolioWorkOrder=Object.freeze({byTitle,byNewest,byOldest,formatDate});
})();
