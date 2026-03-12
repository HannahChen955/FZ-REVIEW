// ========================================
// Campus Planning — Interactive Floor Plan & KPI Dashboard
// ========================================

const CAMPUS_DATA = [
  {
    id: 'wf', name: 'WF Campus', city: 'Wuxi', country: 'China',
    lat: 31.4912, lng: 120.3119,
    description: 'Primary production site for Product A & C',
    utilization: 82, color: 'blue',
    buildings: [
      {
        id: 'wf-bldg-a', name: 'Building A', shortName: 'A',
        floorArea: 19300, isAuto: true,
        floors: [
          { label: 'F1', type: 'production', programs: ['Product A'], processes: ['SMT', 'Reflow'], utilization: 85, area: 6250 },
          { label: 'F2', type: 'production', programs: ['Product A'], processes: ['Assembly', 'Insertion'], utilization: 85, area: 6250 },
          { label: 'F3', type: 'production', programs: ['Product A'], processes: ['Test', 'Pack'], utilization: 92, area: 6800 }
        ]
      },
      {
        id: 'wf-bldg-b', name: 'Building B', shortName: 'B',
        floorArea: 18200, isAuto: false,
        floors: [
          { label: 'F1', type: 'production', programs: ['Product C'], processes: ['SMT', 'Assembly'], utilization: 78, area: 6100 },
          { label: 'F2', type: 'production', programs: ['Product C'], processes: ['Test', 'Inspection'], utilization: 78, area: 6100 },
          { label: 'F3', type: 'production', programs: ['Product C'], processes: ['Pack', 'Shipping'], utilization: 78, area: 6000 }
        ]
      },
      {
        id: 'wf-bldg-c', name: 'Building C', shortName: 'C',
        floorArea: 8500, isAuto: false,
        floors: [
          { label: 'F1', type: 'warehouse', programs: ['Shared'], processes: ['Receiving', 'Storage'], utilization: 70, area: 4500 },
          { label: 'F2', type: 'office', programs: ['Shared'], processes: ['Admin', 'Engineering'], utilization: 65, area: 4000 }
        ]
      }
    ]
  },
  {
    id: 'vn-02', name: 'VN-02 Campus', city: 'Ho Chi Minh', country: 'Vietnam',
    lat: 10.8231, lng: 106.6297,
    description: 'Secondary production site for Product A',
    utilization: 68, color: 'purple',
    buildings: [
      {
        id: 'vn-bldg-1', name: 'Building VN-1', shortName: 'VN-1',
        floorArea: 9500, isAuto: false,
        floors: [
          { label: 'F1', type: 'production', programs: ['Product A'], processes: ['Assembly'], utilization: 72, area: 4800 },
          { label: 'F2', type: 'production', programs: ['Product A'], processes: ['Test', 'Pack'], utilization: 72, area: 4700 }
        ]
      },
      {
        id: 'vn-bldg-2', name: 'Building VN-2', shortName: 'VN-2',
        floorArea: 5200, isAuto: false,
        floors: [
          { label: 'F1', type: 'warehouse', programs: ['Shared'], processes: ['Logistics', 'Storage'], utilization: 64, area: 5200 }
        ]
      },
      {
        id: 'vn-bldg-3', name: 'Building VN-3', shortName: 'VN-3',
        floorArea: 6800, isAuto: false,
        floors: [
          { label: 'F1', type: 'production', programs: ['Product A'], processes: ['SMT'], utilization: 66, area: 3400 },
          { label: 'F2', type: 'office', programs: ['Shared'], processes: ['Engineering', 'QA'], utilization: 58, area: 3400 }
        ]
      }
    ]
  },
  {
    id: 'sz-01', name: 'SZ-01 Campus', city: 'Shenzhen', country: 'China',
    lat: 22.5431, lng: 114.0579,
    description: 'R&D and pilot production',
    utilization: 55, color: 'green',
    buildings: [
      {
        id: 'sz-bldg-a', name: 'Building SZ-A', shortName: 'SZ-A',
        floorArea: 12000, isAuto: false,
        floors: [
          { label: 'F1', type: 'warehouse', programs: ['Shared'], processes: ['Receiving', 'Material'], utilization: 48, area: 4000 },
          { label: 'F2', type: 'production', programs: ['Product B', 'Product D'], processes: ['NPI', 'Pilot'], utilization: 55, area: 4200 },
          { label: 'F3', type: 'lab', programs: ['Product B', 'Product D'], processes: ['Testing', 'Validation'], utilization: 55, area: 3800 }
        ]
      },
      {
        id: 'sz-bldg-b', name: 'Building SZ-B', shortName: 'SZ-B',
        floorArea: 7200, isAuto: false,
        floors: [
          { label: 'F1', type: 'office', programs: ['Shared'], processes: ['R&D', 'Design'], utilization: 60, area: 3600 },
          { label: 'F2', type: 'lab', programs: ['Product D'], processes: ['Prototype', 'EVT'], utilization: 52, area: 3600 }
        ]
      }
    ]
  },
  {
    id: 'mx-03', name: 'MX-03 Campus', city: 'Guadalajara', country: 'Mexico',
    lat: 20.6597, lng: -103.3496,
    description: 'Americas production hub',
    utilization: 88, color: 'orange',
    buildings: [
      {
        id: 'mx-bldg-1', name: 'Building M-1', shortName: 'M-1',
        floorArea: 11200, isAuto: false,
        floors: [
          { label: 'F1', type: 'production', programs: ['Product B'], processes: ['SMT', 'Assembly'], utilization: 90, area: 5600 },
          { label: 'F2', type: 'production', programs: ['Product B'], processes: ['Test', 'Inspection'], utilization: 86, area: 5600 }
        ]
      },
      {
        id: 'mx-bldg-2', name: 'Building M-2', shortName: 'M-2',
        floorArea: 6500, isAuto: false,
        floors: [
          { label: 'F1', type: 'production', programs: ['Product B'], processes: ['Final Assembly', 'Pack'], utilization: 88, area: 6500 }
        ]
      },
      {
        id: 'mx-bldg-3', name: 'Building M-3', shortName: 'M-3',
        floorArea: 4800, isAuto: false,
        floors: [
          { label: 'F1', type: 'warehouse', programs: ['Shared'], processes: ['Shipping', 'Logistics'], utilization: 82, area: 2800 },
          { label: 'F2', type: 'office', programs: ['Shared'], processes: ['Admin', 'Planning'], utilization: 75, area: 2000 }
        ]
      }
    ]
  }
];

