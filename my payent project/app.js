const STORAGE_KEY = 'nairaflow.wallet.v1';
const BANKS = ['Access Bank', 'First Bank of Nigeria', 'Guaranty Trust Bank', 'Lotus Bank', 'Moniepoint MFB', 'Opay Digital Services', 'Palmpay', 'Stanbic IBTC Bank', 'United Bank for Africa', 'Zenith Bank'];
const DEFAULT_STATE = {
  balance: 400584.36,
  balanceVisible: true,
  accountNumber: '807•••4560',
  transactions: [
    { id: 'NF-24061984', name: 'Green Basket Market', bank: 'Opay wallet', account: '•••• 2091', amount: 18500, direction: 'out', category: 'Shopping', date: Date.now() - 1000 * 60 * 60 * 3, status: 'Completed' },
    { id: 'NF-24061973', name: 'Salary payment', bank: 'Northstar Studios', account: 'Monthly income', amount: 285000, direction: 'in', category: 'Income', date: Date.now() - 1000 * 60 * 60 * 26, status: 'Completed' },
    { id: 'NF-24061951', name: 'Amina Yusuf', bank: 'Guaranty Trust Bank', account: '012•••7890', amount: 25000, direction: 'out', category: 'Transfer', date: Date.now() - 1000 * 60 * 60 * 49, status: 'Completed' },
    { id: 'NF-24061920', name: 'Power & Light', bank: 'Ikeja Electric', account: 'Electricity', amount: 12000, direction: 'out', category: 'Bills', date: Date.now() - 1000 * 60 * 60 * 90, status: 'Completed' },
    { id: 'NF-24061891', name: 'Tunde Okafor', bank: 'Access Bank', account: '204•••0165', amount: 8000, direction: 'in', category: 'Transfer', date: Date.now() - 1000 * 60 * 60 * 122, status: 'Completed' },
    { id: 'NF-24061852', name: 'Fresh Market', bank: 'Opay wallet', account: '•••• 2091', amount: 7650, direction: 'out', category: 'Shopping', date: Date.now() - 1000 * 60 * 60 * 168, status: 'Completed' }
  ],
  beneficiaries: [
    { id: 'person-amina', name: 'Amina Yusuf', bank: 'Guaranty Trust Bank', account: '0123456789' },
    { id: 'person-tunde', name: 'Tunde Okafor', bank: 'Access Bank', account: '2045500165' },
    { id: 'person-zara', name: 'Zara Ibrahim', bank: 'First Bank of Nigeria', account: '3001194822' }
  ]
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.transactions) && Array.isArray(saved.beneficiaries)) {
      return { ...structuredClone(DEFAULT_STATE), ...saved };
    }
  } catch (error) {
    console.warn('Wallet data could not be loaded; starting with demo data.', error);
  }
  return structuredClone(DEFAULT_STATE);
}

const state = loadState();
const app = document.querySelector('#app');
let route = 'overview';
let modal = '';
let transferDraft = null;
let toastTimer;
let installPrompt;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast('Browser storage is unavailable. Your changes may not be saved.');
  }
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function money(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value);
}

function shortMoney(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

function dateLabel(timestamp, includeTime = false) {
  return new Intl.DateTimeFormat('en-NG', includeTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(timestamp));
}

function initials(value) {
  return String(value).trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function showToast(message) {
  document.querySelector('.toast-message')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2800);
}

function iconFor(routeName) {
  return ({ overview: '⌂', transfer: '↗', activity: '◷', recipients: '♧', settings: '⚙' })[routeName] || '•';
}

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'transfer', label: 'Send money' },
  { id: 'activity', label: 'Activity' },
  { id: 'recipients', label: 'Recipients' },
  { id: 'settings', label: 'Preferences' }
];

function navLink(item, mobile = false) {
  const isActive = route === item.id || (mobile && item.id === 'activity' && route === 'recipients');
  return `<button class="nav-link${isActive ? ' active' : ''}" data-route="${item.id}"${isActive ? ' aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${iconFor(item.id)}</span><span>${item.label}</span></button>`;
}

