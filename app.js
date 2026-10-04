import {chartSvg,validateSnapshot} from './chart.js';
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=String(value??'—');if(cls)e.className=cls;return e;};
function showChart(snapshot,hero){
 const panel=document.getElementById('chart-panel');panel.hidden=false;
 document.getElementById('chart-title').textContent=hero.symbol+' · 掃描圖表';
 const stored=snapshot.charts[hero.symbol];const display=document.getElementById('chart');const info=document.getElementById('chart-info');const nav=document.getElementById('ranges');nav.replaceChildren();
 if(!stored?.prices?.length){display.replaceChildren(text('p','這次掃描沒有真實圖表資料。'));info.textContent='';document.getElementById('chart-detail').textContent='';return;}
 const prices=stored.prices;const r=stored.structure?.currentRegime;
 info.textContent=`${prices[0].date} 至 ${prices.at(-1).date} · ${prices.length} 根日線 · ${snapshot.scan_time}`;
 document.getElementById('chart-detail').textContent=r?`掃描箱體：${r.context?.label||'盤整'} ｜支持 ${r.support} ｜阻力 ${r.resistance} ｜${r.duration} 根日線`:'這次掃描沒有識別到當前盤整箱體。';
 function draw(count){display.innerHTML=chartSvg(prices,stored.structure,count);for(const b of nav.children)b.setAttribute('aria-pressed',b.dataset.count===String(count));display.scrollLeft=display.scrollWidth;}
 for(const [label,count] of [['3個月',63],['6個月',126],['1年',252],['全部',prices.length]]){const b=text('button',label);b.dataset.count=String(count);b.onclick=()=>draw(count);nav.append(b);}draw(252);panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function render(snapshot,category){const grid=document.getElementById(category);const list=snapshot.heroes.filter(h=>h.category===category);if(!list.length)grid.append(text('p','這次掃描沒有符合條件的股票。'));for(const hero of list){const c=text('article','','card');c.append(text('strong',hero.symbol),text('p',hero.sector,'muted'),text('p',`價格 ${hero.price} ｜評分 ${hero.score} ｜第 ${hero.age} 天`));if(hero.box_duration)c.append(text('p',`盤整時間：${hero.box_duration}`));c.append(text('p',hero.decision_desc));const b=text('button','查看真實圖表及築底箱體');b.onclick=()=>showChart(snapshot,hero);c.append(b);grid.append(c);}}
(async()=>{try{const id=new URLSearchParams(location.search).get('scan')||'';if(id&&!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error('無效掃描連結');const path=id?`data/scans/${id}.json`:'data/latest.json';const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(id?'找不到這次掃描；不會以其他結果代替。':'尚未發布第一次掃描結果。');const data=validateSnapshot(await r.json(),id);render(data,'bottom');render(data,'early');document.getElementById('raw').textContent=data.tg_text;document.getElementById('status').textContent='掃描時間：'+data.scan_time;}catch(e){const s=document.getElementById('status');s.textContent=e.message;s.className='error';}})();
