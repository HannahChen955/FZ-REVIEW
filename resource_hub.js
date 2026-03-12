// ============================================================
// Resource Hub — Centralized document & link management
// ============================================================

const RESOURCE_HUB_KEY = 'resourceHub_links';
const RESOURCE_HUB_VERSION = 2; // bump to force re-seed

const RESOURCE_CATEGORIES = [
  { value: 'planning', label: 'Planning', color: 'blue' },
  { value: 'operations', label: 'Operations', color: 'green' },
  { value: 'finance', label: 'Finance', color: 'amber' },
  { value: 'quality', label: 'Quality', color: 'purple' },
  { value: 'general', label: 'General', color: 'slate' }
];

const RESOURCE_SECTIONS = [
  { value: 'team', label: 'Team & Leadership', icon: '\uD83C\uDFE2', description: 'Shared resources for the whole team — briefings, strategy docs, and shared drives', color: 'blue' },
  { value: 'production', label: 'Production & Delivery', icon: '\uD83C\uDFED', description: 'Production planning, scheduling, and delivery tracking', color: 'emerald' },
  { value: 'supply-ops', label: 'Supply Chain & Operations', icon: '\uD83D\uDE9A', description: 'Supplier management, campus readiness, and labor fulfillment', color: 'amber' },
  { value: 'finance-quality', label: 'Finance & Quality', icon: '\uD83D\uDCB0', description: 'Cost analysis, budget reports, and quality audits', color: 'purple' }
];

const RESOURCE_ICONS = {
  doc: { emoji: '\uD83D\uDCC4', label: 'Document' },
  sheet: { emoji: '\uD83D\uDCCA', label: 'Spreadsheet' },
  slides: { emoji: '\uD83D\uDCFD\uFE0F', label: 'Presentation' },
  drive: { emoji: '\uD83D\uDCC1', label: 'Drive Folder' },
  link: { emoji: '\uD83D\uDD17', label: 'Link' }
};

// ── Seed Data ────────────────────────────────────────────────
function seedResourceHubData() {
  const verKey = RESOURCE_HUB_KEY + '_version';
  const existing = localStorage.getItem(RESOURCE_HUB_KEY);
  const storedVersion = parseInt(localStorage.getItem(verKey) || '0');
  if (existing && storedVersion >= RESOURCE_HUB_VERSION) return JSON.parse(existing);

  const now = new Date().toISOString();
  const seeds = [
    // ── Team & Leadership ──
    {
      id: 'rh-5', title: 'SCO Weekly Briefing Deck', url: 'https://docs.google.com/presentation/d/example5',
      category: 'planning', section: 'team', description: 'Executive briefing slides for weekly SCO leadership review.',
      icon: 'slides', pinned: true
    },
    {
      id: 'rh-7', title: 'FDOS Shared Drive', url: 'https://drive.google.com/drive/folders/example7',
      category: 'general', section: 'team', description: 'Central shared drive with all FDOS program documentation.',
      icon: 'drive', pinned: false
    },
    {
      id: 'rh-9', title: 'MO KPI Dashboard', url: 'https://docs.google.com/spreadsheets/d/example9',
      category: 'planning', section: 'team', description: 'Manufacturing Operations KPI tracking — OTD, yield, cost, and quality metrics.',
      icon: 'sheet', pinned: false
    },
    {
      id: 'rh-10', title: 'Team Meeting Notes', url: 'https://docs.google.com/document/d/example10',
      category: 'general', section: 'team', description: 'Running notes from weekly team syncs, action items, and decisions log.',
      icon: 'doc', pinned: false
    },
    // ── Production & Delivery ──
    {
      id: 'rh-1', title: 'Production Plan', url: 'https://docs.google.com/spreadsheets/d/example1',
      category: 'planning', section: 'production', description: 'Weekly production targets and capacity allocation across all product lines.',
      icon: 'sheet', pinned: true
    },
    {
      id: 'rh-11', title: 'Delivery Commit Tracker', url: 'https://docs.google.com/spreadsheets/d/example11',
      category: 'planning', section: 'production', description: 'Weekly delivery commit vs. actual by product line and factory site.',
      icon: 'sheet', pinned: false
    },
    {
      id: 'rh-12', title: 'Manufacturing Leadtime Model', url: 'https://docs.google.com/spreadsheets/d/example12',
      category: 'operations', section: 'production', description: 'BTO/CTO leadtime breakdown by product — queue, build, test, and ship stages.',
      icon: 'sheet', pinned: false
    },
    // ── Supply Chain & Operations ──
    {
      id: 'rh-6', title: 'Supplier Scorecard Dashboard', url: 'https://docs.google.com/spreadsheets/d/example6',
      category: 'operations', section: 'supply-ops', description: 'Supplier performance metrics — OTD, quality, responsiveness.',
      icon: 'sheet', pinned: false
    },
    {
      id: 'rh-3', title: 'Campus Readiness Checklist', url: 'https://docs.google.com/document/d/example3',
      category: 'operations', section: 'supply-ops', description: 'Pre-launch readiness checklist for new campus facilities.',
      icon: 'doc', pinned: false
    },
    {
      id: 'rh-8', title: 'Labor Fulfillment Tracker', url: 'https://docs.google.com/spreadsheets/d/example8',
      category: 'operations', section: 'supply-ops', description: 'Headcount tracking, hiring pipeline, and fulfillment rate by site.',
      icon: 'sheet', pinned: false
    },
    // ── Finance & Quality ──
    {
      id: 'rh-4', title: 'FV Cost Analysis Report', url: 'https://docs.google.com/spreadsheets/d/example4',
      category: 'finance', section: 'finance-quality', description: 'First vehicle cost breakdown and variance analysis by program.',
      icon: 'sheet', pinned: false
    },
    {
      id: 'rh-2', title: 'Quality Audit Tracker', url: 'https://docs.google.com/spreadsheets/d/example2',
      category: 'quality', section: 'finance-quality', description: 'Tracks audit findings, corrective actions, and closure status.',
      icon: 'sheet', pinned: false
    },
    {
      id: 'rh-13', title: 'Budget vs. Actual Report', url: 'https://docs.google.com/spreadsheets/d/example13',
      category: 'finance', section: 'finance-quality', description: 'Monthly budget variance report — actuals vs. plan by cost center.',
      icon: 'sheet', pinned: false
    }
  ].map(s => ({
    ...s,
    addedAt: now,
    lastCheckedAt: now,
    hasUpdate: false,
    updateDetectedAt: null,
    lastSummary: null,
    lastChangeAnalysis: null
  }));

  localStorage.setItem(RESOURCE_HUB_KEY, JSON.stringify(seeds));
  localStorage.setItem(verKey, String(RESOURCE_HUB_VERSION));
  return seeds;
}