function appShell(content) {
  const heading = navItems.find((item) => item.id === route)?.label || 'Overview';
  return `<div class="app-frame">
    <aside class="sidebar">
      <a class="brand" href="#overview" data-route="overview" aria-label="NairaFlow home"><span class="brand-mark">n</span><span><span class="brand-name">NairaFlow</span><span class="brand-caption">Your everyday wallet</span></span></a>
      <p class="nav-caption">Workspace</p>
      <nav class="main-nav" aria-label="Main navigation">${navItems.map((item) => navLink(item)).join('')}</nav>
      <div class="sidebar-foot"><div class="demo-note"><strong>Demo wallet</strong>This launchable preview stores sample data on this device. It does not connect to a bank or send real money.</div>
      <div class="profile-chip"><span class="avatar">EA</span><span><span class="profile-name">Emmanuel A.</span><span class="profile-detail">Personal account</span></span></div></div>
    </aside>
    <div class="main-column">
      <header class="topbar"><div class="mobile-brand"><span class="brand-mark">n</span><span class="brand-name">NairaFlow</span></div><div class="breadcrumb">Personal account <span aria-hidden="true"> / </span> <strong>${heading}</strong></div>
      <div class="top-actions"><span class="top-date">${new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><button class="icon-button" data-action="notifications" aria-label="Notifications" title="Notifications">♧</button><button class="icon-button" data-route="settings" aria-label="Preferences" title="Preferences">⚙</button></div></header>
      <main class="workspace">${content}</main>
    </div>
  </div>
  <nav class="mobile-nav" aria-label="Mobile navigation">${['overview', 'transfer', 'activity', 'recipients'].map((id) => navLink(navItems.find((item) => item.id === id), true)).join('')}</nav>
  <div class="modal-root" id="modal-root" aria-live="polite">${renderModal()}</div>`;
}

