/* Original dashboard UI, served from one immutable scan instead of live APIs. */
(async()=>{
 window.__INDEX_NAMES__={ES:'S&P',NQ:'納指',YM:'道指',SOX:'費城',RTY:'羅素2000'};
 const status=document.getElementById('snapshot-status');const nativeFetch=window.fetch.bind(window);
 const id=new URLSearchParams(location.search).get('scan')||'';
 try {
  if(id&&!/^[A-Za-z0-9_-]{1,80}$/.test(id))throw Error('無效掃描連結');
  const r=await nativeFetch(id?`data/scans/${id}.json`:'data/latest.json',{cache:'no-store'});
  if(!r.ok)throw Error(id?'找不到這次掃描，不會代替成另一份結果。':'尚未發布第一次掃描結果。');
  const snapshot=await r.json();
  if(!snapshot || !Array.isArray(snapshot.heroes)||!snapshot.charts||id&&snapshot.scan_id!==id)throw Error('掃描快照格式不正確');
  for(const chart of Object.values(snapshot.charts))if(!Array.isArray(chart.prices)||chart.prices.some(p=>!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!['open','high','low','close'].every(k=>Number.isFinite(p[k]))))throw Error('股價資料格式不正確');
  window.__SCAN_SNAPSHOT__=snapshot;window.__INITIAL_HEROES__=snapshot.heroes;
  const d=snapshot.dashboard||{};
  for(const hero of snapshot.heroes){
   const bars=snapshot.charts[hero.symbol]?.prices;
   if(bars?.length>1)hero.change=(bars.at(-1).close/bars.at(-2).close-1)*100;
   const key=hero.category==='bottom'?'ES':'NQ';const index=d.indices?.[key];
   hero.index_resonance=index?{index_code:index.symbol,index_name:window.__INDEX_NAMES__[key],index_change:index.change,status:index.change<0?'warning':'bullish',badge_text:'同次大市快照',badge_type:index.change<0?'resonance_warn':'resonance_good',sub_desc:'同一次市場資料；方向共振並非必然關係。'}:null;
  }
  window.__INITIAL_SECTORS__=d.sectors||[];window.__SCAN_HISTORY__=d.history||[];
  window.__INITIAL_TG_TEXT__=snapshot.tg_text||'';window.__INITIAL_SCAN_TIME__=snapshot.scan_time;
  const json=(value,code=200)=>new Response(JSON.stringify(value),{status:code,headers:{'Content-Type':'application/json'}});
  const ema=(prices,n)=>{let current=0;return prices.map((p,i)=>{current=i<n?current+(p.close-current)/(i+1):p.close*2/(n+1)+current*(1-2/(n+1));return current;});};
  function chartData(symbol){
   const stored=snapshot.charts[symbol];if(!stored?.prices?.length)return null;
   const prices=stored.prices;const structure=stored.structure||{};const box=structure.currentRegime;
   let validation=null;
   if(box){const bars=prices.slice(box.startIndex,box.endIndex+1);const coverage=bars.length?bars.filter(p=>p.close>=box.support&&p.close<=box.resistance).length/bars.length*100:0;const pos=(prices.at(-1).close-box.support)/(box.resistance-box.support||1)*100;const ctx=box.context||{};
    validation={isConsolidationValid:true,durationDays:box.duration,coveragePct:coverage,rangeWidthPct:box.rangeWidth??(box.resistance-box.support)/((box.resistance+box.support)/2)*100,support:box.support,resistance:box.resistance,mid:(box.support+box.resistance)/2,currentPrice:prices.at(-1).close,boxPositionPct:pos,contextType:ctx.type||'NEUTRAL',contextLabel:ctx.label||'橫行盤整',isBottomCatching:ctx.type==='BOTTOM_BUILDING',precedingDropPct:ctx.precedingDropPct||0,positionVsMA200:ctx.positionVsMA200,reason:ctx.reason||'掃描時保存的結構分析',tacticalAdvice:ctx.reason||'以同次掃描支持／阻力與止蝕資料核對。'};
   }
   return {symbol,companyName:symbol,currency:stored.currency||'USD',regularMarketPrice:prices.at(-1).close,previousClose:prices.at(-2)?.close,prices,ema50:ema(prices,50),ema200:ema(prices,200),structure:{...structure,allPrices:prices},validation,scan_id:snapshot.scan_id,source:'scan-snapshot'};
  }
  window.fetch=async(input,options={})=>{
   const url=new URL(typeof input==='string'?input:input.url,location.href);
   if(!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
   const path=url.pathname;
   if(path==='/api/signals')return json({heroes:snapshot.heroes,sectors:d.sectors||[],scan_time:snapshot.scan_time,tg_text:snapshot.tg_text});
   if(path==='/api/stock-chart'){const result=chartData((url.searchParams.get('symbol')||'').toUpperCase());return result?json(result):json({error:'這次掃描未有此圖表'},404);}
   if(path==='/api/history')return json(d.history||[]);
   if(path==='/api/calibration'){
    if(options.method==='POST')return json({error:'靜態網站只支援當前瀏覽器校準'},405);
    return d.money?json({smart:d.money.smart_conf,dumb:d.money.dumb_conf,date:snapshot.scan_time,is_default:true}):json({},404);
   }
   if(path==='/api/sentiment')return d.money?json({smart_money:d.money.smart_conf,dumb_money:d.money.dumb_conf,components:[],source:d.money.source}):json({},404);
   return json({error:'此功能未包含在掃描快照'},404);
  };
  function fillMarket(){
   for(const card of document.querySelectorAll('[data-scan-index]')){
    const value=d.indices?.[card.dataset.scanIndex];const nums=card.querySelectorAll('.mono-num');
    if(nums[0])nums[0].textContent=value?`${value.change>=0?'+':''}${value.change.toFixed(2)}%`:'—';
    if(nums[1])nums[1].textContent=value?value.price.toLocaleString():'—';
    const badge=card.querySelector('.tracking-wider');if(badge&&value)badge.textContent=window.__INDEX_NAMES__[card.dataset.scanIndex];
   }
   const sentiment=d.sentiment||{};
   for(const id of ['chart-factor-smi','chart-factor-cboe','chart-factor-vix','chart-factor-lev']){const e=document.getElementById(id);if(e)e.textContent='未有同次因子數據';}
   for(const card of document.querySelectorAll('[data-scan-gauge]')){
    const key=card.dataset.scanGauge;const value=sentiment[key];const num=card.querySelector('[data-gauge-value]');if(num)num.textContent=Number.isFinite(value)?value.toFixed(key==='vix'?2:0):'—';
    const label=card.querySelector('[data-gauge-label]');if(label)label.textContent=key==='vix'?(Number.isFinite(value)?(value>=25?'高波動區':value>=20?'波動升溫':'較低波動區'):'未有資料'):(sentiment[key+'_label']||'未有資料');
    const needle=card.querySelector('[data-gauge-needle]');if(needle&&Number.isFinite(value)){const fraction=key==='vix'?(value-10)/30:value/100;needle.setAttribute('transform',`rotate(${Math.max(0,Math.min(1,fraction))*180-90},100,95)`);needle.removeAttribute('visibility');}
   }
   const source=document.getElementById('snapshot-money-source');if(source)source.textContent=d.money?.source||'這次掃描未有 Smart / Dumb Money 資料';
   for(const id of ['calib-input-smart','calib-input-dumb']){const e=document.getElementById(id);if(e)e.value=d.money?(id.endsWith('smart')?d.money.smart_conf:d.money.dumb_conf):'';}
   status.textContent=`掃描時間：${snapshot.scan_time} ｜所有數據固定於這次掃描`;if(!snapshot.dashboard)status.textContent+=' ｜舊快照未包含 ZONE01–04 資料，請重新跑一次掃描。';
  }
  const script=document.createElement('script');script.src='dashboard.js';script.onload=()=>{fillMarket();status.hidden=true;document.body.removeAttribute('data-snapshot-loading');};script.onerror=()=>{status.textContent='網站腳本未能載入，請重新整理。';};document.body.append(script);
 }catch(error){status.textContent=error.message;}
})();
