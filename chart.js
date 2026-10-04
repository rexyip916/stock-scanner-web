export function ema(prices, period){let current=0;return prices.map((p,i)=>{if(i<period){current+=(p.close-current)/(i+1);}else{current=p.close*2/(period+1)+current*(1-2/(period+1));}return current;});}
export function chartSvg(prices, structure, count=prices.length){
 if(!prices.length) throw Error('沒有真實價格資料');
 const start=Math.max(0,prices.length-count), bars=prices.slice(start), w=Math.max(760,bars.length*7+100), h=380, left=60, right=w-25, top=25, bottom=330;
 const current=structure?.currentRegime;const regimes=structure?.allRegimes||[];
 const boxes=[...regimes];if(current&&!boxes.includes(current))boxes.push(current);
 const min=Math.min(...bars.map(p=>p.low)),max=Math.max(...bars.map(p=>p.high)),pad=Math.max((max-min)*.08,.01),lo=min-pad,hi=max+pad;
 const x=i=>left+i*(right-left)/Math.max(1,bars.length-1),y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
 let body='';for(let i=0;i<5;i++){const value=lo+(hi-lo)*i/4;body+=`<line x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}" stroke="#334155"/><text x="2" y="${y(value)}">${value.toFixed(2)}</text>`;}
 for(const r of boxes){if(!r||!Number.isFinite(r.startIndex)||!Number.isFinite(r.endIndex)||!Number.isFinite(r.support)||!Number.isFinite(r.resistance))continue;const a=Math.max(0,r.startIndex-start),b=Math.min(bars.length-1,r.endIndex-start);if(b<a)continue;const yy=Math.max(top,y(r.resistance)),yb=Math.min(bottom,y(r.support));if(yb<=yy)continue;body+=`<rect x="${x(a)}" y="${yy}" width="${Math.max(4,x(b)-x(a))}" height="${yb-yy}" fill="#38bdf8" fill-opacity=".12" stroke="#38bdf8"/>`;}
 for(const [period,color] of [[50,'#fbbf24'],[200,'#c084fc']]){const values=ema(prices,period).slice(start);body+=`<polyline fill="none" stroke="${color}" stroke-width="1.5" points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}"/>`;}
 bars.forEach((p,i)=>{const color=p.close>=p.open?'#34d399':'#fb7185';const width=Math.max(2,Math.min(5,(right-left)/bars.length*.65));body+=`<g><title>${p.date} O:${p.open} H:${p.high} L:${p.low} C:${p.close}</title><line x1="${x(i)}" x2="${x(i)}" y1="${y(p.high)}" y2="${y(p.low)}" stroke="${color}"/><rect x="${x(i)-width/2}" y="${Math.min(y(p.open),y(p.close))}" width="${width}" height="${Math.max(1,Math.abs(y(p.open)-y(p.close)))}" fill="${color}"/></g>`;});
 for(const i of [0,Math.floor((bars.length-1)/2),bars.length-1])body+=`<text x="${x(i)}" y="360" text-anchor="middle">${bars[i].date}</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="width:${w}px" role="img" aria-label="真實掃描價格及盤整箱體">${body}</svg>`;
}
export function validateSnapshot(data,id){if(!data||!Array.isArray(data.heroes)||!data.charts||typeof data.tg_text!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(data.scan_id)||id&&data.scan_id!==id)throw Error('掃描資料不正確');for(const chart of Object.values(data.charts)){if(!Array.isArray(chart.prices)||chart.prices.some(p=>!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!['open','high','low','close'].every(k=>Number.isFinite(p[k]))))throw Error('價格資料格式不正確');}return data;}