function pageHead(kicker, title, subtitle, action = '') {
  return `<div class="page-head"><div><p class="page-kicker">${kicker}</p><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;
}

function transactionRow(transaction) {
  const incoming = transaction.direction === 'in';
  const amount = `${incoming ? '+' : '−'}${money(transaction.amount)}`;
  return `<div class="transaction-row"><span class="transaction-icon${incoming ? ' incoming' : ''}" aria-hidden="true">${incoming ? '↓' : '↗'}</span><div><div class="transaction-name">${escapeHTML(transaction.name)}</div><div class="transaction-meta">${escapeHTML(transaction.category)} · ${dateLabel(transaction.date, true)}</div></div><div class="transaction-amount${incoming ? ' incoming' : ''}">${amount}</div></div>`;
}

function getMonthTotals() {
  const today = new Date();
  const monthItems = state.transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  });
  return {
    incoming: monthItems.filter((item) => item.direction === 'in').reduce((total, item) => total + item.amount, 0),
    outgoing: monthItems.filter((item) => item.direction === 'out').reduce((total, item) => total + item.amount, 0)
  };
}

function renderOverview() {
  const totals = getMonthTotals();
  const expenses = state.transactions.filter((transaction) => transaction.direction === 'out');
  const categories = ['Transfer', 'Shopping', 'Bills'].map((category) => ({
    category,
    total: expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0)
  }));
  const maxCategory = Math.max(...categories.map((category) => category.total), 1);
  const balanceText = state.balanceVisible ? money(state.balance) : '₦ ••••••';
  const action = '<button class="button button-primary" data-route="transfer"><span aria-hidden="true">↗</span> Send money</button>';
  return `${pageHead('MONDAY, YOUR MONEY AT A GLANCE', 'Good day, Emmanuel', 'Here is what is happening with your wallet today.', action)}
    <section class="balance-banner" aria-label="Wallet balance">
      <div class="balance-copy"><div class="banner-label">Available balance</div><div class="balance-line"><strong class="balance-value">${balanceText}</strong><button class="balance-toggle" data-action="toggle-balance" aria-label="${state.balanceVisible ? 'Hide' : 'Show'} balance" title="${state.balanceVisible ? 'Hide balance' : 'Show balance'}">${state.balanceVisible ? '◉' : '◎'}</button></div><div class="account-number">Wallet account &nbsp; ${state.accountNumber}</div><div class="banner-actions"><button class="button button-dark" data-route="transfer">+ Send money</button><button class="button button-quiet" data-action="add-money">＋ Add money</button></div></div>
      <div class="banner-side"><div class="card-mini"><div class="card-label">NairaFlow · Virtual wallet</div><div class="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 2091</div><div class="card-bottom"><span>EMMANUEL A.</span><span>NGN</span></div></div></div>
    </section>
    <div class="stat-grid" aria-label="Monthly summary"><div class="stat-block"><div class="stat-label">Money in this month</div><div class="stat-value">${shortMoney(totals.incoming)}</div><div class="stat-foot">Across ${state.transactions.filter((item) => item.direction === 'in').length} incoming payments</div></div><div class="stat-block"><div class="stat-label">Money out this month</div><div class="stat-value">${shortMoney(totals.outgoing)}</div><div class="stat-foot">${state.transactions.filter((item) => item.direction === 'out').length} wallet payments</div></div><div class="stat-block"><div class="stat-label">Saved recipients</div><div class="stat-value">${state.beneficiaries.length}</div><div class="stat-foot">Ready for your next transfer</div></div></div>
    <div class="content-split"><section><div class="section-row"><h2 class="section-title">Recent activity</h2><button class="text-link" data-route="activity">All transactions&nbsp; →</button></div><div class="activity-list">${state.transactions.slice().sort((a, b) => b.date - a.date).slice(0, 5).map(transactionRow).join('') || '<div class="empty-state">Your activity will appear here.</div>'}</div></section>
    <aside><div class="section-row"><h2 class="section-title">Spending overview</h2></div><div class="insight-panel"><div class="insight-label">Wallet payments · all time</div><h3 class="insight-title">Your top categories</h3><div class="spending-bars">${categories.map(({ category, total }) => `<div class="spending-item"><span>${category}</span><span class="spending-track"><span class="spending-fill" style="display:block;width:${Math.max(total ? 4 : 0, Math.round(total / maxCategory * 100))}%"></span></span><strong>${shortMoney(total)}</strong></div>`).join('')}</div></div></aside></div>`;
}

function bankOptions(selected = '') {
  return `<option value="">Choose a bank</option>${BANKS.map((bank) => `<option value="${escapeHTML(bank)}"${selected === bank ? ' selected' : ''}>${escapeHTML(bank)}</option>`).join('')}`;
}

function renderTransfer() {
  const draft = transferDraft || {};
  const saved = state.beneficiaries.length
    ? state.beneficiaries.slice(0, 3).map((person) => `<div class="saved-recipient"><span class="saved-initial">${initials(escapeHTML(person.name))}</span><span class="saved-info"><span class="saved-name">${escapeHTML(person.name)}</span><span class="saved-bank">${escapeHTML(person.bank)}</span></span><button class="saved-send" data-use-recipient="${escapeHTML(person.id)}">Use</button></div>`).join('')
    : '<p class="aside-copy">Your saved recipients will show up here.</p>';
  return `${pageHead('WALLET TRANSFER', 'Send money', 'Transfer to a bank account using this local demo wallet.')}
    <div class="transfer-layout"><section class="form-panel"><h2 class="form-section-title">Recipient details</h2><form id="transfer-form" autocomplete="off"><div class="field-grid">
      <label class="field field-full"><span class="field-label">Recipient full name</span><input class="input" name="recipient" placeholder="Name on the bank account" value="${escapeHTML(draft.name || '')}" maxlength="60" required><span class="field-hint">Enter the name shown on the recipient's bank account.</span></label>
      <label class="field"><span class="field-label">Account number</span><input class="input" name="account" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" placeholder="10-digit account number" value="${escapeHTML(draft.account || '')}" required></label>
      <label class="field"><span class="field-label">Bank</span><select class="select" name="bank" required>${bankOptions(draft.bank || '')}</select></label>
      <label class="field field-full"><span class="field-label">Amount</span><span class="input-prefix"><span class="prefix-symbol">₦</span><input class="input" name="amount" type="number" inputmode="decimal" min="1" max="${state.balance}" step="0.01" placeholder="0.00" value="${escapeHTML(draft.amount || '')}" required></span><span class="field-hint">Available balance: ${money(state.balance)} · Demo transfers only.</span></label>
      <label class="field field-full"><span class="field-label">Note <span style="font-weight:400">(optional)</span></span><input class="input" name="note" maxlength="80" placeholder="What is this transfer for?" value="${escapeHTML(draft.note || '')}"></label>
      <label class="field field-full checkbox-field"><span><input type="checkbox" name="saveRecipient" ${draft.saveRecipient !== false ? 'checked' : ''}> Save this recipient for next time</span></label>
      </div><div class="form-actions"><button class="button button-quiet" type="reset">Clear form</button><button class="button button-primary" type="submit">Review transfer&nbsp; →</button></div></form></section>
    <aside><div class="transfer-aside"><h3 class="aside-heading">Send with confidence</h3><p class="aside-copy">Check the account name, bank and amount before confirming. Transfers are simulated on this device and cannot reach a real bank.</p><div class="saved-recipient-list"><div class="field-label">YOUR RECIPIENTS</div>${saved}</div></div></aside></div>`;
}

function filteredTransactions() {
  const search = (document.querySelector('#activity-search')?.value || '').trim().toLowerCase();
  const filter = document.querySelector('#activity-filter')?.value || 'all';
  return state.transactions.slice().sort((a, b) => b.date - a.date).filter((transaction) => {
    const matchesFilter = filter === 'all' || transaction.direction === filter;
    const matchesSearch = [transaction.name, transaction.bank, transaction.account, transaction.category, transaction.id].some((value) => String(value).toLowerCase().includes(search));
    return matchesFilter && matchesSearch;
  });
}

function transactionTableRows(transactions) {
  if (!transactions.length) return '<tr><td colspan="5"><div class="empty-state">No transactions match this search.</div></td></tr>';
  return transactions.map((transaction) => `<tr><td><div class="table-primary">${escapeHTML(transaction.name)}</div><div class="table-secondary">${escapeHTML(transaction.id)}</div></td><td><div class="table-primary">${escapeHTML(transaction.category)}</div><div class="table-secondary">${escapeHTML(transaction.bank)}</div></td><td>${dateLabel(transaction.date, true)}</td><td><span class="status-pill">${escapeHTML(transaction.status)}</span></td><td class="table-amount" style="color:${transaction.direction === 'in' ? 'var(--green)' : 'var(--ink)'}">${transaction.direction === 'in' ? '+' : '−'}${money(transaction.amount)}</td></tr>`).join('');
}

function renderActivity() {
  const action = '<button class="button button-quiet" data-action="export-csv">↓&nbsp; Export CSV</button>';
  return `${pageHead('YOUR WALLET HISTORY', 'Activity', 'Every transfer and wallet entry, saved on this device.', action)}
    <div class="stat-grid"><div class="stat-block"><div class="stat-label">Total transactions</div><div class="stat-value">${state.transactions.length}</div><div class="stat-foot">All activity</div></div><div class="stat-block"><div class="stat-label">Money in</div><div class="stat-value">${shortMoney(state.transactions.filter((item) => item.direction === 'in').reduce((sum, item) => sum + item.amount, 0))}</div><div class="stat-foot">Received in this demo wallet</div></div><div class="stat-block"><div class="stat-label">Money out</div><div class="stat-value">${shortMoney(state.transactions.filter((item) => item.direction === 'out').reduce((sum, item) => sum + item.amount, 0))}</div><div class="stat-foot">Sent from this demo wallet</div></div></div>
    <div class="filter-bar"><label class="search-field"><input class="input" id="activity-search" type="search" placeholder="Search name, bank or reference" aria-label="Search transactions"></label><select class="select select-filter" id="activity-filter" aria-label="Filter transactions"><option value="all">All activity</option><option value="out">Money out</option><option value="in">Money in</option></select></div>
    <div class="table-wrap"><table class="activity-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody id="activity-rows">${transactionTableRows(filteredTransactions())}</tbody></table></div>`;
}