function loadResourceHubData() {
  const raw = localStorage.getItem(RESOURCE_HUB_KEY);
  return raw ? JSON.parse(raw) : seedResourceHubData();
}

function saveResourceHubData(data) {
  localStorage.setItem(RESOURCE_HUB_KEY, JSON.stringify(data));
}

// ── Icon Detection ──────────────────────────────────────────
function detectIconFromUrl(url) {
  if (!url) return 'link';
  if (url.includes('docs.google.com/document')) return 'doc';
  if (url.includes('docs.google.com/spreadsheets')) return 'sheet';
  if (url.includes('docs.google.com/presentation')) return 'slides';
  if (url.includes('drive.google.com')) return 'drive';
  return 'link';
}

// ── State ───────────────────────────────────────────────────
let _rhSearchTerm = '';
let _rhSectionFilter = 'all';
let _rhSortBy = 'pinned'; // pinned | title | newest

// ── Main Render ─────────────────────────────────────────────
function renderResourceHub() {
  const content = document.getElementById('content');
  if (!content) return;

  const resources = loadResourceHubData();
  const updatedCount = resources.filter(r => r.hasUpdate).length;

  content.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Resource Hub</h1>
          <p class="text-sm text-slate-500 mt-1">Centralized links to key documents, dashboards, and shared drives</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="checkResourceUpdates()" class="flex items-center gap-2 text-sm border border-slate-300 text-slate-700 rounded-lg px-4 py-2 hover:bg-slate-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Check Updates
          </button>
          <button onclick="openAddResourceModal()" class="flex items-center gap-2 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Resource
          </button>
        </div>
      </div>

      <!-- Search / Filter / Sort Bar -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="relative flex-1 min-w-[200px]">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input id="rhSearchInput" type="text" placeholder="Search resources..." value="${_rhSearchTerm}"
            oninput="_rhSearchTerm=this.value; renderResourceCards();"
            class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select id="rhSectionFilter" onchange="_rhSectionFilter=this.value; renderResourceCards();"
          class="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all"${_rhSectionFilter === 'all' ? ' selected' : ''}>All Sections</option>
          ${RESOURCE_SECTIONS.map(s => `<option value="${s.value}"${_rhSectionFilter === s.value ? ' selected' : ''}>${s.icon} ${s.label}</option>`).join('')}
        </select>
        <select id="rhSortSelect" onchange="_rhSortBy=this.value; renderResourceCards();"
          class="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="pinned"${_rhSortBy === 'pinned' ? ' selected' : ''}>Pinned First</option>
          <option value="title"${_rhSortBy === 'title' ? ' selected' : ''}>Title A-Z</option>
          <option value="newest"${_rhSortBy === 'newest' ? ' selected' : ''}>Newest First</option>
        </select>
      </div>

      ${updatedCount > 0 ? `
      <!-- Update Banner -->
      <div class="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2 text-amber-800 text-sm">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span><strong>${updatedCount}</strong> resource${updatedCount > 1 ? 's have' : ' has'} been updated since last review</span>
        </div>
        <button onclick="dismissAllResourceUpdates()" class="text-xs text-amber-700 hover:text-amber-900 underline">Dismiss All</button>
      </div>` : ''}

      <!-- Card Grid -->
      <div id="rhCardGrid"></div>
    </div>

    <!-- Add/Edit Modal -->
    <div id="rhModal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" onclick="closeResourceModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" id="rhModalContent"></div>
    </div>
  `;

  renderResourceCards();
}

// ── Card Grid ───────────────────────────────────────────────
function renderResourceCards() {
  const grid = document.getElementById('rhCardGrid');
  if (!grid) return;

  let resources = loadResourceHubData();

  // Filter by section
  if (_rhSectionFilter !== 'all') {
    resources = resources.filter(r => r.section === _rhSectionFilter);
  }
  // Filter by search
  if (_rhSearchTerm.trim()) {
    const q = _rhSearchTerm.toLowerCase();
    resources = resources.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }

  if (resources.length === 0) {
    grid.innerHTML = `
      <div class="text-center py-16 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 15l2.25 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="text-sm">No resources found</p>
      </div>`;
    return;
  }

  const sectionColorMap = {
    blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', label: 'bg-blue-100 text-blue-800 border-blue-200' },
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', label: 'bg-amber-100 text-amber-800 border-amber-200' },
    purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', label: 'bg-purple-100 text-purple-800 border-purple-200' }
  };

  // Group by section, preserving section order
  const sectionsToRender = RESOURCE_SECTIONS
    .map(sec => {
      const items = sortResourceHub(resources.filter(r => r.section === sec.value), _rhSortBy);
      return { ...sec, items };
    })
    .filter(sec => sec.items.length > 0);

  // Resources without a section (legacy or uncategorized)
  const unsectioned = resources.filter(r => !r.section || !RESOURCE_SECTIONS.find(s => s.value === r.section));

  grid.innerHTML = sectionsToRender.map(sec => {
    const colors = sectionColorMap[sec.color] || sectionColorMap.blue;
    return `
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex items-center gap-2 ${colors.label} border rounded-lg px-3 py-1.5">
            <span class="text-base">${sec.icon}</span>
            <span class="text-sm font-bold">${sec.label}</span>
          </div>
          <p class="text-xs text-slate-400">${sec.description}</p>
          <span class="text-xs text-slate-300 font-medium">${sec.items.length} item${sec.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          ${sec.items.map(r => renderResourceCard(r)).join('')}
        </div>
      </div>`;
  }).join('') + (unsectioned.length > 0 ? `
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="flex items-center gap-2 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5">
          <span class="text-base">\uD83D\uDCCB</span>
          <span class="text-sm font-bold">Other</span>
        </div>
        <span class="text-xs text-slate-300 font-medium">${unsectioned.length} item${unsectioned.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${sortResourceHub(unsectioned, _rhSortBy).map(r => renderResourceCard(r)).join('')}
      </div>
    </div>` : '');
}

function renderResourceCard(r) {
  const cat = RESOURCE_CATEGORIES.find(c => c.value === r.category) || RESOURCE_CATEGORIES[4];
  const iconInfo = RESOURCE_ICONS[r.icon] || RESOURCE_ICONS.link;
  const addedDate = new Date(r.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const pillColors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    slate: 'bg-slate-100 text-slate-700'
  };

  return `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative">
      ${r.hasUpdate ? '<span class="absolute top-3 right-3 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>' : ''}

      <!-- Top row: icon + title + category -->
      <div class="flex items-start gap-3 mb-2">
        <span class="text-2xl flex-shrink-0 mt-0.5">${iconInfo.emoji}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-slate-800 text-sm leading-tight truncate">${r.title}</h3>
            ${r.pinned ? '<svg class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>' : ''}
          </div>
          <span class="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${pillColors[cat.color]}">${cat.label}</span>
        </div>
      </div>

      <!-- Description -->
      <p class="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">${r.description || 'No description'}</p>

      <!-- Date -->
      <p class="text-[10px] text-slate-400 mb-3">Added ${addedDate}${r.hasUpdate ? ' &middot; <span class="text-amber-600 font-medium">Updated</span>' : ''}</p>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <a href="${r.url}" target="_blank" rel="noopener" class="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 inline-flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5"/></svg>
          Open
        </a>
        <button onclick="summarizeResource('${r.id}')" class="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-3 py-1.5 hover:from-blue-700 hover:to-purple-700 inline-flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
          AI Summary
        </button>
        <button onclick="analyzeResourceChanges('${r.id}')" class="text-xs border border-purple-300 text-purple-700 rounded-lg px-3 py-1.5 hover:bg-purple-50 inline-flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
          Changes
        </button>
        <div class="flex-1"></div>
        <button onclick="togglePinResource('${r.id}')" title="${r.pinned ? 'Unpin' : 'Pin'}" class="text-xs text-slate-400 hover:text-blue-600 p-1 rounded">
          <svg class="w-3.5 h-3.5" fill="${r.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        </button>
        <button onclick="openEditResourceModal('${r.id}')" title="Edit" class="text-xs text-slate-400 hover:text-slate-700 p-1 rounded">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
        </button>
        <button onclick="deleteResource('${r.id}')" title="Delete" class="text-xs text-slate-400 hover:text-red-600 p-1 rounded">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
        </button>
      </div>
    </div>`;
}

// ── Sort ─────────────────────────────────────────────────────
function sortResourceHub(resources, sortBy) {
  const sorted = [...resources];
  switch (sortBy) {
    case 'pinned':
      sorted.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || a.title.localeCompare(b.title));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      break;
    case 'section':
      sorted.sort((a, b) => (a.section || '').localeCompare(b.section || '') || a.title.localeCompare(b.title));
      break;
  }
  return sorted;
}

// ── CRUD ─────────────────────────────────────────────────────
function openAddResourceModal() {
  const modal = document.getElementById('rhModal');
  const body = document.getElementById('rhModalContent');
  if (!modal || !body) return;

  body.innerHTML = renderResourceForm(null);
  modal.classList.remove('hidden');
}

function openEditResourceModal(id) {
  const resources = loadResourceHubData();
  const res = resources.find(r => r.id === id);
  if (!res) return;

  const modal = document.getElementById('rhModal');
  const body = document.getElementById('rhModalContent');
  if (!modal || !body) return;

  body.innerHTML = renderResourceForm(res);
  modal.classList.remove('hidden');
}

function renderResourceForm(resource) {
  const isEdit = !!resource;
  return `
    <h2 class="text-lg font-bold text-slate-800 mb-4">${isEdit ? 'Edit Resource' : 'Add Resource'}</h2>
    <form onsubmit="event.preventDefault(); saveResource();" class="space-y-4">
      <input type="hidden" id="rhFormId" value="${isEdit ? resource.id : ''}" />
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Title *</label>
        <input id="rhFormTitle" type="text" required value="${isEdit ? resource.title : ''}"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">URL *</label>
        <input id="rhFormUrl" type="url" required value="${isEdit ? resource.url : ''}"
          oninput="document.getElementById('rhFormIcon').value = detectIconFromUrl(this.value);"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Section</label>
          <select id="rhFormSection" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            ${RESOURCE_SECTIONS.map(s => `<option value="${s.value}"${isEdit && resource.section === s.value ? ' selected' : ''}>${s.icon} ${s.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select id="rhFormCategory" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            ${RESOURCE_CATEGORIES.map(c => `<option value="${c.value}"${isEdit && resource.category === c.value ? ' selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Icon</label>
        <select id="rhFormIcon" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          ${Object.entries(RESOURCE_ICONS).map(([k, v]) => `<option value="${k}"${isEdit && resource.icon === k ? ' selected' : ''}>${v.emoji} ${v.label}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea id="rhFormDesc" rows="2"
          class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">${isEdit ? resource.description : ''}</textarea>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeResourceModal()" class="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">${isEdit ? 'Save Changes' : 'Add Resource'}</button>
      </div>
    </form>`;
}

function closeResourceModal() {
  const modal = document.getElementById('rhModal');
  if (modal) modal.classList.add('hidden');
}

function saveResource() {
  const id = document.getElementById('rhFormId').value;
  const title = document.getElementById('rhFormTitle').value.trim();
  const url = document.getElementById('rhFormUrl').value.trim();
  const section = document.getElementById('rhFormSection').value;
  const category = document.getElementById('rhFormCategory').value;
  const icon = document.getElementById('rhFormIcon').value;
  const description = document.getElementById('rhFormDesc').value.trim();

  if (!title || !url) return;

  const resources = loadResourceHubData();
  const now = new Date().toISOString();

  if (id) {
    // Edit
    const idx = resources.findIndex(r => r.id === id);
    if (idx !== -1) {
      resources[idx] = { ...resources[idx], title, url, section, category, icon, description };
    }
  } else {
    // Add
    resources.push({
      id: 'rh-' + Date.now(),
      title, url, section, category, icon, description,
      addedAt: now, lastCheckedAt: now,
      hasUpdate: false, updateDetectedAt: null,
      lastSummary: null, lastChangeAnalysis: null,
      pinned: false
    });
  }

  saveResourceHubData(resources);
  closeResourceModal();
  renderResourceHub();
}

function deleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  const resources = loadResourceHubData().filter(r => r.id !== id);
  saveResourceHubData(resources);
  renderResourceCards();
}

function togglePinResource(id) {
  const resources = loadResourceHubData();
  const res = resources.find(r => r.id === id);
  if (res) res.pinned = !res.pinned;
  saveResourceHubData(resources);
  renderResourceCards();
}

// ── Update Detection (Simulated) ────────────────────────────
function checkResourceUpdates() {
  const resources = loadResourceHubData();
  const now = new Date().toISOString();
  let updatedCount = 0;

  resources.forEach(r => {
    r.lastCheckedAt = now;
    // ~30% chance of marking as updated
    if (Math.random() < 0.3) {
      r.hasUpdate = true;
      r.updateDetectedAt = now;
      updatedCount++;
    }
  });

  saveResourceHubData(resources);
  renderResourceHub();

  // Brief toast feedback
  if (updatedCount > 0) {
    showResourceToast(`${updatedCount} resource${updatedCount > 1 ? 's' : ''} updated`);
  } else {
    showResourceToast('All resources are up to date');
  }
}

function dismissResourceUpdate(id) {
  const resources = loadResourceHubData();
  const res = resources.find(r => r.id === id);
  if (res) {
    res.hasUpdate = false;
    res.updateDetectedAt = null;
  }
  saveResourceHubData(resources);
  renderResourceHub();
}

function dismissAllResourceUpdates() {
  const resources = loadResourceHubData();
  resources.forEach(r => {
    r.hasUpdate = false;
    r.updateDetectedAt = null;
  });
  saveResourceHubData(resources);
  renderResourceHub();
}

function showResourceToast(msg) {
  const existing = document.getElementById('rhToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'rhToast';
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg z-[100] transition-opacity duration-300';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// ── AI Simulation ───────────────────────────────────────────
const _rhMockSummaries = {
  planning: [
    "This document outlines the weekly production master plan across all product lines. Key highlights:\n\n- **Product A** is on track at 94% capacity utilization with WF site leading production.\n- **Product B** has a 2-week delay in ramp timeline due to supplier constraints.\n- **Product C** shows strong yield improvements (+3.2% WoW).\n\nAction items include reallocating 15 headcount from Line 3 to Line 7 and escalating the BTO component shortage to procurement.",
    "Executive briefing deck covers the weekly SCO leadership review. Main talking points:\n\n- Overall delivery commit stands at 87% vs. 92% target.\n- Campus readiness for Phase 2 is at 78% with facilities on track.\n- Three critical supplier risks flagged requiring VP-level escalation.\n\nRecommendation: Approve the proposed overtime plan for WF site to close the 5% gap."
  ],
  operations: [
    "This tracker monitors supplier performance across key metrics:\n\n- **On-Time Delivery**: 89% average (target: 95%) — 3 suppliers below threshold.\n- **Quality Score**: 4.2/5.0 average with 2 suppliers on probation.\n- **Responsiveness**: Average RFQ turnaround is 3.2 days.\n\nTop concern: Supplier XYZ has missed 4 consecutive delivery windows for critical thermal components.",
    "Labor fulfillment tracker shows current staffing levels vs. plan:\n\n- **Overall fill rate**: 91% (target: 98%)\n- **Critical gap**: 23 open positions in manufacturing engineering.\n- **Hiring pipeline**: 45 candidates in final interview stage.\n\nProjected full staffing by end of Q2 if current hiring velocity maintained."
  ],
  finance: [
    "FV cost analysis reveals the following variance from target:\n\n- **Material cost**: +4.2% over budget driven by expedite fees.\n- **Labor cost**: On target at $12.3M.\n- **Overhead**: -1.8% under budget due to delayed facility costs.\n\nNet FV cost is 2.1% over target. Primary driver is the 3x increase in air freight costs for critical path components."
  ],
  quality: [
    "Quality audit tracker summary:\n\n- **Open findings**: 14 (3 critical, 7 major, 4 minor)\n- **Closure rate**: 72% within SLA\n- **Overdue items**: 4 findings past 30-day closure target.\n\nCritical finding #QA-2024-087 (torque specification non-compliance) requires immediate containment action and customer notification."
  ],
  general: [
    "This shared drive contains the complete FDOS program documentation organized by workstream:\n\n- /Planning — Master schedules, capacity models\n- /Operations — SOPs, work instructions, shift plans\n- /Finance — Cost models, variance reports, forecasts\n- /Quality — Audit records, CAPA logs, inspection criteria\n\nLast major update: 47 files modified in the past 7 days across all workstreams."
  ]
};

const _rhMockChanges = {
  planning: [
    "**Changes detected (last 48 hours):**\n\n1. **Row 24-31**: Product B ramp schedule pushed out by 1 week (was W14, now W15).\n2. **Tab \"WF Capacity\"**: Added new column for overtime capacity — shows 12% buffer available.\n3. **Cell G15**: Weekly target revised from 1,200 to 1,150 units (capacity constraint acknowledged).\n4. **Comments**: 3 new comments from @Sarah.Lin regarding material readiness for Line 5.\n\n**Impact Assessment**: Medium — the schedule slip affects downstream delivery commits. Recommend updating the SCO briefing deck accordingly."
  ],
  operations: [
    "**Changes detected (last 72 hours):**\n\n1. **Supplier ABC**: Status changed from \"Green\" to \"Yellow\" — missed last 2 delivery windows.\n2. **New rows added**: 3 new suppliers onboarded for backup thermal component sourcing.\n3. **Score updates**: 7 suppliers had quarterly scores recalculated.\n4. **Tab \"Action Items\"**: 5 new corrective action requests issued.\n\n**Impact Assessment**: Low-Medium — backup sourcing is positive. Monitor Supplier ABC closely for further degradation."
  ],
  finance: [
    "**Changes detected (last 24 hours):**\n\n1. **Expedite costs**: Updated with actual Feb figures — $2.1M vs. $800K budgeted.\n2. **New tab**: \"Air Freight Analysis\" added with carrier-level cost breakdown.\n3. **Formula fix**: Overhead allocation corrected in cells M12:M24 (was double-counting facility depreciation).\n\n**Impact Assessment**: High — expedite cost overrun is significant. Finance team flagged for VP review."
  ],
  quality: [
    "**Changes detected (last 48 hours):**\n\n1. **Finding #QA-2024-087**: Elevated to critical — containment action initiated.\n2. **3 findings closed**: QA-2024-079, QA-2024-081, QA-2024-083.\n3. **New finding**: QA-2024-091 — dimensional variance on bracket assembly.\n4. **Audit schedule**: Next audit moved up from W16 to W14.\n\n**Impact Assessment**: Medium — critical finding requires immediate attention but closure rate improving."
  ],
  general: [
    "**Changes detected (last 7 days):**\n\n1. **47 files modified** across all workstream folders.\n2. **New folder**: /Planning/Phase2-Ramp added with 12 new documents.\n3. **Permissions update**: 5 new team members granted edit access.\n4. **Deleted**: 3 obsolete templates removed from /Operations/Archive.\n\n**Impact Assessment**: Low — routine updates consistent with active program cadence."
  ]
};

function summarizeResource(id) {
  const resources = loadResourceHubData();
  const res = resources.find(r => r.id === id);
  if (!res) return;

  // Show loading in AI drawer
  const drawerBody = document.getElementById('aiDrawerBody');
  const drawer = document.getElementById('aiDrawer');
  const backdrop = document.getElementById('aiDrawerBackdrop');
  if (!drawerBody || !drawer || !backdrop) return;

  drawerBody.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <div class="text-sm text-slate-600">AI is summarizing "${res.title}"...</div>
    </div>`;
  drawer.classList.remove('hidden');
  backdrop.classList.remove('hidden');

  // Simulate delay
  setTimeout(() => {
    const summaries = _rhMockSummaries[res.category] || _rhMockSummaries.general;
    const summary = summaries[Math.floor(Math.random() * summaries.length)];

    // Save to resource
    res.lastSummary = summary;
    saveResourceHubData(resources);

    drawerBody.innerHTML = `
      <div class="p-1">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-lg">${(RESOURCE_ICONS[res.icon] || RESOURCE_ICONS.link).emoji}</span>
          <div>
            <h3 class="font-semibold text-slate-800 text-sm">${res.title}</h3>
            <p class="text-xs text-slate-500">AI Document Summary</p>
          </div>
        </div>
        <div class="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed">
          ${formatMarkdown(summary)}
        </div>
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2">
          <a href="${res.url}" target="_blank" rel="noopener" class="text-xs bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 inline-flex items-center gap-1">
            Open Document
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5"/></svg>
          </a>
          <button onclick="analyzeResourceChanges('${res.id}')" class="text-xs border border-purple-300 text-purple-700 rounded-lg px-4 py-2 hover:bg-purple-50 inline-flex items-center gap-1">
            View Changes
          </button>
        </div>
        <p class="text-[10px] text-slate-400 mt-3 italic">AI-generated summary (simulated) — always verify against the source document.</p>
      </div>`;
  }, 1500);
}

function analyzeResourceChanges(id) {
  const resources = loadResourceHubData();
  const res = resources.find(r => r.id === id);
  if (!res) return;

  const drawerBody = document.getElementById('aiDrawerBody');
  const drawer = document.getElementById('aiDrawer');
  const backdrop = document.getElementById('aiDrawerBackdrop');
  if (!drawerBody || !drawer || !backdrop) return;

  drawerBody.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <div class="text-sm text-slate-600">AI is analyzing changes in "${res.title}"...</div>
    </div>`;
  drawer.classList.remove('hidden');
  backdrop.classList.remove('hidden');

  setTimeout(() => {
    const changes = _rhMockChanges[res.category] || _rhMockChanges.general;
    const analysis = changes[Math.floor(Math.random() * changes.length)];

    // Save + dismiss update
    res.lastChangeAnalysis = analysis;
    if (res.hasUpdate) {
      res.hasUpdate = false;
      res.updateDetectedAt = null;
    }
    saveResourceHubData(resources);

    drawerBody.innerHTML = `
      <div class="p-1">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-lg">${(RESOURCE_ICONS[res.icon] || RESOURCE_ICONS.link).emoji}</span>
          <div>
            <h3 class="font-semibold text-slate-800 text-sm">${res.title}</h3>
            <p class="text-xs text-slate-500">AI Change Analysis</p>
          </div>
        </div>
        <div class="prose prose-sm max-w-none text-slate-700 text-sm leading-relaxed">
          ${formatMarkdown(analysis)}
        </div>
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2">
          <a href="${res.url}" target="_blank" rel="noopener" class="text-xs bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 inline-flex items-center gap-1">
            Open Document
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5"/></svg>
          </a>
          <button onclick="summarizeResource('${res.id}')" class="text-xs border border-blue-300 text-blue-700 rounded-lg px-4 py-2 hover:bg-blue-50 inline-flex items-center gap-1">
            View Summary
          </button>
        </div>
        <p class="text-[10px] text-slate-400 mt-3 italic">AI-generated change analysis (simulated) — always verify against the source document.</p>
      </div>`;

    // Refresh cards to clear update dot
    renderResourceCards();
  }, 1500);
}

// ── Simple Markdown Formatter ───────────────────────────────
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h4 class="font-semibold text-slate-800 mt-3 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-semibold text-slate-800 mt-3 mb-1">$1</h3>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
