/* Ad-hoc charts stay separate from immutable scan results. */
window.singleStockResults = new Map();
(async () => {
  const form=document.getElementById('single-stock-form');
  if(!form)return;
  const input=document.getElementById('single-stock-symbol');
  const status=document.getElementById('single-stock-status');
  const button=document.getElementById('single-stock-submit');
  const local=['localhost','127.0.0.1','::1'].includes(location.hostname) || location.protocol==='http:';
  window.singleStockApiUrl=symbol=>(local ? '' : 'http://127.0.0.1:8765')+'/api/analyze?symbol='+encodeURIComponent(symbol);
  async function submit(event) {
    event?.preventDefault();
    if(button.disabled)return;
    const symbol=input.value.trim().toUpperCase();
    if(!/^[A-Z0-9^][A-Z0-9.^=!-]{0,24}$/.test(symbol)) {status.textContent='請輸入有效股票代號，例如 NVDA 或 BRK-B。';return;}
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),75000);
    button.disabled=true;status.textContent='正在下載日線並分析 '+symbol+'…';
    try {
      const response=await fetch(window.singleStockApiUrl(symbol),{signal:controller.signal,cache:'no-store'});
      const result=await response.json();
      if(!response.ok)throw Error(result.error || '分析失敗，請稍後再試。');
      if(!result.chart?.prices?.length || !result.hero || result.hero.symbol!==symbol)throw Error('分析服務回傳資料不完整。');
      window.singleStockResults.set(symbol,result);
      status.textContent=symbol+'｜資料截至 '+result.as_of+'｜'+result.analysis_note;
      if(typeof openHeroDrawer!=='function')throw Error('圖表尚未載入，請稍後再按分析。');
      openHeroDrawer(symbol,true);
    } catch(error) {
      status.textContent=error.name==='AbortError'?'分析逾時，請稍後重試。':error instanceof TypeError ? '連唔到電腦上的分析服務。請先執行「啟用背景單股分析.bat」，並允許瀏覽器存取本機網絡；手機不能使用電腦的 localhost。' : error.message;
    } finally {clearTimeout(timeout);button.disabled=false;}
  }
  form.addEventListener('submit',submit);
  const requested=new URLSearchParams(location.search).get('analyze');
  if(requested){input.value=requested;await submit();}
})();