function renderRecipients() {
  const action = '<button class="button button-primary" data-route="transfer">+ New transfer</button>';
  const cards = state.beneficiaries.length ? state.beneficiaries.map((person) => `<article class="recipient-card"><span class="saved-initial">${initials(person.name)}</span><span class="saved-info"><span class="saved-name">${escapeHTML(person.name)}</span><span class="saved-bank">${escapeHTML(person.bank)} · ${escapeHTML(person.account)}</span></span><span class="recipient-actions"><button class="button button-quiet" data-use-recipient="${escapeHTML(person.id)}">Send</button><button class="button button-danger" data-remove-recipient="${escapeHTML(person.id)}" aria-label="Remove ${escapeHTML(person.name)}">Remove</button></span></article>`).join('') : '<div class="empty-state">No saved recipients yet. Save one from the send money form.</div>';
  return `${pageHead('QUICK AND CONVENIENT', 'Recipients', 'Manage the people and accounts you send money to.', action)}<section class="recipient-grid">${cards}</section>`;
}

function renderSettings() {
  return `${pageHead('MAKE IT YOURS', 'Preferences', 'Manage this demo wallet on your device.')}
    <section class="settings-list"><div class="setting-row"><div><div class="setting-title">Hide wallet balance</div><div class="setting-detail">Mask the balance on your overview.</div></div><button class="switch" role="switch" aria-checked="${!state.balanceVisible}" data-action="toggle-balance" aria-label="Hide wallet balance"></button></div>
    <div class="setting-row"><div><div class="setting-title">Currency</div><div class="setting-detail">All amounts are displayed in Nigerian naira (NGN).</div></div><strong style="font-size:12px">NGN &nbsp; ₦</strong></div>
    <div class="setting-row"><div><div class="setting-title">Local data</div><div class="setting-detail">Your demo transactions and recipients stay in this browser.</div></div><span class="status-pill">On this device</span></div>
    <div class="setting-row"><div><div class="setting-title">Install NairaFlow</div><div class="setting-detail">Add this app to your home screen when your browser supports installation.</div></div><button class="button button-quiet" data-action="install-app">Install app</button></div></section>
    <section class="settings-danger"><div class="setting-row" style="min-height:0;border:0"><div><div class="setting-title">Reset demo wallet</div><div class="setting-detail">Restore the sample balance, activity and recipients on this device.</div></div><button class="button button-danger" data-action="reset-confirm">Reset demo</button></div></section>`;
}

