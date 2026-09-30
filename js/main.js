/**
 * main.js
 * App bootstrap: tab switching, clock, cashier-name persistence, mobile
 * sidebar drawer, and the live cross-device sync poll.
 */
const LIVE_SYNC_INTERVAL_MS = 6000;
const TAB_TITLES = { pos: 'Shop', inventory: 'Inventory', reports: 'Sales Reports' };

let liveSyncTimer = null;

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
    btn.setAttribute('aria-current', btn.dataset.tab === tabName ? 'page' : 'false');
  });
  let activePanel = null;
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const isActive = panel.id === 'tab-' + tabName;
    panel.classList.toggle('active', isActive);
    if (isActive) activePanel = panel;
  });
  Motion.playTabEnter(activePanel);
  Motion.observeReveal(activePanel);

  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = TAB_TITLES[tabName] || 'TinDARhan';

  // The top-bar search filters the Shop's product grid, so it's only shown
  // there (Inventory has its own search in its toolbar).
  const topSearch = document.querySelector('.topbar-search');
  if (topSearch) topSearch.classList.toggle('hidden', tabName !== 'pos');

  closeSidebar();

  if (tabName === 'pos') POS.renderItemGrid();
  else if (tabName === 'inventory') Inventory.render();
  else if (tabName === 'reports') Reports.render();
}

function getActiveTab() {
  const active = document.querySelector('.tab-btn.active');
  return active ? active.dataset.tab : 'pos';
}

function startClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  function tick() {
    el.textContent = new Date().toLocaleString('en-PH', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
  }
  tick();
  setInterval(tick, 1000);
}

function initCashierPersistence() {
  const KEY = 'tindarhan_cashier';
  const input = document.getElementById('cashierName');
  if (!input) return;
  const saved = localStorage.getItem(KEY);
  if (saved) input.value = saved;
  input.addEventListener('change', () => localStorage.setItem(KEY, input.value.trim()));
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('sidebarScrim');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (sidebar) sidebar.classList.add('open');
  if (scrim) scrim.classList.add('visible');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('sidebarScrim');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (sidebar) sidebar.classList.remove('open');
  if (scrim) scrim.classList.remove('visible');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const scrim = document.getElementById('sidebarScrim');
  if (toggleBtn) toggleBtn.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (scrim) scrim.addEventListener('click', closeSidebar);
}

function startLiveSync() {
  if (liveSyncTimer) clearInterval(liveSyncTimer);
  liveSyncTimer = setInterval(() => {
    if (document.hidden) return;
    if (!Auth.isAuthenticated()) return;
    const tab = getActiveTab();
    if (tab === 'pos') POS.renderItemGrid({ silent: true });
    else if (tab === 'inventory') Inventory.render();
    else if (tab === 'reports') Reports.render();
    refreshSidebarSnapshot();
  }, LIVE_SYNC_INTERVAL_MS);
}

const DEFAULT_LOW_STOCK = 5;

async function refreshSidebarSnapshot() {
  const lowStockEl = document.getElementById('snapshotLowStock');
  const pendingEl = document.getElementById('snapshotPending');

  let items = null;
  let sales = null;
  try { items = await DB.getItems(); } catch (e) { /* transient; try again next tick */ }
  try { sales = await DB.getSales(); } catch (e) { /* transient; try again next tick */ }

  if (items && lowStockEl) {
    const lowCount = items.filter((it) => {
      const threshold = it.lowStockThreshold != null ? it.lowStockThreshold : DEFAULT_LOW_STOCK;
      return it.stock <= threshold;
    }).length;
    lowStockEl.textContent = String(lowCount);
  }
  if (sales && pendingEl) {
    const pendingTotal = sales
      .filter((s) => s.paymentMethod === 'Pay Later' && !s.isSettled)
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    pendingEl.textContent = UI.peso(pendingTotal);
  }
  // Bell menu: stock alerts + unpaid Pay Later balances.
  if (items && sales) Notify.updateCenter(items, sales);
}

window.App = {
  onLogin() {
    switchTab('pos');
    GCash.loadQr();
    refreshSidebarSnapshot();
    Motion.observeReveal(document);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Auth.init();
  Receipt.init();
  POS.init();
  Inventory.init();
  Reports.init();
  GCash.init();
  Notify.init();
  initSidebarToggle();
  initCashierPersistence();
  startClock();
  startLiveSync();
  if (Auth.isAuthenticated()) { refreshSidebarSnapshot(); Motion.observeReveal(document); }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
});
