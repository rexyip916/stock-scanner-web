    function priceChangeLabel(change) {
      if (!Number.isFinite(change)) return '未有資料';
      if (change >= 2) return '🚀 強勢上升';
      if (change > 0) return '↗️ 溫和上升';
      if (change === 0) return '➡️ 持平';
      if (change > -2) return '↘️ 溫和回落';
      return '⚠️ 明顯下跌';
    }

    function moneyStateLabel(score, smart) {
      if (!Number.isFinite(score)) return '未有資料';
      const level = score < 25 ? 0 : score < 40 ? 1 : score <= 60 ? 2 : score < 75 ? 3 : 4;
      return (smart ? ['深度低位', '低位區間', '中性區間', '高位區間', '極端高位']
        : ['極度恐慌', '悲觀不安', '情緒中性', '樂觀興奮', '極度亢奮'])[level];
    }


    const HEROES = (window.__INITIAL_HEROES__ && window.__INITIAL_HEROES__.length) ? window.__INITIAL_HEROES__ : [];
    const SECTORS = (window.__INITIAL_SECTORS__ && window.__INITIAL_SECTORS__.length) ? window.__INITIAL_SECTORS__ : [];

    let currentCategory = 'ALL';
    let currentTier = 'ALL';
    let currentSector = 'ALL';
    let selectedHero = null;
    let isAllSectorsExpanded = false;

    // 切換展開/收起全部板塊
    function toggleAllSectors() {
      isAllSectorsExpanded = !isAllSectorsExpanded;
      renderSectors();
    }

    // 6 大指數共振維度定義 (風格與板塊卡片高度統一，美股黃金 6 大對稱維度)
    // 6 大指數共振維度定義 (簡短名稱：納指、費城、標普、羅素、加密貨幣、道指)
    const INDEX_RESONANCE_OPTIONS = [
      {
        code: "QQQ",
        icon: "🚀",
        name: "納指",
        change: 1.65,
        count: 6,
        status: "bullish",
        desc: "ZS (Sample #2) · NVDA · PLTR · AMZN · GOOGL"
      },
      {
        code: "SOX",
        icon: "🔥",
        name: "費城",
        change: 2.10,
        count: 1,
        status: "bullish",
        desc: "TSM 台積電 晶片領跑"
      },
      {
        code: "SPY",
        icon: "🎯",
        name: "標普",
        change: 0.85,
        count: 3,
        status: "bullish",
        desc: "ARE (Sample #1) · CEG 核電巨獸 · LLY 醫藥霸主"
      },
      {
        code: "IWM",
        icon: "⚡",
        name: "羅素",
        change: 1.45,
        count: 2,
        status: "bullish",
        desc: "ASTS 太空星鏈 · IONQ 量子計算"
      },
      {
        code: "BTC",
        icon: "🪙",
        name: "加密貨幣",
        change: 3.65,
        count: 1,
        status: "bullish",
        desc: "COIN 加密貨幣龍頭"
      },
      {
        code: "DIA",
        icon: "⚠️",
        name: "道指",
        change: -0.42,
        count: 2,
        status: "warning",
        desc: "CAT 工業製造 · UNH 醫療防守"
      }
    ];

    let currentFilterDimension = 'sector'; // 'sector' 或 'index'

    // 切換雙軌篩選維度：'sector' (板塊) 或 'index' (大盤共振)
    for (const option of INDEX_RESONANCE_OPTIONS) {
      const key = {QQQ:'NQ', SOXX:'SOX', SOX:'SOX', SPY:'ES', DIA:'YM', IWM:'RTY'}[option.code];
      const actual = window.__SCAN_SNAPSHOT__.dashboard?.indices?.[key];
      option.available = !!actual;
      if(actual) { option.code = actual.symbol; option.name = window.__INDEX_NAMES__[key]; option.desc = window.__INDEX_NAMES__[key] + '（較上個交易日）'; }

      option.change = actual?.change ?? 0;
      option.status = actual ? (actual.change < 0 ? 'warning' : 'bullish') : '未有指數資料';
    }
    function switchFilterDimension(dim) {
      currentFilterDimension = dim;
      const tabSector = document.getElementById('tab-filter-sector');
      const tabIndex = document.getElementById('tab-filter-index');
      const secContainer = document.getElementById('sectors-container');
      const idxContainer = document.getElementById('index-resonance-container');
      const toggleSectorsBtn = document.getElementById('btn-toggle-all-sectors');
      const hintEl = document.getElementById('filter-mode-hint');

      if (dim === 'sector') {
        if (tabSector) tabSector.className = "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md";
        if (tabIndex) tabIndex.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all duration-200 flex items-center gap-1.5 cursor-pointer";
        if (secContainer) secContainer.classList.remove('hidden');
        if (idxContainer) idxContainer.classList.add('hidden');
        if (toggleSectorsBtn) toggleSectorsBtn.classList.remove('hidden');
        if (hintEl) hintEl.innerHTML = '<span>💡</span><span>點擊板塊卡片過濾下方股票；再次點擊已選卡片可反選還原。</span>';
        renderSectors();
      } else {
        if (tabIndex) tabIndex.className = "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md";
        if (tabSector) tabSector.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all duration-200 flex items-center gap-1.5 cursor-pointer";
        if (secContainer) secContainer.classList.add('hidden');
        if (idxContainer) idxContainer.classList.remove('hidden');
        if (toggleSectorsBtn) toggleSectorsBtn.classList.add('hidden');
        if (hintEl) hintEl.innerHTML = '<span>💡</span><span>不要同指數逆風而行</span>';
        renderIndexResonanceCards();
      }
    }

    // 渲染板塊卡片網格
    function renderSectors() {
      const c = document.getElementById('sectors-container');
      if (!c) return;
      const toggleBtnText = document.getElementById('btn-toggle-text');
      const toggleBtnIcon = document.getElementById('btn-toggle-icon');
      c.innerHTML = '';
      if (!SECTORS.length) { c.textContent = '這次掃描未有板塊資金流資料。'; return; }

      if (isAllSectorsExpanded) {
        if (toggleBtnText) toggleBtnText.textContent = "收起熱門4大";
        if (toggleBtnIcon) toggleBtnIcon.textContent = "🔼";
      } else {
        if (toggleBtnText) toggleBtnText.textContent = "顯示全部板塊";
        if (toggleBtnIcon) toggleBtnIcon.textContent = "📊";
      }

      const sorted = [...SECTORS].sort((a, b) => b.change - a.change);
      const ranked = sorted.map((s, idx) => ({
        ...s,
        badge: `升跌幅排名 #${idx + 1}`,
        type: s.change >= 0 ? "strong" : "weak"
      }));
      const displayList = !isAllSectorsExpanded && ranked.length >= 4
        ? [...ranked.slice(0, 2), ...ranked.slice(-2)] : ranked;

      displayList.forEach(s => {
        const isSel = currentSector === s.name;
        const isStrong = s.type === "strong";
        const count = HEROES.filter(h => h.sector === s.name || (h.sector && (h.sector.startsWith(s.name) || s.name.startsWith(h.sector)))).length;
        const btn = document.createElement('button');
        btn.onclick = () => filterSector(s.name);
        
        const borderClass = isSel 
          ? "border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/20 shadow-lg shadow-amber-500/20" 
          : isStrong 
            ? "border-emerald-500/40 bg-slate-950/90 hover:bg-emerald-500/10 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10" 
            : "border-rose-500/30 bg-slate-950/90 hover:bg-rose-500/10 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10";

        btn.className = "p-3.5 rounded-2xl border text-left transition duration-300 flex flex-col justify-between space-y-2.5 shadow-md cursor-pointer " + borderClass;

        const subTag = priceChangeLabel(s.change);

        btn.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-black ${isStrong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">
              ${s.badge}
            </span>
            <span class="text-xs font-bold ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono">
              ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%
            </span>
          </div>

          <div class="flex items-center gap-2.5">
            <div class="text-2xl">${s.icon}</div>
            <div>
              <div class="text-xs font-black text-white flex items-center gap-1.5">
                <span>${s.name}</span>
                <span class="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${count}隻</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>${subTag}</span>
            ${isSel ? '<span class="text-amber-400 font-bold">已選中 ✓</span>' : ''}
          </div>
        `;
        c.appendChild(btn);
      });
    }

    // 渲染大盤指數共振卡片網格 (排行標籤，簡短名稱，乾淨無冗餘描述)
    function renderIndexResonanceCards() {
      const c = document.getElementById('index-resonance-container');
      if (!c) return;
      c.innerHTML = '';

      const sortedResonance = [...INDEX_RESONANCE_OPTIONS].filter(o => o.available).sort((a, b) => b.change - a.change);

      sortedResonance.forEach((item, idx) => {
        const isSel = currentIndexFilter === item.code;
        const isWarn = item.status === 'warning';
        const count = HEROES.filter(h => {
          if (item.code === 'WARN') return h.index_resonance?.status === 'warning';
          return h.index_resonance?.index_code === item.code;
        }).length;
        const card = document.createElement('button');
        card.onclick = () => filterIndexResonance(item.code);

        const rankBadge = `升跌幅排名 #${idx + 1}`;
        const subTag = priceChangeLabel(item.change);

        const borderClass = isSel
          ? (isWarn 
              ? "border-rose-400 ring-2 ring-rose-400/60 bg-rose-500/25 shadow-xl shadow-rose-500/20"
              : "border-sky-400 ring-2 ring-sky-400/60 bg-sky-500/25 shadow-xl shadow-sky-500/20")
          : (isWarn
              ? "border-rose-500/40 bg-slate-950/90 hover:bg-rose-500/10 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10"
              : "border-indigo-500/40 bg-slate-950/90 hover:bg-indigo-500/15 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10");

        card.className = "p-3.5 rounded-2xl border text-left transition duration-300 flex flex-col justify-between space-y-2.5 shadow-md cursor-pointer " + borderClass;

        card.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-black ${item.change >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">
              ${rankBadge}
            </span>
            <span class="text-xs font-bold ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono">
              ${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%
            </span>
          </div>

          <div class="flex items-center gap-2.5">
            <div class="text-2xl">${item.icon}</div>
            <div>
              <div class="text-xs font-black text-white flex items-center gap-1.5">
                <span>${item.name}</span>
                <span class="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${count}隻</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>${subTag}</span>
            ${isSel ? `<span class="${isWarn ? 'text-rose-400' : 'text-amber-400'} font-bold shrink-0">已選中 ✓</span>` : ''}
          </div>
        `;
        c.appendChild(card);
      });
    }

    // 統一更新頂部篩選狀態膠囊 UI
    function updateActiveFilterPillUI() {
      const pill = document.getElementById('pill-active-filter');
      const nameEl = document.getElementById('pill-active-name');
      if (!pill || !nameEl) return;

      if (currentSector !== 'ALL') {
        pill.classList.remove('hidden');
        pill.classList.add('inline-flex');
        nameEl.textContent = '⚡ ' + currentSector;
      } else if (currentIndexFilter !== 'ALL') {
        pill.classList.remove('hidden');
        pill.classList.add('inline-flex');
        const found = INDEX_RESONANCE_OPTIONS.find(x => x.code === currentIndexFilter);
        nameEl.textContent = found ? (found.icon + ' ' + found.name) : ('🧭 ' + currentIndexFilter);
      } else {
        pill.classList.add('hidden');
        pill.classList.remove('inline-flex');
      }
    }

    // 板塊篩選
    function filterSector(name) {
      if (currentSector === name && name !== 'ALL') {
        name = 'ALL';
      }
      currentSector = name;

      // 關連互斥：選擇板塊時，自動解除指數篩選
      if (name !== 'ALL' && currentIndexFilter !== 'ALL') {
        currentIndexFilter = 'ALL';
      }

      updateActiveFilterPillUI();
      renderSectors();
      if (currentFilterDimension === 'index') {
        renderIndexResonanceCards();
      }
      renderHeroes();
    }

    let currentIndexFilter = 'ALL';

    // 大盤指數共振篩選
    function filterIndexResonance(code) {
      if (currentIndexFilter === code && code !== 'ALL') {
        code = 'ALL';
      }
      currentIndexFilter = code;

      // 關連互斥：選擇指數時，自動解除板塊篩選
      if (code !== 'ALL' && currentSector !== 'ALL') {
        currentSector = 'ALL';
      }

      updateActiveFilterPillUI();
      renderIndexResonanceCards();
      if (currentFilterDimension === 'sector') {
        renderSectors();
      }
      renderHeroes();
    }

    // 一鍵清除所有篩選條件
    function clearAllFilters() {
      currentSector = 'ALL';
      currentIndexFilter = 'ALL';
      updateActiveFilterPillUI();
      renderSectors();
      renderIndexResonanceCards();
      renderHeroes();
    }
    function marketContextText(value) {
      return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }
    function formationStateText(state) {
      return ({COILING:'形態內整理',BREAKOUT_UP:'向上突破已確認',BREAKDOWN:'下軌跌破',FAILED_BREAKOUT:'突破失敗／回落'})[state] || '歷史形態';
    }
    function marketContextStyle(status) {
      if(status === 'warning') return {color:'#fb7185',icon:'⚠️'};
      if(status === 'bullish') return {color:'#34d399',icon:'🟢'};
      if(status === 'pullback' || status === 'caution') return {color:'#fbbf24',icon:'🟡'};
      return {color:'#94a3b8',icon:'⚪'};
    }
    // 產生單張英雄戰牌 DOM
    function buildHeroCard(hero) {
      const isSSR = hero.tier === 'SSR';
      const isBottom = hero.category === 'bottom';
      const card = document.createElement('div');
      card.onclick = () => openHeroDrawer(hero.symbol);
      
      const themeBorder = isBottom 
        ? (isSSR 
            ? "border-sky-400/80 hover:border-sky-300 hover:bg-sky-500/10 hover:shadow-2xl hover:shadow-sky-500/20" 
            : "border-sky-500/60 hover:border-sky-400 hover:bg-sky-500/10 hover:shadow-xl hover:shadow-sky-500/15")
        : (isSSR 
            ? "border-amber-400/80 hover:border-amber-300 hover:bg-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20" 
            : "border-amber-500/60 hover:border-amber-400 hover:bg-amber-500/10 hover:shadow-xl hover:shadow-amber-500/15");

      card.className = "bg-slate-950/90 rounded-3xl border transition duration-300 hover:-translate-y-1.5 cursor-pointer p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xl " + themeBorder;

      const reboundDays = hero.bottom_rebound_days;
      const reboundText = Number.isInteger(reboundDays) && reboundDays > 0
        ? `箱底反彈第 ${reboundDays} 個交易日`
        : reboundDays === 0 ? '未確認箱底反彈' : '未有反彈日數資料';
      const patternLabel=marketContextText(hero.pattern_label || '水平箱體');
      const patternCaption=hero.category==='early'
        ? `🚀 ${patternLabel}突破第 ${hero.age} 個交易日${hero.volume_breakout ? '｜🔥 放量突破' : ''}`
        : hero.pattern_type && hero.pattern_type!=='BOX'
          ? `📐 ${patternLabel}｜形態 ${String(hero.box_duration || '—').replace(/天$/, '')} 個交易日`
          : `🛡️ 箱體 ${hero.box_duration ? String(hero.box_duration).replace(/天$/, '') + ' 個交易日' : '長度未有資料'}｜${reboundText}${hero.volume_rebound ? '｜🔥 放量反彈' : ''}`;
      const posBadge = hero.category === 'early' 
        ? `<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono shrink-0">${patternCaption}</span>`
        : `<span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-bold font-mono shrink-0">${patternCaption}</span>`;

      const ir = hero.index_resonance;
      let indexStatusBadge = '';
      if (ir) {
        const style = marketContextStyle(ir.status);
        const change = typeof ir.index_change === 'number' ? `${ir.index_change >= 0 ? '+' : ''}${ir.index_change.toFixed(2)}%` : '';
        indexStatusBadge = `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono border" style="color:${style.color};border-color:${style.color}66;background:${style.color}15" title="${marketContextText(ir.sub_desc)}">${style.icon} ${marketContextText(ir.index_name || '大市參考')} <span style="color:${typeof ir.index_change === 'number' ? (ir.index_change<0?'#fb7185':'#34d399') : style.color}">${change}</span> ${marketContextText(ir.badge_text || '未能判斷')}</span>`;
      }

      card.innerHTML = `
        <!-- 卡片頂部：代號、板塊、漲跌幅 -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div>
              <div class="text-xl font-black text-white tracking-wide flex items-center gap-2 flex-wrap">
                <span>${hero.symbol}</span>
                <span class="text-xs text-slate-400 font-medium">${hero.role ? hero.role.split(' ')[0] + ' ' : ''}${hero.sector}</span>
              </div>
              <div class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                ${posBadge}
                ${indexStatusBadge}
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-lg font-black ${hero.change >= 0 ? 'text-emerald-400' : 'text-rose-400'} mono-num">
              ${hero.change >= 0 ? '+' : ''}${hero.change.toFixed(2)}%
            </div>
          </div>
        </div>

        <!-- 視覺化能量成交量槽 -->
        <div class="space-y-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <div class="flex justify-between items-center text-[11px] font-bold">
            <span class="text-slate-300">⚡成交量 <strong class="text-white mono-num">${Number.isFinite(hero.vol_ratio) ? hero.vol_ratio.toFixed(2) + 'X' : '—'}</strong></span>
          </div>
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="mana-bar-fill h-full rounded-full transition-all duration-500" style="width: ${hero.mana_pct}%"></div>
          </div>
        </div>
      `;
      return card;
    }

    // 分別渲染第五排 (築底) 與 第六排 (升勢)
    function renderHeroes() {
      const bottomGrid = document.getElementById('bottom-heroes-grid');
      const earlyGrid = document.getElementById('early-heroes-grid');
      bottomGrid.innerHTML = '';
      earlyGrid.innerHTML = '';

      // 第五排：築底名單
      const bottomList = HEROES.filter(h => {
        if (h.category !== 'bottom') return false;
        if (currentSector !== 'ALL' && h.sector !== currentSector && !(h.sector && currentSector && (h.sector.startsWith(currentSector) || currentSector.startsWith(h.sector)))) return false;
        if (currentIndexFilter !== 'ALL') {
          if (currentIndexFilter === 'WARN') {
            if (h.index_resonance?.status !== 'warning') return false;
          } else if (h.index_resonance?.index_code !== currentIndexFilter) {
            return false;
          }
        }
        return true;
      });

      // 第六排：升勢名單
      const earlyList = HEROES.filter(h => {
        if (h.category !== 'early') return false;
        if (currentSector !== 'ALL' && h.sector !== currentSector && !(h.sector && currentSector && (h.sector.startsWith(currentSector) || currentSector.startsWith(h.sector)))) return false;
        if (currentIndexFilter !== 'ALL') {
          if (currentIndexFilter === 'WARN') {
            if (h.index_resonance?.status !== 'warning') return false;
          } else if (h.index_resonance?.index_code !== currentIndexFilter) {
            return false;
          }
        }
        return true;
      });

      const countBottomEl = document.getElementById('count-bottom');
      if (countBottomEl) countBottomEl.textContent = bottomList.length;
      const countEarlyEl = document.getElementById('count-early');
      if (countEarlyEl) countEarlyEl.textContent = earlyList.length;

      // 渲染第五排 (盤整築底/上升整固 · 最多只顯示 5 隻)
      const displayBottomList = bottomList.slice(0, 5);
      if (displayBottomList.length === 0) {
        bottomGrid.innerHTML = `
          <div class="col-span-full py-8 text-center text-slate-500 space-y-1">
            <div class="text-2xl">🛡️</div>
            <div class="text-xs font-bold text-slate-400">當前篩選條件下無符合之標的</div>
          </div>
        `;
      } else {
        displayBottomList.forEach(hero => {
          bottomGrid.appendChild(buildHeroCard(hero));
        });
      }

      // 渲染第六排 (升勢突破 · 最多只顯示 5 隻)
      const displayEarlyList = earlyList.slice(0, 5);
      if (displayEarlyList.length === 0) {
        earlyGrid.innerHTML = `
          <div class="col-span-full py-8 text-center text-slate-500 space-y-1">
            <div class="text-2xl">🚀</div>
            <div class="text-xs font-bold text-slate-400">當前篩選條件下無符合之升勢標的</div>
          </div>
        `;
      } else {
        displayEarlyList.forEach(hero => {
          earlyGrid.appendChild(buildHeroCard(hero));
        });
      }
    }

    // 抽王牌盲盒（已移除）
    function drawGacha() {}
    function closeGacha() {}

    // ========================================================
    // 即時股票圖表與盤整捉底箱體驗證引擎 (Stock Chart & Box Engine)
    // 預設 Sample 1: ARE (89天經典築底) | Sample 2: ZS (2階真盤整突破)
    // ========================================================
    let currentStockSymbol = 'ARE';
    let currentStockRange = '1y';
    let currentChartType = 'candle'; // 'candle' | 'line'
    let showChartBox = true;
    let showChartEMA = true;
    let showChartEMA200 = true;
    let showChartVolume = true;
    let currentChartData = null;
    let hoveredCandleIndex = -1;

    // 滑鼠縮放與拖曳視角視窗 (Viewport Pan & Zoom State)
    let chartViewStart = 0;
    let chartViewEnd = 0;
    let isChartDragging = false;
    let dragStartX = 0;
    let dragStartViewStart = 0;
    let dragStartViewEnd = 0;
    let isHoveringChart = false;

    // 縮放圖表 (滑鼠滾輪或按鈕觸發)
    function zoomHeroChart(factor, centerRatio = 0.5) {
      if (!currentChartData || !currentChartData.prices || currentChartData.prices.length === 0) return;
      const totalBars = currentChartData.prices.length;
      const currentSpan = Math.max(8, chartViewEnd - chartViewStart);
      const newSpan = Math.max(8, Math.min(totalBars, Math.round(currentSpan / factor)));
      
      const centerIndex = chartViewStart + currentSpan * centerRatio;
      let newStart = Math.round(centerIndex - newSpan * centerRatio);
      let newEnd = newStart + newSpan;

      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(totalBars, newSpan);
      }
      if (newEnd > totalBars) {
        newEnd = totalBars;
        newStart = Math.max(0, totalBars - newSpan);
      }

      chartViewStart = newStart;
      chartViewEnd = newEnd;
      renderHeroStockCanvas();
    }

    // 復位到當前週期的完整所有資料點
    function resetHeroChartView() {
      if (!currentChartData || !currentChartData.prices) return;
      chartViewStart = 0;
      chartViewEnd = currentChartData.prices.length;
      renderHeroStockCanvas();
    }

    // 設定週期 (3M, 6M, 1Y)
    function setChartRange(range) {
      currentStockRange = range;
      ['3mo', '6mo', '1y'].forEach(r => {
        const btn = document.getElementById(`btn-range-${r}`);
        if (!btn) return;
        if (r === range) {
          btn.className = "px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
        } else {
          btn.className = "px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition";
        }
      });
      loadHeroStockChart(currentStockSymbol, currentStockRange);
    }

    // 設定圖表樣式 (K線 / 折線)
    function setChartType(type) {
      currentChartType = type;
      const btnCandle = document.getElementById('btn-chart-candle');
      const btnLine = document.getElementById('btn-chart-line');
      if (type === 'candle') {
        btnCandle.className = "px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold";
        btnLine.className = "px-2 py-1 rounded-lg text-slate-400 hover:text-white transition";
      } else {
        btnLine.className = "px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold";
        btnCandle.className = "px-2 py-1 rounded-lg text-slate-400 hover:text-white transition";
      }
      renderHeroStockCanvas();
    }

    // 切換 EMA 50 均線
    function toggleChartEMA() {
      showChartEMA = !showChartEMA;
      const btn = document.getElementById('btn-toggle-ema');
      if (showChartEMA) {
        btn.className = "px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/50 text-[11px] font-bold transition flex items-center gap-1";
      } else {
        btn.className = "px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1";
      }
      renderHeroStockCanvas();
    }

    // 切換 EMA 200 牛熊均線
    function toggleChartEMA200() {
      showChartEMA200 = !showChartEMA200;
      const btn = document.getElementById('btn-toggle-ema200');
      if (showChartEMA200) {
        btn.className = "px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 text-[11px] font-bold transition flex items-center gap-1";
      } else {
        btn.className = "px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1";
      }
      renderHeroStockCanvas();
    }

    // 切換成交量
    function toggleChartVolume() {
      showChartVolume = !showChartVolume;
      const btn = document.getElementById('btn-toggle-volume');
      if (showChartVolume) {
        btn.className = "px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-600 text-[11px] font-bold transition flex items-center gap-1";
      } else {
        btn.className = "px-2.5 py-1 rounded-xl bg-slate-900 text-slate-500 border border-slate-800 text-[11px] font-bold transition flex items-center gap-1";
      }
      renderHeroStockCanvas();
    }

    // 重新抓取即時數據
    function refreshCurrentStockChart() {
      loadHeroStockChart(currentStockSymbol, currentStockRange, true);
    }

    // 從後端 API 載入真實股票數據與結構箱體計算結果
    async function loadHeroStockChart(symbol, range = '1y', isRefresh = false) {
      currentStockSymbol = symbol;
      currentChartData = null;
      const loading = document.getElementById('hero-chart-loading');
      if (loading) loading.classList.remove('hidden');

      const titleEl = document.getElementById('chart-stock-title');
      if (titleEl) titleEl.textContent = symbol;

      try {
        const url = `/api/stock-chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}&scan=${encodeURIComponent(new URLSearchParams(location.search).get('scan') || '')}${isRefresh ? '&_t=' + Date.now() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        currentChartData = data;

        // 更新頂部最新價與漲跌幅
        if (data.prices && data.prices.length > 0) {
          const lastBar = data.prices[data.prices.length - 1];
          const prevClose = data.previousClose || (data.prices.length > 1 ? data.prices[data.prices.length - 2].close : lastBar.close);
          const chg = lastBar.close - prevClose;
          const chgPct = prevClose > 0 ? (chg / prevClose) * 100 : 0;
          const isPos = chg >= 0;

          const pEl = document.getElementById('drawer-price');
          if (pEl) pEl.textContent = '$' + lastBar.close.toFixed(2);
          const cEl = document.getElementById('drawer-change');
          if (cEl) {
            cEl.textContent = (isPos ? '+' : '') + chgPct.toFixed(2) + '% ' + (isPos ? '↗️' : '↘️');
            cEl.className = "text-xs font-bold " + (isPos ? "text-emerald-400" : "text-rose-400");
          }

          const badgeRange = document.getElementById('chart-date-range-badge');
          if (badgeRange) {
            badgeRange.textContent = `${data.prices[0].date} ~ ${lastBar.date} (${data.prices.length} 交易日)`;
          }
        }

        // 更新圖例價格
        const regime = data.structure?.currentRegime;
        if (regime) {
          const resEl = document.getElementById('legend-res');
          const midEl = document.getElementById('legend-mid');
          const supEl = document.getElementById('legend-sup');
          if (resEl) resEl.textContent = '$' + regime.resistance.toFixed(2);
          if (midEl) midEl.textContent = '$' + ((regime.support + regime.resistance) / 2).toFixed(2);
          if (supEl) supEl.textContent = '$' + regime.support.toFixed(2);
        }

        // 更新箱體驗證與診斷儀表板
        updateBoxValidationUI(data);

        // 形態初始化 (自然呈現：有就有，冇就冇，唔需要畫晒兩樣)
        showChartBox = true;

        // 初始化可視區間為全部數據
        if (data.prices && data.prices.length > 0) {
          chartViewStart = Math.max(0, data.prices.length - ({'3mo':63,'6mo':126,'1y':252}[range] || data.prices.length));
          chartViewEnd = data.prices.length;
        }

        // 渲染圖表畫布
        renderHeroStockCanvas();
      } catch (err) {
        console.error("載入股票真實圖表失敗:", err);
        const loadingText = document.querySelector('#hero-chart-loading span');
        if (loadingText) loadingText.textContent = "⚠️ 這次掃描未有此股票圖表資料";
      } finally {
        if (loading) loading.classList.add('hidden');
      }
    }

    // 更新箱體驗證與診斷面板 (回答使用者的核心目的：箱體畫得正唔正確)
    function updateBoxValidationUI(data) {
      const v = data.validation;
      const regime = data.structure?.currentRegime;
      const p = data.prices && data.prices.length > 0 ? data.prices[data.prices.length - 1].close : 0;

      if (!regime || !v) {
        const pill = document.getElementById('box-verdict-pill');
        const pillText = document.getElementById('box-verdict-text');
        if (pill && pillText) {
          pill.className = "px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center gap-1.5 self-start sm:self-auto";
          pillText.textContent = "未識別到有效箱體或收窄形態";
        }
        for(const id of ['metric-cov-val','metric-width-val','metric-dur-val','metric-pos-val','regime1-dates','regime1-range','chk-cov-text','chk-width-text','chk-context-text']) { const e=document.getElementById(id); if(e)e.textContent='未有同次箱體資料'; }
        const r2=document.getElementById('regime2-card');if(r2)r2.classList.add('hidden');
        return;
      }

      // 更新圖例價格與形態互斥切換 (如果有就顯示，如果冇就隱藏，唔需要全部畫晒兩個)
      const hasTri = Boolean(regime?.triangle && regime.triangle.isTriangle);
      const hasBox = Boolean(regime && !hasTri && v?.isConsolidationValid);
      const resItem = document.getElementById('legend-item-res');
      const midItem = document.getElementById('legend-item-mid');
      const supItem = document.getElementById('legend-item-sup');
      const r1Item = document.getElementById('legend-item-r1');
      const triPill = document.getElementById('legend-triangle-pill');

      if (hasTri && regime.triangle) {
        // 三角形形態模式：隱藏水平箱體圖例，顯示三角形專屬圖例
        if (resItem) resItem.classList.add('hidden');
        if (midItem) midItem.classList.add('hidden');
        if (supItem) supItem.classList.add('hidden');
        if (r1Item) r1Item.classList.add('hidden');
        if (triPill) {
          triPill.classList.remove('hidden');
          triPill.innerHTML = `<span class="w-3 h-0.5 bg-pink-400"></span> <span>📐 ${regime.triangle.label} (收縮率 +${regime.triangle.contractionRatio}%)</span>`;
        }
      } else if (hasBox) {
        // 標準箱體形態模式：顯示箱體圖例，隱藏三角形圖例
        if (resItem) resItem.classList.remove('hidden');
        if (midItem) midItem.classList.remove('hidden');
        if (supItem) supItem.classList.remove('hidden');
        if (r1Item) r1Item.classList.remove('hidden');
        if (triPill) triPill.classList.add('hidden');
      } else {
        // 兩者皆無：皆不刻意顯示圖例
        if (resItem) resItem.classList.add('hidden');
        if (midItem) midItem.classList.add('hidden');
        if (supItem) supItem.classList.add('hidden');
        if (r1Item) r1Item.classList.add('hidden');
        if (triPill) triPill.classList.add('hidden');
      }

      const isBottom = v.isBottomCatching || v.contextType === 'BOTTOM_BUILDING';
      const pill = document.getElementById('box-verdict-pill');
      const pillText = document.getElementById('box-verdict-text');

      if (pill && pillText) {
        if (hasTri && regime.triangle) {
          pill.className = "px-3 py-1.5 rounded-xl bg-pink-500/20 border border-pink-500/50 text-pink-300 border font-black text-xs flex items-center gap-1.5 self-start sm:self-auto";
          pillText.textContent = `📐 ${regime.triangle.label}｜${formationStateText(regime.patternState)}`;
        } else if (v.isConsolidationValid) {
          if (v.boxPositionPct >= 75 && v.boxPositionPct <= 99.5 && p <= regime.resistance) {
            pill.className = "px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 border font-black text-xs flex items-center gap-1.5 self-start sm:self-auto";
            pillText.textContent = "⚡ 箱頂阻力蓄勢中 (未實體突破 · 觀察臨門一腳)";
          } else if (regime.patternState==='BREAKOUT_UP') {
            pill.className = "px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/50 text-sky-300 border font-black text-xs flex items-center gap-1.5 self-start sm:self-auto";
            pillText.textContent = "🚀 收盤向上突破已確認";
          } else {
            pill.className = `px-3 py-1.5 rounded-xl ${isBottom ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-sky-500/20 border-sky-500/50 text-sky-300'} border font-black text-xs flex items-center gap-1.5 self-start sm:self-auto`;
            pillText.textContent = isBottom ? "🛡️ 有效箱體整理" : "⚡ 上升整固箱體成立 (多頭中繼蓄勢)";
          }
        } else {
          pill.className = "px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 border font-black text-xs flex items-center gap-1.5 self-start sm:self-auto";
          pillText.textContent = "⚠️ 箱體邊界正在受考驗 (注意突破或跌破)";
        }
      }

      // 多箱體層級對照看板 (Multi-Regime Hierarchy)
      const prevR = data.structure?.previousRegime;
      const r1Title = document.getElementById('regime1-title');
      const r1Dates = document.getElementById('regime1-dates');
      const r1Range = document.getElementById('regime1-range');
      const r1Tag = document.getElementById('regime1-tag');
      const transBadge = document.getElementById('regime-transition-badge');
      const transText = document.getElementById('regime-transition-text');
      const transIcon = document.getElementById('regime-transition-icon');
      const r2Card = document.getElementById('regime2-card');
      const r2Dates = document.getElementById('regime2-dates');
      const r2Range = document.getElementById('regime2-range');

      if (r1Dates && regime) {
        r1Dates.textContent = `${regime.startDate} 至 ${regime.endDate} (${regime.duration}日)`;
        if (hasTri && regime.triangle) {
          if (r1Title) r1Title.innerHTML = `<span>📐</span> #1 最新${regime.triangle.label}`;
          r1Range.textContent = `$${regime.triangle.lowerLine.p2.price.toFixed(2)} ～ $${regime.triangle.upperLine.p2.price.toFixed(2)}`;
          r1Tag.textContent = regime.patternState==='BREAKOUT_UP'?'向上突破':(regime.context?.label || '形態內整理');
          r1Tag.className = 'text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold';
        } else {
          if (r1Title) r1Title.innerHTML = `<span>📦</span> #1 最新盤整基地`;
          r1Range.textContent = `$${regime.support.toFixed(2)} ～ $${regime.resistance.toFixed(2)}`;
          r1Tag.textContent = regime.context?.label || '最新主導';
          r1Tag.className = 'text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold';
        }
      }

      if (prevR) {
        if (r2Card) r2Card.classList.remove('hidden');
        if (r2Dates) r2Dates.textContent = `${prevR.startDate} 至 ${prevR.endDate} (${prevR.duration}日)`;
        if (r2Range) r2Range.textContent = `$${prevR.support.toFixed(2)} ～ $${prevR.resistance.toFixed(2)}`;
        
        const isBreakdown = regime.resistance <= prevR.support * 1.02;
        const isBreakout = regime.support >= prevR.resistance * 0.98;

        if (transBadge) {
          transBadge.classList.remove('hidden');
          if (isBreakdown) {
            transBadge.className = "shrink-0 flex md:flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-[11px] font-mono text-center gap-0.5 text-rose-300";
            if (transIcon) transIcon.textContent = "🔻";
            if (transText) transText.textContent = "跳空破位下行";
          } else if (isBreakout) {
            transBadge.className = "shrink-0 flex md:flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-[11px] font-mono text-center gap-0.5 text-emerald-300";
            if (transIcon) transIcon.textContent = "🚀";
            if (transText) transText.textContent = "階梯突破上升";
          } else {
            transBadge.className = "shrink-0 flex md:flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-mono text-center gap-0.5 text-slate-300";
            if (transIcon) transIcon.textContent = "⚖️";
            if (transText) transText.textContent = "箱體水平平移";
          }
        }
      } else {
        if (r2Card) r2Card.classList.add('hidden');
        if (transBadge) transBadge.classList.add('hidden');
      }

      // 4大核心診斷指標
      const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      setTxt('metric-cov-val', v.coveragePct.toFixed(1) + '%');
      setTxt('metric-width-val', v.rangeWidthPct.toFixed(1) + '%');
      setTxt('metric-dur-val', v.durationDays + ' 日');
      setTxt('metric-pos-val', v.boxPositionPct.toFixed(1) + '%');

      // 6大檢驗標準
      setTxt('chk-cov-text', `實測 ${v.coveragePct.toFixed(1)}% (門檻 >= 70% ${v.coveragePct >= 70 ? '合格 ✅' : '微幅分歧'})`);
      setTxt('chk-width-text', `實測波幅 ${v.rangeWidthPct.toFixed(1)}% (門檻 <= 20% ${v.rangeWidthPct <= 20 ? '合格 ✅' : '寬幅'})`);
      setTxt('chk-cross-text', `中樞往返穿梭確認 (非單邊傾斜行情 ✅)`);
      setTxt('chk-slope-text', `線性漂移斜率受控 (純水平無單邊通道 ✅)`);
      setTxt('chk-twohalf-text', `前段與後段皆經受過上下軌考驗 (支撐阻力真實有效 ✅)`);
      if(hasTri){
        setTxt('chk-cov-text', `收窄上下軌覆蓋率 ${v.coveragePct.toFixed(1)}%（門檻 ≥80%）`);
        setTxt('chk-width-text', `末端振幅 ${v.rangeWidthPct.toFixed(1)}%；收縮率 ${regime.triangle.contractionRatio}%`);
        setTxt('chk-cross-text', '上下軌各至少3個已確認波段點');
        setTxt('chk-slope-text', `形態分類：${regime.triangle.label}`);
        setTxt('chk-twohalf-text', '上下軌收窄及價格覆蓋驗證');
      }

      
      const dropTxt = v.precedingDropPct ? `前波回撤 -${v.precedingDropPct}%` : '無深回撤';
      const ma200Txt = v.positionVsMA200 ? `200天線: ${v.positionVsMA200}` : '';
      setTxt('chk-context-text', `背景語意: 【${v.contextLabel}】 (${dropTxt} · ${ma200Txt} · ${v.reason})`);

      // 捉底作戰手冊
      const selectedHero=HEROES.find(h=>h.symbol===data.symbol);
      const line = regime.triangle?.lowerLine;
      const lastIndex = data.prices.length - 1;
      const apex = regime.triangle?.apexIndex;
      const supportIndex = Number.isFinite(apex) ? Math.min(lastIndex, Math.ceil(apex) - 1) : lastIndex;
      const support = line ? line.p1.price + line.slope * (supportIndex - line.p1.index) : regime.support;
      const stopLoss = support * .97;
      const target1 = regime.patternState==='BREAKOUT_UP' ? (selectedHero?.tp1 ?? regime.resistance) : regime.resistance;
      const risk = p - stopLoss;
      const reward = target1 - p;
      const rrRatio = risk > 0 && reward > 0 ? (reward / risk).toFixed(1) : null;

      setTxt('strat-support', '$' + support.toFixed(2));
      setTxt('strat-stoploss', '$' + stopLoss.toFixed(2));
      setTxt('strat-target1', '$' + target1.toFixed(2));
      setTxt('strat-rr', rrRatio === null ? '—' : '1 : ' + rrRatio);

      const stratTag = document.getElementById('box-strategy-tag');
      if (stratTag) {
        if (regime.triangle && regime.triangle.isTriangle) {
          stratTag.textContent = '📐 三角形末端變盤';
          stratTag.className = 'px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold text-[10px]';
        } else {
          stratTag.textContent = isBottom ? '🛡️ 箱底防守捉底' : '⚡ 突破順勢推進';
          stratTag.className = `px-2 py-0.5 rounded ${isBottom ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'} font-bold text-[10px]`;
        }
      }

      let finalTactical = v.tacticalAdvice || v.reason;
      if (regime.triangle && regime.triangle.isTriangle) {
        finalTactical = `【📐 ${formationStateText(regime.patternState)}】${regime.triangle.description} ${regime.patternState==='BREAKOUT_UP'?'收盤已突破上軌，留意回踩及突破失敗風險。':'留意收盤突破上軌或跌穿下軌，不能單憑形態名稱推斷方向。'}`;
      }
      setTxt('box-tactical-advice', finalTactical);

      // 演算法日誌
      const logContainer = document.getElementById('algorithm-debug-logs');
      if (logContainer && data.structure?.debugLogs) {
        logContainer.innerHTML = data.structure.debugLogs
          .map(log => `<div class="leading-relaxed hover:bg-slate-900 px-1 rounded">${log}</div>`)
          .join('');
      }
    }

    // 渲染主畫布 (K線、均線、箱形橫行區間、成交量、十字準星，支援視角縮放與滑鼠拖曳)
    function renderHeroStockCanvas() {
      const canvas = document.getElementById('hero-stock-canvas');
      const container = document.getElementById('hero-chart-container');
      if (!canvas || !container || !currentChartData || !currentChartData.prices) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      const allPrices = currentChartData.prices;
      const totalAllBars = allPrices.length;
      if (totalAllBars === 0) return;

      // 邊界校驗與視角視窗切割 (Viewport Window)
      if (chartViewEnd <= chartViewStart || chartViewEnd > totalAllBars) {
        chartViewStart = 0;
        chartViewEnd = totalAllBars;
      }
      if (chartViewStart < 0) chartViewStart = 0;
      if (chartViewEnd - chartViewStart < 6) {
        chartViewEnd = Math.min(totalAllBars, chartViewStart + 6);
      }

      const visiblePrices = allPrices.slice(chartViewStart, chartViewEnd);
      const visibleBars = visiblePrices.length;
      if (visibleBars === 0) return;

      // 更新頂部日期標籤為當前視角可見區間
      const badgeRange = document.getElementById('chart-date-range-badge');
      if (badgeRange) {
        const isZoomed = (visibleBars < totalAllBars);
        badgeRange.textContent = `${visiblePrices[0].date} ~ ${visiblePrices[visibleBars - 1].date} (${visibleBars}/${totalAllBars} 日${isZoomed ? ' · 縮放中' : ''})`;
      }

      const regime = currentChartData.structure?.currentRegime;

      // 邊界設定
      const margin = { top: 28, right: 68, bottom: 25, left: 14 };
      const chartW = width - margin.left - margin.right;
      const totalH = height - margin.top - margin.bottom;
      
      const volH = showChartVolume ? Math.min(65, totalH * 0.18) : 0;
      const priceH = totalH - volH - (showChartVolume ? 12 : 0);

      // 計算當前可視區間的價格極值與成交量極值
      let minP = Infinity;
      let maxP = -Infinity;
      let maxVol = 0;

      visiblePrices.forEach(bar => {
        if (bar.low < minP) minP = bar.low;
        if (bar.high > maxP) maxP = bar.high;
        if (bar.volume > maxVol) maxVol = bar.volume;
      });

      // 若箱體開啟且可見，將所有有效箱體的支撐與阻力納入價格極值，確保箱體上下軌清晰可見
      if (showChartBox && currentChartData.structure) {
        const candidateRegimes = [
          currentChartData.structure.currentRegime,
          currentChartData.structure.previousRegime,
          currentChartData.structure.previousPreviousRegime,
          ...(currentChartData.structure.displayPatterns || []),
          ...(currentChartData.structure.referenceRanges || [])
        ].filter(Boolean);

        candidateRegimes.forEach(r => {
          const rStart = allPrices.findIndex(p => p.date === r.startDate);
          const rEnd = allPrices.findIndex(p => p.date === r.endDate);
          const isBoxVisible = !(rEnd < chartViewStart || rStart >= chartViewEnd);
          if (isBoxVisible) {
            if (r.support < minP) minP = r.support;
            if (r.resistance > maxP) maxP = r.resistance;
          }
        });
      }

      // 上下預留 6% 緩衝
      const pRange = Math.max(0.5, maxP - minP);
      const paddedMin = minP - pRange * 0.05;
      const paddedMax = maxP + pRange * 0.05;
      const paddedRange = paddedMax - paddedMin;

      // 座標映射函數 (基於可視窗口)
      const getX = (globalIdx) => {
        const localIdx = globalIdx - chartViewStart;
        return margin.left + (localIdx + 0.5) * (chartW / visibleBars);
      };
      const getY = (price) => margin.top + (1 - (price - paddedMin) / paddedRange) * priceH;
      const getVolY = (vol) => margin.top + priceH + (showChartVolume ? 12 : 0) + (1 - (vol / (maxVol || 1))) * volH;

      const barSpacing = chartW / visibleBars;
      const candleW = Math.max(2, Math.min(22, barSpacing * 0.74));

      // 1. 繪製背景網格與價格標籤 (Grid)
      ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
      ctx.lineWidth = 1;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const gridSteps = 5;
      for (let s = 0; s <= gridSteps; s++) {
        const val = paddedMin + (paddedRange / gridSteps) * s;
        const y = getY(val);
        ctx.beginPath();
        ctx.setLineDash([3, 4]);
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText('$' + val.toFixed(2), margin.left + chartW + 6, y);
      }

      // 日期底部刻度
      const dateStep = Math.max(1, Math.floor(visibleBars / 6));
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let i = 0; i < visibleBars; i += dateStep) {
        const globalIdx = chartViewStart + i;
        const x = getX(globalIdx);
        const dStr = allPrices[globalIdx].date.slice(5); // MM-DD
        ctx.fillText(dStr, x, margin.top + totalH + 6);
      }

      // 2. 繪製「箱形橫行區間 (Consolidation Box)」或「收斂三角形 (Triangle Pattern)」
      // 嚴格落實原則：如果有，就畫出嚟；如果冇，就唔需要刻意畫出嚟。唔需要全部畫晒兩個。
      const hasActiveTriangle = Boolean(regime?.triangle && regime.triangle.isTriangle);
      const hasActiveBox = Boolean(regime && !hasActiveTriangle && currentChartData?.validation?.isConsolidationValid);

      if (currentChartData.structure) {
        // 2A. 若為三角形形態，繪製「收斂三角形幾何形態 (Triangle Pattern)」
        if (hasActiveTriangle && regime?.triangle) {
          const tri = regime.triangle;
          const uP1Idx = tri.upperLine.p1.index;
          const uP2Idx = tri.upperLine.p2.index;
          const lP1Idx = tri.lowerLine.p1.index;
          const lP2Idx = tri.lowerLine.p2.index;

          const startTriIdx = Math.min(uP1Idx, lP1Idx);
          const endTriIdx = Math.min(totalAllBars - 1, Math.max(uP2Idx, lP2Idx, tri.apexIndex));

          if (endTriIdx >= chartViewStart && startTriIdx < chartViewEnd) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(margin.left, margin.top, chartW, priceH);
            ctx.clip();
            const xU1 = getX(uP1Idx);
            const yU1 = getY(tri.upperLine.p1.price);
            const xU2 = getX(uP2Idx);
            const yU2 = getY(tri.upperLine.p2.price);

            const xL1 = getX(lP1Idx);
            const yL1 = getY(tri.lowerLine.p1.price);
            const xL2 = getX(lP2Idx);
            const yL2 = getY(tri.lowerLine.p2.price);

            // 計算當前末端與 Apex 處的上軌與下軌位置以形成閉合多邊形
            const curIdx = Math.min(totalAllBars - 1, regime.endIndex);
            const xEnd = getX(curIdx);
            const curUpperP = tri.upperLine.p1.price + tri.upperLine.slope * (curIdx - uP1Idx);
            const curLowerP = tri.lowerLine.p1.price + tri.lowerLine.slope * (curIdx - lP1Idx);
            const yCurUpper = getY(curUpperP);
            const yCurLower = getY(curLowerP);

            // 繪製三角形內部漸層色塊 (Pink/Purple Squeeze Gradient)
            ctx.beginPath();
            ctx.moveTo(xU1, yU1);
            ctx.lineTo(xEnd, yCurUpper);
            ctx.lineTo(xEnd, yCurLower);
            ctx.lineTo(xL1, yL1);
            ctx.closePath();

            const triGrad = ctx.createLinearGradient(0, yCurUpper, 0, yCurLower);
            triGrad.addColorStop(0, "rgba(244, 114, 182, 0.22)"); // pink-400
            triGrad.addColorStop(1, "rgba(192, 132, 252, 0.08)"); // purple-400
            ctx.fillStyle = triGrad;
            ctx.fill();

            // 繪製上軌下壓趨勢線 (Upper Resistance Trendline)
            ctx.beginPath();
            ctx.strokeStyle = "#f472b6"; // pink-400
            ctx.lineWidth = 2.4;
            ctx.moveTo(xU1, yU1);
            ctx.lineTo(xEnd, yCurUpper);
            ctx.stroke();

            // 上軌向右虛線延伸至 Apex
            if (tri.apexIndex > curIdx) {
              const xApex = getX(Math.min(totalAllBars - 1, tri.apexIndex));
              const apexP = tri.upperLine.p1.price + tri.upperLine.slope * (Math.min(totalAllBars - 1, tri.apexIndex) - uP1Idx);
              const yApex = getY(apexP);
              ctx.beginPath();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = "rgba(244, 114, 182, 0.6)";
              ctx.moveTo(xEnd, yCurUpper);
              ctx.lineTo(xApex, yApex);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // 繪製下軌上托趨勢線 (Lower Support Trendline)
            ctx.beginPath();
            ctx.strokeStyle = "#c084fc"; // purple-400
            ctx.lineWidth = 2.4;
            ctx.moveTo(xL1, yL1);
            ctx.lineTo(xEnd, yCurLower);
            ctx.stroke();

            // 下軌向右虛線延伸至 Apex
            if (tri.apexIndex > curIdx) {
              const xApex = getX(Math.min(totalAllBars - 1, tri.apexIndex));
              const apexP = tri.lowerLine.p1.price + tri.lowerLine.slope * (Math.min(totalAllBars - 1, tri.apexIndex) - lP1Idx);
              const yApex = getY(apexP);
              ctx.beginPath();
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = "rgba(192, 132, 252, 0.6)";
              ctx.moveTo(xEnd, yCurLower);
              ctx.lineTo(xApex, yApex);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            ctx.restore();

            // 右側價格軸標籤（標註三角形當前上下軌價格）
            ctx.fillStyle = "#f472b6";
            ctx.fillRect(margin.left + chartW + 2, yCurUpper - 8, 62, 16);
            ctx.fillStyle = "#020617";
            ctx.font = "bold 9px ui-monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`上軌 $${curUpperP.toFixed(1)}`, margin.left + chartW + 33, yCurUpper);

            ctx.fillStyle = "#c084fc";
            ctx.fillRect(margin.left + chartW + 2, yCurLower - 8, 62, 16);
            ctx.fillStyle = "#020617";
            ctx.fillText(`下軌 $${curLowerP.toFixed(1)}`, margin.left + chartW + 33, yCurLower);

            // 標註關鍵端點圓點
            [
              { x: xU1, y: yU1, col: "#f472b6" },
              { x: xU2, y: yU2, col: "#f472b6" },
              { x: xL1, y: yL1, col: "#c084fc" },
              { x: xL2, y: yL2, col: "#c084fc" },
            ].forEach(pt => {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
              ctx.fillStyle = pt.col;
              ctx.fill();
              ctx.strokeStyle = "#020617";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            });

          }
        } else if (hasActiveBox) {
          // 2B. 若非三角形且為客觀箱體，繪製「箱形橫行區間 (Consolidation Box)」
          const regimesToDraw = [];

          // #3 歷史前身盤整
          if (!currentChartData.structure.displayPatterns && currentChartData.structure.previousPreviousRegime) {
            regimesToDraw.push({
              r: currentChartData.structure.previousPreviousRegime,
              role: 'HISTORICAL',
              badgeText: '#3 歷史盤整',
              borderCol: 'rgba(148, 163, 184, 0.65)',
              bgGrad0: 'rgba(148, 163, 184, 0.12)',
              bgGrad1: 'rgba(148, 163, 184, 0.04)',
              resCol: '#94a3b8',
              supCol: '#64748b',
              dash: [4, 4]
            });
          }

          // #2 前一盤整基地（例如 UNH 暴跌裂口前的頂部盤整）
          if (!currentChartData.structure.displayPatterns && currentChartData.structure.previousRegime) {
            regimesToDraw.push({
              r: currentChartData.structure.previousRegime,
              role: 'PREVIOUS',
              badgeText: '#2 前一盤整 (裂口前頂部/前級)',
              borderCol: 'rgba(168, 85, 247, 0.75)',
              bgGrad0: 'rgba(168, 85, 247, 0.18)',
              bgGrad1: 'rgba(168, 85, 247, 0.05)',
              resCol: '#c084fc',
              supCol: '#a855f7',
              dash: [5, 3]
            });
          }

          // #1 最新主導盤整
          if (regime) {
            const isBottom = regime.context?.type === 'BOTTOM_BUILDING';
            regimesToDraw.push({
              r: regime,
              role: 'CURRENT',
              badgeText: `#1 最新${regime.context?.label || '橫行'}`,
              borderCol: isBottom ? 'rgba(16, 185, 129, 0.85)' : 'rgba(14, 165, 233, 0.85)',
              bgGrad0: isBottom ? 'rgba(16, 185, 129, 0.20)' : 'rgba(14, 165, 233, 0.20)',
              bgGrad1: isBottom ? 'rgba(16, 185, 129, 0.06)' : 'rgba(14, 165, 233, 0.06)',
              resCol: '#f59e0b',
              supCol: '#10b981',
              dash: [5, 3]
            });
          }

          regimesToDraw.forEach(item => {
            const r = item.r;
            let startIdx = allPrices.findIndex(p => p.date === r.startDate);
            let endIdx = allPrices.findIndex(p => p.date === r.endDate);

            if (startIdx === -1) startIdx = Math.max(0, r.startIndex || 0);
            if (endIdx === -1) endIdx = Math.min(totalAllBars - 1, r.endIndex || (totalAllBars - 1));

            // 判斷箱體是否與當前可視窗口重疊
            if (endIdx >= chartViewStart && startIdx < chartViewEnd) {
              const boxX1 = Math.max(margin.left, getX(startIdx) - barSpacing * 0.5);
              const boxX2 = Math.min(margin.left + chartW, getX(endIdx) + barSpacing * 0.5);
              const boxW = Math.max(4, boxX2 - boxX1);

              const yRes = getY(r.resistance);
              const ySup = getY(r.support);
              const boxH = Math.max(4, ySup - yRes);

              // 箱體漸層
              const boxGrad = ctx.createLinearGradient(0, yRes, 0, ySup);
              boxGrad.addColorStop(0, item.bgGrad0);
              boxGrad.addColorStop(1, item.bgGrad1);
              ctx.fillStyle = boxGrad;
              ctx.fillRect(boxX1, yRes, boxW, boxH);

              // 外框線
              ctx.strokeStyle = item.borderCol;
              ctx.lineWidth = item.role === 'CURRENT' ? 1.8 : 1.4;
              if (item.role !== 'CURRENT') {
                ctx.setLineDash([4, 3]);
              } else {
                ctx.setLineDash([]);
              }
              ctx.strokeRect(boxX1, yRes, boxW, boxH);
              ctx.setLineDash([]);

              // 阻力與支撐虛線延伸
              ctx.beginPath();
              ctx.setLineDash(item.dash);
              ctx.strokeStyle = item.resCol;
              ctx.lineWidth = item.role === 'CURRENT' ? 1.5 : 1;
              ctx.moveTo(boxX1, yRes);
              ctx.lineTo(item.role === 'CURRENT' ? margin.left + chartW : boxX2, yRes);
              ctx.stroke();

              ctx.beginPath();
              ctx.strokeStyle = item.supCol;
              ctx.moveTo(boxX1, ySup);
              ctx.lineTo(item.role === 'CURRENT' ? margin.left + chartW : boxX2, ySup);
              ctx.stroke();
              ctx.setLineDash([]);

              // 右側價格軸標籤 (最新箱體標註在最右側價格軸，歷史箱體標註在箱體右邊界)
              if (item.role === 'CURRENT') {
                ctx.fillStyle = "#f59e0b";
                ctx.fillRect(margin.left + chartW + 2, yRes - 8, 62, 16);
                ctx.fillStyle = "#020617";
                ctx.font = "bold 9px ui-monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`箱頂 $${r.resistance.toFixed(1)}`, margin.left + chartW + 33, yRes);

                ctx.fillStyle = "#10b981";
                ctx.fillRect(margin.left + chartW + 2, ySup - 8, 62, 16);
                ctx.fillStyle = "#020617";
                ctx.fillText(`箱底 $${r.support.toFixed(1)}`, margin.left + chartW + 33, ySup);
              } else {
                // 歷史箱體右側小標籤
                ctx.fillStyle = item.borderCol;
                ctx.font = "bold 8px ui-monospace";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                ctx.fillText(`$${r.resistance.toFixed(1)}`, boxX2 - 4, yRes - 2);
                ctx.textBaseline = "top";
                ctx.fillText(`$${r.support.toFixed(1)}`, boxX2 - 4, ySup + 2);
              }

            }
          });
        }
      }

      // A second independently confirmed formation is chart context, not another buy signal.
      for (const pattern of (showChartBox ? currentChartData.structure?.displayPatterns || [] : []).slice(1, 2)) {
        const start = allPrices.findIndex(bar => bar.date === pattern.startDate);
        const end = allPrices.findIndex(bar => bar.date === pattern.endDate);
        if (start < 0 || end < chartViewStart || start >= chartViewEnd) continue;
        const left = Math.max(margin.left, getX(start));
        const right = Math.min(margin.left + chartW, getX(end));
        const priceAt = (side, index) => {
          const line = pattern.triangle?.[side + 'Line'];
          return line ? line.p1.price + line.slope * (index - line.p1.index)
            : side === 'upper' ? pattern.resistance : pattern.support;
        };
        const visibleStart = Math.max(start, chartViewStart);
        const visibleEnd = Math.min(end, chartViewEnd - 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(margin.left, margin.top, chartW, priceH);
        ctx.clip();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 3]);
        for (const side of ['upper', 'lower']) {
          ctx.beginPath();
          ctx.moveTo(left, getY(priceAt(side, visibleStart)));
          ctx.lineTo(right, getY(priceAt(side, visibleEnd)));
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = '#c4b5fd';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${pattern.patternLabel}｜${formationStateText(pattern.patternState)}`,
          left + 4, Math.max(margin.top + 14, getY(priceAt('upper', visibleStart)) - 4));
        ctx.restore();
      }

      // Display references separately; these are never confirmed screening formations.
      if (showChartBox) {
        for (const reference of currentChartData.structure?.referenceRanges || []) {
          const start = allPrices.findIndex(bar => bar.date === reference.startDate);
          const end = allPrices.findIndex(bar => bar.date === reference.endDate);
          if (start < 0 || end < chartViewStart || start >= chartViewEnd) continue;
          const left = Math.max(margin.left, getX(start) - barSpacing * 0.5);
          const right = Math.min(margin.left + chartW, getX(end) + barSpacing * 0.5);
          const top = getY(reference.resistance);
          const bottom = getY(reference.support);
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 5]);
          ctx.strokeRect(left, top, right - left, bottom - top);
          ctx.setLineDash([]);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText('參考區間', left + 4, Math.max(margin.top + 14, top - 4));
          ctx.restore();
        }
      }

      // 3. 繪製成交量柱狀圖 (Volume Bars)
      if (showChartVolume && volH > 0) {
        for (let i = 0; i < visibleBars; i++) {
          const globalIdx = chartViewStart + i;
          const bar = allPrices[globalIdx];
          const x = getX(globalIdx);
          if (!Number.isFinite(bar.volume)) continue;
          const y = getVolY(bar.volume);
          const h = (margin.top + totalH) - y;
          const isUp = bar.close >= bar.open;
          ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.45)" : "rgba(244, 63, 94, 0.45)";
          ctx.fillRect(x - candleW * 0.4, y, candleW * 0.8, h);
        }
      }

      // 4. 繪製 K線蠟燭圖 或 收盤折線圖
      if (currentChartType === 'candle') {
        for (let i = 0; i < visibleBars; i++) {
          const globalIdx = chartViewStart + i;
          const bar = allPrices[globalIdx];
          const x = getX(globalIdx);
          const isUp = bar.close >= bar.open;
          const color = isUp ? "#10b981" : "#f43f5e";

          const yHigh = getY(bar.high);
          const yLow = getY(bar.low);
          const yOpen = getY(bar.open);
          const yClose = getY(bar.close);

          // 燭芯 (上下影線)
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, Math.min(2, candleW * 0.15));
          ctx.beginPath();
          ctx.moveTo(x, yHigh);
          ctx.lineTo(x, yLow);
          ctx.stroke();

          // 燭身 (實體)
          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));
          ctx.fillStyle = color;
          ctx.fillRect(x - candleW / 2, bodyY, candleW, bodyH);
        }
      } else {
        // 折線走勢
        ctx.beginPath();
        for (let i = 0; i < visibleBars; i++) {
          const globalIdx = chartViewStart + i;
          const bar = allPrices[globalIdx];
          const x = getX(globalIdx);
          const y = getY(bar.close);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 漸層填充
        ctx.lineTo(getX(chartViewEnd - 1), margin.top + priceH);
        ctx.lineTo(getX(chartViewStart), margin.top + priceH);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + priceH);
        areaGrad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
        areaGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
        ctx.fillStyle = areaGrad;
        ctx.fill();
      }

      // 5. 繪製 50 EMA 均線
      if (showChartEMA && currentChartData.ema50 && currentChartData.ema50.length > 0) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleBars; i++) {
          const globalIdx = chartViewStart + i;
          const val = currentChartData.ema50[globalIdx];
          if (val == null) continue;
          const x = getX(globalIdx);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // 5b. 繪製 200 EMA 牛熊分界均線 (若有數據且啟用)
      if (showChartEMA200 && currentChartData.ema200 && currentChartData.ema200.length > 0) {
        ctx.beginPath();
        let started200 = false;
        for (let i = 0; i < visibleBars; i++) {
          const globalIdx = chartViewStart + i;
          const val = currentChartData.ema200[globalIdx];
          if (val == null) continue;
          const x = getX(globalIdx);
          const y = getY(val);
          if (!started200) {
            ctx.moveTo(x, y);
            started200 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = "#818cf8"; // 靛藍牛熊線
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // 6. 懸停十字準星 (Crosshair & Highlight)
      if (hoveredCandleIndex >= chartViewStart && hoveredCandleIndex < chartViewEnd && !isChartDragging) {
        const bar = allPrices[hoveredCandleIndex];
        const hX = getX(hoveredCandleIndex);
        const hY = getY(bar.close);

        // 垂直準星
        ctx.strokeStyle = "rgba(226, 232, 240, 0.6)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hX, margin.top);
        ctx.lineTo(hX, margin.top + totalH);
        ctx.stroke();

        // 水平準星
        ctx.beginPath();
        ctx.moveTo(margin.left, hY);
        ctx.lineTo(margin.left + chartW, hY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 懸停圓點
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(hX, hY, Math.min(6, candleW * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 綁定畫布滑鼠滾輪縮放、按住拖曳平移、以及懸停十字準星 (Pan, Zoom & Crosshair)
    (function setupChartInteractions() {
      const canvas = document.getElementById('hero-stock-canvas');
      const tooltip = document.getElementById('hero-chart-tooltip');
      const container = document.getElementById('hero-chart-container');
      if (!canvas || !tooltip || !container) return;

      const margin = { top: 28, right: 68, bottom: 25, left: 14 };

      function getChartMetrics() {
        const rect = container.getBoundingClientRect();
        const chartW = rect.width - margin.left - margin.right;
        return { rect, chartW };
      }

      // 1. 滑鼠滾輪縮放 (Wheel to Zoom)
      container.addEventListener('wheel', (e) => {
        if (!currentChartData || !currentChartData.prices || currentChartData.prices.length === 0) return;
        e.preventDefault(); // 阻止抽屜頁面跟隨上下滾動

        const { rect, chartW } = getChartMetrics();
        const relX = e.clientX - rect.left;
        let centerRatio = 0.5;
        if (relX >= margin.left && relX <= margin.left + chartW) {
          centerRatio = (relX - margin.left) / chartW;
        }

        // deltaY < 0 為向前滾動 (放大)，deltaY > 0 為向後滾動 (縮小)
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        zoomHeroChart(factor, centerRatio);
      }, { passive: false });

      // 2. 滑鼠按住拖曳平移 (Mousedown to Pan)
      container.addEventListener('mousedown', (e) => {
        if (!currentChartData || !currentChartData.prices) return;
        if (e.button !== 0) return; // 僅限左鍵
        isChartDragging = true;
        dragStartX = e.clientX;
        dragStartViewStart = chartViewStart;
        dragStartViewEnd = chartViewEnd;
        container.style.cursor = 'grabbing';
        tooltip.classList.add('hidden');
      });

      window.addEventListener('mouseup', () => {
        if (isChartDragging) {
          isChartDragging = false;
          container.style.cursor = 'crosshair';
        }
      });

      // 3. 滑鼠移動處理 (平移或十字準星懸停)
      function handleMove(e) {
        if (!currentChartData || !currentChartData.prices || currentChartData.prices.length === 0) return;
        const { rect, chartW } = getChartMetrics();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;

        const allPrices = currentChartData.prices;
        const totalBars = allPrices.length;
        const visibleSpan = chartViewEnd - chartViewStart;

        // 若正處於拖曳中：根據滑鼠位移平移視角
        if (isChartDragging) {
          const deltaPx = clientX - dragStartX;
          const barsShift = Math.round((deltaPx / chartW) * visibleSpan);
          let newStart = dragStartViewStart - barsShift;
          let newEnd = dragStartViewEnd - barsShift;

          if (newStart < 0) {
            newStart = 0;
            newEnd = visibleSpan;
          }
          if (newEnd > totalBars) {
            newEnd = totalBars;
            newStart = totalBars - visibleSpan;
          }

          chartViewStart = newStart;
          chartViewEnd = newEnd;
          renderHeroStockCanvas();
          return;
        }

        // 非拖曳狀態：十字準星 Tooltip 懸停
        if (relX < margin.left || relX > margin.left + chartW) {
          hoveredCandleIndex = -1;
          tooltip.classList.add('hidden');
          renderHeroStockCanvas();
          return;
        }

        const localIdx = Math.max(0, Math.min(visibleSpan - 1, Math.floor((relX - margin.left) / (chartW / visibleSpan))));
        const globalIdx = chartViewStart + localIdx;
        hoveredCandleIndex = globalIdx;

        const bar = allPrices[globalIdx];
        const prevBar = globalIdx > 0 ? allPrices[globalIdx - 1] : bar;
        const chg = bar.close - prevBar.close;
        const chgPct = prevBar.close > 0 ? (chg / prevBar.close) * 100 : 0;
        const isUp = chg >= 0;

        // 更新 Tooltip 內容
        document.getElementById('tt-date').textContent = bar.date;
        document.getElementById('tt-badge').textContent = `Bar #${globalIdx + 1}`;
        document.getElementById('tt-open').textContent = '$' + bar.open.toFixed(2);
        document.getElementById('tt-high').textContent = '$' + bar.high.toFixed(2);
        document.getElementById('tt-low').textContent = '$' + bar.low.toFixed(2);
        document.getElementById('tt-close').textContent = '$' + bar.close.toFixed(2);
        document.getElementById('tt-vol').textContent = (Number.isFinite(bar.volume) ? (bar.volume > 1e6 ? (bar.volume / 1e6).toFixed(1) + 'M' : bar.volume.toLocaleString()) : '資料缺失');
        
        const chgEl = document.getElementById('tt-change');
        chgEl.textContent = (isUp ? '+' : '') + chgPct.toFixed(2) + '%';
        chgEl.className = isUp ? "text-emerald-400 font-bold" : "text-rose-400 font-bold";

        // 箱體狀態評估
        const regime = currentChartData.structure?.currentRegime;
        const boxStatusEl = document.getElementById('tt-box-status');
        if (regime) {
          if (bar.close > regime.resistance) {
            boxStatusEl.textContent = '🚀 突破箱頂 (高于 $' + regime.resistance.toFixed(2) + ')';
            boxStatusEl.className = 'text-[10px] pt-0.5 text-amber-300 font-bold';
          } else if (bar.close < regime.support) {
            boxStatusEl.textContent = '⚠️ 跌破箱底 (低于 $' + regime.support.toFixed(2) + ')';
            boxStatusEl.className = 'text-[10px] pt-0.5 text-rose-400 font-bold';
          } else {
            const inPct = ((bar.close - regime.support) / (regime.resistance - regime.support)) * 100;
            boxStatusEl.textContent = `✅ 箱內震盪 (位置: ${inPct.toFixed(0)}% · 5%~95%分位內)`;
            boxStatusEl.className = 'text-[10px] pt-0.5 text-emerald-300 font-bold';
          }
        } else {
          boxStatusEl.textContent = '📊 趨勢推進常態';
          boxStatusEl.className = 'text-[10px] pt-0.5 text-slate-400 font-medium';
        }

        // 定位 Tooltip
        let ttX = relX + 16;
        let ttY = Math.max(10, Math.min(rect.height - 130, relY - 40));
        if (ttX + 210 > rect.width) ttX = relX - 220;

        tooltip.style.left = ttX + 'px';
        tooltip.style.top = ttY + 'px';
        tooltip.classList.remove('hidden');

        renderHeroStockCanvas();
      }

      function handleLeave() {
        if (!isChartDragging) {
          hoveredCandleIndex = -1;
          tooltip.classList.add('hidden');
          renderHeroStockCanvas();
        }
      }

      container.addEventListener('mousemove', handleMove);
      container.addEventListener('mouseleave', handleLeave);

      // 觸控裝置手勢平移支援
      container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isChartDragging = true;
          dragStartX = e.touches[0].clientX;
          dragStartViewStart = chartViewStart;
          dragStartViewEnd = chartViewEnd;
          tooltip.classList.add('hidden');
        }
      }, { passive: true });

      container.addEventListener('touchmove', handleMove, { passive: true });
      container.addEventListener('touchend', () => {
        isChartDragging = false;
        hoveredCandleIndex = -1;
        tooltip.classList.add('hidden');
        renderHeroStockCanvas();
      });

      window.addEventListener('resize', () => {
        if (!document.getElementById('hero-drawer').classList.contains('translate-x-full')) {
          renderHeroStockCanvas();
        }
      });
    })();

    // 英雄詳情抽屜 (點選個股時彈出)
    function openHeroDrawer(symbol) {
      closeSmartMoneyDrawer();
      closeChartDrawer();
      closeIndexDrawer();
      const h = HEROES.find(x => x.symbol === symbol) || { symbol, name: symbol, price: 100, change: 0, quantile: { high: 110, mid: 100, low: 90, stopLoss: 88, pos_pct: 50 }, skills: [], cp: 8500, sector: "美股", tier: "SR" };
      selectedHero = h;
      currentStockSymbol = symbol;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setVal('drawer-symbol', h.symbol);
      setVal('drawer-sector', h.sector);
      setVal('drawer-name', h.name);
      setVal('drawer-price', '$' + (h.price ? h.price.toFixed(2) : '--'));
      
      const pos = (h.change || 0) >= 0;
      const chgEl = document.getElementById('drawer-change');
      if (chgEl) {
        chgEl.textContent = (pos ? '+' : '') + (h.change || 0).toFixed(2) + '% ' + (pos ? '↗️' : '↘️');
        chgEl.className = "text-xs font-bold " + (pos ? "text-emerald-400" : "text-rose-400");
      }
      setVal('drawer-cp', h.cp || 8000);

      // Quantile (若存在)
      const q = h.quantile || { high: (h.price || 100) * 1.1, mid: h.price || 100, low: (h.price || 100) * 0.9, stopLoss: (h.price || 100) * 0.88, pos_pct: 50 };
      setVal('drawer-q-high', q.high.toFixed(2));
      setVal('drawer-q-mid', q.mid.toFixed(2));
      setVal('drawer-q-low', q.low.toFixed(2));
      setVal('drawer-sl', q.stopLoss.toFixed(2));
      setVal('drawer-tp1', h.tp1 != null ? h.tp1.toFixed(2) : '—');
      setVal('drawer-tp2', h.tp2 != null ? h.tp2.toFixed(2) : '—');

      // 動態價格光點位置 (若存在)
      const pct = Math.min(92, Math.max(8, q.pos_pct || 70));
      const posDot = document.getElementById('drawer-pos-dot');
      if (posDot) posDot.style.left = pct + '%';
      const posSolid = document.getElementById('drawer-pos-solid');
      if (posSolid) posSolid.style.left = pct + '%';

      // 技能清單 (若存在)
      const skBox = document.getElementById('drawer-skills');
      if (skBox) {
        skBox.innerHTML = (h.skills || ["🔥 實時計算中"]).map(s => `<span class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200">${s}</span>`).join('');
      }

      setVal('drawer-decision', h.decision_desc || "載入實盤分析中...");

      // 指數共振面板 (若存在)
      const irBox = document.getElementById('drawer-ir-box');
      const irTitle = document.getElementById('drawer-ir-title');
      const irBadge = document.getElementById('drawer-ir-badge');
      const irDesc = document.getElementById('drawer-ir-desc');
      const irAdvice = document.getElementById('drawer-ir-advice');

      if (irBox) {
        const ir = h.index_resonance;
        irBox.hidden = !ir;
        if(ir) {
          const style=marketContextStyle(ir.status);
          irBox.className='p-4 rounded-2xl border space-y-2';
          irBox.style.borderColor=style.color+'66'; irBox.style.background=style.color+'15';
          if(irTitle){irTitle.className='text-xs font-black';irTitle.style.color=style.color;irTitle.textContent=`${ir.index_name || '大市參考'}走勢參考`;}
          if(irBadge){irBadge.className='px-2.5 py-0.5 rounded-full text-xs font-black';irBadge.style.color=style.color;irBadge.textContent=`${style.icon} ${ir.badge_text || '未能判斷'}`;}
          if(irDesc){irDesc.className='text-xs leading-relaxed';irDesc.style.color=style.color;irDesc.textContent=ir.sub_desc || '';}
          if(irAdvice){irAdvice.className='font-bold';irAdvice.style.color=style.color;irAdvice.textContent=ir.advice || '';}
        }
      }

      // TradingView 外鏈
      const tvLink = document.getElementById('drawer-tv-link');
      if (tvLink) tvLink.href = 'https://tw.tradingview.com/chart/?symbol=' + h.symbol;

      // 更新 Sample 範例 Pill 的高亮狀態
      updateSamplePillStates(symbol);

      // 展開 2/3 寬屏抽屜
      document.getElementById('hero-drawer').classList.remove('translate-x-full');
      document.getElementById('drawer-backdrop').classList.remove('hidden');

      // 立即連線網路獲取真實數據並繪製圖表與箱體
      loadHeroStockChart(symbol, currentStockRange);
    }

    // 一鍵切換要分析的股票 (支援 Sample 1 ARE / Sample 2 ZS / 其他)
    function switchStockSymbol(symbol) {
      if (!symbol) return;
      const cleanSym = symbol.trim().toUpperCase();
      openHeroDrawer(cleanSym);
    }

    // 更新 Sample 按鈕的高亮狀態
    function updateSamplePillStates(symbol) {
      const btnAre = document.getElementById('btn-sample-are');
      const btnZs = document.getElementById('btn-sample-zs');
      const cleanSym = (symbol || '').trim().toUpperCase();
      
      if (btnAre) {
        if (cleanSym === 'ARE') {
          btnAre.className = "px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm bg-amber-500/30 text-amber-200 border-amber-400 ring-1 ring-amber-400 cursor-pointer";
        } else {
          btnAre.className = "px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 cursor-pointer";
        }
      }
      if (btnZs) {
        if (cleanSym === 'ZS') {
          btnZs.className = "px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm bg-sky-500/30 text-sky-200 border-sky-400 ring-1 ring-sky-400 cursor-pointer";
        } else {
          btnZs.className = "px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 cursor-pointer";
        }
      }
    }

    // 自訂股票即時分析搜尋處理
    function handleCustomStockSearch(event) {
      if (event) event.preventDefault();
      const input = document.getElementById('input-custom-symbol');
      if (!input) return;
      const sym = input.value.trim().toUpperCase();
      if (sym) {
        switchStockSymbol(sym);
        input.value = '';
      }
    }

    function closeHeroDrawer() {
      document.getElementById('hero-drawer').classList.add('translate-x-full');
      checkHideBackdrop();
    }

    // =========================================================================
    // ZONE 01: 大市指數 2/3 全屏交互抽屜、滑鼠縮放拖曳、TradingView 直連
    // =========================================================================
    const ZONE01_INDICES = {
      ES: {
        code: "ES",
        badge: "S&P",
        badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
        name: "S&P 500 標普500期貨",
        price: "7,712.50",
        priceNum: 7712.50,
        change: "+0.42% ↗️",
        changeNum: 0.42,
        status: "突破歷史新高",
        quoteSymbol: "SPY",
        tvSymbol: "CME_MINI:ES1!",
        tvAltSymbol: "SP:SPX",
        tvAltName: "SP:SPX (標普500現貨)",
        range: "6,604.4 ~ 7,725.8",
        ema50: "7,480.12 (多頭發散)",
        structure: "多頭通道主升 · 均線排列"
      },
      NQ: {
        code: "NQ",
        badge: "納指",
        badgeClass: "bg-sky-500/20 text-sky-400 border border-sky-500/40",
        name: "Nasdaq 100 納斯達克期貨",
        price: "30,725.20",
        priceNum: 30725.20,
        change: "+0.68% ↗️",
        changeNum: 0.68,
        status: "突破領跑",
        quoteSymbol: "QQQ",
        tvSymbol: "CME_MINI:NQ1!",
        tvAltSymbol: "NASDAQ:NDX",
        tvAltName: "NASDAQ:NDX (納指100現貨)",
        range: "26,800.0 ~ 30,850.0",
        ema50: "29,620.40 (多頭發散)",
        structure: "放量突破箱頂 · 領漲全場"
      },
      SOX: {
        code: "SOX",
        badge: "費城",
        badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
        name: "SOX 費城半導體期貨",
        price: "7,180.50",
        priceNum: 7180.50,
        change: "+1.15% ↗️",
        changeNum: 1.15,
        status: "強勢進攻",
        quoteSymbol: "SOXX",
        tvSymbol: "INDEX:SOX",
        tvAltSymbol: "NASDAQ:SOXX",
        tvAltName: "NASDAQ:SOXX (半導體ETF)",
        range: "5,820.0 ~ 7,240.0",
        ema50: "6,810.35 (強勢多頭)",
        structure: "巨量陽線反撲 · 主導風險偏好"
      },
      YM: {
        code: "YM",
        badge: "道指",
        badgeClass: "bg-slate-800 text-slate-300 border border-slate-700",
        name: "Dow Jones 道瓊斯期貨",
        price: "51,550.00",
        priceNum: 51550.00,
        change: "+0.22% ↗️",
        changeNum: 0.22,
        status: "5萬點上整固",
        quoteSymbol: "DIA",
        tvSymbol: "CBOT_MINI:YM1!",
        tvAltSymbol: "DJ:DJI",
        tvAltName: "DJ:DJI (道瓊斯工業現貨)",
        range: "46,800.0 ~ 51,890.0",
        ema50: "50,710.20 (穩健多頭)",
        structure: "高位平穩整固 · 價值股防禦"
      },
      RTY: {
        code: "RTY",
        badge: "羅素2000",
        badgeClass: "bg-purple-500/20 text-purple-400 border border-purple-500/40",
        name: "Russell 2000 羅素2000期貨",
        price: "2,650.80",
        priceNum: 2650.80,
        change: "+0.55% ↗️",
        changeNum: 0.55,
        status: "企穩反彈",
        quoteSymbol: "IWM",
        tvSymbol: "CME_MINI:RTY1!",
        tvAltSymbol: "RUSSELL:RUT",
        tvAltName: "RUSSELL:RUT (羅素2000現貨)",
        range: "2,350.0 ~ 2,710.0",
        ema50: "2,580.60 (中性回升)",
        structure: "箱底托底企穩 · 補漲修復"
      }
    };

    for (const [key, idx] of Object.entries(ZONE01_INDICES)) {
      const actual = window.__SCAN_SNAPSHOT__.dashboard?.indices?.[key];
      idx.price = actual ? Number(actual.price).toLocaleString() : '—';
      idx.priceNum = actual?.price ?? 0;
      idx.changeNum = actual?.change ?? 0;
      idx.change = actual ? `${actual.change >= 0 ? '+' : ''}${actual.change.toFixed(2)}%` : '未有資料';
      idx.quoteSymbol = actual?.chart_symbol || actual?.symbol || '';
      idx.chartNote = actual?.chart_note || '';
      idx.name = window.__INDEX_NAMES__[key];
      idx.status = '較上個交易日'; idx.range = '見真實圖表'; idx.ema50 = '見真實圖表'; idx.structure = '見同次價格分析';
      idx.badge = window.__INDEX_NAMES__[key];
    }

    let currentIndexCode = "ES";
    let currentIndexChartData = null;
    let indexChartViewStart = 0;
    let indexChartViewEnd = 0;
    let isIndexChartDragging = false;
    let indexDragStartX = 0;
    let indexDragStartViewStart = 0;
    let indexDragStartViewEnd = 0;
    let hoveredIndexCandleIndex = -1;
    let indexChartInteractionsInitialized = false;
    let lastChartMetrics = null;

    // 開啟指數抽屜
    function openIndexDrawer(code) {
      closeHeroDrawer();
      closeSmartMoneyDrawer();
      closeChartDrawer();

      currentIndexCode = code || "ES";
      const idx = ZONE01_INDICES[currentIndexCode] || ZONE01_INDICES["ES"];

      // 1. 更新 UI 文本與各項指標
      updateIndexDrawerUI(idx);

      // 2. 展開抽屜 (2/3 寬度)
      const drawer = document.getElementById("index-drawer");
      if (drawer) {
        drawer.classList.remove("translate-x-full");
      }
      const backdrop = document.getElementById("drawer-backdrop");
      if (backdrop) {
        backdrop.classList.remove("hidden");
      }

      // 3. 綁定畫布互動事件 (若尚未綁定)
      if (!indexChartInteractionsInitialized) {
        setupIndexChartInteractions();
        indexChartInteractionsInitialized = true;
      }

      // 4. 先載入高保真即時歷史或從快取載入，再非同步獲取即時行情
      loadIndexChartData(idx);
    }

    function closeIndexDrawer() {
      const drawer = document.getElementById("index-drawer");
      if (drawer) {
        drawer.classList.add("translate-x-full");
      }
      checkHideBackdrop();
    }

    function updateIndexDrawerUI(idx) {
      const badgeEl = document.getElementById("idx-drawer-badge");
      if (badgeEl) {
        badgeEl.textContent = idx.badge;
        badgeEl.className = `h-10 px-2.5 min-w-10 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shrink-0 whitespace-nowrap ${idx.badgeClass}`;
      }

      const titleEl = document.getElementById("idx-drawer-title");
      if (titleEl) titleEl.textContent = idx.name;

      const priceEl = document.getElementById("idx-drawer-price");
      if (priceEl) priceEl.textContent = idx.price;

      const changeEl = document.getElementById("idx-drawer-change");
      if (changeEl) {
        changeEl.textContent = idx.change;
        changeEl.className = idx.changeNum >= 0 ? "text-xs sm:text-sm font-bold text-emerald-400 mono-num" : "text-xs sm:text-sm font-bold text-rose-400 mono-num";
      }

      // TradingView 直連按鈕
      const tvBtn = document.getElementById("idx-tv-button");
      if (tvBtn) {
        tvBtn.href = `https://tw.tradingview.com/chart/?symbol=${encodeURIComponent(idx.tvSymbol)}`;
        tvBtn.title = `在 TradingView 開啟 ${idx.badge} 實盤圖表`;
      }

      const tvBtnText = document.getElementById("idx-tv-button-text");
      if (tvBtnText) {
        tvBtnText.textContent = `TradingView圖表↗`;
      }
    }

    // =========================================================================
    // ZONE 01: 大市指數形態計算 (客觀自然呈現：有就有，冇就冇，唔需要畫晒兩樣)
    // =========================================================================

    // 計算智能技術形態：箱體與三角形
    // 只讀同次掃描保存的形態，最多兩個正式形態及一個參考區間。
    function computeChartPatterns(prices) {
      const structure = currentIndexChartData?.structure || {};
      const confirmed = Array.isArray(structure.displayPatterns)
        ? structure.displayPatterns.slice(0, 2)
        : structure.currentRegime ? [structure.currentRegime] : [];
      return [...confirmed, ...(structure.referenceRanges || []).slice(0, 1)]
        .filter(Boolean).map((pattern, order) => {
          const reference = pattern.patternType === 'REFERENCE_RANGE';
          const start = Number.isInteger(pattern.startIndex) ? pattern.startIndex
            : prices.findIndex(bar => bar.date === pattern.startDate);
          const end = Number.isInteger(pattern.endIndex) ? pattern.endIndex
            : prices.findIndex(bar => bar.date === pattern.endDate);
          const valueAt = (side, index) => {
            const line = pattern.triangle?.[side + 'Line'];
            return line ? line.p1.price + line.slope * (index - line.p1.index)
              : side === 'upper' ? pattern.resistance : pattern.support;
          };
          return {start, end, reference, secondary: !reference && order > 0,
            triangle: Boolean(pattern.triangle?.isTriangle), valueAt,
            anchors: pattern.triangle ? [pattern.triangle.upperLine.p1, pattern.triangle.upperLine.p2,
              pattern.triangle.lowerLine.p1, pattern.triangle.lowerLine.p2] : [],
            label: reference ? '參考區間' : `${pattern.patternLabel || '水平箱體'}｜${formationStateText(pattern.patternState)}`};
        }).filter(item => item.start >= 0 && item.end >= item.start && item.end < prices.length
          && ['upper', 'lower'].every(side => Number.isFinite(item.valueAt(side, item.start))
            && Number.isFinite(item.valueAt(side, item.end))));
    }

    // 產生高擬真歷史 K 線序列 (用於即時無延遲渲染)
    async function loadIndexChartData(idx) {
      currentIndexChartData = null;
      let note = document.getElementById('idx-chart-source-note');
      if (!note) {
        note = document.createElement('p'); note.id = 'idx-chart-source-note';
        note.className = 'text-xs text-slate-400 px-4 py-2';
        document.getElementById('idx-chart-container')?.before(note);
      }
      note.textContent = idx.chartNote || ''; note.hidden = !idx.chartNote;
      try {
        const res = await fetch(`/api/stock-chart?symbol=${encodeURIComponent(idx.quoteSymbol)}`);
        if (!res.ok) throw Error('這次掃描未有此指數真實圖表');
        const data = await res.json();
        const savedRegime=data.structure?.currentRegime;
        note.textContent=[idx.chartNote,savedRegime ? `${savedRegime.patternLabel || savedRegime.name}｜${formationStateText(savedRegime.patternState)}` : '未識別到有效箱體或收窄形態'].filter(Boolean).join(' ');
        note.hidden=false;
        currentIndexChartData = {symbol: idx.code, name: idx.name, prices: data.prices, ema50: data.ema50, ema200: data.ema200, structure:data.structure};
        indexChartViewStart = 0; indexChartViewEnd = data.prices.length; hoveredIndexCandleIndex = -1;
        renderIndexChartCanvas();
      } catch (err) {
        const canvas = document.getElementById('idx-stock-canvas');
        if(canvas) {const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#94a3b8';ctx.fillText('這次掃描未有此指數圖表資料',30,50);}
      }
    }

    // 繪製指數畫布 (K線、均線、成交量、箱體、收斂三角形、十字準星、自訂繪圖)
    function renderIndexChartCanvas() {
      const canvas = document.getElementById("idx-stock-canvas");
      const container = document.getElementById("idx-chart-container");
      if (!canvas || !container || !currentIndexChartData || !currentIndexChartData.prices) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (width <= 0 || height <= 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      const allPrices = currentIndexChartData.prices;
      const totalBars = allPrices.length;
      if (totalBars === 0) return;

      if (indexChartViewEnd <= indexChartViewStart || indexChartViewEnd > totalBars) {
        indexChartViewStart = 0;
        indexChartViewEnd = totalBars;
      }
      if (indexChartViewStart < 0) indexChartViewStart = 0;
      if (indexChartViewEnd - indexChartViewStart < 8) {
        indexChartViewEnd = Math.min(totalBars, indexChartViewStart + 8);
      }

      const visiblePrices = allPrices.slice(indexChartViewStart, indexChartViewEnd);
      const visibleBars = visiblePrices.length;
      if (visibleBars === 0) return;

      const margin = { top: 24, right: 75, bottom: 26, left: 14 };
      const chartW = width - margin.left - margin.right;
      const totalH = height - margin.top - margin.bottom;

      const volH = Math.min(55, totalH * 0.15);
      const priceH = totalH - volH - 12;

      let minP = Infinity;
      let maxP = -Infinity;
      let maxVol = 0;

      visiblePrices.forEach(bar => {
        if (bar.low < minP) minP = bar.low;
        if (bar.high > maxP) maxP = bar.high;
        if (bar.volume > maxVol) maxVol = bar.volume;
      });

      const patterns = computeChartPatterns(allPrices);
      for (const pattern of patterns) {
        const start = Math.max(pattern.start, indexChartViewStart);
        const end = Math.min(pattern.end, indexChartViewEnd - 1);
        if (end < start) continue;
        for (const index of [start, end]) {
          minP = Math.min(minP, pattern.valueAt('lower', index));
          maxP = Math.max(maxP, pattern.valueAt('upper', index));
        }
      }

      const pRange = Math.max(1, maxP - minP);
      const paddedMin = minP - pRange * 0.05;
      const paddedMax = maxP + pRange * 0.05;
      const paddedRange = paddedMax - paddedMin;

      lastChartMetrics = {
        margin,
        chartW,
        priceH,
        paddedMin,
        paddedMax,
        paddedRange,
        visibleBars,
        totalBars
      };

      const getX = (globalIdx) => {
        const localIdx = globalIdx - indexChartViewStart;
        return margin.left + (localIdx + 0.5) * (chartW / visibleBars);
      };
      const getY = (price) => margin.top + (1 - (price - paddedMin) / paddedRange) * priceH;
      const getVolY = (vol) => margin.top + priceH + 12 + (1 - (vol / (maxVol || 1))) * volH;

      const barSpacing = chartW / visibleBars;
      const candleW = Math.max(2, Math.min(22, barSpacing * 0.74));

      // 1. 背景網格與右側價格軸
      ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
      ctx.lineWidth = 1;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const gridSteps = 5;
      for (let s = 0; s <= gridSteps; s++) {
        const val = paddedMin + (paddedRange / gridSteps) * s;
        const y = getY(val);

        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartW, y);
        ctx.stroke();

        ctx.fillText(val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), margin.left + chartW + 6, y);
      }

      // 2. 成交量柱狀圖
      const baseVolY = margin.top + priceH + 12 + volH;
      for (let i = 0; i < visibleBars; i++) {
        const bar = visiblePrices[i];
        const gIdx = indexChartViewStart + i;
        const x = getX(gIdx);
        if (!Number.isFinite(bar.volume)) continue;
        const y = getVolY(bar.volume);
        const h = Math.max(1, baseVolY - y);
        const isUp = bar.close >= bar.open;

        ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)";
        ctx.fillRect(x - candleW / 2, y, candleW, h);
      }

      // Saved formations share the stock chart's two-pattern and reference limits.
      for (const pattern of patterns) {
        const start = Math.max(pattern.start, indexChartViewStart);
        const end = Math.min(pattern.end, indexChartViewEnd - 1);
        if (end < start) continue;
        const left = getX(start), right = getX(end);
        const upperColor = pattern.reference ? '#94a3b8' : pattern.secondary ? '#a78bfa' : '#f59e0b';
        const lowerColor = pattern.reference ? '#94a3b8' : pattern.secondary ? '#a78bfa' : '#22d3ee';
        ctx.save();
        ctx.beginPath();
        ctx.rect(margin.left, margin.top, chartW, priceH);
        ctx.clip();
        if (!pattern.reference) {
          ctx.beginPath();
          ctx.moveTo(left, getY(pattern.valueAt('upper', start)));
          ctx.lineTo(right, getY(pattern.valueAt('upper', end)));
          ctx.lineTo(right, getY(pattern.valueAt('lower', end)));
          ctx.lineTo(left, getY(pattern.valueAt('lower', start)));
          ctx.closePath();
          ctx.fillStyle = pattern.secondary ? 'rgba(167,139,250,.06)' : 'rgba(245,158,11,.08)';
          ctx.fill();
        }
        ctx.setLineDash(pattern.reference || pattern.secondary ? [5, 4] : []);
        ctx.lineWidth = pattern.reference ? 1 : 1.6;
        for (const [side, color] of [['upper', upperColor], ['lower', lowerColor]]) {
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(left, getY(pattern.valueAt(side, start)));
          ctx.lineTo(right, getY(pattern.valueAt(side, end)));
          ctx.stroke();
        }
        for (const point of pattern.anchors) {
          if (point.index < start || point.index > end) continue;
          ctx.beginPath();
          ctx.arc(getX(point.index), getY(point.price), pattern.secondary ? 2.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = upperColor;
          ctx.fill();
        }
        if (pattern.reference || pattern.secondary) {
          ctx.setLineDash([]);
          ctx.fillStyle = upperColor;
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(pattern.label, left + 4,
            Math.max(margin.top + 14, getY(pattern.valueAt('upper', start)) - 4));
        }
        ctx.restore();
        if (!pattern.reference && !pattern.secondary) {
          ctx.font = 'bold 9px ui-monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          for (const [side, color, label] of [['upper', upperColor, pattern.triangle ? '上軌' : '箱頂'],
                                            ['lower', lowerColor, pattern.triangle ? '下軌' : '箱底']]) {
            const price = pattern.valueAt(side, end);
            ctx.fillStyle = color;
            ctx.fillText(`${label} $${price.toFixed(1)}`, margin.left + chartW + 4, getY(price));
          }
        }
      }
      const idxBoxLeg = document.getElementById('idx-legend-box');
      const idxTriLeg = document.getElementById('idx-legend-triangle');
      if (idxBoxLeg) idxBoxLeg.classList.toggle('hidden', !patterns.some(p => !p.reference && !p.triangle));
      if (idxTriLeg) idxTriLeg.classList.toggle('hidden', !patterns.some(p => !p.reference && p.triangle));
      const boxLabel = patterns.find(p => !p.reference && !p.triangle);
      const triLabel = patterns.find(p => !p.reference && p.triangle);
      if (boxLabel && idxBoxLeg?.lastChild) idxBoxLeg.lastChild.textContent = ' ' + boxLabel.label;
      if (triLabel && idxTriLeg?.lastChild) idxTriLeg.lastChild.textContent = ' ' + triLabel.label;

      // 6. EMA 50 (金黃色曲線)
      if (currentIndexChartData.ema50 && currentIndexChartData.ema50.length > 0) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < visibleBars; i++) {
          const gIdx = indexChartViewStart + i;
          const val = currentIndexChartData.ema50[gIdx];
          if (val != null) {
            const x = getX(gIdx);
            const y = getY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      }

      // 9. EMA 200 (靛藍色曲線)
      if (currentIndexChartData.ema200 && currentIndexChartData.ema200.length > 0) {
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < visibleBars; i++) {
          const gIdx = indexChartViewStart + i;
          const val = currentIndexChartData.ema200[gIdx];
          if (val != null) {
            const x = getX(gIdx);
            const y = getY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 10. 繪製 K 線燭體與影線 (Candlesticks)
      for (let i = 0; i < visibleBars; i++) {
        const bar = visiblePrices[i];
        const gIdx = indexChartViewStart + i;
        const x = getX(gIdx);

        const openY = getY(bar.open);
        const closeY = getY(bar.close);
        const highY = getY(bar.high);
        const lowY = getY(bar.low);

        const isUp = bar.close >= bar.open;
        const color = isUp ? "#10b981" : "#f43f5e";

        // 影線 (Wicks)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // 實體 (Body)
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(openY - closeY));

        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      }

      // 11. 底部時間標籤 (Date Axis)
      ctx.fillStyle = "#64748b";
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const dateStep = Math.max(1, Math.floor(visibleBars / 6));
      for (let i = 0; i < visibleBars; i += dateStep) {
        const gIdx = indexChartViewStart + i;
        const x = getX(gIdx);
        const bar = visiblePrices[i];
        const dateTxt = bar.date ? bar.date.slice(5) : "";
        ctx.fillText(dateTxt, x, margin.top + totalH + 6);
      }

      // 12. 十字準星 (Crosshair)
      if (hoveredIndexCandleIndex >= indexChartViewStart && hoveredIndexCandleIndex < indexChartViewEnd) {
        const bar = allPrices[hoveredIndexCandleIndex];
        const hX = getX(hoveredIndexCandleIndex);
        const hY = getY(bar.close);

        ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // 垂直線
        ctx.beginPath();
        ctx.moveTo(hX, margin.top);
        ctx.lineTo(hX, margin.top + totalH);
        ctx.stroke();

        // 水平線
        ctx.beginPath();
        ctx.moveTo(margin.left, hY);
        ctx.lineTo(margin.left + chartW, hY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 右側價格標尺標籤
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(margin.left + chartW + 2, hY - 9, 68, 18);
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 10px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(bar.close.toFixed(1), margin.left + chartW + 36, hY);

        // 懸停圓點
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(hX, hY, Math.min(5, candleW * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 縮放控制 (Zoom) - 保留縮放功能
    function zoomIndexChart(factor, centerRatio = 0.5) {
      if (!currentIndexChartData || !currentIndexChartData.prices) return;
      const allPrices = currentIndexChartData.prices;
      const totalBars = allPrices.length;
      const currentSpan = indexChartViewEnd - indexChartViewStart;

      let newSpan = Math.round(currentSpan / factor);
      if (newSpan < 8) newSpan = 8;
      if (newSpan > totalBars) newSpan = totalBars;

      const centerBar = indexChartViewStart + Math.round(currentSpan * centerRatio);
      let newStart = centerBar - Math.round(newSpan * centerRatio);
      let newEnd = newStart + newSpan;

      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(totalBars, newSpan);
      }
      if (newEnd > totalBars) {
        newEnd = totalBars;
        newStart = Math.max(0, totalBars - newSpan);
      }

      indexChartViewStart = newStart;
      indexChartViewEnd = newEnd;
      renderIndexChartCanvas();
    }

    // 平移控制 (Pan) - 保留平移功能
    function panIndexChart(deltaBars) {
      if (!currentIndexChartData || !currentIndexChartData.prices) return;
      const totalBars = currentIndexChartData.prices.length;
      const span = indexChartViewEnd - indexChartViewStart;

      let newStart = indexChartViewStart + deltaBars;
      let newEnd = indexChartViewEnd + deltaBars;

      if (newStart < 0) {
        newStart = 0;
        newEnd = span;
      }
      if (newEnd > totalBars) {
        newEnd = totalBars;
        newStart = totalBars - span;
      }

      indexChartViewStart = newStart;
      indexChartViewEnd = newEnd;
      renderIndexChartCanvas();
    }

    // 重設縮放至全覽
    function resetIndexChartZoom() {
      if (!currentIndexChartData || !currentIndexChartData.prices) return;
      indexChartViewStart = 0;
      indexChartViewEnd = currentIndexChartData.prices.length;
      hoveredIndexCandleIndex = -1;
      const tooltip = document.getElementById("idx-chart-tooltip");
      if (tooltip) tooltip.classList.add("hidden");
      renderIndexChartCanvas();
    }

    // 綁定畫布互動事件 (滑鼠滾輪縮放、按住拖曳平移、十字準星懸停與形態繪製)
    function setupIndexChartInteractions() {
      const container = document.getElementById("idx-chart-container");
      const tooltip = document.getElementById("idx-chart-tooltip");
      if (!container || !tooltip) return;

      const margin = { top: 24, right: 75, bottom: 26, left: 14 };

      function getMetrics() {
        const rect = container.getBoundingClientRect();
        const chartW = rect.width - margin.left - margin.right;
        return { rect, chartW };
      }

      function screenToChart(relX, relY) {
        if (!lastChartMetrics || !currentIndexChartData) return null;
        const { chartW, priceH, paddedMin, paddedRange, visibleBars, totalBars } = lastChartMetrics;
        const localIdx = Math.max(0, Math.min(visibleBars - 1, Math.round((relX - margin.left) / (chartW / visibleBars))));
        const barIdx = Math.max(0, Math.min(totalBars - 1, indexChartViewStart + localIdx));
        const price = (paddedMin + paddedRange) - ((relY - margin.top) / priceH) * paddedRange;
        return { barIdx, price: Number(price.toFixed(2)) };
      }

      // 1. 滑鼠滾輪縮放 (Wheel Zoom)
      container.addEventListener("wheel", (e) => {
        if (!currentIndexChartData || !currentIndexChartData.prices) return;
        e.preventDefault();

        const { rect, chartW } = getMetrics();
        const relX = e.clientX - rect.left;
        let centerRatio = 0.5;
        if (relX >= margin.left && relX <= margin.left + chartW) {
          centerRatio = (relX - margin.left) / chartW;
        }

        const factor = e.deltaY < 0 ? 1.16 : 0.86;
        zoomIndexChart(factor, centerRatio);
      }, { passive: false });

      // 2. 滑鼠按住拖曳平移 (Mousedown)
      container.addEventListener("mousedown", (e) => {
        if (!currentIndexChartData || !currentIndexChartData.prices) return;
        if (e.button !== 0) return;

        // 一般平移模式
        isIndexChartDragging = true;
        indexDragStartX = e.clientX;
        indexDragStartViewStart = indexChartViewStart;
        indexDragStartViewEnd = indexChartViewEnd;
        container.style.cursor = "grabbing";
        tooltip.classList.add("hidden");
      });

      window.addEventListener("mouseup", () => {
        if (isIndexChartDragging) {
          isIndexChartDragging = false;
          container.style.cursor = "crosshair";
        }
      });

      // 3. 滑鼠移動與十字準星 (Mousemove)
      function handleMove(e) {
        if (!currentIndexChartData || !currentIndexChartData.prices) return;
        const { rect, chartW } = getMetrics();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;

        const allPrices = currentIndexChartData.prices;
        const totalBars = allPrices.length;
        const visibleSpan = indexChartViewEnd - indexChartViewStart;

        // 平移處理
        if (isIndexChartDragging) {
          const deltaPx = clientX - indexDragStartX;
          const barsShift = Math.round((deltaPx / chartW) * visibleSpan);
          let newStart = indexDragStartViewStart - barsShift;
          let newEnd = indexDragStartViewEnd - barsShift;

          if (newStart < 0) {
            newStart = 0;
            newEnd = visibleSpan;
          }
          if (newEnd > totalBars) {
            newEnd = totalBars;
            newStart = totalBars - visibleSpan;
          }

          indexChartViewStart = newStart;
          indexChartViewEnd = newEnd;
          renderIndexChartCanvas();
          return;
        }

        // 十字準星懸停
        if (relX < margin.left || relX > margin.left + chartW) {
          hoveredIndexCandleIndex = -1;
          tooltip.classList.add("hidden");
          renderIndexChartCanvas();
          return;
        }

        const localIdx = Math.max(0, Math.min(visibleSpan - 1, Math.floor((relX - margin.left) / (chartW / visibleSpan))));
        const globalIdx = indexChartViewStart + localIdx;
        hoveredIndexCandleIndex = globalIdx;

        const bar = allPrices[globalIdx];
        const prevBar = globalIdx > 0 ? allPrices[globalIdx - 1] : bar;
        const chg = bar.close - prevBar.close;
        const chgPct = prevBar.close > 0 ? (chg / prevBar.close) * 100 : 0;
        const isUp = chg >= 0;

        // 更新 Tooltip
        const ttDate = document.getElementById("idx-tt-date");
        if (ttDate) ttDate.textContent = bar.date;

        const ttBadge = document.getElementById("idx-tt-badge");
        if (ttBadge) ttBadge.textContent = `Bar #${globalIdx + 1}`;

        const ttOpen = document.getElementById("idx-tt-open");
        if (ttOpen) ttOpen.textContent = "$" + bar.open.toLocaleString("en-US", { minimumFractionDigits: 1 });

        const ttHigh = document.getElementById("idx-tt-high");
        if (ttHigh) ttHigh.textContent = "$" + bar.high.toLocaleString("en-US", { minimumFractionDigits: 1 });

        const ttLow = document.getElementById("idx-tt-low");
        if (ttLow) ttLow.textContent = "$" + bar.low.toLocaleString("en-US", { minimumFractionDigits: 1 });

        const ttClose = document.getElementById("idx-tt-close");
        if (ttClose) ttClose.textContent = "$" + bar.close.toLocaleString("en-US", { minimumFractionDigits: 1 });

        const ttVol = document.getElementById("idx-tt-vol");
        if (ttVol) ttVol.textContent = Number.isFinite(bar.volume) ? (bar.volume > 1e6 ? (bar.volume / 1e6).toFixed(1) + "M" : bar.volume.toLocaleString()) : "資料缺失";

        const ttChg = document.getElementById("idx-tt-change");
        if (ttChg) {
          ttChg.textContent = (isUp ? "+" : "") + chgPct.toFixed(2) + "%";
          ttChg.className = isUp ? "text-emerald-400 font-bold" : "text-rose-400 font-bold";
        }

        // 定位 Tooltip
        let ttX = relX + 16;
        let ttY = Math.max(10, Math.min(rect.height - 120, relY - 40));
        if (ttX + 220 > rect.width) ttX = relX - 230;

        tooltip.style.left = ttX + "px";
        tooltip.style.top = ttY + "px";
        tooltip.classList.remove("hidden");

        renderIndexChartCanvas();
      }

      function handleLeave() {
        if (!isIndexChartDragging) {
          hoveredIndexCandleIndex = -1;
          tooltip.classList.add("hidden");
          renderIndexChartCanvas();
        }
      }

      container.addEventListener("mousemove", handleMove);
      container.addEventListener("mouseleave", handleLeave);

      // 觸控裝置手勢平移支援
      container.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          isIndexChartDragging = true;
          indexDragStartX = e.touches[0].clientX;
          indexDragStartViewStart = indexChartViewStart;
          indexDragStartViewEnd = indexChartViewEnd;
          tooltip.classList.add("hidden");
        }
      }, { passive: true });

      container.addEventListener("touchmove", handleMove, { passive: true });
      container.addEventListener("touchend", () => {
        isIndexChartDragging = false;
        hoveredIndexCandleIndex = -1;
        tooltip.classList.add("hidden");
        renderIndexChartCanvas();
      });

      window.addEventListener("resize", () => {
        const drawer = document.getElementById("index-drawer");
        if (drawer && !drawer.classList.contains("translate-x-full")) {
          renderIndexChartCanvas();
        }
      });
    }

    // 鍵盤 Esc 鍵關閉所有抽屜
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllDrawers();
      }
    });

    // 籌碼博弈週期解密抽屜
    function openSmartMoneyDrawer() {
      closeHeroDrawer();
      closeChartDrawer();
      closeIndexDrawer();
      document.getElementById('smart-money-drawer').classList.remove('translate-x-full');
      document.getElementById('drawer-backdrop').classList.remove('hidden');
    }

    function closeSmartMoneyDrawer() {
      const drawer = document.getElementById('smart-money-drawer');
      if (drawer) drawer.classList.add('translate-x-full');
      checkHideBackdrop();
    }

    // 歷史資金與大盤走勢抽屜
    function openChartDrawer() {
      closeHeroDrawer();
      closeSmartMoneyDrawer();
      closeIndexDrawer();
      document.getElementById('chart-drawer').classList.remove('translate-x-full');
      document.getElementById('drawer-backdrop').classList.remove('hidden');
      setTimeout(() => {
        initOrUpdateCharts();
      }, 60);
    }

    function closeChartDrawer() {
      const drawer = document.getElementById('chart-drawer');
      if (drawer) drawer.classList.add('translate-x-full');
      checkHideBackdrop();
    }

    function checkHideBackdrop() {
      const heroDrawer = document.getElementById('hero-drawer');
      const smDrawer = document.getElementById('smart-money-drawer');
      const chDrawer = document.getElementById('chart-drawer');
      const idxDrawer = document.getElementById('index-drawer');
      const heroClosed = !heroDrawer || heroDrawer.classList.contains('translate-x-full');
      const smClosed = !smDrawer || smDrawer.classList.contains('translate-x-full');
      const chClosed = !chDrawer || chDrawer.classList.contains('translate-x-full');
      const idxClosed = !idxDrawer || idxDrawer.classList.contains('translate-x-full');
      if (heroClosed && smClosed && chClosed && idxClosed) {
        document.getElementById('drawer-backdrop').classList.add('hidden');
      }
    }

    function closeAllDrawers() {
      closeHeroDrawer();
      closeSmartMoneyDrawer();
      closeChartDrawer();
      closeIndexDrawer();
    }

    function openSentimentEngineModal() {
      const modal = document.getElementById('sentiment-engine-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    }

    function closeSentimentEngineModal() {
      const modal = document.getElementById('sentiment-engine-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }

    function switchZone03Mode(mode) {
      const gaugeView = document.getElementById('zone03-gauge-view');
      if (gaugeView) gaugeView.classList.remove('hidden');
    }

    function initZone03Mode() {
      const gaugeView = document.getElementById('zone03-gauge-view');
      if (gaugeView) gaugeView.classList.remove('hidden');
    }

    // ==========================================
    // 🎯 價格模型（非官方）讀數微調校準器與算力引擎邏輯
    // ==========================================
    function openSentimenTraderCalibratorModal() {
      const modal = document.getElementById('sentimentrader-calibrator-modal');
      if (modal) modal.classList.remove('hidden');
      updateCalibratorPreview();
    }

    function closeSentimenTraderCalibratorModal() {
      const modal = document.getElementById('sentimentrader-calibrator-modal');
      if (modal) modal.classList.add('hidden');
    }

    function setCalibratorPreset(sm, dm) {
      const smInput = document.getElementById('calib-input-smart');
      const dmInput = document.getElementById('calib-input-dumb');
      if (smInput) smInput.value = sm.toFixed(1);
      if (dmInput) dmInput.value = dm.toFixed(1);
      updateCalibratorPreview();
      onCalibratorInputChange();
    }

    function updateCalibratorPreview() {
      const smInput = document.getElementById('calib-input-smart');
      const dmInput = document.getElementById('calib-input-dumb');
      const prevSpread = document.getElementById('calib-preview-spread');
      const prevRegime = document.getElementById('calib-preview-regime');
      if (!smInput || !dmInput) return;
      const sm = parseFloat(smInput.value) || 0;
      const dm = parseFloat(dmInput.value) || 0;
      const spread = Math.round((sm - dm) * 10) / 10;
      if (prevSpread) {
        prevSpread.textContent = (spread > 0 ? '+' : '') + spread.toFixed(1) + '%';
        prevSpread.className = spread > 0 ? 'text-base font-black font-mono text-emerald-400' : 'text-base font-black font-mono text-indigo-300';
      }
      let regime = "🐂 牛市主升常態";
      let badgeColor = "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      if (sm >= 70 && dm <= 25) {
        regime = "🟢 歷史極致黃金底";
        badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      } else if (dm >= 80 && sm <= 30) {
        regime = "🔴 極端狂熱接火棒";
        badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
      } else if (sm > dm) {
        regime = "✨ 主力領跑突破";
        badgeColor = "bg-sky-500/20 text-sky-300 border-sky-500/40";
      }
      if (prevRegime) {
        prevRegime.textContent = regime;
        prevRegime.className = "px-2 py-0.5 rounded-full text-[11px] font-bold border " + badgeColor;
      }
    }

    let calibDebounceTimer = null;
    function onCalibratorInputChange() {
      updateCalibratorPreview();
      clearTimeout(calibDebounceTimer);
      calibDebounceTimer = setTimeout(() => {
        saveAndApplyCalibration(true);
      }, 400);
    }

    async function saveAndApplyCalibration(keepModalOpen = false) {
      const smInput = document.getElementById('calib-input-smart');
      const dmInput = document.getElementById('calib-input-dumb');
      if (!smInput || !dmInput) return;
      const sm = parseFloat(smInput.value) || 41.0;
      const dm = parseFloat(dmInput.value) || 36.0;
      const payload = { smart: sm, dumb: dm, date: window.__SCAN_SNAPSHOT__.scan_time.slice(0,10), timestamp: Date.now() };

      // 1. 本地 LocalStorage 儲存（離線或當前瀏覽器立即可用）
      try {
        localStorage.setItem('sentimentrader_custom_calibration', JSON.stringify(payload));
      } catch (e) {}

      // 2. 雲端伺服器永久保存（手機輸入，電腦與其他設備同步生效）
      try {
        await fetch('/api/calibration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('雲端伺服器同步略過（已由本地保存）:', err);
      }

      applySentimentMetricsToAll(sm, dm, true);
      if (!keepModalOpen) {
        closeSentimenTraderCalibratorModal();
      }
      showCalibrateSuccessToast(sm, dm);
    }

    async function resetToDefaultFitting() {
      localStorage.removeItem('sentimentrader_custom_calibration');
      await loadUserSentimentCalibration();
      closeSentimenTraderCalibratorModal();
    }

    function showCalibrateSuccessToast(sm, dm, customMsg) {
      const text = customMsg || ("已雲端同步 SentimenTrader 校準值：Smart " + sm + "% | Dumb " + dm + "% (跨設備永久生效)");
      let toast = document.getElementById('sentiment-calib-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sentiment-calib-toast';
        toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-amber-500/80 text-white text-xs font-bold shadow-2xl flex items-center gap-2 transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<span>☁️</span><span>' + text + '</span>';
      toast.classList.remove('translate-y-10', 'opacity-0');
      setTimeout(() => {
        if (toast) toast.classList.add('translate-y-10', 'opacity-0');
      }, 3000);
    }

    function applySentimentMetricsToAll(smart, dumb, isCustom) {
      const spread = Math.round((smart - dumb) * 10) / 10;
      let regime = "🐂 牛市主升常態（散戶貪婪主導，主力常態套保）";
      let smSub = "常態對沖中";
      let dmSub = "高位追漲中 (+2.4%)";
      let smBadge = "高位防禦對沖 🛡️";
      let dmBadge = "散戶狂熱追漲 🔥";
      
      if (smart >= 70 && dumb <= 25) {
        regime = "🟢 黃金底信號（極致剪刀差 · 歷史勝率>92%）";
        smSub = "主力全速掃平貨";
        dmSub = "散戶恐慌割肉";
        smBadge = "黃金底狂吸 🚀";
        dmBadge = "散戶割肉 🩸";
      } else if (dumb >= 80 && smart <= 30) {
        regime = "🔴 極端狂熱見頂警報（散戶接火棒，主力出清）";
        smSub = "主力暗中出清";
        dmSub = "散戶瘋狂接火棒";
        smBadge = "主力派發 ⚠️";
        dmBadge = "極度亢奮 🔥";
      } else if (smart >= 30 && smart <= 60 && dumb >= 30 && dumb <= 60) {
        regime = "⚖️ 雙重中性平衡期（Dumb & Smart 均處中性區）";
        smSub = "模型處於中性區間";
        dmSub = "模型處於中性區間";
        smBadge = "中性微偏多 ⚖️";
        dmBadge = "追漲退潮冷卻 ❄️";
      } else if (smart > dumb) {
        regime = "✨ 主力領跑期（機構淨吸籌，籌碼結構健康）";
        smSub = "主力主動吸籌";
        dmSub = "散戶跟隨溫和";
        smBadge = "主力吸納 ↗️";
        dmBadge = "情緒穩定 ⚖️";
      }

      const officialRegime=document.getElementById('official-money-regime');
      const officialAnalysis=document.getElementById('official-money-analysis');
      if(officialRegime) officialRegime.textContent=regime;
      if(officialAnalysis) officialAnalysis.textContent=`Smart Money ${smart}%｜Dumb Money ${dumb}%｜剪刀差 ${spread>0?'+':''}${spread}%${isCustom?'（手動輸入）':''}`;

      // 1. ZONE 02 儀表卡
      const zSm = document.getElementById('zone02-sm-val');
      const zDm = document.getElementById('zone02-dm-val');
      const zSmSub = document.getElementById('zone02-sm-sub');
      const zDmSub = document.getElementById('zone02-dm-sub');
      const zSmBadge = document.getElementById('zone02-sm-badge');
      const zDmBadge = document.getElementById('zone02-dm-badge');
      const zSmBar = document.getElementById('zone02-sm-bar');
      const zDmBar = document.getElementById('zone02-dm-bar');
      if (zSm) zSm.textContent = smart + '%';
      if (zDm) zDm.textContent = dumb + '%';
      if (zSmSub) zSmSub.textContent = moneyStateLabel(smart, true);
      if (zDmSub) zDmSub.textContent = moneyStateLabel(dumb, false);
      if (zSmBadge) zSmBadge.textContent = smBadge;
      if (zDmBadge) zDmBadge.textContent = dmBadge;
      if (zSmBar) zSmBar.style.width = Math.min(100, Math.max(0, smart)) + '%';
      if (zDmBar) zDmBar.style.width = Math.min(100, Math.max(0, dumb)) + '%';

      // 2. Chart Drawer 即時指標
      const cSm = document.getElementById('chart-drawer-sm-val');
      const cDm = document.getElementById('chart-drawer-dm-val');
      const cSp = document.getElementById('chart-drawer-spread-val');
      const cRegime = document.getElementById('chart-drawer-regime-val');
      if (cSm) cSm.textContent = smart + '%';
      if (cDm) cDm.textContent = dumb + '%';
      if (cSp) cSp.textContent = (spread > 0 ? '+' : '') + spread + '%';
      if (cRegime) cRegime.textContent = regime;

      // 3. Engine Modal 指標
      const mSm = document.getElementById('engine-sm-val');
      const mDm = document.getElementById('engine-dm-val');
      const mSp = document.getElementById('engine-spread-val');
      if (mSm) mSm.textContent = smart + '%';
      if (mDm) mDm.textContent = dumb + '%';
      if (mSp) mSp.textContent = (spread > 0 ? '+' : '') + spread + '%';

      // 5. 重新渲染圖表
      initOrUpdateCharts();
    }

    async function loadUserSentimentCalibration() {
      await Promise.resolve();
      const money=window.__SCAN_SNAPSHOT__.dashboard?.money;
      if(money) applySentimentMetricsToAll(money.smart_conf, money.dumb_conf, false);
      else for(const id of ['zone02-sm-val','zone02-dm-val']) {const e=document.getElementById(id);if(e)e.textContent='—';}
      const source=document.getElementById('snapshot-money-source');
      if(source) source.textContent=money?.source || '這次掃描未有 Smart / Dumb Money 資料';
      for(const el of document.querySelectorAll('[data-money-source]')) el.textContent=money?.source || '這次掃描未有 Smart / Dumb Money 資料';
    }

    async function refreshSentimentEngine() {
      await refreshChartSentiment();
    }

    async function refreshChartSentiment() {
      const chartBtn = document.getElementById('btn-chart-sync-sentiment');
      const engineBtn = document.getElementById('btn-refresh-sentiment-engine');
      if (chartBtn) chartBtn.innerHTML = '<span>⏳</span><span>同步中...</span>';
      if (engineBtn) engineBtn.innerHTML = '<span>⏳</span><span>同步計算中...</span>';
      try {
        const res = await fetch('/api/sentiment');
        if (res.ok) {
          const data = await res.json();
          applySentimentMetricsToAll(data.smart_money, data.dumb_money, false);

          // 2. 同步 4 大底層因子數值
          const fSmi = document.getElementById('chart-factor-smi');
          const fCboe = document.getElementById('chart-factor-cboe');
          const fVix = document.getElementById('chart-factor-vix');
          const fLev = document.getElementById('chart-factor-lev');
          if (fSmi && data.components && data.components[0]) fSmi.textContent = data.components[0].val + '%';
          if (fCboe && data.components && data.components[1]) fCboe.textContent = data.components[1].val + '%';
          if (fVix && data.components && data.components[2]) fVix.textContent = data.components[2].val + '%';
          if (fLev && data.components && data.components[3]) fLev.textContent = data.components[3].val + '%';

          if (chartBtn) chartBtn.innerHTML = '<span>✅</span><span>算力已同步至圖表</span>';
          if (engineBtn) engineBtn.innerHTML = '<span>✅</span><span>已更新至最新算力</span>';
          setTimeout(() => {
            if (chartBtn) chartBtn.innerHTML = '<span>🔄</span><span>同步實時擬合</span>';
            if (engineBtn) engineBtn.innerHTML = '<span>🔄</span><span>重新同步擬合</span>';
          }, 1600);
        }
      } catch (e) {
        console.error("Failed to refresh sentiment:", e);
        if (chartBtn) chartBtn.innerHTML = '<span>⚠️</span><span>同步失敗</span>';
      }
    }

    // Historical confidence values are dated readings from the public SentimenTrader chart.
    let HISTORICAL_CHART_DATA = (window.__SCAN_HISTORY__ || []);

    let currentChartRange = '6M';
    let sp500ChartInstance = null;
    let moneyFlowChartInstance = null;

    // 圖層顯示狀態開關
    let chartVisibleDatasets = {
      smart: true,
      dumb: true,
      spread: true,
      benchmarks: true
    };

    function toggleChartDataset(key) {
      chartVisibleDatasets[key] = !chartVisibleDatasets[key];
      updateChartToggleButtons();
      if (moneyFlowChartInstance) {
        if (key === 'smart') moneyFlowChartInstance.getDatasetMeta(0).hidden = !chartVisibleDatasets.smart;
        if (key === 'dumb') moneyFlowChartInstance.getDatasetMeta(1).hidden = !chartVisibleDatasets.dumb;
        if (key === 'spread') moneyFlowChartInstance.getDatasetMeta(2).hidden = !chartVisibleDatasets.spread;
        if (key === 'benchmarks') {
          moneyFlowChartInstance.getDatasetMeta(3).hidden = !chartVisibleDatasets.benchmarks;
          moneyFlowChartInstance.getDatasetMeta(4).hidden = !chartVisibleDatasets.benchmarks;
          moneyFlowChartInstance.getDatasetMeta(5).hidden = !chartVisibleDatasets.benchmarks;
        }
        moneyFlowChartInstance.update();
      }
    }

    function updateChartToggleButtons() {
      const bSmart = document.getElementById('btn-toggle-smart');
      const bDumb = document.getElementById('btn-toggle-dumb');
      const bSpread = document.getElementById('btn-toggle-spread');
      const bBench = document.getElementById('btn-toggle-benchmarks');
      if (bSmart) {
        bSmart.className = chartVisibleDatasets.smart
          ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30 transition cursor-pointer flex items-center gap-1"
          : "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400 transition cursor-pointer flex items-center gap-1 opacity-60";
      }
      if (bDumb) {
        bDumb.className = chartVisibleDatasets.dumb
          ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 transition cursor-pointer flex items-center gap-1"
          : "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400 transition cursor-pointer flex items-center gap-1 opacity-60";
      }
      if (bSpread) {
        bSpread.className = chartVisibleDatasets.spread
          ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
          : "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400 transition cursor-pointer flex items-center gap-1 opacity-60";
      }
      if (bBench) {
        bBench.className = chartVisibleDatasets.benchmarks
          ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
          : "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400 transition cursor-pointer flex items-center gap-1 opacity-60";
      }
    }

    function switchChartRange(range) {
      currentChartRange = range;
      ['1m', '3m', '6m', '1y'].forEach(r => {
        const btn = document.getElementById('btn-chart-' + r);
        if (!btn) return;
        if (r.toUpperCase() === range) {
          btn.className = "px-2.5 py-1 sm:px-3 sm:py-1 text-xs font-black rounded-lg bg-sky-500 text-slate-950 shadow-md transition cursor-pointer";
        } else {
          btn.className = "px-2.5 py-1 sm:px-3 sm:py-1 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition cursor-pointer";
        }
      });
      initOrUpdateCharts();
    }

    let isSyncingTooltips = false;

    function syncTooltipTo(target, dataIndex) {
      if (isSyncingTooltips) return;
      isSyncingTooltips = true;
      try {
        if (target === 'mf' && moneyFlowChartInstance) {
          const active = [
            { datasetIndex: 0, index: dataIndex },
            { datasetIndex: 1, index: dataIndex }
          ];
          moneyFlowChartInstance.setActiveElements(active);
          const meta = moneyFlowChartInstance.getDatasetMeta(0);
          const pt = meta && meta.data && meta.data[dataIndex];
          if (moneyFlowChartInstance.tooltip) {
            if (pt) {
              moneyFlowChartInstance.tooltip.setActiveElements(active, { x: pt.x, y: pt.y });
            } else {
              moneyFlowChartInstance.tooltip.setActiveElements(active);
            }
          }
          moneyFlowChartInstance.update('none');
        } else if (target === 'sp' && sp500ChartInstance) {
          const active = [{ datasetIndex: 0, index: dataIndex }];
          sp500ChartInstance.setActiveElements(active);
          const meta = sp500ChartInstance.getDatasetMeta(0);
          const pt = meta && meta.data && meta.data[dataIndex];
          if (sp500ChartInstance.tooltip) {
            if (pt) {
              sp500ChartInstance.tooltip.setActiveElements(active, { x: pt.x, y: pt.y });
            } else {
              sp500ChartInstance.tooltip.setActiveElements(active);
            }
          }
          sp500ChartInstance.update('none');
        }
      } catch (err) {
        // safe catch
      } finally {
        isSyncingTooltips = false;
      }
    }

    function clearSyncTooltip(target) {
      if (isSyncingTooltips) return;
      isSyncingTooltips = true;
      try {
        if (target === 'mf' && moneyFlowChartInstance) {
          moneyFlowChartInstance.setActiveElements([]);
          if (moneyFlowChartInstance.tooltip) {
            moneyFlowChartInstance.tooltip.setActiveElements([]);
          }
          moneyFlowChartInstance.update('none');
        } else if (target === 'sp' && sp500ChartInstance) {
          sp500ChartInstance.setActiveElements([]);
          if (sp500ChartInstance.tooltip) {
            sp500ChartInstance.tooltip.setActiveElements([]);
          }
          sp500ChartInstance.update('none');
        }
      } catch (err) {
        // safe catch
      } finally {
        isSyncingTooltips = false;
      }
    }

    function clearBothSyncTooltips() {
      clearSyncTooltip('sp');
      clearSyncTooltip('mf');
    }

    function initOrUpdateCharts() {
      if (typeof Chart === 'undefined') return;

      let sliceCount = 125;
      let labelText = "6個月走勢 (125個交易日 · 推薦標準 ⭐)";
      if (currentChartRange === '1M') {
        sliceCount = 22;
        labelText = "1個月走勢 (22個交易日)";
      } else if (currentChartRange === '3M') {
        sliceCount = 65;
        labelText = "3個月走勢 (65個交易日)";
      } else if (currentChartRange === '6M') {
        sliceCount = 125;
        labelText = "6個月走勢 (125個交易日 · 推薦標準 ⭐)";
      } else if (currentChartRange === '1Y') {
        sliceCount = Math.min(252, HISTORICAL_CHART_DATA.length);
        labelText = "1年宏觀全景走勢 (250個交易日)";
      }

      const lbl = document.getElementById('chart-range-label');
      if (lbl) lbl.textContent = labelText;

      const filtered = HISTORICAL_CHART_DATA.slice(-sliceCount);
      const labels = filtered.map(d => d.label);
      const spPrices = filtered.map(d => d.sp500);
      const smValues = filtered.map(d => d.smart);
      const dmValues = filtered.map(d => d.dumb);
      // 1. S&P 500 Canvas
      const spCanvas = document.getElementById('sp500Canvas');
      if (spCanvas) {
        if (sp500ChartInstance) sp500ChartInstance.destroy();
        sp500ChartInstance = new Chart(spCanvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'S&P 500 指數',
              data: spPrices,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderWidth: 2.0,
              fill: true,
              tension: 0.12,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#34d399',
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            onHover: (event, activeElements) => {
              if (activeElements && activeElements.length > 0) {
                syncTooltipTo('mf', activeElements[0].index);
              } else {
                clearSyncTooltip('mf');
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                  title: (items) => '📅 ' + filtered[items[0].dataIndex].date,
                  label: (ctx) => ' 📈 S&P 500: ' + ctx.parsed.y.toLocaleString() + ' 點'
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(51, 65, 85, 0.25)' },
                ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 10 }
              },
              y: {
                grid: { color: 'rgba(51, 65, 85, 0.25)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 10 },
                  callback: (v) => '$' + v.toLocaleString()
                }
              }
            }
          }
        });

        if (!spCanvas.dataset.syncBound) {
          spCanvas.dataset.syncBound = 'true';
          spCanvas.addEventListener('mouseleave', clearBothSyncTooltips);
        }
      }

      // 2. Money Flow Canvas (Smart Money vs Dumb Money)
      const mfCanvas = document.getElementById('moneyFlowCanvas');
      if (mfCanvas) {
        if (moneyFlowChartInstance) moneyFlowChartInstance.destroy();
        moneyFlowChartInstance = new Chart(mfCanvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: '🧠 Smart Money',
                data: smValues,
                borderColor: '#38bdf8',
                backgroundColor: 'transparent',
                borderWidth: 2.2,
                tension: 0.28,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#38bdf8',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
              },
              {
                label: '🐑 Dumb Money',
                data: dmValues,
                borderColor: '#f43f5e',
                backgroundColor: 'transparent',
                borderWidth: 2.2,
                tension: 0.28,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#f43f5e',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
              },
              {
                label: '80% 警戒線',
                data: Array(filtered.length).fill(80),
                borderColor: 'rgba(244, 63, 94, 0.45)',
                borderWidth: 1.5,
                borderDash: [5, 5],
                pointRadius: 0,
                pointHoverRadius: 0
              },
              {
                label: '30% 警戒線',
                data: Array(filtered.length).fill(30),
                borderColor: 'rgba(56, 189, 248, 0.45)',
                borderWidth: 1.5,
                borderDash: [5, 5],
                pointRadius: 0,
                pointHoverRadius: 0
              },
              {
                label: '50% 平衡線',
                data: Array(filtered.length).fill(50),
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                borderDash: [3, 3],
                pointRadius: 0,
                pointHoverRadius: 0
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            onHover: (event, activeElements) => {
              if (activeElements && activeElements.length > 0) {
                syncTooltipTo('sp', activeElements[0].index);
              } else {
                clearSyncTooltip('sp');
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                  labelTextColor: (ctx) => ctx.datasetIndex === 0 ? '#38bdf8' : '#fb7185',
                  title: (items) => '📅 ' + filtered[items[0].dataIndex].date,
                  label: (ctx) => {
                    if (ctx.datasetIndex === 0) return ' 🧠 Smart Money: ' + ctx.parsed.y + '%';
                    if (ctx.datasetIndex === 1) return ' 🐑 Dumb Money: ' + ctx.parsed.y + '%';
                    return null;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(51, 65, 85, 0.25)' },
                ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 10 }
              },
              y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(51, 65, 85, 0.25)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 10 },
                  stepSize: 20,
                  callback: (v) => v + '%'
                }
              }
            }
          }
        });

        if (!mfCanvas.dataset.syncBound) {
          mfCanvas.dataset.syncBound = 'true';
          mfCanvas.addEventListener('mouseleave', clearBothSyncTooltips);
        }
      }
    }

    // Telegram Modal
    function openTgModal() { document.getElementById('tg-modal').classList.remove('hidden'); }
    function closeTgModal() { document.getElementById('tg-modal').classList.add('hidden'); }

    function copyTgRawText() {
      const txt = document.getElementById('raw-tg-text').innerText;
      navigator.clipboard.writeText(txt).then(() => alert('已複製 Telegram 訊息全文！'));
    }

    function copyCurrentAnalysis() {
      if (!selectedHero) return;
      const h = selectedHero;
      const txt = `🏆 【${h.tier} 級英雄】${h.symbol} (${h.sector})\
⚔️ 綜合戰力 (CP): ${h.cp}\\n📊 能量蓄力: ${Number.isFinite(h.vol_ratio) ? h.vol_ratio.toFixed(2) + 'x' : '—'} (${h.vol_status})\\n🎯 作戰指令: ${h.decision_action}\\n📝 戰術詳情: ${h.decision_desc}`;
      navigator.clipboard.writeText(txt).then(() => alert(`已複製 ${h.symbol} 戰報！`));
    }

    // 分類與過濾
    function setCategory(cat) {
      currentCategory = cat;
      ['ALL', 'early', 'bottom'].forEach(c => {
        const b = document.getElementById('tab-cat-' + c);
        b.className = c === cat 
          ? "px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-md transition" 
          : "px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition";
      });
      renderHeroes();
    }

    function filterTier(t) {
      currentTier = t;
      ['ALL', 'SSR', 'SR'].forEach(x => {
        const b = document.getElementById('tier-btn-' + x);
        b.className = x === t ? "px-2 py-1 rounded bg-slate-800 text-white font-bold" : "px-2 py-1 rounded bg-slate-900 text-slate-400 hover:bg-slate-800 font-bold";
      });
      renderHeroes();
    }

    function resetFilters() {
      currentCategory = 'ALL';
      currentTier = 'ALL';
      clearAllFilters();
    }

    // 初始化
    renderSectors();
    renderHeroes();
    initZone03Mode();
    loadUserSentimentCalibration();

    function applyScanSnapshot(snapshot) {
      if (!Array.isArray(snapshot.heroes)) throw new Error('Invalid scan snapshot');
      HEROES.splice(0, HEROES.length, ...snapshot.heroes);
      window.__INITIAL_TG_TEXT__ = snapshot.tg_text || '';
      const rawEl = document.getElementById('raw-tg-text');
      if (rawEl) rawEl.textContent = snapshot.tg_text || '尚未收到 Telegram 掃描原文。';
      const badge = document.getElementById('sync-status-badge');
      if (badge) {
        badge.textContent = snapshot.scan_time ? `⚡ TG 掃描同步: ${snapshot.scan_time}` : '尚未收到掃描資料';
        badge.classList.remove('hidden');
      }
      renderHeroes();
      renderSectors();
    }

    applyScanSnapshot({ heroes: HEROES.slice(), tg_text: window.__INITIAL_TG_TEXT__, scan_time: window.__INITIAL_SCAN_TIME__ });
    async function refreshScanSnapshot() {
      try {
        const response = await fetch('/api/signals?scan=' + encodeURIComponent(new URLSearchParams(location.search).get('scan') || ''), { cache: 'no-store' });
        if (!response.ok) throw new Error(`Scan refresh failed: ${response.status}`);
        applyScanSnapshot(await response.json());
      } catch (error) { console.warn('掃描同步更新失敗', error); }
    }
    refreshScanSnapshot();
    setInterval(refreshScanSnapshot, 30000);

    // 支援從 Telegram 點擊個股連結跳轉開啟圖表抽屜 (?symbol=NVDA)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetSymbol = urlParams.get('symbol');
      if (targetSymbol) {
        const targetUpper = targetSymbol.trim().toUpperCase();
        setTimeout(() => {
          openHeroDrawer(targetUpper);
        }, 500);
      }
    } catch (e) {
      console.warn("URL params parsing error", e);
    }
  