// Program → color mapping for floor cells
const PROGRAM_COLORS = {
  'Product A': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  'Product B': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  'Product C': { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  'Product D': { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', bar: 'bg-pink-500', dot: 'bg-pink-500' },
  'Shared': { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', bar: 'bg-slate-400', dot: 'bg-slate-400' }
};

const FLOOR_TYPE_ICONS = {
  production: '🏭', warehouse: '📦', office: '🏢', lab: '🔬'
};

const CAMPUS_COLOR_MAP = {
  blue: { tab: 'bg-blue-600', tabHover: 'hover:bg-blue-100', badge: 'bg-blue-100 text-blue-700', header: 'from-blue-100 to-indigo-100', border: 'border-blue-300', bar: 'bg-blue-500', text: 'text-blue-700', dot: 'bg-blue-500', light: 'bg-blue-50' },
  purple: { tab: 'bg-purple-600', tabHover: 'hover:bg-purple-100', badge: 'bg-purple-100 text-purple-700', header: 'from-purple-100 to-pink-100', border: 'border-purple-300', bar: 'bg-purple-500', text: 'text-purple-700', dot: 'bg-purple-500', light: 'bg-purple-50' },
  green: { tab: 'bg-green-600', tabHover: 'hover:bg-green-100', badge: 'bg-green-100 text-green-700', header: 'from-green-100 to-emerald-100', border: 'border-green-300', bar: 'bg-green-500', text: 'text-green-700', dot: 'bg-green-500', light: 'bg-green-50' },
  orange: { tab: 'bg-orange-600', tabHover: 'hover:bg-orange-100', badge: 'bg-orange-100 text-orange-700', header: 'from-orange-100 to-red-100', border: 'border-orange-300', bar: 'bg-orange-500', text: 'text-orange-700', dot: 'bg-orange-500', light: 'bg-orange-50' }
};

// State
let cpSelectedCampusId = 'wf';
let cpSelectedFloor = null; // { campusId, buildingId, floorLabel }
let cpMapInstance = null;
let cpMapMarkers = {};
let cpMapLocationId = null; // currently selected location on map

// ---- Utility ----

function computeCampusSummary() {
  let totalBuildings = 0, totalArea = 0, totalWeightedUtil = 0;
  CAMPUS_DATA.forEach(c => {
    c.buildings.forEach(b => {
      totalBuildings++;
      totalArea += b.floorArea;
      totalWeightedUtil += b.floorArea * (b.floors.reduce((s, f) => s + f.utilization, 0) / b.floors.length);
    });
  });
  return {
    campuses: CAMPUS_DATA.length,
    buildings: totalBuildings,
    avgUtilization: Math.round(totalWeightedUtil / totalArea),
    totalArea
  };
}

function utilColor(u) {
  if (u >= 90) return { badge: 'bg-red-100 text-red-700 border-red-300', bar: 'bg-red-500', label: 'HIGH', text: 'text-red-700' };
  if (u >= 75) return { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', bar: 'bg-yellow-500', label: 'MODERATE', text: 'text-yellow-700' };
  return { badge: 'bg-green-100 text-green-700 border-green-300', bar: 'bg-green-500', label: 'GOOD', text: 'text-green-700' };
}

function fmtArea(n) {
  return n.toLocaleString();
}

function getProgramColor(programs) {
  const p = programs[0] || 'Shared';
  return PROGRAM_COLORS[p] || PROGRAM_COLORS['Shared'];
}

// ---- Render Sections ----

function renderCPHeader(summary) {
  const uc = utilColor(summary.avgUtilization);
  return `
    <div class="bg-white border rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-lg font-bold text-slate-900">Campus Status — Location & Space Utilization</div>
          <div class="text-sm text-slate-600">Monitor program distribution across campuses and facility utilization</div>
        </div>
        <button onclick="openAIDrawer('campus_analysis')" class="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:from-blue-700 hover:to-purple-700 flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          AI Campus Analysis
        </button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Total Campuses</div>
          <div class="text-4xl font-bold text-blue-700">${summary.campuses}</div>
          <div class="text-xs text-slate-600 mt-1">Active locations</div>
          <div class="w-full bg-blue-200 rounded-full h-1.5 mt-2"><div class="bg-blue-500 h-1.5 rounded-full" style="width:100%"></div></div>
        </div>
        <div class="bg-purple-50 border-2 border-purple-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Total Buildings</div>
          <div class="text-4xl font-bold text-purple-700">${summary.buildings}</div>
          <div class="text-xs text-slate-600 mt-1">Production facilities</div>
          <div class="w-full bg-purple-200 rounded-full h-1.5 mt-2"><div class="bg-purple-500 h-1.5 rounded-full" style="width:100%"></div></div>
        </div>
        <div class="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Avg Utilization</div>
          <div class="text-4xl font-bold text-yellow-700 mb-1">${summary.avgUtilization}%</div>
          <div class="inline-block px-2 py-0.5 ${uc.badge} border rounded text-xs font-semibold">${uc.label}</div>
          <div class="w-full bg-yellow-200 rounded-full h-1.5 mt-2"><div class="${uc.bar} h-1.5 rounded-full" style="width:${summary.avgUtilization}%"></div></div>
        </div>
        <div class="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Total Floor Space</div>
          <div class="text-3xl font-bold text-green-700">${fmtArea(summary.totalArea)}</div>
          <div class="text-xs text-slate-600 mt-1">m² across all sites</div>
          <div class="w-full bg-green-200 rounded-full h-1.5 mt-2"><div class="bg-green-500 h-1.5 rounded-full" style="width:78%"></div></div>
        </div>
      </div>
    </div>`;
}

function renderCPUtilizationBar() {
  const totalArea = CAMPUS_DATA.reduce((s, c) => s + c.buildings.reduce((s2, b) => s2 + b.floorArea, 0), 0);
  const segments = CAMPUS_DATA.map(c => {
    const area = c.buildings.reduce((s, b) => s + b.floorArea, 0);
    const pct = (area / totalArea * 100).toFixed(1);
    const cm = CAMPUS_COLOR_MAP[c.color];
    return { campus: c, area, pct, cm };
  });

  return `
    <div class="bg-white border rounded-xl p-6">
      <div class="text-sm font-bold text-slate-900 mb-3">Campus Utilization Comparison</div>
      <div class="flex rounded-lg overflow-hidden h-8 mb-3">
        ${segments.map(s => `
          <div class="${s.cm.bar} relative group" style="width:${s.pct}%" title="${s.campus.name}: ${s.campus.utilization}%">
            <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">${s.pct > 12 ? s.campus.id.toUpperCase() + ' ' + s.campus.utilization + '%' : ''}</span>
          </div>
        `).join('')}
      </div>
      <div class="flex flex-wrap gap-4">
        ${segments.map(s => `
          <div class="flex items-center gap-2 text-xs">
            <span class="w-3 h-3 rounded-full ${s.cm.dot}"></span>
            <span class="font-medium text-slate-700">${s.campus.name}</span>
            <span class="${s.cm.badge} px-1.5 py-0.5 rounded text-xs font-semibold">${s.campus.utilization}%</span>
            <span class="text-slate-500">${fmtArea(s.area)} m²</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// Hex colors for map markers
const CAMPUS_HEX_COLORS = {
  blue: '#3b82f6', purple: '#a855f7', green: '#22c55e', orange: '#f97316'
};

function renderCPMap() {
  const countries = [...new Set(CAMPUS_DATA.map(c => c.country))];
  const totalBuildings = CAMPUS_DATA.reduce((s, c) => s + c.buildings.length, 0);

  const locationList = CAMPUS_DATA.map(c => {
    const isActive = cpMapLocationId === c.id;
    const cm = CAMPUS_COLOR_MAP[c.color];
    const totalArea = c.buildings.reduce((s, b) => s + b.floorArea, 0);
    return `
      <div onclick="selectMapLocation('${c.id}')"
           class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-lg ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <svg class="w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-red-400'}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div class="min-w-0">
            <div class="font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-900'} truncate">${c.city}, ${c.country}</div>
            <div class="text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}">${c.buildings.length} buildings · ${fmtArea(totalArea)} m²</div>
          </div>
        </div>
        <button onclick="event.stopPropagation(); selectCampusTab('${c.id}'); document.getElementById('cp-floorplan-section')?.scrollIntoView({behavior:'smooth'})"
                class="flex-shrink-0 ${isActive ? 'text-blue-300 hover:text-white' : 'text-blue-500 hover:text-blue-700'}" title="View Floor Plans">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
        </button>
      </div>`;
  }).join('');

  return `
    <div class="bg-white border rounded-xl overflow-hidden">
      <div class="flex" style="height: 420px;">
        <!-- Left: Location List -->
        <div class="w-80 flex-shrink-0 border-r flex flex-col">
          <div class="px-4 pt-4 pb-2">
            <div class="text-base font-bold text-slate-900">Manufacturing Locations</div>
            <div class="text-xs text-slate-500">${CAMPUS_DATA.length} locations across ${countries.length} countries</div>
          </div>
          <div class="flex-1 overflow-y-auto px-2 space-y-0.5">
            ${locationList}
          </div>
          <div class="px-4 py-2 border-t text-xs text-slate-400">Click a location to zoom · Click grid icon for floor plans</div>
        </div>
        <!-- Right: Map -->
        <div class="flex-1 relative">
          <div id="cp-leaflet-map" class="w-full h-full"></div>
        </div>
      </div>
    </div>`;
}

function initCPMap() {
  const mapEl = document.getElementById('cp-leaflet-map');
  if (!mapEl || typeof L === 'undefined') return;

  // Destroy previous instance if exists
  if (cpMapInstance) {
    cpMapInstance.remove();
    cpMapInstance = null;
  }

  cpMapInstance = L.map('cp-leaflet-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([20, 60], 3);

  L.control.zoom({ position: 'topright' }).addTo(cpMapInstance);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(cpMapInstance);

  // Add markers
  cpMapMarkers = {};
  CAMPUS_DATA.forEach(c => {
    const hex = CAMPUS_HEX_COLORS[c.color] || '#3b82f6';
    const totalArea = c.buildings.reduce((s, b) => s + b.floorArea, 0);
    const icon = L.divIcon({
      className: 'cp-map-marker',
      html: `<div style="position:relative;">
        <svg width="32" height="42" viewBox="0 0 32 42">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${hex}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>
      </div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -44]
    });

    const marker = L.marker([c.lat, c.lng], { icon }).addTo(cpMapInstance);

    const popupContent = `
      <div style="min-width:200px; font-family: system-ui, sans-serif;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${hex}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <div>
            <div style="font-weight:700; font-size:14px; color:#1e293b;">${c.city}, ${c.country}</div>
            <div style="font-size:11px; color:#94a3b8;">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</div>
          </div>
        </div>
        <div style="font-size:12px; color:#475569; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span><strong>${c.name}</strong> (${c.buildings.length} buildings)</span>
          </div>
          <div style="font-size:11px; color:#94a3b8; margin-left:20px;">${c.description}</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <div style="flex:1; background:#e2e8f0; border-radius:4px; height:6px;">
            <div style="width:${c.utilization}%; background:${hex}; height:6px; border-radius:4px;"></div>
          </div>
          <span style="font-weight:700; font-size:12px; color:${hex};">${c.utilization}%</span>
        </div>
        <button onclick="selectCampusTab('${c.id}'); document.getElementById('cp-floorplan-section')?.scrollIntoView({behavior:'smooth'})"
                style="display:flex; align-items:center; gap:4px; font-size:12px; color:#3b82f6; font-weight:600; cursor:pointer; background:none; border:none; padding:0;">
          <svg width="14" height="14" fill="none" stroke="#3b82f6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          View Floor Plans
        </button>
      </div>`;

    marker.bindPopup(popupContent, { maxWidth: 280, closeButton: true });
    cpMapMarkers[c.id] = marker;
  });

  // If a location is selected, zoom to it
  if (cpMapLocationId) {
    const c = CAMPUS_DATA.find(x => x.id === cpMapLocationId);
    if (c) {
      cpMapInstance.setView([c.lat, c.lng], 12);
      setTimeout(() => cpMapMarkers[c.id]?.openPopup(), 300);
    }
  }
}

function selectMapLocation(id) {
  if (cpMapLocationId === id) {
    // Deselect → zoom out to world
    cpMapLocationId = null;
    renderCampusPlanning();
    setTimeout(() => {
      if (cpMapInstance) cpMapInstance.setView([20, 60], 3);
    }, 100);
  } else {
    cpMapLocationId = id;
    renderCampusPlanning();
    setTimeout(() => {
      const c = CAMPUS_DATA.find(x => x.id === id);
      if (c && cpMapInstance) {
        cpMapInstance.flyTo([c.lat, c.lng], 12, { duration: 1 });
        setTimeout(() => cpMapMarkers[id]?.openPopup(), 800);
      }
    }, 100);
  }
}

function renderCPFloorPlan() {
  const campus = CAMPUS_DATA.find(c => c.id === cpSelectedCampusId) || CAMPUS_DATA[0];
  const cm = CAMPUS_COLOR_MAP[campus.color];

  // Tabs
  const tabs = CAMPUS_DATA.map(c => {
    const active = c.id === cpSelectedCampusId;
    const tcm = CAMPUS_COLOR_MAP[c.color];
    return `<button onclick="selectCampusTab('${c.id}')" class="px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${active ? tcm.tab + ' text-white' : 'bg-slate-100 text-slate-600 ' + tcm.tabHover}">
      ${c.name} <span class="ml-1 px-1.5 py-0.5 rounded text-xs ${active ? 'bg-white/20' : tcm.badge}">${c.utilization}%</span>
    </button>`;
  }).join('');

  // Max floors for grid height
  const maxFloors = Math.max(...campus.buildings.map(b => b.floors.length));

  // Building columns
  const columns = campus.buildings.map(b => renderCPBuildingColumn(campus, b, maxFloors)).join('');

  // Detail panel
  const detailPanel = renderCPFloorDetailPanel(campus);

  return `
    <div class="bg-white border rounded-xl overflow-hidden">
      <div class="flex gap-1 px-4 pt-4 border-b">${tabs}</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm font-bold text-slate-900">${campus.name}</span>
          <span class="text-xs text-slate-500">${campus.city}, ${campus.country}</span>
          <span class="text-xs text-slate-500">— ${campus.description}</span>
        </div>
        <div class="flex gap-4">
          <!-- Floor Plan Grid -->
          <div class="flex-1 overflow-x-auto">
            <div class="flex gap-3 min-w-0">
              ${columns}
            </div>
            <!-- Program Legend -->
            <div class="flex flex-wrap gap-3 mt-4 pt-3 border-t">
              ${Object.entries(PROGRAM_COLORS).map(([name, pc]) => `
                <div class="flex items-center gap-1.5 text-xs">
                  <span class="w-3 h-3 rounded ${pc.dot}"></span>
                  <span class="text-slate-600">${name}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <!-- Detail Panel -->
          <div class="w-80 flex-shrink-0">${detailPanel}</div>
        </div>
      </div>
    </div>`;
}

function renderCPBuildingColumn(campus, building, maxFloors) {
  // Floors stacked bottom-up: F1 at bottom
  const sortedFloors = [...building.floors].sort((a, b) => {
    const na = parseInt(a.label.replace('F', ''));
    const nb = parseInt(b.label.replace('F', ''));
    return nb - na; // reverse so F3 is top in DOM (renders top-down)
  });

  // Pad empty cells if building has fewer floors
  const padCount = maxFloors - sortedFloors.length;
  const padCells = Array(padCount).fill('').map(() => `<div class="h-24"></div>`).join('');

  const floorCells = sortedFloors.map(f => renderCPFloorCell(campus, building, f)).join('');

  const bldgUtil = Math.round(building.floors.reduce((s, f) => s + f.utilization, 0) / building.floors.length);

  return `
    <div class="flex-1 min-w-[140px]">
      ${padCells}
      ${floorCells}
      <div class="text-center mt-2 space-y-0.5">
        <div class="text-xs font-bold text-slate-700">${building.shortName}</div>
        <div class="text-xs text-slate-500">${fmtArea(building.floorArea)} m²</div>
        ${building.isAuto ? '<div class="inline-block px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">AUTO</div>' : ''}
      </div>
    </div>`;
}

function renderCPFloorCell(campus, building, floor) {
  const pc = getProgramColor(floor.programs);
  const uc = utilColor(floor.utilization);
  const isSelected = cpSelectedFloor &&
    cpSelectedFloor.campusId === campus.id &&
    cpSelectedFloor.buildingId === building.id &&
    cpSelectedFloor.floorLabel === floor.label;

  const ringClass = isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '';

  return `
    <div onclick="selectCampusFloor('${campus.id}','${building.id}','${floor.label}')"
         class="h-24 ${pc.bg} border ${pc.border} rounded-lg p-2 mb-1 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md ${ringClass} flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold ${pc.text}">${floor.label}</span>
          <span class="text-xs text-slate-500">${FLOOR_TYPE_ICONS[floor.type] || ''}</span>
        </div>
        <div class="text-xs ${pc.text} truncate mt-0.5">${floor.programs.join(', ')}</div>
      </div>
      <div>
        <div class="w-full bg-white/50 rounded-full h-1.5">
          <div class="${uc.bar} h-1.5 rounded-full" style="width:${floor.utilization}%"></div>
        </div>
        <div class="text-xs font-semibold ${uc.text} text-right mt-0.5">${floor.utilization}%</div>
      </div>
    </div>`;
}

function renderCPFloorDetailPanel(campus) {
  if (!cpSelectedFloor || cpSelectedFloor.campusId !== campus.id) {
    return `
      <div class="border-2 border-dashed border-slate-200 rounded-xl p-6 h-full flex items-center justify-center">
        <div class="text-center text-slate-400">
          <svg class="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          <div class="text-sm font-medium">Click a floor to view details</div>
        </div>
      </div>`;
  }

  const building = campus.buildings.find(b => b.id === cpSelectedFloor.buildingId);
  if (!building) return '';
  const floor = building.floors.find(f => f.label === cpSelectedFloor.floorLabel);
  if (!floor) return '';

  const pc = getProgramColor(floor.programs);
  const uc = utilColor(floor.utilization);

  return `
    <div class="border-2 ${pc.border} rounded-xl overflow-hidden">
      <div class="${pc.bg} px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-bold ${pc.text}">${building.name} — ${floor.label}</div>
          <button onclick="clearCampusFloorSelection()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <div class="text-xs text-slate-600 mt-0.5">${campus.name} • ${campus.city}</div>
      </div>
      <div class="p-4 space-y-3">
        <div>
          <div class="text-xs font-semibold text-slate-500 mb-1">Floor Type</div>
          <div class="text-sm font-medium text-slate-900">${FLOOR_TYPE_ICONS[floor.type] || ''} ${floor.type.charAt(0).toUpperCase() + floor.type.slice(1)}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-500 mb-1">Programs</div>
          <div class="flex flex-wrap gap-1">
            ${floor.programs.map(p => {
              const ppc = PROGRAM_COLORS[p] || PROGRAM_COLORS['Shared'];
              return `<span class="px-2 py-0.5 ${ppc.bg} ${ppc.text} rounded text-xs font-medium">${p}</span>`;
            }).join('')}
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-500 mb-1">Processes</div>
          <div class="flex flex-wrap gap-1">
            ${floor.processes.map(p => `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">${p}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-500 mb-1">Utilization</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-slate-200 rounded-full h-2.5">
              <div class="${uc.bar} h-2.5 rounded-full" style="width:${floor.utilization}%"></div>
            </div>
            <span class="text-sm font-bold ${uc.text}">${floor.utilization}%</span>
          </div>
          <div class="inline-block mt-1 px-2 py-0.5 ${uc.badge} border rounded text-xs font-semibold">${uc.label}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-500 mb-1">Floor Area</div>
          <div class="text-sm font-medium text-slate-900">${fmtArea(floor.area)} m²</div>
        </div>
      </div>
    </div>`;
}

function renderCPDetailTables() {
  return CAMPUS_DATA.map(c => {
    const cm = CAMPUS_COLOR_MAP[c.color];
    const rows = [];
    c.buildings.forEach(b => {
      b.floors.forEach(f => {
        const uc = utilColor(f.utilization);
        rows.push(`
          <tr class="hover:bg-slate-50">
            <td class="px-3 py-2 font-medium text-sm">${b.name}</td>
            <td class="px-3 py-2 text-sm">${f.label}</td>
            <td class="px-3 py-2 text-sm">${f.programs.join(', ')} (${f.processes.join(', ')})</td>
            <td class="px-3 py-2 text-right text-sm">${fmtArea(f.area)}</td>
            <td class="px-3 py-2 text-right">
              <div class="flex items-center gap-2 justify-end">
                <div class="w-20 bg-slate-200 rounded-full h-2">
                  <div class="${uc.bar} h-2 rounded-full" style="width:${f.utilization}%"></div>
                </div>
                <span class="font-semibold text-sm ${uc.text}">${f.utilization}%</span>
              </div>
            </td>
          </tr>`);
      });
    });

    const totalArea = c.buildings.reduce((s, b) => s + b.floorArea, 0);

    return `
      <details class="border-2 ${cm.border} rounded-xl overflow-hidden">
        <summary class="bg-gradient-to-r ${cm.header} px-4 py-3 cursor-pointer flex items-center justify-between">
          <div>
            <div class="font-bold text-lg text-slate-900">${c.name} (${c.city}, ${c.country})</div>
            <div class="text-sm text-slate-600">${c.description}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold ${cm.text}">${c.utilization}%</div>
            <div class="text-xs text-slate-600">${fmtArea(totalArea)} m²</div>
          </div>
        </summary>
        <div class="p-4">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-slate-700">Building</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-700">Floor</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-700">Programs</th>
                <th class="px-3 py-2 text-right font-semibold text-slate-700">Floor Space (m²)</th>
                <th class="px-3 py-2 text-right font-semibold text-slate-700">Utilization</th>
              </tr>
            </thead>
            <tbody class="divide-y">${rows.join('')}</tbody>
          </table>
        </div>
      </details>`;
  }).join('');
}

function renderCPInsights() {
  return `
    <div class="bg-white border rounded-xl p-6">
      <div class="flex items-center justify-between mb-3">
        <div class="text-lg font-bold text-slate-900">Campus Utilization Insights</div>
        <button onclick="openAIDrawer('campus_analysis')" class="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-3 py-1.5 hover:from-blue-700 hover:to-purple-700">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          AI Campus Analysis
        </button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-green-50 border-l-4 border-green-500 rounded p-4">
          <div class="text-xs font-semibold text-green-900 mb-2">Expansion Opportunity</div>
          <div class="text-sm text-green-900">VN-02 and SZ-01 campuses have significant available capacity (32-45%). Consider shifting future programs to these sites to balance utilization.</div>
        </div>
        <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded p-4">
          <div class="text-xs font-semibold text-yellow-900 mb-2">Capacity Constraint</div>
          <div class="text-sm text-yellow-900">WF Building A F3 (Test/Pack) is at 92% utilization. Near capacity limit — may become bottleneck for Product A scale-up.</div>
        </div>
        <div class="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
          <div class="text-xs font-semibold text-blue-900 mb-2">Optimization</div>
          <div class="text-sm text-blue-900">MX-03 campus is well-utilized (88%) but has room for 12% growth. Ideal for Americas market expansion with existing infrastructure.</div>
        </div>
        <div class="bg-purple-50 border-l-4 border-purple-500 rounded p-4">
          <div class="text-xs font-semibold text-purple-900 mb-2">Planning</div>
          <div class="text-sm text-purple-900">Overall campus utilization is ~78% — healthy balance between productivity and flexibility for new program ramps in H2 2026.</div>
        </div>
      </div>
    </div>`;
}

// ---- Main Render ----

function renderCampusPlanning() {
  const summary = computeCampusSummary();
  const html = `
    <div class="space-y-4">
      ${renderCPHeader(summary)}
      ${renderCPUtilizationBar()}
      ${renderCPMap()}
      <div id="cp-floorplan-section">
        ${renderCPFloorPlan()}
      </div>
      <!-- Detail Tables -->
      <div class="space-y-3">
        <div class="text-sm font-bold text-slate-900 px-1">Campus Detail Tables</div>
        ${renderCPDetailTables()}
      </div>
      ${renderCPInsights()}
    </div>`;
  $("content").innerHTML = html;
  // Initialize Leaflet map after DOM is ready
  setTimeout(() => initCPMap(), 50);
}

// ---- Interactions ----

function selectCampusTab(id) {
  cpSelectedCampusId = id;
  cpSelectedFloor = null;
  renderCampusPlanning();
}

function selectCampusFloor(campusId, buildingId, floorLabel) {
  // Toggle off if same floor clicked
  if (cpSelectedFloor &&
      cpSelectedFloor.campusId === campusId &&
      cpSelectedFloor.buildingId === buildingId &&
      cpSelectedFloor.floorLabel === floorLabel) {
    cpSelectedFloor = null;
  } else {
    cpSelectedFloor = { campusId, buildingId, floorLabel };
  }
  renderCampusPlanning();
}

function clearCampusFloorSelection() {
  cpSelectedFloor = null;
  renderCampusPlanning();
}