function renderModal() {
  if (!modal) return '';
  if (modal === 'review' && transferDraft) {
    const draft = transferDraft;
    return `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-head"><div><p class="page-kicker">CHECK BEFORE SENDING</p><h2 class="dialog-title" id="dialog-title">Review transfer</h2></div><button class="dialog-close" data-action="close-modal" aria-label="Close">×</button></div>
      <div class="review-amount"><small>You are sending</small><strong>${money(draft.amount)}</strong></div><div class="review-details"><div class="review-row"><span>Recipient</span><strong>${escapeHTML(draft.name)}</strong></div><div class="review-row"><span>Account number</span><strong>${escapeHTML(draft.account)}</strong></div><div class="review-row"><span>Bank</span><strong>${escapeHTML(draft.bank)}</strong></div>${draft.note ? `<div class="review-row"><span>Note</span><strong>${escapeHTML(draft.note)}</strong></div>` : ''}<div class="review-row"><span>Transfer fee</span><strong>${money(0)}</strong></div></div><div class="demo-disclaimer">This is a simulated transfer. Confirming will update only the demo balance and activity saved in this browser. No money will move.</div>
      <div class="dialog-actions"><button class="button button-quiet" data-action="close-modal">Edit details</button><button class="button button-primary" data-action="confirm-transfer">Confirm demo transfer</button></div></div>`;
  }
  if (modal === 'success' && transferDraft) {
    return `<div class="dialog success-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><span class="success-mark">✓</span><h2 class="dialog-title" id="dialog-title">Demo transfer complete</h2><p class="page-subtitle">Your local wallet balance and activity have been updated. Nothing was sent to a real bank.</p><div class="review-amount"><small>Amount</small><strong>${money(transferDraft.amount)}</strong></div><div class="dialog-actions" style="justify-content:center"><button class="button button-primary" data-action="finish-transfer">View activity</button><button class="button button-quiet" data-action="another-transfer">Send another</button></div></div>`;
  }
  if (modal === 'reset') {
    return `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-head"><h2 class="dialog-title" id="dialog-title">Reset demo wallet?</h2><button class="dialog-close" data-action="close-modal" aria-label="Close">×</button></div><p class="page-subtitle">This restores the sample data in this browser. It does not affect any financial account.</p><div class="dialog-actions"><button class="button button-quiet" data-action="close-modal">Cancel</button><button class="button button-danger" data-action="reset-demo">Reset wallet</button></div></div>`;
  }
  return '';
}

function render() {
  const views = { overview: renderOverview, transfer: renderTransfer, activity: renderActivity, recipients: renderRecipients, settings: renderSettings };
  app.innerHTML = appShell(views[route]());
}

function refreshActivityRows() {
  const rows = document.querySelector('#activity-rows');
  if (rows) rows.innerHTML = transactionTableRows(filteredTransactions());
}

function prepareTransfer(person) {
  transferDraft = person ? { name: person.name, account: person.account, bank: person.bank, saveRecipient: false } : null;
  route = 'transfer';
  modal = '';
  render();
}

