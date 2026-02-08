(function () {
  'use strict';

  const DEX_API = 'https://api.dexscreener.com/latest/dex/tokens/';
  const POLL_INTERVAL_MS = 3000;
  const STORAGE_KEY = 'crypto-monitor-watchlist';

  const PERIODS = ['m5', 'h1', 'h6', 'h24'];
  const PERIOD_LABELS = { m5: '5m', h1: '1H', h6: '6H', h24: '24H' };

  let list = [];
  let pollTimer = null;
  let selectedPeriod = 'h1';
  let lastResults = {};

  const $ = (id) => document.getElementById(id);

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          list = arr.filter((c) => c && typeof c === 'string').map((c) => ({ contract: normalizeAddress(c) }));
          return;
        }
      }
      const legacy = localStorage.getItem('crypto-monitor-data');
      if (legacy) {
        try {
          const data = JSON.parse(legacy);
          if (data && Array.isArray(data.list)) {
            list = data.list.filter((p) => p && p.contract).map((p) => ({ contract: normalizeAddress(p.contract) }));
            if (list.length > 0) saveData();
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map((p) => p.contract)));
    } catch (e) {}
  }

  function normalizeAddress(addr) {
    if (!addr || typeof addr !== 'string') return '';
    return addr.trim().toLowerCase();
  }

  function shortAddress(addr) {
    if (!addr || addr.length < 12) return addr || '—';
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  function addItem(addr) {
    const n = normalizeAddress(addr);
    if (!n || n.length < 20) return false;
    if (list.some((p) => p.contract === n)) return true;
    list.push({ contract: n });
    saveData();
    return true;
  }

  function removeItem(contract) {
    const addr = (contract || '').toLowerCase();
    list = list.filter((p) => (p.contract || '').toLowerCase() !== addr);
    saveData();
  }

  function getBestPair(pairs) {
    if (!pairs || !pairs.length) return null;
    return pairs.reduce((best, p) => {
      const liq = (p.liquidity && p.liquidity.usd) || 0;
      const bestLiq = (best.liquidity && best.liquidity.usd) || 0;
      return liq >= bestLiq ? p : best;
    }, pairs[0]);
  }

  function getChangeValue(item, period) {
    if (!item) return null;
    const key = 'change' + period.charAt(0).toUpperCase() + period.slice(1);
    const v = item[key];
    return v != null && v !== '' && !isNaN(parseFloat(v)) ? parseFloat(v) : null;
  }

  function changeClass(val) {
    if (val == null || isNaN(val)) return 'flat';
    if (val > 0) return 'up';
    if (val < 0) return 'down';
    return 'flat';
  }

  function changeText(val) {
    if (val == null || isNaN(val)) return '—';
    return (val >= 0 ? '+' : '') + val.toFixed(2) + '%';
  }

  function formatPrice(priceUsd) {
    if (priceUsd == null || priceUsd === '') return '—';
    const n = parseFloat(priceUsd);
    if (isNaN(n)) return '—';
    if (n >= 100) return '$' + n.toFixed(2);
    if (n >= 1) return '$' + n.toFixed(4);
    if (n >= 0.0001) return '$' + n.toFixed(6);
    if (n >= 0.000001) return '$' + n.toFixed(8);
    if (n > 0) return '$' + n.toExponential(4);
    return '$0';
  }

  function formatShortMoney(v) {
    if (v == null || !Number.isFinite(v) || v < 0) return '—';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    if (v >= 1) return '$' + v.toFixed(0);
    return '$' + v.toFixed(2);
  }

  function getGmgnUrl(chainId, contract) {
    const chain = (chainId || '').toLowerCase();
    const path = chain === 'solana' ? 'sol' : chain === 'ethereum' ? 'eth' : chain || 'eth';
    return `https://gmgn.ai/${path}/token/${contract}`;
  }

  function showToast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('toast-hide');
    el.classList.add('toast-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.remove('toast-show');
      el.classList.add('toast-hide');
    }, 1500);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  async function fetchTokenData(contract) {
    try {
      const res = await fetch(DEX_API + contract);
      if (!res.ok) return null;
      const data = await res.json();
      const pair = getBestPair(data.pairs);
      if (!pair) return null;
      const base = pair.baseToken || {};
      const change = pair.priceChange || {};
      const info = pair.info || {};
      const vol = pair.volume || {};
      const liqUsd = (pair.liquidity && pair.liquidity.usd) != null ? pair.liquidity.usd : null;
      const fdv = pair.fdv != null ? pair.fdv : null;
      const volumeH24 = vol.h24 != null ? vol.h24 : null;
      return {
        contract,
        name: base.name || '—',
        symbol: base.symbol || '—',
        chainId: pair.chainId,
        priceUsd: pair.priceUsd,
        changeM5: change.m5 != null ? change.m5 : null,
        changeH1: change.h1 != null ? change.h1 : null,
        changeH6: change.h6 != null ? change.h6 : null,
        changeH24: change.h24 != null ? change.h24 : null,
        imageUrl: info.imageUrl || null,
        fdv,
        volumeH24,
        liquidityUsd: liqUsd,
        pairUrl: pair.url || null,
      };
    } catch (e) {
      console.warn('Fetch failed for', contract, e);
      return null;
    }
  }

  function buildRowHtml(item, data) {
    const priceStr = data ? formatPrice(data.priceUsd) : '—';
    const mcStr = data && data.fdv != null ? formatShortMoney(data.fdv) : '—';
    const volStr = data && data.volumeH24 != null ? formatShortMoney(data.volumeH24) : '—';
    const liqStr = data && data.liquidityUsd != null ? formatShortMoney(data.liquidityUsd) : '—';
    const changeVal = data ? getChangeValue(data, selectedPeriod) : null;
    const changeCls = changeClass(changeVal);
    const changeStr = changeText(changeVal);

    const imgSrc = data && data.imageUrl ? data.imageUrl : '';
    const imgHtml = imgSrc
      ? `<img class="token-icon" src="${escapeHtml(imgSrc)}" alt="" onerror="this.style.display='none'">`
      : '<span class="token-icon"></span>';
    const chainBadge = data && data.chainId
      ? `<span class="chain-badge">${escapeHtml(String(data.chainId).toUpperCase())}</span>`
      : '';
    const name = data ? data.name + ' (' + data.symbol + ')' : '—';
    const contractKey = (item.contract || '').trim() || '';
    const addrShort = shortAddress(contractKey);
    const gmgnUrl = data ? getGmgnUrl(data.chainId, contractKey) : '#';

    return `
      <div class="token-row" data-contract="${escapeHtml(contractKey)}" role="row">
        <div class="cell cell-token">
          <div class="cell-token-inner">
            ${imgHtml}
            <div class="token-info">
              <div class="token-name-row">${chainBadge}<span class="token-name">${escapeHtml(name)}</span></div>
              <div class="token-address">${escapeHtml(addrShort)}</div>
            </div>
          </div>
        </div>
        <div class="cell cell-price">${escapeHtml(priceStr)}</div>
        <div class="cell cell-mc">${escapeHtml(mcStr)}</div>
        <div class="cell cell-vol">${escapeHtml(volStr)}</div>
        <div class="cell cell-liq">${escapeHtml(liqStr)}</div>
        <div class="cell cell-change"><span class="change-badge ${changeCls}">${escapeHtml(changeStr)}</span></div>
        <div class="cell cell-actions">
          <button type="button" class="btn-icon btn-copy" data-contract="${escapeHtml(contractKey)}" title="复制地址">📋</button>
          <a class="btn-icon btn-link" href="${escapeHtml(gmgnUrl)}" target="_blank" rel="noopener" title="GMGN">🔗</a>
          <button type="button" class="btn-remove" data-contract="${escapeHtml(contractKey)}" title="删除">🗑️</button>
        </div>
      </div>
    `;
  }

  function updateChangeHeader() {
    const periodLabel = PERIOD_LABELS[selectedPeriod];
    const th = $('th-change');
    if (th) th.textContent = periodLabel + ' 涨跌幅';
  }

  function sortRows(a, b) {
    const chA = a.data ? getChangeValue(a.data, selectedPeriod) : -Infinity;
    const chB = b.data ? getChangeValue(b.data, selectedPeriod) : -Infinity;
    const vA = chA != null ? chA : -Infinity;
    const vB = chB != null ? chB : -Infinity;
    return vB - vA;
  }

  async function refresh() {
    const container = $('table-body');
    const emptyEl = $('empty-state');
    if (!container) return;

    if (list.length === 0) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    const results = {};
    await Promise.all(
      list.map(async (item) => {
        const data = await fetchTokenData(item.contract);
        results[item.contract] = data;
      })
    );

    const validList = list.filter((item) => results[item.contract] != null);
    if (validList.length !== list.length) {
      list = validList;
      saveData();
    }

    lastResults = results;
    const withData = list.map((item) => ({ item, data: results[item.contract] || null }));
    const sorted = withData.slice().sort(sortRows);

    container.innerHTML = sorted.map(({ item }) => buildRowHtml(item, results[item.contract] || null)).join('');
    if (emptyEl) emptyEl.classList.add('hidden');
    bindRowListeners(container);
  }

  function bindRowListeners(container) {
    if (!container) return;
    container.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.onclick = () => {
        const addr = (btn.dataset.contract || '').trim();
        if (addr) removeItem(addr);
        startPolling();
      };
    });
    container.querySelectorAll('.btn-copy').forEach((btn) => {
      btn.onclick = function () {
        const contract = btn.dataset.contract;
        if (contract) {
          navigator.clipboard.writeText(contract).then(() => showToast('已复制'), () => showToast('复制失败'));
        }
      };
    });
  }

  function startPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    refresh();
    if (list.length > 0) {
      pollTimer = setInterval(refresh, POLL_INTERVAL_MS);
    }
  }

  function init() {
    loadData();
    updateChangeHeader();

    window.clearAll = function () {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('watchlist_v2');
      location.reload();
    };

    const contractInput = $('contract-input');
    const btnAdd = $('btn-add');
    if (btnAdd && contractInput) {
      btnAdd.addEventListener('click', () => {
        if (addItem(contractInput.value)) {
          contractInput.value = '';
          startPolling();
        }
      });
      contractInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && addItem(contractInput.value)) {
          contractInput.value = '';
          startPolling();
        }
      });
    }

    document.querySelectorAll('.timeframe-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const period = tab.dataset.period;
        if (!period || !PERIODS.includes(period)) return;
        selectedPeriod = period;
        document.querySelectorAll('.timeframe-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        updateChangeHeader();
        if (list.length > 0 && Object.keys(lastResults).length > 0) {
          const withData = list.map((item) => ({ item, data: lastResults[item.contract] || null }));
          const sorted = withData.slice().sort(sortRows);
          const container = $('table-body');
          if (container) {
            container.innerHTML = sorted.map(({ item }) => buildRowHtml(item, lastResults[item.contract] || null)).join('');
            bindRowListeners(container);
          }
        } else {
          refresh();
        }
      });
    });

    startPolling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