function completeTransfer() {
  if (!transferDraft || transferDraft.amount > state.balance) {
    modal = '';
    render();
    showToast('The transfer amount is greater than the available demo balance.');
    return;
  }
  const transaction = {
    id: `NF-${Date.now().toString().slice(-8)}`,
    name: transferDraft.name,
    bank: transferDraft.bank,
    account: `${transferDraft.account.slice(0, 3)}••••${transferDraft.account.slice(-3)}`,
    amount: transferDraft.amount,
    direction: 'out',
    category: 'Transfer',
    note: transferDraft.note,
    date: Date.now(),
    status: 'Completed'
  };
  state.balance = Math.round((state.balance - transferDraft.amount) * 100) / 100;
  state.transactions.push(transaction);
  if (transferDraft.saveRecipient && !state.beneficiaries.some((person) => person.account === transferDraft.account && person.bank === transferDraft.bank)) {
    state.beneficiaries.push({ id: `person-${Date.now()}`, name: transferDraft.name, account: transferDraft.account, bank: transferDraft.bank });
  }
  persist();
  modal = 'success';
  render();
}

function exportCSV() {
  const rows = [['Reference', 'Recipient', 'Bank', 'Account', 'Category', 'Direction', 'Amount NGN', 'Date', 'Status'], ...state.transactions.map((transaction) => [transaction.id, transaction.name, transaction.bank, transaction.account, transaction.category, transaction.direction, transaction.amount.toFixed(2), new Date(transaction.date).toISOString(), transaction.status])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'nairaflow-activity.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Activity export downloaded.');
}

app.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) {
    route = routeButton.dataset.route;
    modal = '';
    transferDraft = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const useRecipient = event.target.closest('[data-use-recipient]');
  if (useRecipient) {
    const person = state.beneficiaries.find((item) => item.id === useRecipient.dataset.useRecipient);
    if (person) prepareTransfer(person);
    return;
  }
  const removeRecipient = event.target.closest('[data-remove-recipient]');
  if (removeRecipient) {
    const person = state.beneficiaries.find((item) => item.id === removeRecipient.dataset.removeRecipient);
    state.beneficiaries = state.beneficiaries.filter((item) => item.id !== removeRecipient.dataset.removeRecipient);
    persist();
    render();
    showToast(`${person?.name || 'Recipient'} removed.`);
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'toggle-balance') {
    state.balanceVisible = !state.balanceVisible;
    persist();
    render();
  } else if (action === 'add-money') {
    showToast('Cash deposits are not connected in this demo wallet.');
  } else if (action === 'notifications') {
    showToast('You are all caught up.');
  } else if (action === 'close-modal') {
    modal = '';
    render();
  } else if (action === 'confirm-transfer') {
    completeTransfer();
  } else if (action === 'finish-transfer') {
    modal = '';
    transferDraft = null;
    route = 'activity';
    render();
  } else if (action === 'another-transfer') {
    modal = '';
    transferDraft = null;
    route = 'transfer';
    render();
  } else if (action === 'export-csv') {
    exportCSV();
  } else if (action === 'reset-confirm') {
    modal = 'reset';
    render();
  } else if (action === 'reset-demo') {
    Object.assign(state, structuredClone(DEFAULT_STATE));
    persist();
    route = 'overview';
    modal = '';
    transferDraft = null;
    render();
    showToast('Demo wallet restored.');
  } else if (action === 'install-app') {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.finally(() => { installPrompt = null; });
    } else {
      showToast('Use your browser menu to install or add this app to your home screen.');
    }
  }
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'transfer-form') return;
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const account = String(formData.get('account')).trim();
  const amount = Number(formData.get('amount'));
  if (!/^\d{10}$/.test(account)) {
    showToast('Enter a valid 10-digit account number.');
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > state.balance) {
    showToast('Enter an amount within your available balance.');
    return;
  }
  transferDraft = {
    name: String(formData.get('recipient')).trim(),
    account,
    bank: String(formData.get('bank')),
    amount: Math.round(amount * 100) / 100,
    note: String(formData.get('note') || '').trim(),
    saveRecipient: formData.has('saveRecipient')
  };
  modal = 'review';
  render();
  document.querySelector('.dialog [data-action="confirm-transfer"]')?.focus();
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'activity-search') refreshActivityRows();
});
app.addEventListener('change', (event) => {
  if (event.target.id === 'activity-filter') refreshActivityRows();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal) {
    modal = '';
    render();
  }
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
});

if ('serviceWorker' in navigator && ['localhost', '127.0.0.1'].includes(location.hostname)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Offline support could not be registered.', error)));
}

render();
