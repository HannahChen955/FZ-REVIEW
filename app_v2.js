// FDOS — Factory Delivery Orchestration System
// Unified execution intelligence for manufacturing commit protection

let STATE = {
  data: null,
  scenarioId: "A",
  filters: { product: null, factorySite: null, week: null },
  activeView: "overview", // overview | portfolio (Decision Center) | home | signals | radar | actions | reports | dataFoundation
  currentProgram: null, // Current program context { product, factorySite, week }
  selectedRiskId: null,
  prdMode: false,
  viewMode: "live", // live | simulation
  simulationPreset: null,
  simulationResults: null,
  aiMode: false, // AI mode toggle
  aiContext: null, // Current AI context for drawer
  dataFoundationSubpage: "alignedIndex" // alignedIndex | dataSource | productionPlanLogic
};

// Export STATE to window so other scripts (like command_center_new.js) can access it
window.STATE = STATE;

const $ = (id) => document.getElementById(id);

// ---- Global Product Filter for Production pages ----
let activeProductFilter = 'all'; // 'all' | 'product_a' | 'product_b' | 'product_c' | 'product_d'

function renderProductFilterBar(page) {
  const products = [
    { id: 'all', label: 'All Products', color: 'slate' },
    { id: 'product_a', label: 'Product A', color: 'blue' },
    { id: 'product_b', label: 'Product B', color: 'orange' },
    { id: 'product_c', label: 'Product C', color: 'emerald' },
    { id: 'product_d', label: 'Product D', color: 'pink' }
  ];
  const colorMap = {
    slate: { active: 'bg-slate-800 text-white', inactive: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50' },
    blue: { active: 'bg-blue-600 text-white', inactive: 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50' },
    orange: { active: 'bg-orange-500 text-white', inactive: 'bg-white text-orange-700 border border-orange-300 hover:bg-orange-50' },
    emerald: { active: 'bg-emerald-600 text-white', inactive: 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50' },
    pink: { active: 'bg-pink-600 text-white', inactive: 'bg-white text-pink-700 border border-pink-300 hover:bg-pink-50' }
  };
  const buttons = products.map(p => {
    const isActive = activeProductFilter === p.id;
    const cm = colorMap[p.color];
    return `<button onclick="setProductFilter('${p.id}','${page}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive ? cm.active : cm.inactive}">${p.label}</button>`;
  }).join('');
  return `<div class="flex items-center gap-2 flex-wrap">
    <span class="text-xs font-semibold text-slate-500 mr-1">
      <svg class="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
      Filter:</span>
    ${buttons}
  </div>`;
}

function setProductFilter(id, page) {
  activeProductFilter = id;
  if (page === 'production-plan') renderProductionPlan();
  else if (page === 'productionMgmt') renderProductionManagement();
}

// ========================================
// Environment Detection - Hide localhost-only features in production
// ========================================
(function() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isLocalhost) {
    // Hide all localhost-only elements when deployed to production/Vercel
    document.addEventListener('DOMContentLoaded', function() {
      const localhostOnlyElements = document.querySelectorAll('.localhost-only');
      localhostOnlyElements.forEach(el => {
        el.style.display = 'none';
      });
    });
  }
})();

// ========================================
// Date Format Helper
// ========================================
// Extract date portion from week_id format "2026-W39 (09/26)" -> "09/26"
function getWeekDisplayDate(weekId) {
  if (!weekId) return weekId;
  const match = weekId.match(/\((.*?)\)/);
  return match ? match[1] : weekId;
}

// ========================================
// Configuration Persistence (LocalStorage)
// ========================================
const CONFIG_STORAGE_KEYS = {
  SITES: 'productionPlan_sites_config',
  CAPACITY_UNITS: 'productionPlan_capacity_units_config',
  // PLAN_CONFIG: 'productionPlan_general_config',  // Unused - removed
  PROGRAM_CONFIG: 'productionPlan_program_config',
  COUNTRY_HOLIDAYS: 'productionPlan_country_holidays',
  SITE_OVERRIDES: 'productionPlan_site_overrides'
};

/**
 * Save sites configuration to localStorage
 */
function saveSitesConfig() {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEYS.SITES, JSON.stringify(PRODUCTION_PLAN_SEED_DATA.sites));
    console.log('[Config] Sites saved to localStorage:', PRODUCTION_PLAN_SEED_DATA.sites.length, 'sites');
  } catch (error) {
    console.error('[Config] Error saving sites:', error);
  }
}

/**
 * Load sites configuration from localStorage
 */
function loadSitesConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEYS.SITES);
    if (saved) {
      PRODUCTION_PLAN_SEED_DATA.sites = JSON.parse(saved);
      console.log('[Config] Sites loaded from localStorage:', PRODUCTION_PLAN_SEED_DATA.sites.length, 'sites');
      return true;
    }
  } catch (error) {
    console.error('[Config] Error loading sites:', error);
  }
  return false;
}

/**
 * Save capacity units configuration to localStorage
 */
function saveCapacityUnitsConfig() {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEYS.CAPACITY_UNITS, JSON.stringify(PRODUCTION_PLAN_SEED_DATA.capacityUnits));
    console.log('[Config] Capacity units saved to localStorage:', PRODUCTION_PLAN_SEED_DATA.capacityUnits.length, 'units');
  } catch (error) {
    console.error('[Config] Error saving capacity units:', error);
  }
}

/**
 * Load capacity units configuration from localStorage
 */
function loadCapacityUnitsConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEYS.CAPACITY_UNITS);
    if (saved) {
      PRODUCTION_PLAN_SEED_DATA.capacityUnits = JSON.parse(saved);
      console.log('[Config] Capacity units loaded from localStorage:', PRODUCTION_PLAN_SEED_DATA.capacityUnits.length, 'units');

      // ⚠️ CRITICAL: Refresh curve factors from presets
      // If a unit has a preset specified, load the latest preset factors from window.curvePresets
      // This ensures we use the latest preset definition, not stale factors saved in localStorage
      PRODUCTION_PLAN_SEED_DATA.capacityUnits.forEach((unit, index) => {
        // Refresh UPH curve from preset
        if (unit.uph_ramp_curve_preset && unit.uph_ramp_curve_preset !== 'custom') {
          const preset = window.curvePresets?.uph?.[unit.uph_ramp_curve_preset];
          if (preset) {
            unit.uph_ramp_curve = {
              length_workdays: preset.length,
              factors: [...preset.factors]
            };
            console.log(`[Config]   ✅ Unit ${index} (${unit.unit_id}): Refreshed UPH curve from preset '${unit.uph_ramp_curve_preset}'`);
          } else {
            console.warn(`[Config]   ⚠️ Unit ${index} (${unit.unit_id}): UPH preset '${unit.uph_ramp_curve_preset}' not found`);
          }
        }

        // Refresh Yield curve from preset
        if (unit.yield_ramp_curve_preset && unit.yield_ramp_curve_preset !== 'custom') {
          const preset = window.curvePresets?.yield?.[unit.yield_ramp_curve_preset];
          if (preset) {
            unit.yield_ramp_curve = {
              length_workdays: preset.length,
              factors: [...preset.factors]
            };
            console.log(`[Config]   ✅ Unit ${index} (${unit.unit_id}): Refreshed Yield curve from preset '${unit.yield_ramp_curve_preset}'`);
          } else {
            console.warn(`[Config]   ⚠️ Unit ${index} (${unit.unit_id}): Yield preset '${unit.yield_ramp_curve_preset}' not found`);
          }
        }
      });

      return true;
    }
  } catch (error) {
    console.error('[Config] Error loading capacity units:', error);
  }
  return false;
}

/**
 * Save program configuration to localStorage
 * Includes: program_id, program_name, default_shift_hours, output_factors, shipment_lag_workdays, shipment_pallet_size, weekly_window, startDate, endDate, considerHolidays
 */
function saveProgramConfig() {
  try {
    // Read all configuration fields from DOM if available
    const startDateEl = document.getElementById('configStartDate');
    const endDateEl = document.getElementById('configEndDate');
    const shiftHoursEl = document.getElementById('configShiftHours');
    const workingDaysEl = document.getElementById('configWorkingDays');
    const shipmentLagEl = document.getElementById('configShipmentLag');
    const palletSizeEl = document.getElementById('configPalletSize');
    const considerHolidaysEl = document.getElementById('configConsiderHolidays');
    const day1FactorEl = document.getElementById('configDay1Factor');
    const day2FactorEl = document.getElementById('configDay2Factor');
    const day3FactorEl = document.getElementById('configDay3Factor');
    const maxDailyShipmentEl = document.getElementById('configMaxDailyShipment');
    const shipmentStartDateEl = document.getElementById('configShipmentStartDate');

    // Update programConfig with current values
    if (startDateEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.startDate = startDateEl.value;
    }
    if (endDateEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.endDate = endDateEl.value;
    }
    if (shiftHoursEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.default_shift_hours = {
        DAY: parseFloat(shiftHoursEl.value),
        NIGHT: parseFloat(shiftHoursEl.value)
      };
    }
    if (workingDaysEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.weekly_window = workingDaysEl.value;
    }
    if (shipmentLagEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.shipment_lag_workdays = parseInt(shipmentLagEl.value);
    }
    if (palletSizeEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.shipment_pallet_size = parseInt(palletSizeEl.value) || 1;
    }
    if (considerHolidaysEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.considerHolidays = considerHolidaysEl.checked;
    }
    if (day1FactorEl && day2FactorEl && day3FactorEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.output_factors = {
        day1: parseFloat(day1FactorEl.value),
        day2: parseFloat(day2FactorEl.value),
        day3_plus: parseFloat(day3FactorEl.value)
      };
    }
    if (maxDailyShipmentEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.max_daily_shipment = parseInt(maxDailyShipmentEl.value) || 0;
    }
    if (shipmentStartDateEl) {
      PRODUCTION_PLAN_SEED_DATA.programConfig.shipment_start_date = shipmentStartDateEl.value || null;
    }

    // Inventory Audit configuration
    const middleDaysEl = document.getElementById('configAuditMiddleDays');
    const endDaysEl = document.getElementById('configAuditEndDays');

    if (middleDaysEl && endDaysEl) {
      const middleDays = parseInt(middleDaysEl.value) || 1;
      const endDays = parseInt(endDaysEl.value) || 1;

      const middleDates = [];
      for (let i = 1; i <= middleDays; i++) {
        const dateEl = document.getElementById(`configAuditMiddleDate${i}`);
        if (dateEl && dateEl.value) {
          middleDates.push(dateEl.value);
        }
      }

      const endDates = [];
      for (let i = 1; i <= endDays; i++) {
        const dateEl = document.getElementById(`configAuditEndDate${i}`);
        if (dateEl && dateEl.value) {
          endDates.push(dateEl.value);
        }
      }

      PRODUCTION_PLAN_SEED_DATA.programConfig.inventory_audit = {
        middle_year: { days: middleDays, dates: middleDates },
        end_year: { days: endDays, dates: endDates }
      };
    }

    localStorage.setItem(CONFIG_STORAGE_KEYS.PROGRAM_CONFIG, JSON.stringify(PRODUCTION_PLAN_SEED_DATA.programConfig));
    console.log('[Config] Program config saved to localStorage:', PRODUCTION_PLAN_SEED_DATA.programConfig);
  } catch (error) {
    console.error('[Config] Error saving program config:', error);
  }
}

/**
 * Load program configuration from localStorage
 */
function loadProgramConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEYS.PROGRAM_CONFIG);
    if (saved) {
      PRODUCTION_PLAN_SEED_DATA.programConfig = JSON.parse(saved);
      console.log('[Config] Program config loaded from localStorage:', PRODUCTION_PLAN_SEED_DATA.programConfig);

      // Populate DOM elements if they exist
      const startDateEl = document.getElementById('configStartDate');
      const endDateEl = document.getElementById('configEndDate');
      const shiftHoursEl = document.getElementById('configShiftHours');
      const workingDaysEl = document.getElementById('configWorkingDays');
      const shipmentLagEl = document.getElementById('configShipmentLag');
      const palletSizeEl = document.getElementById('configPalletSize');
      const considerHolidaysEl = document.getElementById('configConsiderHolidays');
      const day1FactorEl = document.getElementById('configDay1Factor');
      const day2FactorEl = document.getElementById('configDay2Factor');
      const day3FactorEl = document.getElementById('configDay3Factor');
      const maxDailyShipmentEl = document.getElementById('configMaxDailyShipment');
      const shipmentStartDateEl = document.getElementById('configShipmentStartDate');

      const config = PRODUCTION_PLAN_SEED_DATA.programConfig;

      if (startDateEl && config.startDate) {
        startDateEl.value = config.startDate;
      }
      if (endDateEl && config.endDate) {
        endDateEl.value = config.endDate;
      }
      if (shiftHoursEl && config.default_shift_hours) {
        shiftHoursEl.value = config.default_shift_hours.DAY || config.default_shift_hours.NIGHT || 10;
      }
      if (workingDaysEl && config.weekly_window) {
        workingDaysEl.value = config.weekly_window;
      }
      if (shipmentLagEl && config.shipment_lag_workdays !== undefined) {
        shipmentLagEl.value = config.shipment_lag_workdays;
      }
      if (palletSizeEl && config.shipment_pallet_size !== undefined) {
        palletSizeEl.value = config.shipment_pallet_size;
      }
      if (considerHolidaysEl && config.considerHolidays !== undefined) {
        considerHolidaysEl.checked = config.considerHolidays;
      }
      if (day1FactorEl && config.output_factors) {
        day1FactorEl.value = config.output_factors.day1 || 0.5;
      }
      if (day2FactorEl && config.output_factors) {
        day2FactorEl.value = config.output_factors.day2 || 1.0;
      }
      if (day3FactorEl && config.output_factors) {
        day3FactorEl.value = config.output_factors.day3_plus || 1.0;
      }
      if (maxDailyShipmentEl && config.max_daily_shipment !== undefined) {
        maxDailyShipmentEl.value = config.max_daily_shipment;
      }
      if (shipmentStartDateEl && config.shipment_start_date) {
        shipmentStartDateEl.value = config.shipment_start_date;
      }

      // Load Inventory Audit configuration
      if (config.inventory_audit) {
        const middleDaysEl = document.getElementById('configAuditMiddleDays');
        const endDaysEl = document.getElementById('configAuditEndDays');

        if (middleDaysEl && config.inventory_audit.middle_year) {
          middleDaysEl.value = config.inventory_audit.middle_year.days || 1;
          updateAuditDates('middle');

          const dates = config.inventory_audit.middle_year.dates || [];
          dates.forEach((date, idx) => {
            const dateEl = document.getElementById(`configAuditMiddleDate${idx + 1}`);
            if (dateEl) {
              dateEl.value = date;
            }
          });
        }

        if (endDaysEl && config.inventory_audit.end_year) {
          endDaysEl.value = config.inventory_audit.end_year.days || 1;
          updateAuditDates('end');

          const dates = config.inventory_audit.end_year.dates || [];
          dates.forEach((date, idx) => {
            const dateEl = document.getElementById(`configAuditEndDate${idx + 1}`);
            if (dateEl) {
              dateEl.value = date;
            }
          });
        }
      }

      return true;
    }
  } catch (error) {
    console.error('[Config] Error loading program config:', error);
  }
  return false;
}

/**
 * Save country holidays configuration to localStorage
 */
function saveCountryHolidaysConfig() {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEYS.COUNTRY_HOLIDAYS, JSON.stringify(PRODUCTION_PLAN_SEED_DATA.countryHolidays));
    console.log('[Config] Country holidays saved to localStorage');
  } catch (error) {
    console.error('[Config] Error saving country holidays:', error);
  }
}

/**
 * Load country holidays configuration from localStorage
 */
function loadCountryHolidaysConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEYS.COUNTRY_HOLIDAYS);
    if (saved) {
      PRODUCTION_PLAN_SEED_DATA.countryHolidays = JSON.parse(saved);
      console.log('[Config] Country holidays loaded from localStorage');
      return true;
    }
  } catch (error) {
    console.error('[Config] Error loading country holidays:', error);
  }
  return false;
}

/**
 * Save site overrides configuration to localStorage
 */
function saveSiteOverridesConfig() {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEYS.SITE_OVERRIDES, JSON.stringify(PRODUCTION_PLAN_SEED_DATA.siteOverrides));
    console.log('[Config] Site overrides saved to localStorage');
  } catch (error) {
    console.error('[Config] Error saving site overrides:', error);
  }
}

/**
 * Load site overrides configuration from localStorage
 */
function loadSiteOverridesConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEYS.SITE_OVERRIDES);
    if (saved) {
      PRODUCTION_PLAN_SEED_DATA.siteOverrides = JSON.parse(saved);
      console.log('[Config] Site overrides loaded from localStorage');
      return true;
    }
  } catch (error) {
    console.error('[Config] Error loading site overrides:', error);
  }
  return false;
}

/**
 * Reset to default configuration (from seed data file)
 */
function resetToDefaultConfig() {
  if (!confirm('⚠️ Reset to default configuration? This will clear all your custom sites and lines.')) {
    return;
  }

  // Clear localStorage
  localStorage.removeItem(CONFIG_STORAGE_KEYS.SITES);
  localStorage.removeItem(CONFIG_STORAGE_KEYS.CAPACITY_UNITS);
  localStorage.removeItem(CONFIG_STORAGE_KEYS.PROGRAM_CONFIG);
  localStorage.removeItem(CONFIG_STORAGE_KEYS.COUNTRY_HOLIDAYS);
  localStorage.removeItem(CONFIG_STORAGE_KEYS.SITE_OVERRIDES);

  // Reload page to get fresh data from seed file
  showNotification('🔄 Resetting to default configuration...', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Expose to window for HTML onclick handlers
window.resetToDefaultConfig = resetToDefaultConfig;

/**
 * Initialize configuration - load from localStorage or use defaults
 */
function initializeProductionPlanConfig() {
  console.log('[Config] Initializing production plan configuration...');

  // ⚠️ CRITICAL: Load curve presets from localStorage FIRST
  // This must happen before loading capacity units config
  if (localStorage.getItem('curvePresets')) {
    try {
      window.curvePresets = JSON.parse(localStorage.getItem('curvePresets'));
      console.log('[Config] ✅ Loaded curve presets from localStorage:', Object.keys(window.curvePresets.uph || {}).length, 'UPH presets,', Object.keys(window.curvePresets.yield || {}).length, 'Yield presets');
    } catch (error) {
      console.error('[Config] Error loading curve presets from localStorage:', error);
    }
  } else {
    console.log('[Config] No saved curve presets in localStorage, using defaults from curve_presets_manager.js');
  }

  // Try to load from localStorage first
  const sitesLoaded = loadSitesConfig();
  const unitsLoaded = loadCapacityUnitsConfig();
  const programLoaded = loadProgramConfig();
  const holidaysLoaded = loadCountryHolidaysConfig();
  const overridesLoaded = loadSiteOverridesConfig();

  if (!sitesLoaded || !unitsLoaded || !programLoaded || !holidaysLoaded || !overridesLoaded) {
    console.log('[Config] Using default configuration from seed data file for some settings');
  }

  console.log('[Config] Final configuration:', {
    sites: PRODUCTION_PLAN_SEED_DATA.sites.length,
    capacityUnits: PRODUCTION_PLAN_SEED_DATA.capacityUnits.length,
    programConfig: !!PRODUCTION_PLAN_SEED_DATA.programConfig,
    countryHolidays: Object.keys(PRODUCTION_PLAN_SEED_DATA.countryHolidays || {}).length,
    siteOverrides: PRODUCTION_PLAN_SEED_DATA.siteOverrides?.length || 0
  });
}

/**
 * Track unsaved changes
 */
let hasUnsavedChanges = false;

/**
 * Mark configuration as having unsaved changes
 */
function markConfigAsModified() {
  hasUnsavedChanges = true;
  updateSaveButtonState();
}

/**
 * Update Inventory Audit date inputs based on selected days
 */
function updateAuditDates(period) {
  const daysSelect = document.getElementById(`configAudit${period === 'middle' ? 'Middle' : 'End'}Days`);
  const container = document.getElementById(`configAudit${period === 'middle' ? 'Middle' : 'End'}DatesContainer`);
  const days = parseInt(daysSelect.value);

  // Clear existing inputs
  container.innerHTML = '<label class="text-xs text-slate-500 block mb-1">日期</label>';

  // Add date inputs based on selected days
  for (let i = 1; i <= days; i++) {
    const defaultDate = period === 'middle' ? '2026-06-30' : '2026-12-31';
    const input = document.createElement('input');
    input.type = 'date';
    input.id = `configAudit${period === 'middle' ? 'Middle' : 'End'}Date${i}`;
    input.value = defaultDate;
    input.className = 'w-full border rounded px-3 py-2 text-sm mb-2';
    input.onchange = () => markConfigAsModified();
    container.appendChild(input);
  }
}

/**
 * Update the save button to show unsaved changes state
 */
function updateSaveButtonState() {
  const saveBtn = document.getElementById('saveConfigBtn');
  if (saveBtn) {
    if (hasUnsavedChanges) {
      saveBtn.innerHTML = '<span>💾 Save Configuration</span><span class="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">Unsaved</span>';
      saveBtn.classList.remove('bg-slate-200', 'text-slate-600', 'hover:bg-slate-300');
      saveBtn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700', 'font-bold', 'animate-pulse');
    } else {
      saveBtn.innerHTML = '<span>✅ Configuration Saved</span>';
      saveBtn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700', 'font-bold', 'animate-pulse');
      saveBtn.classList.add('bg-slate-200', 'text-slate-600', 'hover:bg-slate-300');
    }
  }
}

/**
 * Save all configuration changes to localStorage
 */
function saveAllConfiguration() {
  saveSitesConfig();
  saveCapacityUnitsConfig();
  saveProgramConfig();
  saveCountryHolidaysConfig();
  saveSiteOverridesConfig();
  hasUnsavedChanges = false;
  updateSaveButtonState();
  showNotification('✅ Configuration saved successfully!', 'success');
}

/**
 * Update a specific field in a capacity unit (without auto-saving)
 */
function updateCapacityUnitField(unitIndex, field, value) {
  try {
    if (unitIndex < 0 || unitIndex >= PRODUCTION_PLAN_SEED_DATA.capacityUnits.length) {
      console.error('[Config] Invalid unit index:', unitIndex);
      return;
    }

    const unit = PRODUCTION_PLAN_SEED_DATA.capacityUnits[unitIndex];
    const oldValue = unit[field];

    // Convert value to appropriate type
    if (field === 'base_uph' || field === 'shift_hours') {
      value = parseFloat(value);
    }

    unit[field] = value;

    // ⚠️ CRITICAL: When curve preset changes, update the actual curve factors
    if (field === 'uph_ramp_curve_preset' && value !== 'custom') {
      // Load preset from window.curvePresets
      const preset = window.curvePresets?.uph?.[value];
      if (preset) {
        unit.uph_ramp_curve = {
          length_workdays: preset.length,
          factors: [...preset.factors] // Deep copy
        };
        console.log(`[Config] ✅ Loaded UPH curve preset '${value}':`, preset.length, 'workdays, factors:', preset.factors.slice(0, 5), '...');
      } else {
        console.error(`[Config] ❌ UPH curve preset '${value}' not found in window.curvePresets`);
      }
    } else if (field === 'yield_ramp_curve_preset' && value !== 'custom') {
      // Load preset from window.curvePresets
      const preset = window.curvePresets?.yield?.[value];
      if (preset) {
        unit.yield_ramp_curve = {
          length_workdays: preset.length,
          factors: [...preset.factors] // Deep copy
        };
        console.log(`[Config] ✅ Loaded Yield curve preset '${value}':`, preset.length, 'workdays, factors:', preset.factors.slice(0, 5), '...');
      } else {
        console.error(`[Config] ❌ Yield curve preset '${value}' not found in window.curvePresets`);
      }
    }

    markConfigAsModified(); // Mark as modified, but don't save yet

    console.log(`[Config] Updated ${unit.unit_id} ${field}: ${oldValue} → ${value}`);
  } catch (error) {
    console.error('[Config] Error updating capacity unit field:', error);
  }
}

// Expose to window for HTML onclick/onchange handlers
window.updateCapacityUnitField = updateCapacityUnitField;
window.saveAllConfiguration = saveAllConfiguration;

// ========================================
// Navigation Helper
// ========================================
function navigateTo(view, updateUrl = true) {
  STATE.activeView = view;

  // Save current view to localStorage for page refresh persistence
  try {
    localStorage.setItem('lastActiveView', view);
  } catch (error) {
    console.error('[Navigation] Error saving active view:', error);
  }

  // Program workspace sub-views share the same URL (/mo-dashboard)
  // So we don't update URL for these, just render the new view
  const programWorkspaceSubViews = ['mfg-leadtime', 'bto-cto-leadtime',
                                     'labor-fulfillment'];

  if (programWorkspaceSubViews.includes(view)) {
    // For sub-views, just render without changing URL
    render();
  } else if (updateUrl && window.Router) {
    // For main views (overview, moKpis, etc), update URL
    window.Router.navigate(
      view,
      STATE.filters.product,
      STATE.filters.factorySite,
      STATE.filters.week
    );
  } else {
    render();
  }
}

// Export navigateTo globally for onclick handlers in HTML
window.navigateTo = navigateTo;

// Route icons
const ROUTE_ICONS = {
  "AUTO_ACTION": "✅",
  "HUMAN_REVIEW": "👤",
  "MONITOR": "👁️",
  "AUTO_ACTION_CANDIDATE": "✅"
};

// Commit health colors
const COMMIT_HEALTH_COLORS = {
  "GREEN": "bg-green-50 border-green-200 text-green-900",
  "YELLOW": "bg-yellow-50 border-yellow-200 text-yellow-900",
  "RED": "bg-red-50 border-red-200 text-red-900"
};

// Status badge colors
const STATUS_COLORS = {
  "GREEN": "bg-green-100 text-green-800",
  "YELLOW": "bg-yellow-100 text-yellow-800",
  "RED": "bg-red-100 text-red-800"
};

// Load data
async function loadData() {
  const res = await fetch("./mockData_delivery.json");
  const data = await res.json();
  STATE.data = data;
  console.log('Data loaded successfully. Has overview:', !!data.overview);
}

function setMeta() {
  const { meta } = STATE.data;
  $("appName").textContent = meta.appName;
  $("version").textContent = `v${meta.version}`;
  $("lastRefresh").textContent = meta.lastRefresh;
  $("dqStatus").textContent = meta.dataQuality.status;
  $("dqStatus").className = `font-medium ${meta.dataQuality.status === "OK" ? "text-green-600" : "text-amber-600"}`;
}

function populateSelect(selectEl, options, value) {
  if (!selectEl) {
    console.error('[populateSelect] selectEl is null');
    return;
  }
  if (!options || !Array.isArray(options)) {
    console.error('[populateSelect] options is not an array:', options);
    return;
  }

  selectEl.innerHTML = "";
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    if (opt === value) o.selected = true;
    selectEl.appendChild(o);
  });

  console.log(`[populateSelect] Populated ${selectEl.id} with ${options.length} options, selected: ${value}`);
}

function populateSelectWithOptions(selectEl, options, value) {
  if (!selectEl) {
    console.error('[populateSelectWithOptions] selectEl is null');
    return;
  }
  if (!options || !Array.isArray(options)) {
    console.error('[populateSelectWithOptions] options is not an array:', options);
    return;
  }

  selectEl.innerHTML = "";
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === value) o.selected = true;
    selectEl.appendChild(o);
  });

  console.log(`[populateSelectWithOptions] Populated ${selectEl.id} with ${options.length} options, selected: ${value}`);
}

function initControls() {
  console.log('[initControls] Starting initialization');
  console.log('[initControls] STATE.data:', STATE.data);
  console.log('[initControls] STATE.data.dimensions:', STATE.data?.dimensions);

  // Note: PRD Mode toggle (liveMode/simulationMode) has been removed from UI
  // Run Simulation button (if it exists)
  const runSimBtn = $("runSimulationBtn");
  if (runSimBtn) {
    runSimBtn.addEventListener("click", () => {
      runSimulation();
    });
  }

  // Filters
  const { products, factorySites, weeks } = STATE.data.dimensions;
  console.log('[initControls] Filter dimensions:', { products, factorySites, weeks });

  const scenario = getScenario();
  console.log('[initControls] Scenario:', scenario);

  const { product, factorySite, week } = scenario.defaultFilters;
  console.log('[initControls] Default filters:', { product, factorySite, week });

  // Initialize filters from URL if available, otherwise use defaults
  if (!STATE.filters.product) {
    STATE.filters = { product, factorySite, week };
  }

  // For product filter, use simple values: A, B, C, D
  const productValues = ['A', 'B', 'C', 'D'];
  const productOptions = productValues.map(p => ({ value: p, label: `Product ${p}` }));

  // Populate selects
  populateSelectWithOptions($("productFilter"), productOptions, STATE.filters.product);
  populateSelect($("factorySiteFilter"), factorySites, STATE.filters.factorySite);
  populateSelect($("weekFilter"), weeks, STATE.filters.week);

  // Add debug logging for product filter
  const productFilterEl = $("productFilter");
  console.log('[initControls] Product filter element:', productFilterEl);
  console.log('[initControls] Product filter exists?', !!productFilterEl);
  console.log('[initControls] Product filter options count:', productFilterEl?.options?.length);
  console.log('[initControls] Product filter current value:', productFilterEl?.value);

  if (!productFilterEl) {
    console.error('[initControls] ERROR: Product filter element not found!');
  } else {
    // Add click listener to verify element is interactive
    productFilterEl.addEventListener("click", () => {
      console.log('[Product Filter] ===== CLICK EVENT FIRED =====');
      console.log('[Product Filter] Current value on click:', productFilterEl.value);
      console.log('[Product Filter] Current STATE.filters.product:', STATE.filters.product);
      console.log('[Product Filter] All options:');
      Array.from(productFilterEl.options).forEach((opt, idx) => {
        console.log(`  [${idx}] value="${opt.value}" text="${opt.text}" selected=${opt.selected}`);
      });
    });

    productFilterEl.addEventListener("change", (e) => {
      console.log('[Product Filter] ===== CHANGE EVENT FIRED =====');
      console.log('[Product Filter] Changed to:', e.target.value);
      console.log('[Product Filter] e.target:', e.target);
      console.log('[Product Filter] e.target.selectedIndex:', e.target.selectedIndex);
      STATE.filters.product = e.target.value;
      console.log('[Product Filter] STATE.filters.product is now:', STATE.filters.product);
      // Update URL with new product
      if (window.Router) {
        console.log('[Product Filter] Navigating to:', STATE.activeView, STATE.filters.product);
        window.Router.navigate(
          STATE.activeView,
          STATE.filters.product,
          STATE.filters.factorySite,
          STATE.filters.week
        );
      } else {
        render();
      }
    });
  }

  $("factorySiteFilter").addEventListener("change", (e) => {
    STATE.filters.factorySite = e.target.value;
    // Update URL with new site
    if (window.Router) {
      window.Router.navigate(
        STATE.activeView,
        STATE.filters.product,
        STATE.filters.factorySite,
        STATE.filters.week
      );
    } else {
      render();
    }
  });

  $("weekFilter").addEventListener("change", (e) => {
    STATE.filters.week = e.target.value;
    // Update URL with new week
    if (window.Router) {
      window.Router.navigate(
        STATE.activeView,
        STATE.filters.product,
        STATE.filters.factorySite,
        STATE.filters.week
      );
    } else {
      render();
    }
  });

  // Navigation
  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const view = btn.getAttribute("data-view");
      navigateTo(view);
    });
  });
}

function applyFilters(filters) {
  STATE.filters = filters;
  populateSelect($("productFilter"), STATE.data.dimensions.products, filters.product);
  populateSelect($("factorySiteFilter"), STATE.data.dimensions.factorySites, filters.factorySite);
  populateSelect($("weekFilter"), STATE.data.dimensions.weeks, filters.week);
}

function getScenario() {
  // Use product from filters if available, otherwise use scenarioId
  const productId = STATE.filters.product || STATE.scenarioId;
  return STATE.data.scenarios.find(s => s.id === productId);
}

function getDemo() {
  // Use product from filters if available, otherwise use scenarioId
  const productId = STATE.filters.product || STATE.scenarioId;
  return STATE.data.demoData[productId];
}

function enterProgram(productName, factorySite) {
  // Set filters for the selected program
  STATE.filters.product = productName;
  STATE.filters.factorySite = factorySite;
  // Week is already set from portfolio, but ensure it's set
  if (!STATE.filters.week) {
    STATE.filters.week = STATE.data.portfolio.week;
  }

  // Update dropdown UI to reflect the selected filters
  $("productFilter").value = productName;
  $("factorySiteFilter").value = factorySite;
  $("weekFilter").value = STATE.filters.week;

  // Navigate to Program Home
  STATE.activeView = 'home';
  render();
}

function runSimulation() {
  const preset = $("presetSelect").value;

  // Mock simulation results
  const baseCommit = getDemo().deliveryCommit;
  const baseConfidence = baseCommit.confidence;
  const baseAtRisk = baseCommit.atRiskUnits;

  let simResults = {
    preset: preset,
    before: {
      confidence: baseConfidence,
      atRiskUnits: baseAtRisk,
      commitHealth: baseCommit.commitHealth,
      liabilityPressure: "YELLOW"
    },
    after: {},
    recommendation: ""
  };

  // Different outcomes based on preset
  if (preset.includes("Material Slip")) {
    simResults.after = {
      confidence: Math.max(baseConfidence - 15, 50),
      atRiskUnits: baseAtRisk + 6500,
      commitHealth: "RED",
      liabilityPressure: "YELLOW",
      expediteCost: 120000
    };
    simResults.recommendation = "Keep W04 recovery actions ON; expedite IC-77 via air freight.";
  } else if (preset.includes("Yield Drift")) {
    simResults.after = {
      confidence: Math.max(baseConfidence - 12, 55),
      atRiskUnits: baseAtRisk + 5200,
      commitHealth: "RED",
      liabilityPressure: "YELLOW",
      expediteCost: 0
    };
    simResults.recommendation = "Prioritize re-test lane + add weekend shift; freeze non-critical releases.";
  } else if (preset.includes("Holiday")) {
    simResults.after = {
      confidence: Math.max(baseConfidence - 18, 48),
      atRiskUnits: baseAtRisk + 8100,
      commitHealth: "RED",
      liabilityPressure: "YELLOW",
      expediteCost: 95000
    };
    simResults.recommendation = "Pull forward W05 starts to W04; negotiate holiday overtime package.";
  } else if (preset.includes("Demand Downside")) {
    simResults.after = {
      confidence: baseConfidence - 3,
      atRiskUnits: Math.max(baseAtRisk - 2000, 0),
      commitHealth: baseCommit.commitHealth,
      liabilityPressure: "RED",
      expediteCost: 0
    };
    simResults.recommendation = "Block additional pre-build releases; slow down WIP starts by 10%; maintain W04 commit actions.";
  } else { // Mixed Shock
    simResults.after = {
      confidence: Math.max(baseConfidence - 25, 42),
      atRiskUnits: baseAtRisk + 9800,
      commitHealth: "RED",
      liabilityPressure: "RED",
      expediteCost: 185000
    };
    simResults.recommendation = "Escalate to leadership for commit re-negotiation; freeze all non-committed builds.";
  }

  STATE.simulationResults = simResults;
  render();
}

function render() {
  // Determine if we're in Program workspace (vs Global pages)
  // Decision Center and Data Foundation are global pages - no sidebar filters
  const isProgramWorkspace = ["home", "delivery", "command-center", "mfg-leadtime", "bto-cto-leadtime", "labor-fulfillment", "signals", "radar", "actions", "reports"].includes(STATE.activeView);

  // Toggle sidebar visibility
  const sidebar = $("sidebar");
  const mainContent = $("mainContent");
  if (isProgramWorkspace) {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("md:col-span-3");
    mainContent.classList.remove("col-span-12");
    mainContent.classList.add("md:col-span-9");
  } else {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("md:col-span-3");
    mainContent.classList.remove("md:col-span-9");
    mainContent.classList.add("col-span-12");
  }

  // Update breadcrumb for Program workspace
  if (isProgramWorkspace) {
    updateBreadcrumb();
  }

  // Update global navigation active state
  document.querySelectorAll("[data-global-nav]").forEach(btn => {
    const view = btn.getAttribute("data-global-nav");
    if (view === STATE.activeView || (view === "program" && isProgramWorkspace)) {
      btn.classList.add("bg-blue-50", "text-blue-700", "font-semibold", "border-blue-300", "ring-1", "ring-blue-200");
      btn.classList.remove("border-slate-200", "text-slate-700");
    } else {
      btn.classList.remove("bg-blue-50", "text-blue-700", "font-semibold", "border-blue-300", "ring-1", "ring-blue-200");
      btn.classList.add("border-slate-200", "text-slate-700");
    }
  });

  // Show/hide filters bar based on view
  const filtersBar = document.querySelector(".no-print.bg-slate-50.border-b");
  const updateDataBtn = document.querySelector("#updateDataBtn");

  const globalPages = ["overview", "notification", "portfolio", "moKpis", "production-plan", "productionMgmt", "fv-management", "campus-readiness", "dataFoundation", "whitePaper", "teamAIStrategy", "resourceHub"];
  if (globalPages.includes(STATE.activeView)) {
    // Hide filters on global pages
    if (filtersBar) filtersBar.style.display = "none";
  } else {
    // Show filters and Update Data button on Program workspace
    if (filtersBar) filtersBar.style.display = "block";
    if (updateDataBtn) updateDataBtn.style.display = "flex";
  }

  // Update sidebar nav active state
  document.querySelectorAll("[data-view]").forEach(btn => {
    if (btn.getAttribute("data-view") === STATE.activeView) {
      btn.classList.add("bg-slate-100", "font-semibold");
    } else {
      btn.classList.remove("bg-slate-100", "font-semibold");
    }
  });

  // Render content based on active view
  switch (STATE.activeView) {
    case "overview":
      renderOverview();
      break;
    case "notification":
      renderNotification();
      break;
    case "portfolio":
      renderPortfolio();
      break;
    case "home":
    case "delivery":
      renderDeliveryCommandCenter();
      break;
    case "production-plan":
      renderProductionPlan();
      break;
    case "mfg-leadtime":
      renderManufacturingLeadtime();
      break;
    case "bto-cto-leadtime":
      renderBTOCTOLeadtime();
      break;
    case "fv-management":
      renderFVManagement();
      break;
    case "labor-fulfillment":
      renderLaborFulfillment();
      break;
    case "campus-readiness":
      renderCampusReadiness();
      break;
    case "signals":
      renderSignals();
      break;
    case "radar":
      renderRadar();
      break;
    case "actions":
    case "orchestration":
      renderActions();
      break;
    case "reports":
      renderReports();
      break;
    case "moKpis":
      renderMOKpis();
      break;
    case "productionMgmt":
      renderProductionManagement();
      break;
    case "dataFoundation":
      renderDataFoundation();
      break;
    case "whitePaper":
      renderWhitePaper();
      break;
    case "teamAIStrategy":
      renderTeamAIStrategy();
      break;
    case "resourceHub":
      renderResourceHub();
      break;
    default:
      renderOverview();
  }
}

// Update breadcrumb for Program workspace
function updateBreadcrumb() {
  const breadcrumb = $("breadcrumb");
  if (!breadcrumb) return;

  const { product, factorySite, week } = STATE.filters;
  const viewNames = {
    "home": "Delivery Command Center",
    "signals": "Signals",
    "radar": "Risk Radar",
    "actions": "Actions",
    "reports": "Reports"
  };

  breadcrumb.innerHTML = `
    <div class="flex items-center gap-1 flex-wrap">
      <a href="#" onclick="navigateTo('portfolio'); return false;" class="hover:text-blue-600">Decision Center</a>
      <span>›</span>
      <span class="font-semibold">${product} / ${factorySite}</span>
      <span>›</span>
      <span class="text-slate-400">${week}</span>
      <span>›</span>
      <span class="text-blue-600 font-semibold">${viewNames[STATE.activeView]}</span>
    </div>
  `;
}

// ========================================
// OVERVIEW - Vision & Scope
// ========================================
function renderOverview() {
  const html = `
    <!-- ============================================================ -->
    <!-- 0) HERO -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-300 rounded-xl p-8 mb-6">
      <h1 class="text-3xl font-bold text-slate-900 mb-2">FDOS — Factory Delivery Orchestration System</h1>
      <div class="text-base text-slate-700 mb-3">
        Turning factory execution signals into delivery decisions.
      </div>
      <div class="text-sm text-slate-600 border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg space-y-2">
        <p>FDOS closes the missing factory link by standardizing execution signals and routing decisions with evidence.</p>
        <p>In complex manufacturing environments, operational signals often remain fragmented across planning systems, factory reports, and communication channels.</p>
        <p>FDOS converts these signals into structured insights that enable faster and more reliable operational decisions.</p>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 1) MO ROLE: Cross-Constraint Orchestrator -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-indigo-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-1">Manufacturing Operations</div>
      <div class="text-sm font-semibold text-indigo-700 mb-4">The Cross-Constraint Orchestrator</div>
      <div class="text-sm text-slate-700 space-y-2 mb-5">
        <p>Manufacturing Operations operates at the intersection of multiple operational constraints.</p>
        <p>Every production decision must balance three constantly shifting forces:</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5 text-center">
          <div class="text-3xl mb-2">📦</div>
          <div class="text-sm font-bold text-blue-900">Supply Variability</div>
          <div class="text-xs text-blue-700 mt-1">Material availability, supplier lead times, and component readiness</div>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-5 text-center">
          <div class="text-3xl mb-2">📊</div>
          <div class="text-sm font-bold text-amber-900">Demand Volatility</div>
          <div class="text-xs text-amber-700 mt-1">Forecast changes, order shifts, and commitment adjustments</div>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-5 text-center">
          <div class="text-3xl mb-2">🏭</div>
          <div class="text-sm font-bold text-green-900">Factory Capacity</div>
          <div class="text-xs text-green-700 mt-1">Production throughput, yield rates, and resource constraints</div>
        </div>
      </div>

      <div class="text-sm text-slate-700 space-y-2">
        <p>MO continuously orchestrates signals across production, materials, planning, logistics, and engineering teams to maintain stable execution.</p>
        <p>Rather than operating within a single functional boundary, MO acts as the coordination layer that translates evolving factory conditions into executable supply outcomes.</p>
        <p>This orchestration role becomes increasingly critical as product portfolios expand and operational complexity grows.</p>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 2) WHY THIS EXISTS -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-red-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-2">Why This Exists</div>
      <div class="text-sm text-slate-700 space-y-2 mb-4">
        <p>Factory execution is often the least standardized segment of the end-to-end supply chain.</p>
        <p>Operational signals originate from multiple sources:</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs text-slate-700">Factory production reports</div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs text-slate-700">Material readiness updates</div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs text-slate-700">Planning systems</div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs text-slate-700">Engineering change notifications</div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs text-slate-700">Logistics updates</div>
      </div>
      <div class="text-sm text-slate-700 space-y-2 mb-4">
        <p>When these signals are incomplete or inconsistent, planning assumptions become unreliable.</p>
        <p>As a result, decision-making often relies on manual reconciliation and experience-driven interpretation.</p>
      </div>
      <div class="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
        <div class="text-sm font-bold text-red-900">Factory signals often do not travel cleanly across the chain.</div>
        <div class="text-sm text-red-800 mt-1">FDOS exists to convert factory reality into decision-grade signals that planners and operational leaders can rely on.</div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 3) EXECUTION FRICTION -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-2">Why Factory Signals Don't Travel Well Today</div>
      <div class="text-sm text-slate-600 mb-4">Operational friction typically appears in four areas:</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border-2 border-amber-200 bg-amber-50 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-2">Metric Inconsistency</div>
          <div class="text-xs text-slate-700 space-y-1">
            <p>Operational metrics may use similar terminology but different definitions across systems.</p>
            <p>This requires manual reconciliation before the signals can be used in decision-making.</p>
          </div>
        </div>

        <div class="border-2 border-red-200 bg-red-50 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-2">Messy Inputs</div>
          <div class="text-xs text-slate-700 space-y-1">
            <p>Factory inputs frequently contain missing fields, inconsistent formats, or partial updates.</p>
            <p>This reduces confidence in the data and slows operational alignment.</p>
          </div>
        </div>

        <div class="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-2">High Change Speed</div>
          <div class="text-xs text-slate-700 space-y-1">
            <p>Factory conditions evolve continuously throughout the day.</p>
            <p>Operational dashboards and reports often lag behind real conditions, limiting decision agility.</p>
          </div>
        </div>

        <div class="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-2">Truth Lives Offline</div>
          <div class="text-xs text-slate-700 space-y-1">
            <p>Critical operational context frequently exists in meetings, chat threads, or spreadsheets rather than structured systems.</p>
            <p>As a result, important insights remain difficult to reuse or analyze systematically.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 4) HOW FDOS WORKS -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-blue-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-2">How FDOS Turns Signals into Decisions</div>
      <div class="text-sm text-slate-600 mb-5">FDOS transforms fragmented operational signals into structured decision workflows through four mechanisms.</div>

      <div class="space-y-4">
        <div class="flex items-start gap-4 border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
          <div>
            <div class="font-bold text-slate-900 mb-1">Standardize</div>
            <div class="text-sm text-slate-700">Operational signals are standardized using shared definitions for metrics, data granularity, and refresh cadence. This ensures that signals carry consistent meaning across systems and teams.</div>
          </div>
        </div>

        <div class="flex items-start gap-4 border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
          <div class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <div class="font-bold text-slate-900 mb-1">Validate</div>
            <div class="text-sm text-slate-700">Each signal receives confidence indicators including freshness, completeness, and reconciliation status. This allows decision-makers to distinguish reliable signals from noise.</div>
          </div>
        </div>

        <div class="flex items-start gap-4 border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg">
          <div class="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
          <div>
            <div class="font-bold text-slate-900 mb-1">Route Decisions</div>
            <div class="text-sm text-slate-700">When signals indicate potential delivery risk, FDOS automatically routes the issue to the responsible owner. Each decision includes supporting evidence, operational context, suggested action options, and response expectations.</div>
          </div>
        </div>

        <div class="flex items-start gap-4 border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
          <div class="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
          <div>
            <div class="font-bold text-slate-900 mb-1">Close the Loop</div>
            <div class="text-sm text-slate-700">Decisions and outcomes are recorded so the system can continuously learn which actions actually improve execution results. This creates a feedback loop that improves decision accuracy over time.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 5) OPERATIONAL RHYTHM -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-2">Operational Rhythm</div>
      <div class="text-sm text-slate-600 mb-5">FDOS supports a predictable operational cadence that keeps factory execution aligned with delivery commitments.</div>

      <div class="space-y-3 mb-5">
        <div class="flex items-start gap-3 border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
          <div class="flex-shrink-0 font-bold text-sm text-blue-900 w-16">Weekly</div>
          <div class="text-sm text-slate-700">Delivery commitments are established. FDOS monitors whether factory execution signals remain aligned with those commitments.</div>
        </div>

        <div class="flex items-start gap-3 border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
          <div class="flex-shrink-0 font-bold text-sm text-green-900 w-16">Daily</div>
          <div class="text-sm text-slate-700">Material readiness, capacity signals, and yield updates continuously refresh execution visibility. The system evaluates emerging risks and routes required actions.</div>
        </div>

        <div class="flex items-start gap-3 border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg">
          <div class="flex-shrink-0 font-bold text-sm text-amber-900 w-24">48-Hour Window</div>
          <div class="text-sm text-slate-700">Within the final window before shipments, FDOS prioritizes the limited set of decisions that can still change the weekly outcome. This ensures operational attention focuses on the highest-impact decisions.</div>
        </div>
      </div>

      <div class="border-t pt-4">
        <div class="text-xs font-semibold text-slate-700 mb-2">Closed-loop execution chain:</div>
        <div class="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 font-mono">
          Plan → Constraints → Inputs → Outputs → Shipment Readiness → Commit → Exceptions → Actions → Learning
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 6) NORTH STAR: Future Smart Factory -->
    <!-- ============================================================ -->
    <div class="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-2">North Star — Future Smart Factory</div>
      <div class="text-sm text-slate-700 space-y-2 mb-6">
        <p>FDOS represents an important step toward a future operating model in which manufacturing execution becomes increasingly autonomous.</p>
        <p>This vision is referred to as the <strong>Future Smart Factory</strong>.</p>
        <p>The Future Smart Factory moves beyond manual coordination toward engineered decision systems.</p>
      </div>

      <!-- Operating Model Evolution -->
      <div class="text-sm font-semibold text-indigo-800 mb-3">Operating Model Evolution</div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white border-2 border-slate-300 rounded-xl p-5 text-center relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-slate-500 text-white text-xs font-bold rounded-full">Stage 1</div>
          <div class="text-2xl mb-2 mt-2">🔧</div>
          <div class="text-sm font-bold text-slate-900 mb-2">Manual Stabilization</div>
          <div class="text-xs text-slate-600">Operational teams manually detect and resolve issues as they arise.</div>
        </div>
        <div class="bg-white border-2 border-blue-300 rounded-xl p-5 text-center relative ring-2 ring-blue-200">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">Stage 2</div>
          <div class="text-2xl mb-2 mt-2">⚙️</div>
          <div class="text-sm font-bold text-blue-900 mb-2">System-Enabled Orchestration</div>
          <div class="text-xs text-blue-800">FDOS consolidates operational signals and coordinates execution decisions across the factory network.</div>
        </div>
        <div class="bg-white border-2 border-purple-300 rounded-xl p-5 text-center relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">Stage 3</div>
          <div class="text-2xl mb-2 mt-2">🤖</div>
          <div class="text-sm font-bold text-purple-900 mb-2">AI-Driven Execution</div>
          <div class="text-xs text-purple-800">AI agents manage routine operational decisions using predefined guardrails while human operators oversee strategic decisions and exceptions.</div>
        </div>
      </div>

      <!-- Arrows between stages -->
      <div class="hidden md:flex items-center justify-center gap-2 -mt-10 mb-6">
        <div class="w-1/3 text-center text-2xl text-slate-300">→</div>
        <div class="w-1/3 text-center text-2xl text-slate-300">→</div>
      </div>

      <!-- Human Role Evolution -->
      <div class="bg-white border border-indigo-200 rounded-xl p-5">
        <div class="text-sm font-semibold text-indigo-800 mb-3">Human Role Evolution</div>
        <div class="flex items-center gap-3 flex-wrap mb-4">
          <span class="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-700">Manual Operator</span>
          <span class="text-slate-400">→</span>
          <span class="px-3 py-1.5 bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-800">Execution Coordinator</span>
          <span class="text-slate-400">→</span>
          <span class="px-3 py-1.5 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-800">System Orchestrator</span>
        </div>
        <div class="text-sm text-slate-700">
          Rather than replacing operational expertise, this evolution allows teams to focus on:
        </div>
        <ul class="text-sm text-slate-700 mt-2 space-y-1 ml-4">
          <li>• Evaluating operational trade-offs</li>
          <li>• Resolving ambiguous situations</li>
          <li>• Guiding factory execution under changing conditions</li>
        </ul>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 7) IMPLEMENTATION PLAN -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
      <div class="text-lg font-bold text-slate-900 mb-2">Implementation Plan</div>
      <div class="text-sm text-slate-600 mb-6">FDOS development combines new system development, upgrades to existing workflows, and integration with enterprise planning platforms. The rollout prioritizes improving execution visibility and decision speed while building the orchestration layer required for the Future Smart Factory.</div>

      <!-- Implementation Modules Table -->
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-slate-100">
              <th class="text-left p-3 border border-slate-300 font-semibold text-slate-800">Functional Module</th>
              <th class="text-left p-3 border border-slate-300 font-semibold text-slate-800">Module Type</th>
              <th class="text-left p-3 border border-slate-300 font-semibold text-slate-800">Resources</th>
              <th class="text-left p-3 border border-slate-300 font-semibold text-slate-800">Dev Plan</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">Overall Framework</td>
              <td class="p-3 border border-slate-200 text-slate-700">New System Architecture</td>
              <td class="p-3 border border-slate-200 text-slate-700">BET / MO</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-medium">Under discussion</span></td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">Data Integration</td>
              <td class="p-3 border border-slate-200 text-slate-700">Platform Integration</td>
              <td class="p-3 border border-slate-200 text-slate-700">BET / MO</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">Phase I: Apr-26</span></td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">APR System (Production Planning)</td>
              <td class="p-3 border border-slate-200 text-slate-700">System Upgrade</td>
              <td class="p-3 border border-slate-200 text-slate-700">BET / O9</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-medium">Under discussion</span></td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">Campus Planning System</td>
              <td class="p-3 border border-slate-200 text-slate-700">New System</td>
              <td class="p-3 border border-slate-200 text-slate-700">MO</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">Phase I: Apr-26</span></td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">Production Dashboard System</td>
              <td class="p-3 border border-slate-200 text-slate-700">System Upgrade</td>
              <td class="p-3 border border-slate-200 text-slate-700">MO</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">Phase I: Apr-26</span></td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">FV Cost Management System</td>
              <td class="p-3 border border-slate-200 text-slate-700">New System</td>
              <td class="p-3 border border-slate-200 text-slate-700">MO</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">Phase I: May-26</span></td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-3 border border-slate-200 font-medium text-slate-900">KPIs Dashboards</td>
              <td class="p-3 border border-slate-200 text-slate-700">System Upgrade</td>
              <td class="p-3 border border-slate-200 text-slate-700">MO / BET</td>
              <td class="p-3 border border-slate-200"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">Phase I: Apr-26</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Module Explanations -->
      <div class="text-sm font-semibold text-slate-800 mb-3">Module Details</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">Overall Framework</div>
          <div class="text-xs text-slate-700">Defines the FDOS system architecture and primary interface connecting execution signals with decision workflows.</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">Data Integration</div>
          <div class="text-xs text-slate-700">Builds the data pipelines that consolidate operational signals from factory systems and planning platforms.</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">APR System</div>
          <div class="text-xs text-slate-700">Enhances production planning capabilities through APS integration with O9.</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">Campus Planning System</div>
          <div class="text-xs text-slate-700">Introduces an interactive system for visualizing campus resources and simulating facility planning scenarios.</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">Production Dashboard System</div>
          <div class="text-xs text-slate-700">Improves real-time visibility of production execution metrics.</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">FV Cost Management System</div>
          <div class="text-xs text-slate-700">Automates factory variance cost tracking and analysis.</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div class="text-sm font-bold text-slate-900 mb-1">KPIs Dashboards</div>
          <div class="text-xs text-slate-700">Standardizes operational metrics and visualizes supply chain health.</div>
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// DECISION CENTER - All Programs
// ========================================
// ========================================
// Decision Center Helper Functions
// ========================================

function calculateDriverBreakdown(programs) {
  const drivers = {};
  let totalAtRisk = 0;

  programs.forEach(prog => {
    const constraint = extractPrimaryConstraint(prog.topDriver);
    drivers[constraint] = (drivers[constraint] || 0) + prog.atRiskUnits;
    totalAtRisk += prog.atRiskUnits;
  });

  const sorted = Object.entries(drivers)
    .map(([driver, units]) => ({
      driver,
      units,
      percentage: totalAtRisk > 0 ? Math.round((units / totalAtRisk) * 100) : 0
    }))
    .sort((a, b) => b.units - a.units);

  return {
    top: sorted[0] ? `${sorted[0].driver} (${sorted[0].percentage}%)` : 'N/A',
    breakdown: sorted
  };
}

function extractPrimaryConstraint(topDriver) {
  if (!topDriver) return 'Unknown';

  const lower = topDriver.toLowerCase();
  if (lower.includes('ctb') || lower.includes('material')) return 'CTB';
  if (lower.includes('yield')) return 'Yield';
  if (lower.includes('capacity')) return 'Capacity';
  if (lower.includes('shipment') || lower.includes('ship')) return 'Shipment';
  if (lower.includes('lead time') || lower.includes('cycle')) return 'Lead time';
  if (lower.includes('data') || lower.includes('confidence')) return 'Data confidence';

  return 'Other';
}

function generateTopFocusCards(programs) {
  // Generate top 3 focus items based on impact × confidence × urgency
  return programs
    .filter(prog => prog.commitHealth !== 'GREEN' && prog.atRiskUnits > 0)
    .map(prog => {
      const priority = prog.commitHealth === 'RED' || prog.atRiskUnits > 10000 ? 'HIGH' :
                       prog.commitHealth === 'YELLOW' || prog.atRiskUnits > 5000 ? 'MEDIUM' : 'LOW';

      const slaHours = prog.sla === '24h' ? 24 :
                       prog.sla === '48h' ? 48 :
                       prog.sla === '72h' ? 72 : 48;

      const constraint = extractPrimaryConstraint(prog.topDriver);

      return {
        program: prog.name,
        site: prog.buildSites.split(',')[0].trim(),
        priority,
        impact: `${prog.atRiskUnits.toLocaleString()} units at risk`,
        whyNow: `${constraint} constraint detected`,
        owner: prog.owner,
        slaHours,
        confidence: prog.confidence || 'HIGH'
      };
    })
    .sort((a, b) => {
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);
}

// Placeholder functions for card click handlers
function filterPrograms(filter) {
  console.log(`[Decision Center] Filter programs by: ${filter}`);
  // TODO: Implement filtering logic
}

function openDecisionInbox() {
  console.log('[Decision Center] Opening Decision Inbox');
  // TODO: Implement decision inbox
}

function openAtRiskBreakdown() {
  console.log('[Decision Center] Opening At-risk breakdown');
  // TODO: Implement at-risk breakdown
}

function openInventoryDrilldown() {
  console.log('[Decision Center] Opening Inventory drilldown');
  // TODO: Implement inventory drilldown
}

function assignOrEscalate(program) {
  console.log(`[Decision Center] Assign/Escalate for program: ${program}`);
  // TODO: Implement assign/escalate flow
}

function openException(program, issue) {
  console.log(`[Decision Center] Opening exception: ${program} - ${issue}`);
  // TODO: Implement exception detail view
}

function toggleScenarioAnalysis(decisionId) {
  console.log(`[Decision Console] Toggle scenario analysis for decision: ${decisionId}`);
  const el = document.getElementById(`scenario-${decisionId}`);
  if (el) {
    el.classList.toggle('hidden');
  }
}

function confirmDecision(decisionId, scenario) {
  console.log(`[Decision Console] Confirm decision: ${decisionId}, scenario: ${scenario}`);
  alert(`Decision confirmed: ${decisionId} — ${scenario}`);
}

function selectScenario(scenario) {
  console.log(`[Decision Console] Select scenario: ${scenario}`);
  alert(`Scenario selected: ${scenario}`);
}

function routeDecision(decisionId) {
  console.log(`[Decision Console] Route decision: ${decisionId}`);
  alert(`Decision routed: ${decisionId}`);
}

// ========================================
// Decision Center Rendering
// ========================================

function renderPortfolio() {
  const portfolio = STATE.data.portfolio;

  if (!portfolio) {
    $("content").innerHTML = `<div class="p-4 text-center text-slate-500">Decision Console data not available</div>`;
    return;
  }

  const { summary, programs, topExceptions } = portfolio;

  // Calculate top drivers distribution
  const driverBreakdown = calculateDriverBreakdown(programs);
  const focusCards = generateTopFocusCards(programs);

  // Hardcoded scenario options per decision card
  const scenarioOptions = [
    [
      { label: 'Shift Capacity +1 Line', recovery: '+3,200 units', cost: 'Low', risk: 'Medium', complexity: 'Medium' },
      { label: 'Partial Build (top SKUs)', recovery: '+5,000 units', cost: 'None', risk: 'Low', complexity: 'Low' },
      { label: 'Delay Low-Priority SKU', recovery: '+7,000 units', cost: 'None', risk: 'Lowest', complexity: 'Low' },
    ],
    [
      { label: 'Expedite Material', recovery: '+2,800 units', cost: 'Medium', risk: 'Low', complexity: 'Medium' },
      { label: 'Substitute Component', recovery: '+4,200 units', cost: 'Low', risk: 'Medium', complexity: 'High' },
      { label: 'Split Shipment', recovery: '+3,500 units', cost: 'Low', risk: 'Low', complexity: 'Low' },
    ],
    [
      { label: 'Overtime Authorization', recovery: '+1,500 units', cost: 'Medium', risk: 'Low', complexity: 'Low' },
      { label: 'Cross-Site Transfer', recovery: '+3,000 units', cost: 'Low', risk: 'Medium', complexity: 'High' },
      { label: 'Defer to Next Week', recovery: '+4,500 units', cost: 'None', risk: 'Lowest', complexity: 'Low' },
    ],
  ];

  // Hardcoded decision context per card
  const decisionContexts = [
    { constraint: 'Yield degradation', exposure: 'Assembly line output', gap: '12,400 units at risk' },
    { constraint: 'Material shortage (CTB)', exposure: 'Production input readiness', gap: '8,000 units exposed' },
    { constraint: 'Capacity limitation', exposure: 'Build schedule pressure', gap: '5,200 units at risk' },
  ];

  const html = `
    <!-- Page Header: Decision Console -->
    <div class="bg-white border-2 border-slate-300 rounded-xl p-6 mb-4">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="text-xl font-bold mb-2">Decision Console — Execution Decisions</div>
          <div class="text-sm text-slate-700 mb-3">Turning execution risks into structured decisions.</div>
          <div class="grid grid-cols-3 gap-4 text-xs text-slate-600">
            <div><span class="font-semibold text-slate-900">1.</span> What needs a decision this week / within 48h</div>
            <div><span class="font-semibold text-slate-900">2.</span> Who owns it + what evidence is ready</div>
            <div><span class="font-semibold text-slate-900">3.</span> What will change if we act</div>
          </div>
        </div>
        <button onclick="openAIDrawer('portfolio_exec_summary')" class="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:from-blue-700 hover:to-purple-700 flex-shrink-0">
          <span>🤖</span>
          <span>AI: Weekly Exec Summary</span>
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- WEEKLY EXECUTION SIGNALS -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-5 mb-4">
      <div class="text-sm font-semibold text-slate-800 mb-4">Weekly Execution Signals</div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Signal 1: Commit Coverage -->
        <div class="border border-slate-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2.5 h-2.5 rounded-full ${summary.commitHealth === 'GREEN' ? 'bg-green-500' : summary.commitHealth === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'}"></div>
            <div class="text-xs font-semibold text-slate-700">Commit Coverage</div>
          </div>
          <div class="text-lg font-bold text-slate-900 mb-1">${(summary.programsInScope * 5000).toLocaleString()} <span class="text-sm font-normal text-slate-500">demand</span></div>
          <div class="text-sm font-semibold text-red-600">${summary.atRiskUnits.toLocaleString()} at risk</div>
          <div class="text-xs text-slate-500 mt-1">Confidence: ${summary.dataConfidence || 'HIGH'} · ${focusCards.length} decisions needed</div>
        </div>

        <!-- Signal 2: Primary Constraint -->
        <div class="border border-slate-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2.5 h-2.5 rounded-full ${summary.atRiskUnits > 20000 ? 'bg-red-500' : summary.atRiskUnits > 10000 ? 'bg-yellow-500' : 'bg-green-500'}"></div>
            <div class="text-xs font-semibold text-slate-700">Primary Constraint</div>
          </div>
          <div class="text-lg font-bold text-slate-900 mb-1">${driverBreakdown.breakdown[0] ? driverBreakdown.breakdown[0].driver : 'N/A'}</div>
          <div class="text-sm text-slate-600">${driverBreakdown.breakdown[0] ? driverBreakdown.breakdown[0].percentage + '% of at-risk' : ''}</div>
          <div class="text-xs text-slate-500 mt-1">Driving most at-risk units</div>
        </div>

        <!-- Signal 3: Inventory Exposure -->
        <div class="border border-slate-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2.5 h-2.5 rounded-full ${summary.inventoryPressure === 'GREEN' ? 'bg-green-500' : summary.inventoryPressure === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'}"></div>
            <div class="text-xs font-semibold text-slate-700">Inventory Exposure</div>
          </div>
          <div class="text-lg font-bold text-slate-900 mb-1">${summary.inventoryPressure === 'GREEN' ? 'Stable' : summary.inventoryPressure === 'YELLOW' ? 'Elevated' : 'Critical'}</div>
          <div class="text-sm text-slate-600">FG/WIP ${summary.inventoryPressure === 'GREEN' ? '→ flat' : summary.inventoryPressure === 'YELLOW' ? '↑ rising' : '↑↑ spiking'}</div>
          <div class="text-xs text-slate-500 mt-1">Confidence: ${summary.dataConfidence === 'HIGH' ? 'HIGH' : 'MED'} · ${summary.inventoryPressure !== 'GREEN' ? '1 review needed' : 'monitor'}</div>
        </div>

        <!-- Signal 4: Decision Load -->
        <div class="border border-slate-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2.5 h-2.5 rounded-full ${topExceptions.length > 3 ? 'bg-yellow-500' : 'bg-green-500'}"></div>
            <div class="text-xs font-semibold text-slate-700">Decision Load</div>
          </div>
          <div class="text-lg font-bold text-slate-900 mb-1">${topExceptions.length} <span class="text-sm font-normal text-slate-500">open</span></div>
          <div class="text-sm text-slate-600">${topExceptions.filter(ex => ex.slaHours && ex.slaHours <= 24).length} SLA breaches</div>
          <div class="text-xs text-slate-500 mt-1">${focusCards.length} priority decisions this week</div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PRIORITY DECISIONS -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-blue-200 rounded-xl p-6 mb-4">
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="text-lg font-bold text-slate-900">Priority Decisions</div>
          <div class="text-xs text-slate-600 mt-1">Each decision card shows the execution context, available scenarios, and the system recommendation to support structured operational decisions.</div>
        </div>
        <div class="text-xs text-slate-500">Updated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>

      <div class="space-y-4">
        ${focusCards.map((focus, idx) => {
          const scenarios = scenarioOptions[idx] || scenarioOptions[0];
          const ctx = decisionContexts[idx] || decisionContexts[0];
          return `
          <div class="bg-white border-2 ${focus.priority === 'HIGH' ? 'border-red-300' : focus.priority === 'MEDIUM' ? 'border-yellow-300' : 'border-blue-300'} rounded-lg p-5 hover:shadow-md transition-shadow">
            <!-- Header: Program + Priority -->
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg font-bold text-slate-400">#${idx + 1}</span>
              <span class="text-base font-bold text-slate-900">${focus.program}</span>
              ${focus.site ? `<span class="text-xs text-slate-500">/ ${focus.site}</span>` : ''}
              <span class="px-2 py-0.5 rounded text-xs font-semibold ${focus.priority === 'HIGH' ? 'bg-red-100 text-red-800' : focus.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">${focus.priority}</span>
            </div>

            <!-- 5-Question Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4 pb-4 border-b border-slate-200">
              <div>
                <div class="text-xs font-semibold text-slate-500 mb-1">Decision</div>
                <div class="text-sm text-slate-900 font-medium">Protect W04 Commit — ${focus.program}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 mb-1">Why Now</div>
                <div class="text-xs text-slate-700">${focus.whyNow} · conf. <span class="font-semibold ${focus.confidence === 'HIGH' ? 'text-green-700' : focus.confidence === 'MEDIUM' ? 'text-yellow-700' : 'text-red-700'}">${focus.confidence || 'HIGH'}</span></div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 mb-1">Impact</div>
                <div class="text-xs text-slate-700">${focus.impact} · commit exposed</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 mb-1">Decision Window</div>
                <div class="text-xs font-semibold ${focus.slaHours <= 24 ? 'text-red-600' : focus.slaHours <= 48 ? 'text-yellow-600' : 'text-slate-600'}">${focus.slaHours}h SLA</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 mb-1">Owner</div>
                <div class="text-xs text-slate-700 font-medium">${focus.owner}</div>
              </div>
            </div>

            <!-- Decision Context -->
            <div class="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div class="text-xs font-semibold text-slate-700 mb-2">Decision Context</div>
              <div class="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div class="text-slate-500 mb-0.5">Primary constraint</div>
                  <div class="font-medium text-slate-900">${ctx.constraint}</div>
                </div>
                <div>
                  <div class="text-slate-500 mb-0.5">Program exposure</div>
                  <div class="font-medium text-slate-900">${ctx.exposure}</div>
                </div>
                <div>
                  <div class="text-slate-500 mb-0.5">Commit gap</div>
                  <div class="font-medium text-slate-900">${ctx.gap}</div>
                </div>
              </div>
            </div>

            <!-- Scenario Options -->
            <div class="mb-4">
              <div class="text-xs font-semibold text-slate-700 mb-2">Options</div>
              <div class="grid grid-cols-3 gap-3">
                ${scenarios.map((s, sIdx) => `
                  <div class="border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition" onclick="selectScenario('${s.label}')">
                    <div class="text-xs font-semibold text-blue-700 mb-1">Scenario ${String.fromCharCode(65 + sIdx)}</div>
                    <div class="text-sm font-medium text-slate-900 mb-2">${s.label}</div>
                    <div class="space-y-1 text-xs text-slate-600">
                      <div>Recovery: <span class="font-semibold text-green-700">${s.recovery}</span></div>
                      <div>Cost: <span class="font-semibold">${s.cost}</span></div>
                      <div>Risk: <span class="font-semibold">${s.risk}</span></div>
                      <div>Complexity: <span class="font-semibold">${s.complexity}</span></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-200">
              <div class="text-xs text-slate-500">
                ${scenarios.length} scenarios available · Best recovery: ${scenarios.reduce((best, s) => { const v = parseInt(s.recovery.replace(/[^0-9]/g, '')); return v > best.v ? {v, l: s.label} : best; }, {v:0, l:''}).l}
              </div>
              <div class="flex gap-2">
                <button onclick="toggleScenarioAnalysis('${focus.program.replace(/[^a-zA-Z0-9]/g, '')}')" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200">
                  Run What-If
                </button>
                <button onclick="enterProgram('${focus.program}', '${focus.site || 'WF'}')" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200">
                  Open Production Plan
                </button>
                <button onclick="selectScenario('${scenarios[1] ? scenarios[1].label : scenarios[0].label}')" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200">
                  Select Scenario
                </button>
                <button onclick="routeDecision('${focus.program}')" class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
                  Route Execution
                </button>
              </div>
            </div>
          </div>
        `}).join('')}
      </div>

      ${focusCards.length === 0 ? `
        <div class="bg-white border-2 border-green-300 rounded-lg p-6 text-center">
          <div class="text-4xl mb-2">✅</div>
          <div class="text-sm font-bold text-green-900 mb-1">All Programs On Track</div>
          <div class="text-xs text-green-700">No urgent decisions needed this week. Continue monitoring for changes.</div>
        </div>
      ` : ''}
    </div>

    <!-- ============================================================ -->
    <!-- SCENARIO ANALYSIS (NEW) -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-purple-200 rounded-xl p-6 mb-4">
      <div class="flex items-center justify-between mb-1">
        <div class="text-lg font-bold text-slate-900">Scenario Analysis</div>
        <span class="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">Interactive</span>
      </div>
      <div class="text-xs text-slate-600 mb-4">${focusCards.length > 0 ? `Active decision: Protect W04 Commit — ${focusCards[0].program}` : 'No active decision selected'}</div>

      <!-- Scenario Comparison Table -->
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left p-3 font-semibold text-slate-700">Scenario</th>
              <th class="text-center p-3 font-semibold text-slate-700">Output Recovery</th>
              <th class="text-center p-3 font-semibold text-slate-700">Cost Impact</th>
              <th class="text-center p-3 font-semibold text-slate-700">Commit Risk</th>
              <th class="text-center p-3 font-semibold text-slate-700">Execution Complexity</th>
              <th class="text-center p-3 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b hover:bg-slate-50 transition">
              <td class="p-3">
                <div class="font-semibold text-slate-900">A. Shift Capacity +1 Line</div>
                <div class="text-xs text-slate-500">Add production line at primary site</div>
              </td>
              <td class="p-3 text-center font-semibold text-green-700">+3,200 units</td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Low</span></td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Medium</span></td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Medium</span></td>
              <td class="p-3 text-center">
                <button onclick="selectScenario('Shift Capacity')" class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">Select</button>
              </td>
            </tr>
            <tr class="border-b hover:bg-slate-50 transition bg-green-50">
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <div class="font-semibold text-slate-900">B. Partial Build (top SKUs)</div>
                  <span class="px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-300">Recommended</span>
                </div>
                <div class="text-xs text-slate-500">Build high-priority SKUs first</div>
              </td>
              <td class="p-3 text-center font-semibold text-green-700">+5,000 units</td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">None</span></td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Low</span></td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Low</span></td>
              <td class="p-3 text-center">
                <button onclick="selectScenario('Partial Build')" class="px-2 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">Select</button>
              </td>
            </tr>
            <tr class="hover:bg-slate-50 transition">
              <td class="p-3">
                <div class="font-semibold text-slate-900">C. Delay Low-Priority SKU</div>
                <div class="text-xs text-slate-500">Defer lower-priority builds to next week</div>
              </td>
              <td class="p-3 text-center font-semibold text-green-700">+7,000 units</td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">None</span></td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Lowest</span></td>
              <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Low</span></td>
              <td class="p-3 text-center">
                <button onclick="selectScenario('Delay SKU')" class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">Select</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- AI Recommendation (Enhanced with reasoning) -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5 mb-4">
        <div class="flex items-start gap-3">
          <span class="text-lg">🤖</span>
          <div class="flex-1">
            <div class="text-xs font-semibold text-blue-800 mb-2">AI Recommendation</div>
            <div class="text-sm text-slate-800 mb-3">Partial build reduces commit risk with minimal operational disruption.</div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div class="bg-white border border-blue-200 rounded-lg p-2.5">
                <div class="text-slate-500 mb-0.5">Recovered Output</div>
                <div class="font-semibold text-green-700">+5,000 units</div>
              </div>
              <div class="bg-white border border-blue-200 rounded-lg p-2.5">
                <div class="text-slate-500 mb-0.5">Cost Impact</div>
                <div class="font-semibold text-slate-900">None</div>
              </div>
              <div class="bg-white border border-blue-200 rounded-lg p-2.5">
                <div class="text-slate-500 mb-0.5">Historical Context</div>
                <div class="font-medium text-slate-700">Similar ramp scenarios show partial build typically restores commit stability within 1 cycle.</div>
              </div>
              <div class="bg-white border border-blue-200 rounded-lg p-2.5">
                <div class="text-slate-500 mb-0.5">Confidence</div>
                <div class="font-semibold text-green-700">High</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2">
        <button onclick="selectScenario('Partial Build')" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200">
          Select Scenario
        </button>
        <button onclick="routeDecision('${focusCards.length > 0 ? focusCards[0].program : 'decision'}')" class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
          Route Execution
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PROGRAM EXECUTION MAP -->
    <!-- ============================================================ -->
    <div class="bg-white border rounded-xl overflow-hidden mb-4">
      <div class="p-4 border-b bg-slate-50">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-700">Program Execution Map — Week ${portfolio.week}</div>
            <div class="text-xs text-slate-500 mt-1">All programs with commit gaps, constraints, and decision routing.</div>
          </div>
          <div class="flex gap-2">
            <button onclick="filterPrograms('at-risk')" class="px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200">
              At-risk only
            </button>
            <button onclick="filterPrograms('ctb')" class="px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200">
              Filter: CTB
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th class="text-left p-3 font-semibold text-slate-700">Program</th>
              <th class="text-right p-3 font-semibold text-slate-700">Commit Gap</th>
              <th class="text-left p-3 font-semibold text-slate-700">Constraint</th>
              <th class="text-left p-3 font-semibold text-slate-700">Decision Needed</th>
              <th class="text-left p-3 font-semibold text-slate-700">Owner</th>
            </tr>
          </thead>
          <tbody>
            ${programs.map(prog => {
              const constraint = extractPrimaryConstraint(prog.topDriver);
              const constraintIcon =
                constraint === 'CTB' ? '📦' :
                constraint === 'Yield' ? '🎯' :
                constraint === 'Capacity' ? '🏭' :
                constraint === 'Shipment' ? '🚚' : '📊';
              const statusDot = prog.commitHealth === 'GREEN' ? '🟢' : prog.commitHealth === 'YELLOW' ? '🟡' : '🔴';

              // Generate decision-needed text based on constraint and health
              const decisionText = prog.commitHealth === 'GREEN' ? 'Monitor — on track' :
                prog.commitHealth === 'RED' ? `Resolve ${constraint} gap — escalate` :
                `Review ${constraint} exposure`;

              return `
              <tr class="border-b hover:bg-blue-50 cursor-pointer transition" onclick="enterProgram('${prog.name}', '${prog.buildSites.split(',')[0].trim()}');">
                <td class="p-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm">${statusDot}</span>
                    <div>
                      <div class="font-semibold text-slate-900">${prog.name}</div>
                      <div class="text-xs text-slate-500">${prog.buildSites}</div>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-right font-semibold text-slate-900">${prog.atRiskUnits > 0 ? prog.atRiskUnits.toLocaleString() : '—'}</td>
                <td class="p-3">
                  <div class="flex items-center gap-1.5">
                    <span>${constraintIcon}</span>
                    <span class="font-medium text-slate-700">${constraint}</span>
                  </div>
                </td>
                <td class="p-3">
                  <span class="text-xs ${prog.commitHealth === 'RED' ? 'text-red-700 font-semibold' : prog.commitHealth === 'YELLOW' ? 'text-yellow-700' : 'text-green-700'}">${decisionText}</span>
                </td>
                <td class="p-3 text-slate-700">${prog.owner}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TOP EXCEPTIONS — EVIDENCE-BACKED ROUTING -->
    <!-- ============================================================ -->
    <div class="bg-white border rounded-xl p-6">
      <div class="text-sm font-semibold mb-2">Top Exceptions — Evidence-Backed Routing</div>
      <div class="text-xs text-slate-500 mb-4">Each exception shows the detected threat, available evidence, evidence status, and execution routing.</div>

      <div class="space-y-4">
        ${topExceptions.map((ex, idx) => {
          const threatenedOutcome = ex.issue.toLowerCase().includes('ctb') || ex.issue.toLowerCase().includes('material') ? 'Commit fulfillment' :
                                    ex.issue.toLowerCase().includes('yield') ? 'Output quality' :
                                    ex.issue.toLowerCase().includes('ship') ? 'Delivery timing' : 'Plan execution';
          const hasEvidence = ex.evidence && ex.evidence.length > 0;
          const evidenceStatus = hasEvidence && ex.evidence.length >= 2 ? 'Validated' : hasEvidence ? 'Partial — needs review' : 'Needs validation';
          const evidenceStatusColor = evidenceStatus === 'Validated' ? 'text-green-700 bg-green-50 border-green-200' : evidenceStatus.includes('Partial') ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-red-700 bg-red-50 border-red-200';

          return `
          <div class="border-2 ${ex.severity === 'HIGH' ? 'border-red-300 bg-red-50' : ex.severity === 'MED' ? 'border-yellow-300 bg-yellow-50' : 'border-blue-300 bg-blue-50'} rounded-lg p-4">
            <!-- Header -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-start gap-2 flex-1">
                <div class="text-base font-bold text-slate-400">#${idx + 1}</div>
                <div class="flex-1">
                  <div class="font-semibold text-sm text-slate-900 mb-1">${ex.program} — ${ex.issue}</div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-xs font-semibold ${ex.severity === 'HIGH' ? 'bg-red-100 text-red-800' : ex.severity === 'MED' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                      ${ex.severity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Structured fields: Exception / Threat / Evidence / Evidence Status / Routing -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div class="bg-white border border-slate-200 rounded p-3">
                <div class="text-xs font-semibold text-slate-500 mb-1">Exception</div>
                <div class="text-xs text-slate-900 font-medium">${ex.decisionNeeded || ex.issue}</div>
              </div>
              <div class="bg-white border border-slate-200 rounded p-3">
                <div class="text-xs font-semibold text-slate-500 mb-1">Threat</div>
                <div class="text-xs text-slate-900">${threatenedOutcome}</div>
              </div>
              <div class="bg-white border border-slate-200 rounded p-3">
                <div class="text-xs font-semibold text-slate-500 mb-1">Evidence</div>
                ${hasEvidence ? `
                  <div class="space-y-0.5">
                    ${ex.evidence.slice(0, 3).map(e => `
                      <div class="text-xs text-slate-700 flex items-center gap-1">
                        <span class="text-green-600">✅</span>
                        <span>${e.split(':')[0] || e}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div class="text-xs text-amber-800">⚠️ No evidence collected</div>
                `}
              </div>
              <div class="bg-white border border-slate-200 rounded p-3">
                <div class="text-xs font-semibold text-slate-500 mb-1">Evidence Status</div>
                <div class="text-xs font-semibold px-2 py-0.5 rounded border inline-block ${evidenceStatusColor}">${evidenceStatus}</div>
              </div>
            </div>

            <!-- Routing + Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-200">
              <div class="text-xs text-slate-600">
                <span class="font-semibold">Routing:</span> ${ex.owner || 'Unassigned'} ·
                <span class="font-semibold ${ex.slaHours && ex.slaHours <= 24 ? 'text-red-600' : 'text-slate-600'}">
                  SLA ${ex.sla || ex.slaHours ? ex.slaHours + 'h' : 'TBD'}
                </span>
              </div>
              <div class="flex gap-2">
                <button onclick="openException('${ex.program}', '${ex.issue}')" class="px-2 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200">
                  Open Evidence
                </button>
                <button onclick="routeDecision('${ex.program}')" class="px-2 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
                  Route Exception
                </button>
              </div>
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// HOME - Delivery Command Center
// ========================================
function renderHome() {
  const demo = getDemo();
  const scenario = getScenario();

  if (!demo || !demo.deliveryCommit) {
    $("content").innerHTML = `<div class="p-4 text-center text-slate-500">No data available for this scenario</div>`;
    return;
  }

  const { deliveryCommit, topDeliveryRisks = [], todaysLoop, pacingGuardrail, kpis } = demo;

  const html = `
    <!-- Scenario Header -->
    <div class="bg-white border rounded-xl p-4">
      <div class="text-sm font-semibold text-slate-900">${scenario.name}</div>
      <div class="text-xs text-slate-600 mt-1">${scenario.description}</div>
    </div>

    <!-- Delivery Commit Hero Card -->
    <div class="bg-white border rounded-xl p-6 ${COMMIT_HEALTH_COLORS[deliveryCommit.commitHealth]} border-2">
      <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">This Week's Delivery Commit</div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div class="text-xs text-slate-600">Week / Product / Factory Site</div>
          <div class="font-semibold text-sm">${deliveryCommit.week} / ${deliveryCommit.product} / ${deliveryCommit.factorySite}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Commit Health</div>
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold">${deliveryCommit.commitHealth}</div>
            <div class="text-xs">${deliveryCommit.commitHealthLabel}</div>
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-600">At-risk Units / Confidence</div>
          <div class="text-2xl font-bold">${deliveryCommit.atRiskUnits.toLocaleString()} <span class="text-sm font-normal">/ ${deliveryCommit.confidence}%</span></div>
        </div>
      </div>

      ${deliveryCommit.recoveryActions && deliveryCommit.recoveryActions.length > 0 ? `
        <div class="border-t pt-4 mt-4">
          <div class="text-xs font-semibold text-slate-700 mb-3">What we need to do (next 48h):</div>
          <div class="space-y-2">
            ${deliveryCommit.recoveryActions.map((action, i) => `
              <div class="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">${action.priority}</div>
                <div class="flex-1">
                  <div class="text-sm font-semibold">${action.action}</div>
                  <div class="text-xs text-slate-600 mt-1">
                    <span class="font-semibold">Owner:</span> ${action.owner}
                    <span class="mx-2">|</span>
                    <span class="font-semibold">SLA:</span> ${action.sla}
                    <span class="mx-2">|</span>
                    <span class="px-2 py-0.5 rounded ${action.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}">${action.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '<div class="text-sm text-slate-600">✓ No recovery actions needed — commit on track</div>'}

      <div class="border-t pt-3 mt-4 text-xs text-slate-600">
        <strong>Next checkpoint:</strong> ${deliveryCommit.nextCheckpoint}
      </div>
    </div>

    <!-- Top Delivery Risks -->
    ${topDeliveryRisks.length > 0 ? `
      <div class="bg-white border rounded-xl p-6">
        <div class="text-sm font-semibold mb-4">Top Delivery Risks (Ranked)</div>
        <div class="space-y-3">
          ${topDeliveryRisks.map((risk, index) => `
            <div class="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer" onclick="openCaseDrawer('${risk.id}')">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-bold text-slate-500">#${index + 1}</span>
                    <span class="text-sm font-semibold">${risk.sku || risk.order} / ${risk.factory} / ${risk.week}</span>
                    <span class="px-2 py-0.5 rounded text-xs ${risk.type === 'LATE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${risk.type}</span>
                  </div>
                  <div class="text-xs text-slate-600 mb-2">
                    <strong>Driver:</strong> ${risk.driver}
                  </div>
                  <div class="text-xs text-slate-600 mb-2">
                    <strong>Impact:</strong> ${risk.impact}
                  </div>
                  <div class="text-xs bg-green-50 border-l-2 border-green-500 p-2 rounded">
                    <strong>Action:</strong> ${risk.action}
                  </div>
                  <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <div><strong>Owner:</strong> ${risk.owner}</div>
                    <div><strong>SLA:</strong> ${risk.sla}</div>
                    <div class="flex items-center gap-1">
                      <span>${ROUTE_ICONS[risk.route]}</span>
                      <span>${risk.route.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold">${risk.score}</div>
                  <div class="text-xs text-slate-500">${risk.confidence}% conf</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Today's Loop -->
    ${todaysLoop ? `
      <div class="bg-white border rounded-xl p-6">
        <div class="text-sm font-semibold mb-4">Today's Loop — End-to-End Case</div>
        <div class="space-y-4">
          <!-- Case Header -->
          <div class="border rounded-lg p-3 bg-slate-50">
            <div class="text-sm font-bold mb-1">${todaysLoop.caseId}</div>
            <div class="text-xs text-slate-600 mb-2">${todaysLoop.deliveryImpact}</div>
            <div class="flex items-center gap-4 text-xs">
              <div><strong>Late Score:</strong> ${todaysLoop.lateScore}</div>
              <div><strong>Excess Score:</strong> ${todaysLoop.excessScore}</div>
              <div><strong>Confidence:</strong> ${todaysLoop.confidence}%</div>
            </div>
          </div>

          <!-- Signals -->
          <div class="border-l-4 border-blue-500 pl-4">
            <div class="text-xs font-semibold text-slate-500 uppercase mb-2">→ SIGNALS</div>
            <ul class="text-xs space-y-1">
              ${todaysLoop.signals.map(s => `<li>• ${s}</li>`).join('')}
            </ul>
          </div>

          <!-- Factory Reality -->
          <div class="border-l-4 border-purple-500 pl-4">
            <div class="text-xs font-semibold text-slate-500 uppercase mb-2">→ FACTORY IMPACT</div>
            <ul class="text-xs space-y-1">
              ${todaysLoop.factoryReality.map(f => `<li>• ${f}</li>`).join('')}
            </ul>
          </div>

          <!-- Decision -->
          <div class="border-l-4 border-orange-500 pl-4">
            <div class="text-xs font-semibold text-slate-500 uppercase mb-2">→ DECISION</div>
            <div class="text-sm font-semibold">Route: ${todaysLoop.decision}</div>
          </div>

          <!-- Actions -->
          <div class="border-l-4 border-green-500 pl-4">
            <div class="text-xs font-semibold text-slate-500 uppercase mb-2">→ ACTIONS</div>
            <ul class="text-xs space-y-1">
              ${todaysLoop.actions.map(a => `<li>• ${a}</li>`).join('')}
            </ul>
          </div>

          <!-- Evidence & Feedback -->
          <div class="flex items-center gap-4">
            <div class="flex-1 border-l-4 border-slate-500 pl-4">
              <div class="text-xs font-semibold text-slate-500 uppercase">→ EVIDENCE PACK</div>
              <div class="text-xs">${todaysLoop.evidencePack}</div>
            </div>
            <div class="flex-1 border-l-4 border-slate-500 pl-4">
              <div class="text-xs font-semibold text-slate-500 uppercase">→ FEEDBACK</div>
              <div class="text-xs">${todaysLoop.feedback}</div>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Pacing Guardrail -->
    ${pacingGuardrail ? `
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div class="text-xs font-semibold text-amber-900 uppercase mb-2">⚠️ Pacing Guardrail (Secondary)</div>
        <div class="text-sm text-amber-900 mb-2">${pacingGuardrail.message}</div>
        <div class="text-xs text-amber-800"><strong>Rule:</strong> ${pacingGuardrail.rule}</div>
      </div>
    ` : ''}

    <!-- Executive KPIs -->
    ${kpis ? `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white border rounded-xl p-4">
          <div class="text-xs text-slate-500 mb-1">Execution Health</div>
          <div class="flex items-center gap-3">
            <div class="text-3xl font-bold">${kpis.executionHealth}</div>
            <span class="px-2 py-1 rounded text-xs ${STATUS_COLORS[kpis.executionHealthStatus]}">${kpis.executionHealthStatus}</span>
          </div>
          <div class="text-xs text-slate-600 mt-2">${kpis.executionHealthDrivers}</div>
        </div>
        <div class="bg-white border rounded-xl p-4">
          <div class="text-xs text-slate-500 mb-1">Inventory & Liability Pressure</div>
          <div class="flex items-center gap-3">
            <div class="text-3xl font-bold">${kpis.inventoryPressure}</div>
            <span class="px-2 py-1 rounded text-xs ${STATUS_COLORS[kpis.inventoryPressureStatus]}">${kpis.inventoryPressureStatus}</span>
          </div>
          <div class="text-xs text-slate-600 mt-2">${kpis.inventoryPressureDrivers}</div>
        </div>
      </div>
    ` : ''}
  `;

  $("content").innerHTML = html;
}

// ========================================
// SIGNALS
// ========================================
function renderSignals() {
  const demo = getDemo();

  if (!demo || !demo.signals) {
    $("content").innerHTML = `<div class="p-4 text-center text-slate-500">No signal data available</div>`;
    return;
  }

  const { signals } = demo;

  const html = `
    <div class="bg-white border rounded-xl p-6">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <div class="text-sm font-semibold mb-2">Signals — Turn factory reality into trusted signals</div>
          <div class="text-xs text-slate-600 mb-4">Convert fragmented planning / factory / material / inventory inputs into trusted signals with freshness, coverage, and confidence labels.</div>
        </div>
        <button onclick="openAIDrawer('signals_ingest')" class="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:from-blue-700 hover:to-purple-700 flex-shrink-0">
          <span>🤖</span>
          <span>AI: Ingest Update</span>
        </button>
      </div>

      <!-- Data Quality Matrix -->
      <div class="mb-6">
        <div class="text-xs font-semibold text-slate-700 mb-3">Data Quality Matrix</div>
        <div class="border rounded-lg overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left p-2 font-semibold">Source</th>
                <th class="text-center p-2 font-semibold">Freshness</th>
                <th class="text-center p-2 font-semibold">Coverage</th>
                <th class="text-center p-2 font-semibold">Trust</th>
              </tr>
            </thead>
            <tbody>
              ${signals.dataQuality.map((dq, i) => `
                <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
                  <td class="p-2">${dq.source}</td>
                  <td class="text-center p-2"><span class="px-2 py-0.5 rounded ${STATUS_COLORS[dq.freshness]}">${dq.freshness}</span></td>
                  <td class="text-center p-2"><span class="px-2 py-0.5 rounded ${STATUS_COLORS[dq.coverage]}">${dq.coverage}</span></td>
                  <td class="text-center p-2"><span class="px-2 py-0.5 rounded ${STATUS_COLORS[dq.trust]}">${dq.trust}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="text-xs text-slate-500 mt-2">Low coverage reduces decision automation. High trust enables auto-routing.</div>
      </div>

      <!-- Event Stream -->
      <div>
        <div class="text-xs font-semibold text-slate-700 mb-3">Event Stream — What changed since last cut (last 24h)</div>
        <div class="space-y-2">
          ${signals.eventStream.map(event => `
            <div class="border rounded-lg p-3 flex items-start gap-3">
              <div class="text-xs font-mono text-slate-500">${event.time}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold ${event.severity === 'HIGH' ? 'bg-red-100 text-red-800' : event.severity === 'MED' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'}">${event.type}</span>
                  <span class="text-xs text-slate-500">${event.severity}</span>
                </div>
                <div class="text-sm">${event.message}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// RISK RADAR
// ========================================
function renderRadar() {
  const demo = getDemo();

  if (!demo || !demo.riskRadar) {
    $("content").innerHTML = `<div class="p-4 text-center text-slate-500">No risk data available</div>`;
    return;
  }

  const { riskRadar, kpis } = demo;

  const html = `
    <div class="bg-white border rounded-xl p-6">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <div class="text-sm font-semibold mb-2">Risk Radar — Rank what threatens commit</div>
          <div class="text-xs text-slate-600 mb-4">Rank delivery risk and overbuild liability with explainable drivers and confidence. Focus on actions that change outcomes, not just metrics.</div>
        </div>
        <button onclick="openAIDrawer('radar_interpret_scores')" class="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-3 py-1.5 hover:from-blue-700 hover:to-purple-700 flex-shrink-0">
          <span>🤖</span>
          <span>AI: Interpret Scores</span>
        </button>
      </div>

      <!-- KPIs -->
      ${kpis ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="border rounded-lg p-4 bg-slate-50">
            <div class="text-xs text-slate-500 mb-1">Execution Health</div>
            <div class="flex items-center gap-3">
              <div class="text-2xl font-bold">${kpis.executionHealth}</div>
              <span class="px-2 py-1 rounded text-xs ${STATUS_COLORS[kpis.executionHealthStatus]}">${kpis.executionHealthStatus}</span>
            </div>
            <div class="text-xs text-slate-600 mt-2">${kpis.executionHealthDrivers}</div>
          </div>
          <div class="border rounded-lg p-4 bg-slate-50">
            <div class="text-xs text-slate-500 mb-1">Inventory Pressure</div>
            <div class="flex items-center gap-3">
              <div class="text-2xl font-bold">${kpis.inventoryPressure}</div>
              <span class="px-2 py-1 rounded text-xs ${STATUS_COLORS[kpis.inventoryPressureStatus]}">${kpis.inventoryPressureStatus}</span>
            </div>
            <div class="text-xs text-slate-600 mt-2">${kpis.inventoryPressureDrivers}</div>
          </div>
        </div>
      ` : ''}

      <!-- Late Risks -->
      <div class="mb-6">
        <div class="text-sm font-semibold mb-3">Late Risks (Delivery)</div>
        <div class="space-y-3">
          ${riskRadar.lateRisks.map(risk => `
            <div class="border rounded-lg p-4 hover:bg-slate-50">
              <div class="flex items-start justify-between gap-4 mb-3 cursor-pointer" onclick="openCaseDrawer('${risk.id}')">
                <div class="flex-1">
                  <div class="text-sm font-semibold mb-2">${risk.object}</div>
                  <div class="text-xs text-slate-600 mb-2">
                    <strong>Drivers:</strong> ${risk.drivers.join(' • ')}
                  </div>
                  <div class="text-xs text-slate-600 mb-2">
                    <strong>Impact:</strong> ${risk.impact}
                  </div>
                  <div class="text-xs bg-green-50 border-l-2 border-green-500 p-2 rounded">
                    <strong>Suggested:</strong> ${risk.recommendedAction}
                  </div>
                  <div class="flex items-center gap-2 mt-2 text-xs">
                    <span>${ROUTE_ICONS[risk.route]}</span>
                    <span>${risk.route.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold">${risk.score}</div>
                  <div class="text-xs text-slate-500">${risk.confidence}% conf</div>
                </div>
              </div>
              <div class="flex items-center gap-2 border-t pt-3">
                <button onclick="event.stopPropagation(); openAIDrawer('radar_explain_risk')" class="flex items-center gap-1 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
                  <span>🤖</span>
                  <span>Explain</span>
                </button>
                <button onclick="event.stopPropagation(); openAIDrawer('radar_explain_risk')" class="flex items-center gap-1 text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700">
                  <span>🤖</span>
                  <span>Action Options</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Excess Risks -->
      ${riskRadar.excessRisks.length > 0 ? `
        <div>
          <div class="text-sm font-semibold mb-3">Excess Risks (Guardrails)</div>
          <div class="space-y-3">
            ${riskRadar.excessRisks.map(risk => `
              <div class="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer bg-amber-50" onclick="openCaseDrawer('${risk.id}')">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="text-sm font-semibold mb-2">${risk.object}</div>
                    <div class="text-xs text-slate-600 mb-2">
                      <strong>Drivers:</strong> ${risk.drivers.join(' • ')}
                    </div>
                    <div class="text-xs text-slate-600 mb-2">
                      <strong>Impact:</strong> ${risk.impact}
                    </div>
                    <div class="text-xs bg-yellow-50 border-l-2 border-yellow-500 p-2 rounded">
                      <strong>Suggested:</strong> ${risk.recommendedAction}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold">${risk.score}</div>
                    <div class="text-xs text-slate-500">${risk.confidence}% conf</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Footer Note -->
      <div class="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
        <strong>Note:</strong> Confidence controls routing: auto-action vs human review vs monitor.
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// ACTIONS — Recovery Playbooks
// ========================================
function renderActions() {
  const demo = getDemo();

  if (!demo || !demo.orchestration) {
    $("content").innerHTML = `<div class="p-4 text-center text-slate-500">No orchestration data available</div>`;
    return;
  }

  const { orchestration } = demo;

  const html = `
    <div class="bg-white border rounded-xl p-6">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <div class="text-sm font-semibold mb-2">Actions — Route Recovery with Owners and SLAs</div>
          <div class="text-xs text-slate-600 mb-4">Turn recommendations into routable workflows with clear thresholds, owners, SLAs, and checkpoints.</div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button onclick="openAIDrawer('actions_generate_playbook')" class="flex items-center gap-1 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
            <span>🤖</span>
            <span>Generate Playbook</span>
          </button>
          <button onclick="openAIDrawer('actions_draft_message')" class="flex items-center gap-1 text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700">
            <span>📝</span>
            <span>Draft Message</span>
          </button>
        </div>
      </div>

      <!-- Routing Rules -->
      <div class="mb-6">
        <div class="text-sm font-semibold mb-3">Routing Rules</div>
        <div class="space-y-2">
          <div class="border rounded-lg p-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">✅</span>
              <span class="text-xs font-semibold">Auto-action</span>
            </div>
            <div class="text-xs text-slate-600">${orchestration.routingRules.autoAction}</div>
          </div>
          <div class="border rounded-lg p-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">👤</span>
              <span class="text-xs font-semibold">Human review</span>
            </div>
            <div class="text-xs text-slate-600">${orchestration.routingRules.humanReview}</div>
          </div>
          <div class="border rounded-lg p-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">👁️</span>
              <span class="text-xs font-semibold">Monitor only</span>
            </div>
            <div class="text-xs text-slate-600">${orchestration.routingRules.monitor}</div>
          </div>
        </div>
      </div>

      <!-- Playbook Library -->
      <div>
        <div class="text-sm font-semibold mb-3">Playbook Library</div>
        <div class="space-y-3">
          ${orchestration.playbooks.map(pb => `
            <div class="border rounded-lg p-4">
              <div class="text-sm font-semibold mb-2">${pb.name}</div>
              <div class="text-xs text-slate-600 mb-3"><strong>When:</strong> ${pb.trigger}</div>
              <div class="space-y-1">
                ${pb.steps.map((step, i) => `
                  <div class="flex items-start gap-2 text-xs">
                    <span class="font-semibold text-slate-500">Step ${i + 1}:</span>
                    <span>${step}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// REPORTS
// ========================================
function renderReports() {
  const html = `
    <div class="bg-white border rounded-xl p-6">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <div class="text-sm font-semibold mb-2">Reports — One-click Briefings for Leadership</div>
          <div class="text-xs text-slate-600 mb-4">Generate decision briefings and evidence packs. Capture what we decided, why, and what happened next.</div>
        </div>
        <button onclick="openAIDrawer('reports_exec_email')" class="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:from-blue-700 hover:to-purple-700 flex-shrink-0">
          <span>🤖</span>
          <span>AI: Generate Exec Email</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Template 1 -->
        <div class="border rounded-lg p-4 hover:bg-slate-50">
          <div class="text-sm font-semibold mb-2">📄 Weekly Factory Execution Brief</div>
          <div class="text-xs text-slate-600 mb-4">Factory snapshot + pacing recommendation + top risks + actions</div>
          <div class="flex gap-2">
            <button onclick="alert('Preview feature coming soon')" class="flex-1 text-xs border rounded-lg px-3 py-2 hover:bg-slate-100">Preview</button>
            <button onclick="alert('Download feature coming soon')" class="flex-1 text-xs bg-slate-900 text-white rounded-lg px-3 py-2 hover:bg-slate-800">Download PDF</button>
          </div>
        </div>

        <!-- Template 2 -->
        <div class="border rounded-lg p-4 hover:bg-slate-50">
          <div class="text-sm font-semibold mb-2">⚠️ Exception Report — Top 5 Risks</div>
          <div class="text-xs text-slate-600 mb-4">Late + excess risks ranked, with drivers and owners</div>
          <div class="flex gap-2">
            <button onclick="alert('Preview feature coming soon')" class="flex-1 text-xs border rounded-lg px-3 py-2 hover:bg-slate-100">Preview</button>
            <button onclick="alert('Download feature coming soon')" class="flex-1 text-xs bg-slate-900 text-white rounded-lg px-3 py-2 hover:bg-slate-800">Download PDF</button>
          </div>
        </div>

        <!-- Template 3 -->
        <div class="border rounded-lg p-4 hover:bg-slate-50">
          <div class="text-sm font-semibold mb-2">💰 Forecast Downside Impact</div>
          <div class="text-xs text-slate-600 mb-4">Overbuild exposure (FG/WIP/components) + recommended slow-down plan</div>
          <div class="flex gap-2">
            <button onclick="alert('Preview feature coming soon')" class="flex-1 text-xs border rounded-lg px-3 py-2 hover:bg-slate-100">Preview</button>
            <button onclick="alert('Download feature coming soon')" class="flex-1 text-xs bg-slate-900 text-white rounded-lg px-3 py-2 hover:bg-slate-800">Download PDF</button>
          </div>
        </div>
      </div>

      <div class="mt-6 p-4 bg-slate-50 rounded-lg text-xs text-slate-600">
        <strong>Demo mode:</strong> Reports are generated from mocked data for illustration.
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// CASE DRAWER & REPORT FUNCTIONS
// ========================================

// Case Drawer Functions
function openCaseDrawer(riskId) {
  const demo = getDemo();

  // Find risk from all sources
  let risk = null;
  if (demo.topDeliveryRisks) {
    risk = demo.topDeliveryRisks.find(r => r.id === riskId);
  }
  if (!risk && demo.riskRadar) {
    risk = [...(demo.riskRadar.lateRisks || []), ...(demo.riskRadar.excessRisks || [])].find(r => r.id === riskId);
  }

  if (!risk) return;

  STATE.selectedRiskId = riskId;
  const icon = ROUTE_ICONS[risk.route] || "•";

  const drawerHtml = `
    <div class="space-y-4">
      <!-- Snapshot -->
      <div class="border rounded-xl p-3 bg-gradient-to-br from-blue-50 to-white">
        <div class="text-xs text-slate-500 mb-2">SNAPSHOT</div>
        <div class="font-bold text-lg mb-2">${risk.sku || risk.object || risk.id}</div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div><div class="text-xs text-slate-500">Score</div><div class="text-xl font-bold">${risk.score}</div></div>
          <div><div class="text-xs text-slate-500">Confidence</div><div class="text-xl font-bold">${risk.confidence}%</div></div>
          <div><div class="text-xs text-slate-500">Route</div><div class="text-2xl">${icon}</div></div>
        </div>
        <div class="mt-2 text-xs text-slate-600"><span class="font-semibold">Impact:</span> ${risk.impact}</div>
      </div>

      <!-- Driver -->
      <div class="border rounded-xl p-3">
        <div class="text-xs font-semibold text-slate-500 mb-2">→ DRIVER</div>
        <div class="text-xs p-2 bg-slate-50 rounded border-l-2 border-blue-500">${risk.driver}</div>
      </div>

      <!-- Recommended Action -->
      <div class="border rounded-xl p-3 bg-green-50">
        <div class="text-xs font-semibold text-slate-500 mb-2">→ RECOMMENDED ACTION</div>
        <div class="text-sm font-semibold mb-2">${risk.action || risk.recommendedAction}</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><span class="text-slate-500">Owner:</span> ${risk.owner || 'China Delivery'}</div>
          <div><span class="text-slate-500">SLA:</span> ${risk.sla || '24-48h'}</div>
        </div>
      </div>

      <!-- Evidence Pack -->
      <div class="border rounded-xl p-3">
        <div class="text-xs font-semibold text-slate-500 mb-2">→ EVIDENCE PACK</div>
        <button onclick="generateReport('${risk.id}')" class="w-full text-sm border rounded-lg px-3 py-2 hover:bg-slate-50">📄 Generate Report</button>
      </div>

      <!-- Feedback -->
      <div class="border rounded-xl p-3">
        <div class="text-xs font-semibold text-slate-500 mb-2">→ FEEDBACK</div>
        <div class="text-xs text-slate-600 mb-2">Was this recommendation effective?</div>
        <div class="grid grid-cols-2 gap-2">
          <button class="text-sm border rounded-lg px-3 py-2 hover:bg-green-50" onclick="submitFeedback('${risk.id}', 'effective')">✓ Effective</button>
          <button class="text-sm border rounded-lg px-3 py-2 hover:bg-red-50" onclick="submitFeedback('${risk.id}', 'ineffective')">✗ Ineffective</button>
        </div>
        <div class="mt-2 text-xs text-slate-500">Status: Pending</div>
      </div>
    </div>
  `;

  document.getElementById('caseDrawerBody').innerHTML = drawerHtml;
  document.getElementById('caseDrawer').classList.remove('hidden');
  document.getElementById('caseDrawerBackdrop').classList.remove('hidden');
}

function closeCaseDrawer() {
  document.getElementById('caseDrawer').classList.add('hidden');
  document.getElementById('caseDrawerBackdrop').classList.add('hidden');
  STATE.selectedRiskId = null;
}

function submitFeedback(riskId, type) {
  alert(`Feedback "${type}" submitted for case ${riskId}. This would update the learning model.`);
  closeCaseDrawer();
}

// Report Generation with Delivery-first Weekly Report Style
function generateReport(riskId) {
  const demo = getDemo();

  // Find risk from all sources
  let risk = null;
  if (demo.topDeliveryRisks) {
    risk = demo.topDeliveryRisks.find(r => r.id === riskId);
  }
  if (!risk && demo.riskRadar) {
    risk = [...(demo.riskRadar.lateRisks || []), ...(demo.riskRadar.excessRisks || [])].find(r => r.id === riskId);
  }

  if (!risk) return;

  const scenario = getScenario();
  const timestamp = new Date().toISOString().split('T')[0];

  const reportHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:8.5in;margin:0 auto;padding:0.75in;background:white;color:#1e293b;line-height:1.5}
.header{border-bottom:3px solid #0f172a;padding-bottom:12px;margin-bottom:24px}
.header h1{font-size:18px;font-weight:700;margin:0 0 4px 0;color:#0f172a}
.header .meta{font-size:11px;color:#64748b}
.section{margin-bottom:20px;page-break-inside:avoid}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.section-content{font-size:12px;color:#334155}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
.metric-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
.metric-label{font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
.metric-value{font-size:24px;font-weight:700;color:#0f172a}
.action-box{background:#f0fdf4;border-left:4px solid #22c55e;padding:12px;margin:8px 0;border-radius:4px}
.action-box strong{color:#166534}
ul{margin:8px 0;padding-left:20px}
li{margin:4px 0;font-size:12px}
.footer{margin-top:32px;padding-top:16px;border-top:2px solid #e2e8f0;font-size:10px;color:#94a3b8}
.status-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;background:#fef3c7;color:#92400e}
</style></head><body>
<div class="header">
<h1>🏭 W04 Commit Protection Brief — ${risk.factory} / ${STATE.filters.product}</h1>
<div class="meta"><strong>Case ID:</strong> ${risk.id} | <strong>Generated:</strong> ${timestamp} | <strong>Scenario:</strong> ${scenario.name}</div>
</div>
<div class="section"><div class="section-title">Situation</div><div class="section-content"><strong>${risk.sku || risk.object}</strong> — Current commit is at risk. Requires <span class="status-badge">${risk.route.replace(/_/g, ' ')}</span> routing.</div></div>
<div class="section"><div class="section-title">Driver</div><div class="section-content">${risk.driver}</div></div>
<div class="section"><div class="section-title">Impact</div><div class="section-content">${risk.impact}</div></div>
<div class="section"><div class="section-title">Risk Assessment</div>
<div class="metrics">
<div class="metric-card"><div class="metric-label">Risk Score</div><div class="metric-value">${risk.score}</div></div>
<div class="metric-card"><div class="metric-label">Confidence</div><div class="metric-value">${risk.confidence}%</div></div>
<div class="metric-card"><div class="metric-label">Route</div><div class="metric-value" style="font-size:20px;">${ROUTE_ICONS[risk.route]}</div></div>
</div></div>
<div class="section"><div class="section-title">Decision & Route</div>
<div class="section-content"><strong>Route:</strong> ${risk.route.replace(/_/g, ' ')}<br><strong>Reason:</strong> ${risk.routeReason || 'Policy threshold'}</div></div>
<div class="section"><div class="section-title">Recommended Actions</div>
<div class="action-box"><strong>Action:</strong> ${risk.action || risk.recommendedAction}<br>
<span style="font-size:11px;color:#64748b;">Owner: ${risk.owner || 'China Delivery'} | SLA: ${risk.sla || '24-48h'}</span></div>
</div>
<div class="footer">
<div><strong>Decision Log:</strong> Pending review by China Delivery Team</div>
<div><strong>Feedback Status:</strong> Awaiting outcome validation within 7 days</div>
<div style="margin-top:8px;"><em>Generated by FDOS — Factory Delivery Orchestration System | Confidential & Internal Use Only</em></div>
</div></body></html>`;

  document.getElementById('reportPreview').innerHTML = reportHtml;
  document.getElementById('reportModal').classList.remove('hidden');
  document.getElementById('reportModalBackdrop').classList.remove('hidden');
  window._currentReportHtml = reportHtml;
  window._currentReportFilename = `SCDO_W04_Commit_Brief_${risk.id}_${timestamp}`;
}

function downloadHTMLReport() {
  const blob = new Blob([window._currentReportHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${window._currentReportFilename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPDFReport() {
  const element = document.getElementById('reportPreview');
  const opt = {
    margin: 0.5,
    filename: `${window._currentReportFilename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

function closeReportModal() {
  document.getElementById('reportModal').classList.add('hidden');
  document.getElementById('reportModalBackdrop').classList.add('hidden');
}

// Global exports
window.openCaseDrawer = openCaseDrawer;
window.closeCaseDrawer = closeCaseDrawer;
window.generateReport = generateReport;
window.submitFeedback = submitFeedback;
window.downloadHTMLReport = downloadHTMLReport;
window.downloadPDFReport = downloadPDFReport;
window.closeReportModal = closeReportModal;

// Initialize report modal buttons after DOM loads
(function() {
  const initReportButtons = () => {
    const downloadHTMLBtn = document.getElementById('downloadHTMLBtn');
    const downloadPDFBtn = document.getElementById('downloadPDFBtn');
    const closeReportModalBtn = document.getElementById('closeReportModalBtn');

    if (downloadHTMLBtn) {
      downloadHTMLBtn.addEventListener('click', downloadHTMLReport);
      downloadPDFBtn.addEventListener('click', downloadPDFReport);
      closeReportModalBtn.addEventListener('click', closeReportModal);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportButtons);
  } else {
    initReportButtons();
  }
})();

// Initialize
(async function() {
  console.log('[App Init] Starting initialization...');
  console.log('[App Init] document.readyState:', document.readyState);
  console.log('[App Init] productFilter element exists at start?', !!document.getElementById('productFilter'));

  await loadData();

  // Load production plan configuration from localStorage
  initializeProductionPlanConfig();

  setMeta();

  console.log('[App Init] About to call initControls()');
  console.log('[App Init] productFilter element exists before initControls?', !!document.getElementById('productFilter'));

  initControls();

  // Initialize router
  if (window.Router) {
    window.Router.init((route) => {
      console.log('[App] Route changed:', route);
      console.log('[App] Before update - STATE.filters.product:', STATE.filters.product);

      // Update STATE from route
      STATE.activeView = route.view;

      // If navigating to program workspace, restore last sub-view from localStorage
      const programWorkspaceViews = ['program', 'home', 'delivery', 'command-center'];
      if (programWorkspaceViews.includes(route.view)) {
        try {
          const lastView = localStorage.getItem('lastActiveView');
          const programWorkspaceSubViews = ['production-plan', 'mfg-leadtime', 'bto-cto-leadtime',
                                             'fv-management', 'labor-fulfillment', 'campus-readiness',
                                             'command-center', 'delivery'];
          if (lastView && programWorkspaceSubViews.includes(lastView)) {
            console.log('[App] Restoring last active sub-view:', lastView);
            STATE.activeView = lastView;
          }
        } catch (error) {
          console.error('[App] Error restoring last view:', error);
        }
      }

      // Update filters if provided in URL
      if (route.product) {
        console.log('[App] Updating STATE.filters.product from route:', route.product);
        STATE.filters.product = route.product;
      }
      if (route.site) {
        STATE.filters.factorySite = route.site;
      }
      if (route.week) {
        STATE.filters.week = route.week;
      }

      console.log('[App] After update - STATE.filters.product:', STATE.filters.product);

      // Sync filter dropdowns with STATE
      const productFilter = $("productFilter");
      const siteFilter = $("factorySiteFilter");
      const weekFilter = $("weekFilter");

      if (productFilter && STATE.filters.product) {
        console.log('[App] Syncing productFilter.value to:', STATE.filters.product);
        productFilter.value = STATE.filters.product;

        // Force update selected state on all options
        Array.from(productFilter.options).forEach(opt => {
          opt.selected = (opt.value === STATE.filters.product);
        });

        console.log('[App] After sync, productFilter.value is:', productFilter.value);
        console.log('[App] Selected option:', Array.from(productFilter.options).find(o => o.selected));
      }
      if (siteFilter && STATE.filters.factorySite) {
        siteFilter.value = STATE.filters.factorySite;
      }
      if (weekFilter && STATE.filters.week) {
        weekFilter.value = STATE.filters.week;
      }

      // Render the view
      render();
    });
  } else {
    // Fallback if router not loaded
    console.warn('[App] Router not loaded, using default initialization');

    // Try to restore last active view
    try {
      const lastView = localStorage.getItem('lastActiveView');
      if (lastView) {
        console.log('[App] Restoring last active view from localStorage:', lastView);
        STATE.activeView = lastView;
      }
    } catch (error) {
      console.error('[App] Error restoring last view:', error);
    }

    render();
  }
})();
// Home v3 - Delivery Command Center
// This is the new renderHome function with v3 architecture

function renderHomeV3() {
  const demo = getDemo();
  const scenario = getScenario();

  if (!demo || !demo.deliveryCommit) {
    $("content").innerHTML = `<div class="p-4 text-center text-slate-500">No data available for this scenario</div>`;
    return;
  }

  const { deliveryCommit, topDeliveryRisks = [], todaysLoop, pacingGuardrail, kpis } = demo;
  const isSimulation = STATE.viewMode === "simulation";
  const simResults = STATE.simulationResults;

  const html = `
    ${isSimulation ? `
      <!-- Simulation Mode Banner -->
      <div class="bg-blue-600 text-white border rounded-xl p-3 mb-4">
        <div class="flex items-center gap-2">
          <div class="text-lg">🔬</div>
          <div class="flex-1">
            <div class="text-sm font-bold">Simulation Mode</div>
            <div class="text-xs opacity-90">You are viewing a what-if scenario. No operational actions are executed.</div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Hero Banner -->
    <div class="bg-gradient-to-r from-blue-50 to-slate-50 border rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-bold text-slate-900">Scenario Focus: Protect W04 Commit (Delivery Risk + Yield Drift)</div>
          <div class="text-xs text-slate-600 mt-1">Material constraint + yield drift are pressuring commit confidence. Prioritize actions that change outcomes within 48 hours.</div>
        </div>
        <div class="px-3 py-1.5 bg-white border rounded-lg text-xs font-semibold">
          <span class="text-slate-500">Scope:</span> ${STATE.filters.product} · ${STATE.filters.factorySite} · ${STATE.filters.week}
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- COMPONENT 1: Executive Scorecard (NEW) -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-6 mb-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-sm font-bold text-slate-900">Executive Scorecard</div>
          <div class="text-xs text-slate-600">This week's outcome metrics with data confidence and system routing</div>
        </div>
        <div class="text-xs text-slate-500">
          Updated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Metric</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">This Week</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">vs Target</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700">Confidence</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">System Routing</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <!-- Row 1: Plan Achievement -->
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">Plan Achievement</td>
              <td class="px-4 py-3 text-right font-bold text-slate-900">92%</td>
              <td class="px-4 py-3 text-right">
                <span class="inline-block px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">-8%</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded font-semibold">🟢 HIGH</span>
              </td>
              <td class="px-4 py-3 text-slate-700">
                <div class="font-semibold">Review needed within 48h</div>
                <div class="text-slate-600 mt-0.5">Output gap 11.6k units → check yield + capacity</div>
              </td>
            </tr>

            <!-- Row 2: Commit Fulfillment -->
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">Commit Fulfillment</td>
              <td class="px-4 py-3 text-right font-bold text-slate-900">95.5%</td>
              <td class="px-4 py-3 text-right">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">-4.5%</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded font-semibold">🟢 HIGH</span>
              </td>
              <td class="px-4 py-3 text-slate-700">
                <div class="font-semibold">Monitor shipment pacing</div>
                <div class="text-slate-600 mt-0.5">Shipment lag +1.5d → expedite packing if needed</div>
              </td>
            </tr>

            <!-- Row 3: Cost Risk -->
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">Cost Risk</td>
              <td class="px-4 py-3 text-right font-bold text-slate-900">$45k</td>
              <td class="px-4 py-3 text-right">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">+12%</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded font-semibold">🟡 MED</span>
              </td>
              <td class="px-4 py-3 text-slate-700">
                <div class="font-semibold">Track but no immediate action</div>
                <div class="text-slate-600 mt-0.5">Overtime + rework costs elevated, watch weekly trend</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-xs text-blue-900">
        <strong>How to read:</strong> "System Routing" shows what decision/action the system recommends based on the metric state + confidence level. Red/yellow status triggers routing, not ranking.
      </div>
    </div>

    <!-- Section A: Product Snapshot (NEW) -->
    <div class="bg-white border rounded-xl p-6 mb-4">
      <div class="text-sm font-semibold mb-2">Product Snapshot — Manufacturing Footprint</div>
      <div class="text-xs text-slate-600 mb-4">A stable view of where and how this product is built. Use this to sanity-check capacity and pacing decisions.</div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div class="text-xs text-slate-500">FY Volume (EoY)</div>
          <div class="font-semibold text-lg">2.8M units</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">EOM (End of Manufacturing)</div>
          <div class="font-semibold text-lg">2026-11</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">Primary Build Sites</div>
          <div class="font-semibold text-sm">WF (CN), VN-02 (VN)</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">Weekly Capacity (Nominal)</div>
          <div class="font-semibold text-lg">150k / week</div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-slate-50 rounded-lg text-xs">
        <div class="font-semibold mb-2">Lines & UPH</div>
        <div class="grid grid-cols-2 gap-2">
          <div>WF (CN): 3 lines · 110–135 UPH</div>
          <div>VN-02 (VN): 2 lines · 95–120 UPH</div>
        </div>
      </div>

      <div class="mt-3 p-3 bg-amber-50 border-l-2 border-amber-400 rounded text-xs">
        <strong>Notable Constraints:</strong> Test lane shared across SKUs · IC-77 is single-source · Holiday labor availability impacts W05–W07
      </div>

      <div class="text-xs text-slate-500 mt-3">
        Footprint metrics change infrequently; weekly execution signals update daily.
      </div>
    </div>

    <!-- Section B: Weekly Command Summary -->

    <!-- B1: Two Hero KPIs (MOVED UP) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-white border rounded-xl p-4">
        <div class="text-xs text-slate-500 mb-1">Execution Health</div>
        <div class="flex items-center gap-3">
          <div class="text-3xl font-bold">${kpis?.executionHealth || 62}</div>
          <span class="px-2 py-1 rounded text-xs ${STATUS_COLORS[kpis?.executionHealthStatus || 'YELLOW']}">${kpis?.executionHealthStatus || 'YELLOW'}</span>
        </div>
        <div class="text-xs text-slate-600 mt-2">${kpis?.executionHealthDrivers || 'Yield drift at Test + WIP building above baseline.'}</div>
        ${STATE.prdMode ? '<div class="text-xs text-slate-500 mt-2 italic">Composite score from yield stability, throughput vs plan, rework load, and critical process downtime.</div>' : ''}
      </div>
      <div class="bg-white border rounded-xl p-4">
        <div class="text-xs text-slate-500 mb-1">Inventory & Liability Pressure</div>
        <div class="flex items-center gap-3">
          <div class="text-3xl font-bold">${kpis?.inventoryPressure || 71}</div>
          <span class="px-2 py-1 rounded text-xs ${STATUS_COLORS[kpis?.inventoryPressureStatus || 'YELLOW']}">${kpis?.inventoryPressureStatus || 'YELLOW'}</span>
        </div>
        <div class="text-xs text-slate-600 mt-2">${kpis?.inventoryPressureDrivers || 'FG above target + forecast down-rev risk; watch WIP exposure.'}</div>
        ${STATE.prdMode ? '<div class="text-xs text-slate-500 mt-2 italic">Composite score from FG/WIP/transit exposure, demand signals, and cancel/freeze risk vs manufacturing lead time.</div>' : ''}
      </div>
    </div>

    <!-- B2: This Week's Delivery Commit (Command Card) -->
    <div class="bg-white border rounded-xl p-6 ${COMMIT_HEALTH_COLORS[deliveryCommit.commitHealth]} border-2 mb-4">
      <div class="flex items-center justify-between mb-4">
        <div class="text-sm font-semibold">This Week's Delivery Commit</div>
        <div class="flex items-center gap-2">
          <button onclick="openAIDrawer('home_diagnose_commit', {product: '${deliveryCommit.product}'})" class="flex items-center gap-1 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700">
            <span>🤖</span>
            <span>Diagnose</span>
          </button>
          <button onclick="openAIDrawer('home_recovery_plan')" class="flex items-center gap-1 text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700">
            <span>🤖</span>
            <span>Generate Plan</span>
          </button>
          <button onclick="openAIDrawer('home_leadership_ask', {product: '${deliveryCommit.product}'})" class="flex items-center gap-1 text-xs bg-purple-600 text-white rounded-lg px-3 py-1.5 hover:bg-purple-700">
            <span>📝</span>
            <span>Leadership Ask</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div class="text-xs text-slate-600">Week / Product / Factory Site</div>
          <div class="font-semibold text-sm">${deliveryCommit.week} / ${deliveryCommit.product} / ${deliveryCommit.factorySite}</div>
        </div>
        <div>
          <div class="text-xs text-slate-600">Commit Health</div>
          <div class="flex items-center gap-2">
            <div class="text-2xl font-bold">${deliveryCommit.commitHealth}</div>
            <div class="text-xs">${deliveryCommit.commitHealthLabel}</div>
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-600">At-risk Units / Confidence</div>
          <div class="text-2xl font-bold">${deliveryCommit.atRiskUnits.toLocaleString()} <span class="text-sm font-normal">/ ${deliveryCommit.confidence}%</span></div>
        </div>
      </div>

      ${deliveryCommit.recoveryActions && deliveryCommit.recoveryActions.length > 0 ? `
        <div class="border-t pt-4 mt-4">
          <div class="text-xs font-semibold text-slate-700 mb-3">Next 48 Hours — Actions That Move the Commit</div>
          <div class="space-y-2">
            ${deliveryCommit.recoveryActions.map((action, i) => `
              <div class="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">${action.priority}</div>
                <div class="flex-1">
                  <div class="text-sm font-semibold">${action.action}</div>
                  <div class="text-xs text-slate-600 mt-1">
                    <span class="font-semibold">Owner:</span> ${action.owner}
                    <span class="mx-2">|</span>
                    <span class="font-semibold">SLA:</span> ${action.sla}
                    <span class="mx-2">|</span>
                    <span class="px-2 py-0.5 rounded ${action.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}">${action.status.replace('_', ' ')}</span>
                  </div>
                  <div class="text-xs text-green-600 mt-1">
                    <strong>Expected impact:</strong> ${i === 0 ? '+6–10 pts confidence' : i === 1 ? '-2–3 days schedule drift risk' : '-3.5k at-risk units'}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '<div class="text-sm text-slate-600">✓ No recovery actions needed — commit on track</div>'}

      <div class="border-t pt-3 mt-4 text-xs text-slate-600">
        <strong>Next checkpoint:</strong> ${deliveryCommit.nextCheckpoint}
      </div>
    </div>

    <!-- Section C: Top Delivery Risks (Ranked) -->
    ${topDeliveryRisks.length > 0 ? `
      <div class="bg-white border rounded-xl p-6 mb-4">
        <div class="text-sm font-semibold mb-2">Top Risks (Ranked by Impact × Confidence)</div>
        <div class="text-xs text-slate-600 mb-4">Focus on risks that can break commit or create liability. Each card links to the drivers and recommended routing.</div>

        <div class="space-y-3">
          ${topDeliveryRisks.map((risk, index) => `
            <div class="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer" onclick="openCaseDrawer('${risk.id}')">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-bold text-slate-500">#${index + 1}</span>
                    <span class="text-sm font-semibold">${risk.sku || risk.order} / ${risk.factory} / ${risk.week}</span>
                    <span class="px-2 py-0.5 rounded text-xs ${risk.type === 'LATE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${risk.type}</span>
                  </div>
                  <div class="text-xs text-slate-600 mb-1">
                    <strong>Drivers:</strong> ${risk.driver}
                  </div>
                  <div class="text-xs text-slate-600 mb-2">
                    <strong>Impact:</strong> ${risk.impact}
                  </div>
                  <div class="text-xs bg-green-50 border-l-2 border-green-500 p-2 rounded mb-2">
                    <strong>Suggested:</strong> ${risk.action}
                  </div>
                  <div class="text-xs bg-blue-50 p-2 rounded mb-2">
                    <strong>Why it matters:</strong> ${index === 0 ? 'This is the primary constraint driving commit confidence below GREEN.' : index === 1 ? 'A preventable schedule slip with clear operational levers.' : 'Avoid solving W04 late risk by creating W05+ inventory liability.'}
                  </div>
                  <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <div><strong>Owner:</strong> ${risk.owner}</div>
                    <div><strong>SLA:</strong> ${risk.sla}</div>
                    <div class="flex items-center gap-1">
                      <span>${ROUTE_ICONS[risk.route]}</span>
                      <span>${risk.route.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold">${risk.score}</div>
                  <div class="text-xs text-slate-500">${risk.confidence}% conf</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Section D: What-if Simulation (NEW) -->
    ${isSimulation ? `
      <div class="bg-white border rounded-xl p-6 mb-4">
        <div class="text-sm font-semibold mb-2">What-if Simulation — Decision Sandbox</div>
        <div class="text-xs text-slate-600 mb-4">Factory execution is not static. Simulation helps the team test trade-offs (commit vs cost vs liability) before changing pacing.</div>

        ${simResults ? `
          <!-- Simulation Results -->
          <div class="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-4 mb-4">
            <div class="text-xs font-semibold text-slate-700 mb-3">Outcome Comparison (Before → After)</div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div class="text-xs text-slate-500">Commit confidence</div>
                <div class="font-semibold">${simResults.before.confidence}% → <span class="text-red-600">${simResults.after.confidence}%</span></div>
              </div>
              <div>
                <div class="text-xs text-slate-500">At-risk units</div>
                <div class="font-semibold">${simResults.before.atRiskUnits.toLocaleString()} → <span class="text-red-600">${simResults.after.atRiskUnits.toLocaleString()}</span></div>
              </div>
              ${simResults.after.expediteCost ? `
                <div>
                  <div class="text-xs text-slate-500">Expected expedite cost</div>
                  <div class="font-semibold text-amber-600">+$${(simResults.after.expediteCost / 1000).toFixed(0)}k</div>
                </div>
              ` : ''}
              <div>
                <div class="text-xs text-slate-500">Liability pressure</div>
                <div class="font-semibold">${simResults.before.liabilityPressure} → <span class="${simResults.after.liabilityPressure === 'RED' ? 'text-red-600' : 'text-yellow-600'}">${simResults.after.liabilityPressure}</span></div>
              </div>
            </div>

            <div class="bg-white border-l-4 border-green-500 p-3 rounded">
              <div class="text-xs font-semibold text-slate-700 mb-1">Recommendation</div>
              <div class="text-xs text-slate-600">${simResults.recommendation}</div>
            </div>
          </div>

          <div class="flex gap-2">
            <button onclick="openAIDrawer('simulation_explain_tradeoffs')" class="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:from-blue-700 hover:to-purple-700">
              <span>🤖</span>
              <span>AI: Explain Trade-offs</span>
            </button>
            <button onclick="alert('Demo: Would update 48-hour action list based on simulation results')" class="text-sm bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700">Apply to Recovery Plan (Demo)</button>
            <button onclick="STATE.simulationResults = null; render();" class="text-sm border rounded-lg px-4 py-2 hover:bg-slate-50">Reset</button>
          </div>

          <div class="text-xs text-slate-500 mt-3">
            <strong>Demo note:</strong> Numbers are mocked for illustration; the goal is to show decision flow, not model accuracy.
          </div>
        ` : `
          <div class="text-xs text-slate-600 mb-4">
            <strong>Preset selected:</strong> ${$("presetSelect")?.value || 'None'}
          </div>
          <div class="text-sm text-slate-500 text-center py-8">
            Click "Run Simulation" in the top filter bar to test this scenario's impact.
          </div>
        `}
      </div>
    ` : ''}

    <!-- Section E: Case Trace (Collapsible, replaces Today's Loop) -->
    ${todaysLoop ? `
      <details class="bg-white border rounded-xl overflow-hidden mb-4">
        <summary class="p-4 cursor-pointer hover:bg-slate-50">
          <div class="text-sm font-semibold">Case Trace — Why this routed to Human Review</div>
          <div class="text-xs text-slate-500 mt-1">Signals → Drivers → Decision → Actions → Evidence</div>
        </summary>
        <div class="p-4 border-t space-y-4">
          <!-- Case Header -->
          <div class="border rounded-lg p-3 bg-slate-50">
            <div class="text-sm font-bold mb-1">${todaysLoop.caseId}</div>
            <div class="text-xs text-slate-600 mb-2">${todaysLoop.deliveryImpact}</div>
            <div class="flex items-center gap-4 text-xs">
              <div><strong>Late Score:</strong> ${todaysLoop.lateScore}</div>
              <div><strong>Excess Score:</strong> ${todaysLoop.excessScore}</div>
              <div><strong>Confidence:</strong> ${todaysLoop.confidence}%</div>
            </div>
          </div>

          <!-- Signals (Latest) -->
          <div class="border-l-4 border-blue-500 pl-4">
            <div class="text-xs font-semibold text-slate-700 uppercase mb-2">Signals (Latest)</div>
            <ul class="text-xs space-y-1">
              ${todaysLoop.signals.map(s => `<li>• ${s}</li>`).join('')}
            </ul>
          </div>

          <!-- Factory Impact -->
          <div class="border-l-4 border-purple-500 pl-4">
            <div class="text-xs font-semibold text-slate-700 uppercase mb-2">Factory Impact</div>
            <ul class="text-xs space-y-1">
              ${todaysLoop.factoryReality.map(f => `<li>• ${f}</li>`).join('')}
            </ul>
          </div>

          <!-- Decision -->
          <div class="border-l-4 border-orange-500 pl-4">
            <div class="text-xs font-semibold text-slate-700 uppercase mb-2">Decision</div>
            <div class="text-sm font-semibold">Route: ${todaysLoop.decision}</div>
          </div>

          <!-- Actions -->
          <div class="border-l-4 border-green-500 pl-4">
            <div class="text-xs font-semibold text-slate-700 uppercase mb-2">Actions</div>
            <ul class="text-xs space-y-1">
              ${todaysLoop.actions.map(a => `<li>• ${a}</li>`).join('')}
            </ul>
          </div>

          <!-- Evidence & Feedback -->
          <div class="grid grid-cols-2 gap-4">
            <div class="border-l-4 border-slate-500 pl-4">
              <div class="text-xs font-semibold text-slate-700 uppercase">Evidence Pack</div>
              <div class="text-xs">${todaysLoop.evidencePack}</div>
            </div>
            <div class="border-l-4 border-slate-500 pl-4">
              <div class="text-xs font-semibold text-slate-700 uppercase">Feedback</div>
              <div class="text-xs">${todaysLoop.feedback}</div>
            </div>
          </div>
        </div>
      </details>
    ` : ''}

    <!-- Pacing Guardrail -->
    ${pacingGuardrail ? `
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <div class="text-xs font-semibold text-amber-900 uppercase mb-2">⚠️ Pacing Guardrail (Secondary)</div>
        <div class="text-sm text-amber-900 mb-2">${pacingGuardrail.message}</div>
        <div class="text-xs text-amber-800"><strong>Rule:</strong> ${pacingGuardrail.rule}</div>
      </div>
    ` : ''}

    <!-- ============================================================ -->
    <!-- COMPONENT 2: How We Avoid KPI Theater (Concrete Example) -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-blue-200 rounded-xl p-6 mb-4">
      <div class="text-sm font-bold text-slate-900 mb-2">How We Avoid KPI Theater</div>
      <div class="text-xs text-slate-600 mb-4">Red/Yellow is not a score — it's a routing signal. Every colored status must have: Owner, SLA, Evidence, Options, and Expected Impact.</div>

      <div class="bg-gradient-to-r from-blue-50 to-slate-50 border-2 border-blue-300 rounded-lg p-4">
        <div class="text-xs font-semibold text-blue-900 mb-3">Example: Commit Turns Yellow</div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- What Changed -->
          <div>
            <div class="text-xs font-bold text-slate-700 mb-2">📊 What Changed</div>
            <div class="text-xs text-slate-700 space-y-1">
              <div>• CTB short 3 days (IC-77 component)</div>
              <div>• Yield drift: 94.2% → 97.5% target (-3.3%)</div>
              <div>• Test capacity: 87% utilization</div>
            </div>
          </div>

          <!-- System Decision -->
          <div>
            <div class="text-xs font-bold text-slate-700 mb-2">🎯 System Decision</div>
            <div class="text-xs text-slate-700 space-y-1">
              <div>• Route to: <span class="font-semibold">Production Planner</span></div>
              <div>• SLA: <span class="font-semibold">48h review required</span></div>
              <div>• Confidence: <span class="inline-block px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded font-semibold">HIGH</span></div>
            </div>
          </div>
        </div>

        <!-- Evidence Linked -->
        <div class="mb-4">
          <div class="text-xs font-bold text-slate-700 mb-2">🔗 Evidence Linked</div>
          <div class="flex flex-wrap gap-2">
            <button class="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 font-semibold">CTB Trend (past 7d)</button>
            <button class="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 font-semibold">Yield by Line</button>
            <button class="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 font-semibold">Downtime Log</button>
            <button class="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 font-semibold">Component Lot #X2401</button>
          </div>
        </div>

        <!-- Options with Expected Impact -->
        <div>
          <div class="text-xs font-bold text-slate-700 mb-2">⚙️ Options (with Expected Impact)</div>
          <div class="space-y-2">
            <div class="flex items-start gap-2 p-2 bg-white border rounded">
              <div class="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <div class="flex-1">
                <div class="text-xs font-semibold">Rebalance CTB (cross-site transfer)</div>
                <div class="text-xs text-slate-600 mt-0.5">Impact: +800 units, closes 6.8% of gap</div>
              </div>
            </div>
            <div class="flex items-start gap-2 p-2 bg-white border rounded">
              <div class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <div class="flex-1">
                <div class="text-xs font-semibold">Add overtime (weekend shift for Test)</div>
                <div class="text-xs text-slate-600 mt-0.5">Impact: +2.8k units, closes 24% of gap, cost +$8k</div>
              </div>
            </div>
            <div class="flex items-start gap-2 p-2 bg-white border rounded">
              <div class="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold">3</div>
              <div class="flex-1">
                <div class="text-xs font-semibold">Freeze pull (delay lower-priority SKUs)</div>
                <div class="text-xs text-slate-600 mt-0.5">Impact: +4.2k units W04 recovery, pushes 4.2k to W05 (liability risk)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded text-xs">
          <strong>Result:</strong> Expected impact: +4.8k ship recovery in W04 if Option 1+2 approved by Production Director within 24h.
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- COMPONENT 3: Metric Standardization Snapshot -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-6 mb-4">
      <div class="text-sm font-bold text-slate-900 mb-2">Unified Metric Index: 8 Core Metrics</div>
      <div class="text-xs text-slate-600 mb-4">We standardized metric definitions across 8 metrics that matter for decision-making. This prevents "my number vs your number" debates and enables automated routing.</div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-3 py-2 text-left font-semibold text-slate-700">Metric (Plain Language)</th>
              <th class="px-3 py-2 text-center font-semibold text-slate-700">Grain</th>
              <th class="px-3 py-2 text-center font-semibold text-slate-700">Source</th>
              <th class="px-3 py-2 text-center font-semibold text-slate-700">Refresh</th>
              <th class="px-3 py-2 text-left font-semibold text-slate-700">Confidence Rule</th>
              <th class="px-3 py-2 text-left font-semibold text-slate-700">Decision Usage</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <!-- Row 1 -->
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium">Plan Achievement Rate</td>
              <td class="px-3 py-2 text-center text-slate-600">Program×Week</td>
              <td class="px-3 py-2 text-center text-slate-600">Planning+MES</td>
              <td class="px-3 py-2 text-center text-slate-600">Daily</td>
              <td class="px-3 py-2 text-slate-600">Fresh <24h & coverage >95%</td>
              <td class="px-3 py-2 text-slate-600">Routes to planning review when below target</td>
            </tr>

            <!-- Row 2 -->
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium">Material Availability</td>
              <td class="px-3 py-2 text-center text-slate-600">Site×Day</td>
              <td class="px-3 py-2 text-center text-slate-600">WMS</td>
              <td class="px-3 py-2 text-center text-slate-600">Daily</td>
              <td class="px-3 py-2 text-slate-600">Fresh <12h & coverage >98%</td>
              <td class="px-3 py-2 text-slate-600">Caps daily input in constrained mode</td>
            </tr>

            <!-- Row 3 -->
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium">First Pass Yield</td>
              <td class="px-3 py-2 text-center text-slate-600">Line×Shift×Day</td>
              <td class="px-3 py-2 text-center text-slate-600">MES</td>
              <td class="px-3 py-2 text-center text-slate-600">Daily</td>
              <td class="px-3 py-2 text-slate-600">Fresh <6h & coverage >95%</td>
              <td class="px-3 py-2 text-slate-600">Explains output gap, triggers quality action</td>
            </tr>

            <!-- Row 4 -->
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium">Capacity Utilization</td>
              <td class="px-3 py-2 text-center text-slate-600">Site×Week</td>
              <td class="px-3 py-2 text-center text-slate-600">Planning+MES</td>
              <td class="px-3 py-2 text-center text-slate-600">Daily</td>
              <td class="px-3 py-2 text-slate-600">Fresh <24h & coverage >90%</td>
              <td class="px-3 py-2 text-slate-600">Identifies bottleneck lines for rebalancing</td>
            </tr>

            <!-- Row 5 -->
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium">Commit Fulfillment Rate</td>
              <td class="px-3 py-2 text-center text-slate-600">Program×Week</td>
              <td class="px-3 py-2 text-center text-slate-600">OMS+Shipping</td>
              <td class="px-3 py-2 text-center text-slate-600">12h</td>
              <td class="px-3 py-2 text-slate-600">Fresh <24h & reconciled with OMS</td>
              <td class="px-3 py-2 text-slate-600">Triggers customer escalation if below threshold</td>
            </tr>

            <!-- Row 6 -->
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium">Cost Risk (Extra Cost %)</td>
              <td class="px-3 py-2 text-center text-slate-600">Site×Month</td>
              <td class="px-3 py-2 text-center text-slate-600">Finance+MES</td>
              <td class="px-3 py-2 text-center text-slate-600">Weekly</td>
              <td class="px-3 py-2 text-slate-600">Fresh <72h & reconciled with actuals</td>
              <td class="px-3 py-2 text-slate-600">Routes to finance review when above budget</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-amber-900">
        <strong>Why this matters:</strong> Without unified definitions, each team uses their own calculation logic. This creates "my number vs your number" debates that delay decisions. Unified metrics = one source of truth = faster routing.
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// ========================================
// NEW PROGRAM PAGES
// ========================================

// Helper function to get current week's Monday 8am
function getWeekMondayCutoff() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(8, 0, 0, 0);

  // Format: "Jan 20, 2026 8:00 AM"
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  return monday.toLocaleString('en-US', options);
}

// 1. Delivery Command Center (v3.0 with Decision Inbox)
// NOTE: This old version is replaced by command_center_new.js
// Commented out to use the new "Weekly Commit Brief" version
/*
function renderDeliveryCommandCenter() {
  const cutoffTime = getWeekMondayCutoff();

  // ============================================================
  // STEP 1: Generate metrics from Production Plan
  // ============================================================
  let metrics = {};
  let decisionCards = [];
  let confidenceResults = {};

  if (window.productionPlanState && window.productionPlanState.planResults) {
    metrics = calculateMetricsFromPlan(
      window.productionPlanState.planResults.dailyDetails,
      window.productionPlanState.engine?.state || {}
    );

    // Calculate confidence for all metrics
    confidenceResults = calculateBatchConfidence(metrics);

    // Evaluate routing rules to generate decision cards
    decisionCards = evaluateRoutingRules(metrics, {
      date: new Date(),
      isHoliday: false,
      ramp_day_index: 10 // Example
    });

    // Store in global state for other components to access
    window.commandCenterState = {
      latestMetrics: metrics,
      latestDecisionCards: decisionCards,
      latestConfidence: confidenceResults,
      featureEnabled: true
    };

    console.log('[Delivery Command Center] Generated:', {
      metricsCount: Object.keys(metrics).length,
      decisionCardsCount: decisionCards.length,
      confidenceResults
    });
  } else {
    console.warn('[Delivery Command Center] No production plan data available - using example data');

    // Provide example metrics for Decision Chain visualization
    metrics = {
      mps_attainment: {
        value: 0.92,
        threshold: 0.85,
        gap_qty: 11600,
        status: 'at_risk',
        data_snapshot: {
          age_hours: 2,
          coverage_pct: 98,
          reconciliation_status: 'matched'
        }
      },
      ctb: {
        value: 5.2,
        threshold: 5.0,
        status: 'on_track',
        days_cover: 5.2,
        shortage_components: [],
        data_snapshot: {
          age_hours: 4,
          coverage_pct: 95,
          reconciliation_status: 'matched'
        }
      },
      capacity: {
        value: 0.87,
        threshold: 0.90,
        status: 'on_track',
        utilization: 0.87,
        data_snapshot: {
          age_hours: 6,
          coverage_pct: 100,
          reconciliation_status: 'matched'
        }
      },
      yield: {
        value: 0.942,
        threshold: 0.975,
        status: 'at_risk',
        drift_pct: -3.3,
        scrap_qty: 1200,
        data_snapshot: {
          age_hours: 3,
          coverage_pct: 98,
          reconciliation_status: 'matched'
        }
      },
      shipment_readiness: {
        value: 3.2,
        threshold: 5.0,
        status: 'at_risk',
        days_cover: 3.2,
        at_risk_orders: 15,
        data_snapshot: {
          age_hours: 8,
          coverage_pct: 92,
          reconciliation_status: 'matched'
        }
      },
      service_level: {
        value: 0.955,
        threshold: 1.00,
        status: 'at_risk',
        late_orders: 12,
        data_snapshot: {
          age_hours: 12,
          coverage_pct: 90,
          reconciliation_status: 'partial'
        }
      }
    };

    confidenceResults = calculateBatchConfidence(metrics);

    // Generate decision cards from example metrics
    decisionCards = evaluateRoutingRules(metrics, {
      date: new Date(),
      isHoliday: false,
      ramp_day_index: 10
    });
  }

  // ============================================================
  // STEP 2: Decision Inbox is now inlined in main layout below
  // ============================================================

  // ============================================================
  // STEP 3: Render Decision Chain Widget
  // ============================================================
  const focusMetric = metrics['mps_attainment'] || null;
  const decisionChainHTML = renderDecisionChain(metrics, focusMetric);

  // ============================================================
  // STEP 4: Render main page
  // ============================================================
  const html = `
    <!-- Header: Simplified -->
    <div class="bg-white border-2 border-slate-300 rounded-xl p-5 mb-6 shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="text-xl font-bold text-slate-900 mb-2">Delivery Command Center — Decision routing for weekly commit</div>
          <div class="text-sm text-slate-600 leading-relaxed">What decision is needed, by whom, by when, based on what evidence, and what happens if we act?</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500 font-semibold uppercase tracking-wide">Scope</div>
          <div class="text-base font-bold text-slate-900 mt-1">Product A · 2026-W04</div>
          <div class="text-xs text-slate-500 mt-1.5">Cut-off: ${cutoffTime}</div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PRIMARY: Decision Inbox + At-a-Glance (60% of first screen) -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-3 gap-5 mb-6">
      <!-- LEFT: Decision Inbox (占2列 = 66%) -->
      <div class="col-span-2">
        <div class="bg-white border-2 border-blue-200 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-lg font-bold text-slate-900">Decisions Due (48h)</div>
              <div class="text-xs text-slate-600 mt-1">Every decision shows: What / Why now / Impact / Owner+SLA / Actions</div>
            </div>
            <div class="text-xs text-slate-500">
              ${decisionCards.length} total decisions
            </div>
          </div>

          ${decisionCards.length > 0 ? `
            <div class="space-y-5">
              ${decisionCards.slice(0, 3).map((card, idx) => `
                <div class="border-2 ${card.priority === 'high' ? 'border-red-300 bg-red-50' : card.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' : 'border-blue-300 bg-blue-50'} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <!-- Header -->
                  <div class="flex items-center gap-3 mb-4">
                    <span class="text-lg font-bold text-slate-400">#${idx + 1}</span>
                    <span class="text-base font-bold text-slate-900 flex-1">${card.title || 'Decision needed'}</span>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${card.priority === 'high' ? 'bg-red-200 text-red-900' : card.priority === 'medium' ? 'bg-yellow-200 text-yellow-900' : 'bg-blue-200 text-blue-900'}">
                      ${card.priority.toUpperCase()}
                    </span>
                  </div>

                  <!-- Why now + Impact (grid) -->
                  <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-slate-200">
                    <div class="space-y-1.5">
                      <div class="text-xs font-bold text-slate-700 uppercase tracking-wide">Why now</div>
                      <div class="text-sm text-slate-800 leading-relaxed">${card.description || 'Trigger detected'}</div>
                      <div class="text-xs text-slate-600">Confidence: <span class="font-bold ${card.confidence?.level === 'HIGH' ? 'text-green-600' : card.confidence?.level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'}">${card.confidence?.level || 'HIGH'}</span></div>
                    </div>
                    <div class="space-y-1.5">
                      <div class="text-xs font-bold text-slate-700 uppercase tracking-wide">Impact</div>
                      <div class="text-sm text-slate-800 leading-relaxed">${card.impact_statement || 'Units at risk'}</div>
                      <div class="text-xs text-slate-600">SLA: <span class="font-bold ${card.sla_hours <= 24 ? 'text-red-600' : 'text-slate-600'}">${card.sla_hours}h</span></div>
                    </div>
                  </div>

                  <!-- Owner + Actions -->
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-sm text-slate-700">
                      <span class="font-semibold">Owner:</span> <span class="text-slate-900 font-medium">${card.decision_owner || 'Unassigned'}</span>
                    </div>
                    <div class="flex gap-2 flex-wrap justify-end">
                      ${card.suggested_actions?.slice(0, 3).map(action => `
                        <button onclick="executeAction('${card.card_id}', '${action.action_id}')" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-sm transition-all">
                          ${action.label.split(' ').slice(0, 2).join(' ')}
                        </button>
                      `).join('') || `
                        <button class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all">
                          Open Plan
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="bg-white border-2 border-green-300 rounded-lg p-8 text-center">
              <div class="text-4xl mb-3">✅</div>
              <div class="text-sm font-bold text-green-900 mb-2">No Decisions Due</div>
              <div class="text-xs text-green-700">All metrics within target. Continue monitoring for changes.</div>
            </div>
          `}
        </div>
      </div>

      <!-- RIGHT: This Week at a Glance (占1列 = 33%) -->
      <div class="col-span-1">
        <div class="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
          <div class="text-sm font-bold text-slate-900 mb-1">This Week at a Glance</div>
          <div class="text-xs text-slate-500 mb-4">3 outcome metrics only</div>

          <div class="space-y-4">
            <!-- Plan Achievement -->
            <div class="border-b-2 border-slate-100 pb-4">
              <div class="flex items-start gap-3">
                <div class="w-3 h-3 rounded-full mt-1 ${metrics.mps_attainment?.status === 'at_risk' ? 'bg-red-500' : 'bg-green-500'} shadow-sm"></div>
                <div class="flex-1">
                  <div class="text-xs font-bold text-slate-900 uppercase tracking-wide">Plan Achievement</div>
                  <div class="text-lg font-bold text-slate-900 mt-1">${metrics.mps_attainment ? (metrics.mps_attainment.value * 100).toFixed(1) : '92.0'}%</div>
                  <div class="text-xs text-slate-600 mt-1.5">Gap: ${metrics.mps_attainment?.gap_qty?.toLocaleString() || '11,600'} units</div>
                  <div class="text-xs text-slate-500 mt-2">Confidence: <span class="font-bold ${confidenceResults.mps_attainment?.level === 'HIGH' ? 'text-green-600' : 'text-yellow-600'}">${confidenceResults.mps_attainment?.level || 'HIGH'}</span></div>
                </div>
              </div>
            </div>

            <!-- Commit Fulfillment -->
            <div class="border-b-2 border-slate-100 pb-4">
              <div class="flex items-start gap-3">
                <div class="w-3 h-3 rounded-full mt-1 ${metrics.service_level?.status === 'at_risk' ? 'bg-yellow-500' : 'bg-green-500'} shadow-sm"></div>
                <div class="flex-1">
                  <div class="text-xs font-bold text-slate-900 uppercase tracking-wide">Commit Fulfillment</div>
                  <div class="text-lg font-bold text-slate-900 mt-1">${metrics.service_level ? (metrics.service_level.value * 100).toFixed(1) : '95.5'}%</div>
                  <div class="text-xs text-slate-600 mt-1.5">${metrics.service_level?.late_orders || 12} orders at risk</div>
                  <div class="text-xs text-slate-500 mt-2">Confidence: <span class="font-bold ${confidenceResults.service_level?.level === 'HIGH' ? 'text-green-600' : 'text-yellow-600'}">${confidenceResults.service_level?.level || 'HIGH'}</span></div>
                </div>
              </div>
            </div>

            <!-- Cost Risk -->
            <div>
              <div class="flex items-start gap-3">
                <div class="w-3 h-3 rounded-full mt-1 bg-yellow-500 shadow-sm"></div>
                <div class="flex-1">
                  <div class="text-xs font-bold text-slate-900 uppercase tracking-wide">Cost Risk</div>
                  <div class="text-lg font-bold text-slate-900 mt-1">$45k</div>
                  <div class="text-xs text-slate-600 mt-1.5">Extra cost: +12%</div>
                  <div class="text-xs text-slate-500 mt-2">Confidence: <span class="font-bold text-yellow-600">MED</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- SECONDARY: Why This Is At Risk (Decision Chain - simplified) -->
    <!-- ============================================================ -->
    ${decisionChainHTML}

    <!-- Product Snapshot -->
    <div class="bg-white border rounded-xl p-6 mb-4">
      <div class="text-lg font-bold text-slate-900 mb-3">Product Snapshot — Manufacturing Footprint</div>
      <div class="text-sm text-slate-600 mb-5">A stable view of where and how this product is built. Use this to sanity-check capacity and pacing decisions.</div>

      <!-- Two-column cutoff view -->
      <div class="grid grid-cols-2 gap-6 mb-5">
        <!-- This Week Cutoff (W04) -->
        <div class="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
          <div class="text-sm font-bold text-blue-900 mb-3">Cut-off: This Week (W04 — Sat Jan 25, 2026)</div>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Cum Forecast</span>
              <span class="text-base font-bold text-slate-900">580k units</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Cum Capacity</span>
              <span class="text-base font-bold text-slate-900">600k units</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Cum CTB</span>
              <span class="text-base font-bold text-slate-900">575k units</span>
            </div>
            <div class="flex justify-between items-center border-t pt-2 mt-2">
              <span class="text-xs text-slate-700">Cum Ship (+2WD)</span>
              <span class="text-base font-bold text-blue-700">534k units</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Gap vs Forecast</span>
              <span class="text-base font-bold text-red-700">-46k units</span>
            </div>
          </div>
        </div>

        <!-- Year End Cutoff (2026) -->
        <div class="border-2 border-slate-200 bg-slate-50 rounded-xl p-4">
          <div class="text-sm font-bold text-slate-900 mb-3">Cut-off: Year End (Dec 31, 2026)</div>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Cum Forecast</span>
              <span class="text-base font-bold text-slate-900">2.8M units</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Cum Capacity</span>
              <span class="text-base font-bold text-slate-900">2.9M units</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Cum CTB</span>
              <span class="text-base font-bold text-slate-900">2.7M units</span>
            </div>
            <div class="flex justify-between items-center border-t pt-2 mt-2">
              <span class="text-xs text-slate-700">Cum Ship (+2WD)</span>
              <span class="text-base font-bold text-blue-700">2.6M units</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-700">Gap vs Forecast</span>
              <span class="text-base font-bold text-red-700">-200k units</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Build Sites & Capacity -->
      <div class="bg-slate-50 border rounded-lg p-4 mb-4">
        <div class="text-xs font-semibold text-slate-700 mb-3">Build Sites & Capacity</div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="font-semibold text-slate-900">WF (CN): 3 lines</div>
            <div class="text-xs text-slate-600">110–135 UPH · 95–120k/week</div>
          </div>
          <div>
            <div class="font-semibold text-slate-900">VN-02 (VN): 2 lines</div>
            <div class="text-xs text-slate-600">95–120 UPH · 96–120k/week</div>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div class="text-xs font-semibold text-amber-900 mb-1">Notable Constraints:</div>
        <div class="text-sm text-amber-800">Test lane shared across SKUs · IC-77 is single-source · Holiday labor availability impacts W05–W07</div>
      </div>

      <div class="text-xs text-slate-500 mt-3">Footprint metrics change infrequently; weekly execution signals update daily.</div>
    </div>

    <!-- ============================================================ -->
    <!-- Evidence Panel (5 key drivers only, compact) -->
    <!-- ============================================================ -->
    <div class="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-5">
        <div>
          <div class="text-base font-bold text-slate-900">Evidence: What's constraining this week</div>
          <div class="text-xs text-slate-600 mt-1.5">Max 5 drivers · 3 bullets + 1 action per driver</div>
        </div>
        <div class="text-sm text-slate-600">Binding constraint: <span class="font-bold text-red-700">Yield</span></div>
      </div>

      <div class="space-y-4">
        <!-- Driver 1: CTB (OK) -->
        <div class="border-2 rounded-xl p-4 bg-green-50 border-green-300 shadow-sm min-h-[140px] flex">
          <div class="flex items-start gap-4 w-full">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow-md">✓</div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900 mb-2.5">📦 Material Availability (CTB)</div>
              <div class="text-sm text-slate-700 space-y-1.5 mb-3">
                <div class="flex items-start gap-2"><span class="text-green-600 font-bold">•</span><span>Coverage: 98% (1.85M units available)</span></div>
                <div class="flex items-start gap-2"><span class="text-green-600 font-bold">•</span><span>Confidence: HIGH (updated 4h ago)</span></div>
                <div class="flex items-start gap-2"><span class="text-green-600 font-bold">•</span><span>Not constraining this week</span></div>
              </div>
              <div class="text-sm text-green-800 font-bold bg-white border-2 border-green-400 rounded-lg px-3 py-2">✓ No action needed</div>
            </div>
          </div>
        </div>

        <!-- Driver 2: Yield (BINDING CONSTRAINT) -->
        <div class="border-2 rounded-xl p-4 bg-red-50 border-red-400 shadow-md min-h-[140px] flex">
          <div class="flex items-start gap-4 w-full">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center text-lg font-bold shadow-md">⚠️</div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900 mb-2.5">🎯 First Pass Yield · <span class="text-red-700 uppercase text-xs tracking-wide">BINDING TODAY</span></div>
              <div class="text-sm text-slate-700 space-y-1.5 mb-3">
                <div class="flex items-start gap-2"><span class="text-red-600 font-bold">•</span><span>Current: 94.2% vs target 97.5% (-3.3%)</span></div>
                <div class="flex items-start gap-2"><span class="text-red-600 font-bold">•</span><span>Impact: ~4.8k units scrapped/reworked → causes 11.6k output gap</span></div>
                <div class="flex items-start gap-2"><span class="text-red-600 font-bold">•</span><span>Top 3 failure codes: AC-401 (45%), DC-203 (30%), FN-105 (25%)</span></div>
              </div>
              <div class="text-sm bg-white border-2 border-red-500 rounded-lg px-3 py-2 font-bold text-red-900">⚡ Quarantine Lot #X2401 + fast-track ECN for AC-401 fix by W05</div>
            </div>
          </div>
        </div>

        <!-- Driver 3: Capacity (Moderate) -->
        <div class="border-2 rounded-xl p-4 bg-yellow-50 border-yellow-300 shadow-sm min-h-[140px] flex">
          <div class="flex items-start gap-4 w-full">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold shadow-md">!</div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900 mb-2.5">🏭 Test Capacity</div>
              <div class="text-sm text-slate-700 space-y-1.5 mb-3">
                <div class="flex items-start gap-2"><span class="text-yellow-600 font-bold">•</span><span>Utilization: 87% (constrained)</span></div>
                <div class="flex items-start gap-2"><span class="text-yellow-600 font-bold">•</span><span>Re-test queue: 2.8k units</span></div>
                <div class="flex items-start gap-2"><span class="text-yellow-600 font-bold">•</span><span>Contributing to output gap (not primary driver)</span></div>
              </div>
              <div class="text-sm bg-white border-2 border-yellow-400 rounded-lg px-3 py-2 font-bold text-yellow-900">→ Add weekend shift + reallocate 20% capacity</div>
            </div>
          </div>
        </div>

        <!-- Driver 4: Shipment Readiness (Moderate) -->
        <div class="border-2 rounded-xl p-4 bg-yellow-50 border-yellow-300 shadow-sm min-h-[140px] flex">
          <div class="flex items-start gap-4 w-full">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold shadow-md">!</div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900 mb-2.5">🚚 Shipment Readiness</div>
              <div class="text-sm text-slate-700 space-y-1.5 mb-3">
                <div class="flex items-start gap-2"><span class="text-yellow-600 font-bold">•</span><span>Current: 132.6k shipped vs 139k commit (95.5%)</span></div>
                <div class="flex items-start gap-2"><span class="text-yellow-600 font-bold">•</span><span>Packing bottleneck: +1.5d lead-time variance</span></div>
                <div class="flex items-start gap-2"><span class="text-yellow-600 font-bold">•</span><span>WH space: 94% utilization (nearing capacity)</span></div>
              </div>
              <div class="text-sm bg-white border-2 border-yellow-400 rounded-lg px-3 py-2 font-bold text-yellow-900">→ Dual-shift packing + prioritize high-priority SKUs</div>
            </div>
          </div>
        </div>

        <!-- Driver 5: Data Confidence (OK) -->
        <div class="border-2 rounded-xl p-4 bg-green-50 border-green-300 shadow-sm min-h-[140px] flex">
          <div class="flex items-start gap-4 w-full">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow-md">✓</div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900 mb-2.5">📊 Data Confidence</div>
              <div class="text-sm text-slate-700 space-y-1.5 mb-3">
                <div class="flex items-start gap-2"><span class="text-green-600 font-bold">•</span><span>All metrics: HIGH confidence (updated <8h ago)</span></div>
                <div class="flex items-start gap-2"><span class="text-green-600 font-bold">•</span><span>Coverage: >95% across all tables</span></div>
                <div class="flex items-start gap-2"><span class="text-green-600 font-bold">•</span><span>Not limiting decision quality</span></div>
              </div>
              <div class="text-sm text-green-800 font-bold bg-white border-2 border-green-400 rounded-lg px-3 py-2">✓ Data quality supports routing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}
*/

// 2. Production Plan
function renderProductionPlan() {
  //Initialize production plan state if not exists
  if (!window.productionPlanState) {
    // Try to restore saved tab and subpage state from localStorage
    let savedTab = 'generate';
    let savedSubpage = 'latest';

    try {
      const storedTab = localStorage.getItem('productionPlan_activeTab');
      const storedSubpage = localStorage.getItem('productionPlan_activeSubpage');

      if (storedTab) {
        // Redirect removed 'library' tab to 'simulations'
        savedTab = storedTab === 'library' ? 'simulations' : storedTab;
        console.log('[Production Plan] Restored activeTab from localStorage:', savedTab);
      }

      if (storedSubpage) {
        savedSubpage = storedSubpage;
        console.log('[Production Plan] Restored activeSubpage from localStorage:', storedSubpage);
      }
    } catch (error) {
      console.error('[Production Plan] Error restoring tab/subpage state:', error);
    }

    window.productionPlanState = {
      program: 'product_a',
      site: 'all',
      startDate: '2026-01-20',
      endDate: '2026-12-31',
      mode: 'unconstrained',
      planResults: null,
      engine: null,
      activeTab: savedTab, // 'generate' | 'por' | 'history'
      activeSubpage: savedSubpage // legacy, kept for compatibility
    };
  }

  const state = window.productionPlanState;
  const content = $('content');

  // Render tab navigation
  content.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Production Plan</h2>
          <p class="text-sm text-gray-600 mt-1">Define assumptions, run simulations, and compare scenarios.</p>
        </div>
        <div class="px-3 py-1 bg-purple-100 border border-purple-300 rounded-lg">
          <span class="text-xs font-mono font-semibold text-purple-700">v2.2.5</span>
        </div>
      </div>
      <div class="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        ${renderProductFilterBar('production-plan')}
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            onclick="switchProductionPlanTab('generate')"
            class="tab-button ${state.activeTab === 'generate' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            ⭐ Production Planning
          </button>
          <button
            onclick="switchProductionPlanTab('simulations')"
            class="tab-button ${state.activeTab === 'simulations' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            🧪 Simulations
          </button>
          <button
            onclick="switchProductionPlanTab('por')"
            class="tab-button ${state.activeTab === 'por' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            ✅ POR (Plan of Record)
          </button>
          <button
            onclick="switchProductionPlanTab('history')"
            class="tab-button ${state.activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            📜 POR Version History
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div id="tabContent"></div>

      <!-- Floating Ask AI Button -->
      <button
        onclick="openProductionPlanAIChat()"
        class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50 no-print"
        title="Ask AI about Production Planning">
        <span class="text-2xl">💬</span>
      </button>
    </div>
  `;

  // Render active tab content
  switch (state.activeTab) {
    case 'generate':
      renderProductionPlanMerged();
      break;
    case 'simulations':
      renderSimulationsTab();
      break;
    case 'por':
      renderCurrentPOR();
      break;
    case 'history':
      renderPORHistory();
      break;
    default:
      renderProductionPlanMerged();
  }
}

// Tab switching function
window.switchProductionPlanTab = function(tabName) {
  window.productionPlanState.activeTab = tabName;

  // Save tab state to localStorage
  try {
    localStorage.setItem('productionPlan_activeTab', tabName);
    console.log('[Production Plan] Saved activeTab to localStorage:', tabName);
  } catch (error) {
    console.error('[Production Plan] Error saving activeTab:', error);
  }

  renderProductionPlan();
};

// Simulations Tab — Latest Simulation + Simulation Library
function renderSimulationsTab() {
  var tabContent = document.getElementById('tabContent');
  if (!tabContent) return;

  var state = window.productionPlanState;

  // --- Build Latest Simulation HTML (reuses plan results from state) ---
  var latestSimHtml = '';
  if (state.planResults) {
    var isCombinedMode = state.planResults.mode === 'combined';
    var results = isCombinedMode ? state.planResults.unconstrained : state.planResults;
    var resultsConstrained = isCombinedMode ? state.planResults.constrained : null;
    var weeklyMetrics = (results && results.weeklyMetrics) ? results.weeklyMetrics : [];
    var granularity = state.viewGranularity || 'weekly';
    var periodLabel = granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly';
    var dateColLabel = granularity === 'daily' ? 'Date' : granularity === 'weekly' ? 'Week' : 'Month';

    var currentData = [];
    var hasMoreData = false;

    if (results && results.programResults) {
      var today = new Date();
      var currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay());

      if (granularity === 'weekly') {
        currentData = weeklyMetrics.slice(0, 4);
        hasMoreData = weeklyMetrics.length > 4;
      } else if (granularity === 'monthly') {
        var monthlyData = aggregateByMonth(results.programResults);
        var currentMonth = today.getMonth() + 1;
        var currentYear = today.getFullYear();
        currentData = monthlyData.filter(function(m) {
          if (!m.month_id) return false;
          var parts = m.month_id.split('-').map(Number);
          return parts[0] === currentYear && parts[1] >= currentMonth;
        });
        hasMoreData = monthlyData.length > currentData.length;
      } else {
        var twoWeeksLater = new Date(currentWeekStart);
        twoWeeksLater.setDate(currentWeekStart.getDate() + 14);
        var twoWeeksLaterStr = twoWeeksLater.toISOString().split('T')[0];
        var currentWeekStartStr = currentWeekStart.toISOString().split('T')[0];
        currentData = results.programResults.filter(function(d) {
          return d.date >= currentWeekStartStr && d.date < twoWeeksLaterStr;
        });
        hasMoreData = results.programResults.length > currentData.length;
      }
    }

    var thisWeekSaturday = '2026-01-25';
    var yearEnd = '2026-12-31';
    var weekSummary = results && results.programResults ?
      calculateCutoffSummary(results.programResults, thisWeekSaturday) :
      { cumForecast: 0, cumCTB: 0, cumCapacity: 0, cumShip: 0, gap: 0 };
    var yearSummary = results && results.programResults ?
      calculateCutoffSummary(results.programResults, yearEnd) :
      { cumForecast: 0, cumCTB: 0, cumCapacity: 0, cumShip: 0, gap: 0 };
    var constraintAnalysis = results && results.programResults ?
      analyzePrimaryConstraint(results.programResults) :
      { primaryConstraint: 'Mixed', ctbLimitedDays: 0, capacityLimitedDays: 0, ctbLimitedUnits: 0, capacityLimitedUnits: 0, ctbLimitedPct: '0', capacityLimitedPct: '0' };

    var porBadgeHtml = '';
    var porVersion = typeof getCurrentPOR === 'function' ? getCurrentPOR() : null;
    if (porVersion) {
      porBadgeHtml = '<div class="border-l pl-4">' +
        '<div class="text-xs text-slate-600 mb-1">Plan of Record</div>' +
        '<div class="flex items-center gap-2">' +
        '<span class="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded font-bold">★ POR</span>' +
        '<span class="font-semibold text-slate-900 text-xs">' + porVersion.version + '</span>' +
        '</div></div>';
    }

    var constraintDesc = '';
    if (constraintAnalysis.primaryConstraint === 'CTB') {
      constraintDesc = 'CTB limited ' + constraintAnalysis.ctbLimitedPct + '% of days (' + constraintAnalysis.ctbLimitedUnits.toLocaleString() + ' units short)';
    } else if (constraintAnalysis.primaryConstraint === 'Capacity') {
      constraintDesc = 'Capacity limited ' + constraintAnalysis.capacityLimitedPct + '% of days (' + constraintAnalysis.capacityLimitedUnits.toLocaleString() + ' units short)';
    } else {
      constraintDesc = 'Both capacity and materials are sufficient';
    }

    var constrainedHeaderGroup = '';
    var constrainedSubHeaders = '';
    if (isCombinedMode) {
      constrainedHeaderGroup = '<th class="px-2 py-2 text-center font-bold border-r-2 bg-purple-50" colspan="6">Reality Track<br/><span class="text-xs font-normal">(Constrained)</span></th>';
      constrainedSubHeaders =
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">' + periodLabel + '<br/>Input</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">Cum<br/>Input</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">' + periodLabel + '<br/>Output</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">Cum<br/>Output</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">' + periodLabel + '<br/>Ship</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50 border-r-2">Cum<br/>Ship</th>';
    }

    var truthTableRows = currentData.map(function(row, idx) {
      var dateLabel = granularity === 'daily' ? row.date :
                       granularity === 'weekly' ? getWeekDisplayDate(row.week_id) : row.month_id;
      var isSunday = granularity === 'daily' && DateUtils.isSunday(row.date);
      var cumForecast = row.cum_demand || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + (r.demand || 0); }, 0) : row.demand || 0);
      var cumCTB = idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((r.ctb_available || r.capacity_unconstrained) || 0); }, 0) : (row.ctb_available || row.capacity_unconstrained || 0);
      var cumCapacity = idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + (r.capacity_unconstrained || 0); }, 0) : (row.capacity_unconstrained || 0);
      var dailyInput = granularity === 'daily' ? (row.input_final || 0) : (row.input || 0);
      var cumInput = row.cum_input || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((granularity === 'daily' ? r.input_final : r.input) || 0); }, 0) : dailyInput);
      var dailyOutput = granularity === 'daily' ? (row.output_final || 0) : (row.output || 0);
      var cumOutput = row.cum_output || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((granularity === 'daily' ? r.output_final : r.output) || 0); }, 0) : dailyOutput);
      var dailyShip = granularity === 'daily' ? (row.shipment_final || 0) : (row.shipments || 0);
      var cumShip = row.cum_shipment || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((granularity === 'daily' ? r.shipment_final : r.shipments) || 0); }, 0) : dailyShip);
      var gap = cumShip - cumForecast;
      var bindingDriver = granularity === 'daily' ? getDailyConstraint(row) : '-';

      var constrainedCells = '';
      if (isCombinedMode && resultsConstrained) {
        var constrainedData = granularity === 'weekly' ?
          resultsConstrained.weeklyMetrics : granularity === 'monthly' ?
          aggregateByMonth(resultsConstrained.programResults) : resultsConstrained.programResults;
        var rowC = constrainedData[idx];
        if (rowC) {
          var dIC = granularity === 'daily' ? (rowC.input_final || 0) : (rowC.input || 0);
          var cIC = rowC.cum_input || dIC;
          var dOC = granularity === 'daily' ? (rowC.output_final || 0) : (rowC.output || 0);
          var cOC = rowC.cum_output || dOC;
          var dSC = granularity === 'daily' ? (rowC.shipment_final || 0) : (rowC.shipments || 0);
          var cSC = rowC.cum_shipment || dSC;
          constrainedCells =
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(dIC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(cIC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(dOC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(cOC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700 font-semibold">' + Math.round(dSC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700 font-semibold border-r-2">' + Math.round(cSC).toLocaleString() + '</td>';
        }
      }

      var bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
      var gapColor = gap >= 0 ? 'text-green-700' : 'text-red-700';
      var driverColor = bindingDriver === 'CTB' ? 'text-orange-700' : bindingDriver === 'Capacity' ? 'text-red-700' : 'text-slate-500';

      return '<tr class="' + bgColor + (isSunday ? ' text-slate-400' : '') + ' hover:bg-blue-50 border-b">' +
        '<td class="px-2 py-2 font-mono text-xs border-r-2">' + dateLabel + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(cumForecast).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono border-r-2">' + Math.round(cumCTB).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(row.capacity_unconstrained || 0).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono border-r-2">' + Math.round(cumCapacity).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(dailyInput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(cumInput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(dailyOutput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(cumOutput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono text-blue-700">' + Math.round(dailyShip).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono text-blue-700' + (isCombinedMode ? '' : ' border-r-2') + '">' + Math.round(cumShip).toLocaleString() + '</td>' +
        constrainedCells +
        '<td class="px-2 py-2 text-right font-mono ' + gapColor + ' font-semibold">' + (gap >= 0 ? '+' : '') + Math.round(gap).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-center text-xs font-semibold ' + driverColor + '">' + bindingDriver + '</td>' +
        '</tr>';
    }).join('');

    var constraintColor = constraintAnalysis.primaryConstraint === 'CTB' ? 'text-orange-700' : constraintAnalysis.primaryConstraint === 'Capacity' ? 'text-red-700' : 'text-green-700';
    var constraintLabel = constraintAnalysis.primaryConstraint === 'CTB' ? '📦 CTB-limited' : constraintAnalysis.primaryConstraint === 'Capacity' ? '⚙️ Capacity-limited' : '✅ No binding constraint';
    var yearGapColor = yearSummary.gap >= 0 ? 'text-green-700' : 'text-red-700';
    var weekGapColor = weekSummary.gap >= 0 ? 'text-green-700' : 'text-red-700';
    var combinedModeLabel = isCombinedMode ? '<span class="ml-2 text-xs font-normal text-blue-600">(Combined View: Unconstrained vs Constrained)</span>' : '';
    var realityTrackLabel = isCombinedMode ? 'Reality Track<br/><span class="text-xs font-normal">(Unconstrained)</span>' : 'Reality Track';
    var cumShipBorderClass = isCombinedMode ? '' : ' border-r-2';

    latestSimHtml =
      '<div class="space-y-6">' +
      '<div class="bg-white border rounded-xl p-4">' +
        '<div class="flex items-center justify-between flex-wrap gap-3">' +
          '<div class="flex items-center gap-4">' +
            '<div><div class="text-xs text-slate-600 mb-1">Program</div><div class="font-semibold text-slate-900">Product A</div></div>' +
            '<div class="border-l pl-4"><div class="text-xs text-slate-600 mb-1">Date Range</div><div class="font-semibold text-slate-900">' + state.startDate + ' to ' + state.endDate + '</div></div>' +
            '<div class="border-l pl-4"><div class="text-xs text-slate-600 mb-1">Sites</div><div class="font-semibold text-slate-900">' + (state.site === 'all' ? 'All Sites' : state.site) + '</div></div>' +
            '<div class="border-l pl-4"><div class="text-xs text-slate-600 mb-1">Last Updated</div><div class="font-semibold text-slate-900">' + new Date().toLocaleString() + '</div></div>' +
            porBadgeHtml +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<button onclick="exportLatestProductionPlan()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">📊 Export Excel</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-6">' +
        '<div class="border-2 border-blue-300 bg-blue-50 rounded-xl p-5 shadow-sm">' +
          '<div class="text-sm font-bold text-blue-900 mb-4">Cut-off: This Week</div>' +
          '<div class="space-y-3">' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Forecast</span><span class="text-lg font-bold text-slate-900">' + (weekSummary.cumForecast / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Ship</span><span class="text-lg font-bold text-blue-700">' + (weekSummary.cumShip / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline border-t-2 border-blue-200 pt-3 mt-3"><span class="text-xs text-slate-700">Gap</span><span class="text-lg font-bold ' + weekGapColor + '">' + (weekSummary.gap >= 0 ? '+' : '') + (weekSummary.gap / 1000).toFixed(1) + 'k</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="border-2 border-slate-300 bg-slate-50 rounded-xl p-5 shadow-sm">' +
          '<div class="text-sm font-bold text-slate-900 mb-4">Cut-off: Year End</div>' +
          '<div class="space-y-3">' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Forecast</span><span class="text-lg font-bold text-slate-900">' + (yearSummary.cumForecast / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Ship</span><span class="text-lg font-bold text-blue-700">' + (yearSummary.cumShip / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline border-t-2 border-slate-200 pt-3 mt-3"><span class="text-xs text-slate-700">Gap</span><span class="text-lg font-bold ' + yearGapColor + '">' + (yearSummary.gap >= 0 ? '+' : '') + (yearSummary.gap / 1000).toFixed(1) + 'k</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bg-white border-2 rounded-xl p-4 shadow-sm">' +
        '<div class="flex items-center justify-between flex-wrap gap-3">' +
          '<div><div class="text-xs font-bold text-slate-500 mb-1">PRIMARY BINDING CONSTRAINT</div><div class="text-lg font-bold ' + constraintColor + '">' + constraintLabel + '</div></div>' +
          '<div><div class="text-xs font-bold text-slate-500 mb-1">GAP (YEAR END)</div><div class="text-lg font-bold ' + yearGapColor + '">' + (yearSummary.gap >= 0 ? '+' : '') + (yearSummary.gap / 1000).toFixed(1) + 'k units</div></div>' +
          '<div class="text-sm text-slate-600">' + constraintDesc + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="flex items-center justify-between">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-sm font-semibold text-slate-700">View:</span>' +
          '<div class="flex gap-2">' +
            '<button onclick="switchPlanGranularity(\'daily\')" class="px-4 py-2 rounded-lg text-sm font-semibold ' + (granularity === 'daily' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700') + '">Daily</button>' +
            '<button onclick="switchPlanGranularity(\'weekly\')" class="px-4 py-2 rounded-lg text-sm font-semibold ' + (granularity === 'weekly' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700') + '">Weekly</button>' +
            '<button onclick="switchPlanGranularity(\'monthly\')" class="px-4 py-2 rounded-lg text-sm font-semibold ' + (granularity === 'monthly' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700') + '">Monthly</button>' +
          '</div>' +
        '</div>' +
        '<div class="flex gap-2"><button onclick="viewLatestPlanFullReport()" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition">📊 View Full Report</button></div>' +
      '</div>' +
      '<div class="bg-white border-2 rounded-xl p-6 shadow-sm">' +
        '<div class="text-sm font-bold text-slate-900 mb-4">Production Plan Truth Table ' + combinedModeLabel + '</div>' +
        '<div class="overflow-x-auto">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead class="bg-slate-100">' +
              '<tr class="border-b-2">' +
                '<th class="px-2 py-2 text-left font-bold border-r-2" rowspan="2">' + dateColLabel + '</th>' +
                '<th class="px-2 py-2 text-center font-bold border-r-2 bg-slate-200" colspan="2">Demand / Supply</th>' +
                '<th class="px-2 py-2 text-center font-bold border-r-2 bg-blue-50" colspan="2">Capacity Track</th>' +
                '<th class="px-2 py-2 text-center font-bold border-r-2 bg-green-50" colspan="6">' + realityTrackLabel + '</th>' +
                constrainedHeaderGroup +
                '<th class="px-2 py-2 text-center font-bold bg-orange-50" colspan="2">Gap / Constraint</th>' +
              '</tr>' +
              '<tr class="border-b-2">' +
                '<th class="px-2 py-2 text-right font-semibold bg-slate-200">Cum<br/>Forecast</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-slate-200 border-r-2">Cum<br/>CTB</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-blue-50">' + periodLabel + '<br/>Capacity</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-blue-50 border-r-2">Cum<br/>Capacity</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">' + periodLabel + '<br/>Input</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">Cum<br/>Input</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">' + periodLabel + '<br/>Output</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">Cum<br/>Output</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">' + periodLabel + '<br/>Ship</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50' + cumShipBorderClass + '">Cum<br/>Ship</th>' +
                constrainedSubHeaders +
                '<th class="px-2 py-2 text-right font-semibold bg-orange-50">Gap<br/>(Cum)</th>' +
                '<th class="px-2 py-2 text-center font-semibold bg-orange-50">Binding<br/>Driver</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + truthTableRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
      '</div>';
  }

  // --- Build Simulation Library HTML ---
  var simLibHtml = (function() {
    var projects = SimulationManager.getProjects();
    var allSimulations = SimulationManager.getSimulations();
    var projectSimIds = new Set();
    projects.forEach(function(proj) { proj.simulationIds.forEach(function(id) { projectSimIds.add(id); }); });
    var standaloneSimulations = allSimulations.filter(function(sim) { return !projectSimIds.has(sim.id); });

    var formatNumber = function(num) { return num.toLocaleString('en-US'); };
    var formatDate = function(dateStr) {
      var date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    var renderSimCard = function(sim, showVariantButton, projectId) {
      var summary = sim.results.summary;
      var weeklyM = sim.results.weeklyMetrics;
      var weeksWithGap = weeklyM.filter(function(w) { return w.gap < 0; });
      var gapColor = weeksWithGap.length === 0 ? 'text-green-600' : 'text-red-600';

      var variantBtn = '';
      if (showVariantButton && projectId) {
        variantBtn = '<button onclick="createVariantFromSimulation(\'' + projectId + '\', \'' + sim.id + '\')" class="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">+ Create Variant</button>';
      }

      return '<div class="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">' +
        '<div class="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">' +
          '<div class="flex items-start justify-between">' +
            '<div class="flex-1"><h4 class="font-semibold text-gray-800 mb-1">' + sim.name + '</h4>' +
            (sim.description ? '<p class="text-xs text-gray-600">' + sim.description + '</p>' : '') +
            '</div><span class="text-2xl">📊</span>' +
          '</div>' +
        '</div>' +
        '<div class="p-4 space-y-2 text-sm border-b border-gray-100">' +
          '<div class="flex justify-between"><span class="text-gray-600">Created:</span><span class="font-medium text-gray-800">' + formatDate(sim.createdAt) + '</span></div>' +
          '<div class="flex justify-between"><span class="text-gray-600">Output:</span><span class="font-medium text-gray-800">' + formatNumber(summary.totalOutput) + ' units</span></div>' +
          '<div class="flex justify-between"><span class="text-gray-600">Attainment:</span><span class="font-medium text-gray-800">' + summary.overallAttainment.toFixed(1) + '%</span></div>' +
          '<div class="flex justify-between"><span class="text-gray-600">Gap Weeks:</span><span class="font-medium ' + gapColor + '">' + weeksWithGap.length + '</span></div>' +
        '</div>' +
        '<div class="p-4 border-t border-gray-200 space-y-2">' +
          '<button onclick="viewSimulationReport(\'' + sim.id + '\')" class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">View Report</button>' +
          variantBtn +
          '<button onclick="promptPromoteSimulationToPOR(\'' + sim.id + '\')" class="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium">⬆️ Promote to POR</button>' +
          '<button onclick="confirmDeleteSimulation(\'' + sim.id + '\')" class="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">🗑️ Delete</button>' +
        '</div>' +
      '</div>';
    };

    if (projects.length === 0 && allSimulations.length === 0) {
      return '<div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">' +
        '<div class="text-gray-400 text-4xl mb-3">📊</div>' +
        '<h4 class="text-md font-semibold text-gray-700 mb-2">No Simulations Yet</h4>' +
        '<p class="text-gray-600 text-sm">Go to Production Planning tab, configure your plan, then click "Generate New Simulation".</p>' +
      '</div>';
    }

    var html = '';
    if (projects.length > 0) {
      html += '<div class="mb-6"><h4 class="text-md font-semibold text-gray-700 mb-4">📁 Projects</h4><div class="space-y-6">';
      projects.forEach(function(project) {
        var sims = SimulationManager.getProjectSimulations(project.id);
        html += '<div class="border-2 border-purple-200 rounded-xl bg-purple-50/50 overflow-hidden">';
        html += '<div class="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex-1"><h5 class="font-bold text-purple-900">' + project.name + '</h5>' +
            (project.description ? '<p class="text-sm text-purple-700 mt-1">' + project.description + '</p>' : '') +
            '<p class="text-xs text-purple-600 mt-1">' + sims.length + ' simulation' + (sims.length !== 1 ? 's' : '') + ' • Created ' + formatDate(project.createdAt) + '</p></div>' +
            '<button onclick="deleteProject(\'' + project.id + '\')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm">Delete Project</button>' +
          '</div></div>';
        if (sims.length === 0) {
          html += '<div class="p-8 text-center"><p class="text-gray-500 text-sm">No simulations in this project yet</p></div>';
        } else {
          html += '<div class="p-4"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
          sims.forEach(function(sim) { html += renderSimCard(sim, true, project.id); });
          html += '</div></div>';
        }
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (standaloneSimulations.length > 0) {
      html += '<div><h4 class="text-md font-semibold text-gray-700 mb-4">🔬 Standalone Simulations</h4>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
      standaloneSimulations.forEach(function(sim) { html += renderSimCard(sim, false, null); });
      html += '</div></div>';
    }

    return html;
  })();

  // --- Render full tab ---
  tabContent.innerHTML =
    '<div class="space-y-8">' +

    // Latest Simulation section
    '<div>' +
      '<div class="mb-4">' +
        '<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">' +
          '<span class="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>' +
          'Latest Simulation' +
        '</h3>' +
        '<p class="text-sm text-slate-600 mt-1 ml-10">Most recent simulation output, summary metrics, and truth table.</p>' +
      '</div>' +
      (latestSimHtml || '<div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">' +
        '<div class="text-gray-400 text-5xl mb-4">📊</div>' +
        '<h4 class="text-lg font-semibold text-gray-700 mb-2">No Simulation Generated Yet</h4>' +
        '<p class="text-gray-600 mb-4">Go to the <button onclick="switchProductionPlanTab(\'generate\')" class="text-blue-600 font-semibold hover:underline" style="cursor:pointer;">Production Planning</button> tab, configure your plan, then click "Generate New Simulation".</p>' +
      '</div>') +
    '</div>' +

    // Simulation Library section
    '<div>' +
      '<div class="mb-4 flex items-center justify-between">' +
        '<div>' +
          '<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">' +
            '<span class="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>' +
            'Simulation Library' +
          '</h3>' +
          '<p class="text-sm text-slate-600 mt-1 ml-10">Saved simulations ready to promote to POR.</p>' +
        '</div>' +
        '<div class="flex gap-2">' +
          '<button onclick="openCreateProjectDialog()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">+ New Project</button>' +
        '</div>' +
      '</div>' +
      '<div class="space-y-4">' + simLibHtml + '</div>' +
    '</div>' +

    '</div>';
}

// 2.0 Merged Production Planning Page (single scrollable view)
function renderProductionPlanMerged() {
  const tabContent = document.getElementById('tabContent');
  if (!tabContent) return;

  const state = window.productionPlanState;

  // Initialize engine with seed data if not exists
  if (!state.engine) {
    state.engine = new ProductionPlanEngine(PRODUCTION_PLAN_SEED_DATA);
  }

  // Load latest forecast data from localStorage
  const forecastVersions = JSON.parse(localStorage.getItem('productionPlan_forecast_versions') || '[]');
  if (forecastVersions.length > 0) {
    const latestForecast = forecastVersions[forecastVersions.length - 1];
    PRODUCTION_PLAN_SEED_DATA.weeklyDemand = latestForecast.data.map(function(row) {
      return {
        week_id: row.week_id,
        program_id: 'product_a',
        demand_qty: row.weekly_forecast,
        notes: 'From ' + latestForecast.fileName
      };
    });
  }

  // --- Plan Results computation (only if results exist) ---
  var planResultsHtml = '';

  if (state.planResults) {
    var isCombinedMode = state.planResults.mode === 'combined';
    var results = isCombinedMode ? state.planResults.unconstrained : state.planResults;
    var resultsConstrained = isCombinedMode ? state.planResults.constrained : null;
    var weeklyMetrics = (results && results.weeklyMetrics) ? results.weeklyMetrics : [];
    var granularity = state.viewGranularity || 'weekly';
    var periodLabel = granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly';
    var dateColLabel = granularity === 'daily' ? 'Date' : granularity === 'weekly' ? 'Week' : 'Month';

    var currentData = [];
    var hasMoreData = false;

    if (results && results.programResults) {
      var today = new Date();
      var currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay());

      if (granularity === 'weekly') {
        currentData = weeklyMetrics.slice(0, 4);
        hasMoreData = weeklyMetrics.length > 4;
      } else if (granularity === 'monthly') {
        var monthlyData = aggregateByMonth(results.programResults);
        var currentMonth = today.getMonth() + 1;
        var currentYear = today.getFullYear();
        currentData = monthlyData.filter(function(m) {
          if (!m.month_id) return false;
          var parts = m.month_id.split('-').map(Number);
          return parts[0] === currentYear && parts[1] >= currentMonth;
        });
        hasMoreData = monthlyData.length > currentData.length;
      } else {
        var twoWeeksLater = new Date(currentWeekStart);
        twoWeeksLater.setDate(currentWeekStart.getDate() + 14);
        var twoWeeksLaterStr = twoWeeksLater.toISOString().split('T')[0];
        var currentWeekStartStr = currentWeekStart.toISOString().split('T')[0];
        currentData = results.programResults.filter(function(d) {
          return d.date >= currentWeekStartStr && d.date < twoWeeksLaterStr;
        });
        hasMoreData = results.programResults.length > currentData.length;
      }
    }

    state.hasMoreData = hasMoreData;

    var thisWeekSaturday = '2026-01-25';
    var yearEnd = '2026-12-31';
    var weekSummary = results && results.programResults ?
      calculateCutoffSummary(results.programResults, thisWeekSaturday) :
      { cumForecast: 0, cumCTB: 0, cumCapacity: 0, cumShip: 0, gap: 0 };
    var yearSummary = results && results.programResults ?
      calculateCutoffSummary(results.programResults, yearEnd) :
      { cumForecast: 0, cumCTB: 0, cumCapacity: 0, cumShip: 0, gap: 0 };
    var constraintAnalysis = results && results.programResults ?
      analyzePrimaryConstraint(results.programResults) :
      { primaryConstraint: 'Mixed', ctbLimitedDays: 0, capacityLimitedDays: 0, ctbLimitedUnits: 0, capacityLimitedUnits: 0, ctbLimitedPct: '0', capacityLimitedPct: '0' };

    // Build POR badge HTML
    var porBadgeHtml = '';
    var porVersion = typeof getCurrentPOR === 'function' ? getCurrentPOR() : null;
    if (porVersion) {
      porBadgeHtml = '<div class="border-l pl-4">' +
        '<div class="text-xs text-slate-600 mb-1">Plan of Record</div>' +
        '<div class="flex items-center gap-2">' +
        '<span class="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded font-bold">★ POR</span>' +
        '<span class="font-semibold text-slate-900 text-xs">' + porVersion.version + '</span>' +
        '</div></div>';
    }

    // Build constraint description
    var constraintDesc = '';
    if (constraintAnalysis.primaryConstraint === 'CTB') {
      constraintDesc = 'CTB limited ' + constraintAnalysis.ctbLimitedPct + '% of days (' + constraintAnalysis.ctbLimitedUnits.toLocaleString() + ' units short)';
    } else if (constraintAnalysis.primaryConstraint === 'Capacity') {
      constraintDesc = 'Capacity limited ' + constraintAnalysis.capacityLimitedPct + '% of days (' + constraintAnalysis.capacityLimitedUnits.toLocaleString() + ' units short)';
    } else {
      constraintDesc = 'Both capacity and materials are sufficient';
    }

    // Build constrained header columns
    var constrainedHeaderGroup = '';
    var constrainedSubHeaders = '';
    if (isCombinedMode) {
      constrainedHeaderGroup = '<th class="px-2 py-2 text-center font-bold border-r-2 bg-purple-50" colspan="6">Reality Track<br/><span class="text-xs font-normal">(Constrained)</span></th>';
      constrainedSubHeaders =
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">' + periodLabel + '<br/>Input</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">Cum<br/>Input</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">' + periodLabel + '<br/>Output</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">Cum<br/>Output</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50">' + periodLabel + '<br/>Ship</th>' +
        '<th class="px-2 py-2 text-right font-semibold bg-purple-50 border-r-2">Cum<br/>Ship</th>';
    }

    // Build truth table rows
    var truthTableRows = currentData.map(function(row, idx) {
      var dateLabel = granularity === 'daily' ? row.date :
                       granularity === 'weekly' ? getWeekDisplayDate(row.week_id) : row.month_id;
      var isSunday = granularity === 'daily' && DateUtils.isSunday(row.date);
      var cumForecast = row.cum_demand || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + (r.demand || 0); }, 0) : row.demand || 0);
      var cumCTB = idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((r.ctb_available || r.capacity_unconstrained) || 0); }, 0) : (row.ctb_available || row.capacity_unconstrained || 0);
      var cumCapacity = idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + (r.capacity_unconstrained || 0); }, 0) : (row.capacity_unconstrained || 0);
      var dailyInput = granularity === 'daily' ? (row.input_final || 0) : (row.input || 0);
      var cumInput = row.cum_input || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((granularity === 'daily' ? r.input_final : r.input) || 0); }, 0) : dailyInput);
      var dailyOutput = granularity === 'daily' ? (row.output_final || 0) : (row.output || 0);
      var cumOutput = row.cum_output || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((granularity === 'daily' ? r.output_final : r.output) || 0); }, 0) : dailyOutput);
      var dailyShip = granularity === 'daily' ? (row.shipment_final || 0) : (row.shipments || 0);
      var cumShip = row.cum_shipment || (idx > 0 ? currentData.slice(0, idx + 1).reduce(function(sum, r) { return sum + ((granularity === 'daily' ? r.shipment_final : r.shipments) || 0); }, 0) : dailyShip);
      var gap = cumShip - cumForecast;
      var bindingDriver = granularity === 'daily' ? getDailyConstraint(row) : '-';

      var constrainedCells = '';
      if (isCombinedMode && resultsConstrained) {
        var constrainedData = granularity === 'weekly' ?
          resultsConstrained.weeklyMetrics : granularity === 'monthly' ?
          aggregateByMonth(resultsConstrained.programResults) : resultsConstrained.programResults;
        var rowC = constrainedData[idx];
        if (rowC) {
          var dIC = granularity === 'daily' ? (rowC.input_final || 0) : (rowC.input || 0);
          var cIC = rowC.cum_input || dIC;
          var dOC = granularity === 'daily' ? (rowC.output_final || 0) : (rowC.output || 0);
          var cOC = rowC.cum_output || dOC;
          var dSC = granularity === 'daily' ? (rowC.shipment_final || 0) : (rowC.shipments || 0);
          var cSC = rowC.cum_shipment || dSC;
          constrainedCells =
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(dIC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(cIC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(dOC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700">' + Math.round(cOC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700 font-semibold">' + Math.round(dSC).toLocaleString() + '</td>' +
            '<td class="px-2 py-2 text-right font-mono text-purple-700 font-semibold border-r-2">' + Math.round(cSC).toLocaleString() + '</td>';
        }
      }

      var bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
      var gapColor = gap >= 0 ? 'text-green-700' : 'text-red-700';
      var driverColor = bindingDriver === 'CTB' ? 'text-orange-700' : bindingDriver === 'Capacity' ? 'text-red-700' : 'text-slate-500';

      return '<tr class="' + bgColor + (isSunday ? ' text-slate-400' : '') + ' hover:bg-blue-50 border-b">' +
        '<td class="px-2 py-2 font-mono text-xs border-r-2">' + dateLabel + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(cumForecast).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono border-r-2">' + Math.round(cumCTB).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(row.capacity_unconstrained || 0).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono border-r-2">' + Math.round(cumCapacity).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(dailyInput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(cumInput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(dailyOutput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono">' + Math.round(cumOutput).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono text-blue-700">' + Math.round(dailyShip).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-right font-mono text-blue-700' + (isCombinedMode ? '' : ' border-r-2') + '">' + Math.round(cumShip).toLocaleString() + '</td>' +
        constrainedCells +
        '<td class="px-2 py-2 text-right font-mono ' + gapColor + ' font-semibold">' + (gap >= 0 ? '+' : '') + Math.round(gap).toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-center text-xs font-semibold ' + driverColor + '">' + bindingDriver + '</td>' +
        '</tr>';
    }).join('');

    var constraintColor = constraintAnalysis.primaryConstraint === 'CTB' ? 'text-orange-700' : constraintAnalysis.primaryConstraint === 'Capacity' ? 'text-red-700' : 'text-green-700';
    var constraintLabel = constraintAnalysis.primaryConstraint === 'CTB' ? '📦 CTB-limited' : constraintAnalysis.primaryConstraint === 'Capacity' ? '⚙️ Capacity-limited' : '✅ No binding constraint';
    var yearGapColor = yearSummary.gap >= 0 ? 'text-green-700' : 'text-red-700';
    var weekGapColor = weekSummary.gap >= 0 ? 'text-green-700' : 'text-red-700';
    var combinedModeLabel = isCombinedMode ? '<span class="ml-2 text-xs font-normal text-blue-600">(Combined View: Unconstrained vs Constrained)</span>' : '';
    var realityTrackLabel = isCombinedMode ? 'Reality Track<br/><span class="text-xs font-normal">(Unconstrained)</span>' : 'Reality Track';
    var cumShipBorderClass = isCombinedMode ? '' : ' border-r-2';

    planResultsHtml =
      '<!-- Context Header -->' +
      '<div class="bg-white border rounded-xl p-4">' +
        '<div class="flex items-center justify-between flex-wrap gap-3">' +
          '<div class="flex items-center gap-4">' +
            '<div><div class="text-xs text-slate-600 mb-1">Program</div><div class="font-semibold text-slate-900">Product A</div></div>' +
            '<div class="border-l pl-4"><div class="text-xs text-slate-600 mb-1">Date Range</div><div class="font-semibold text-slate-900">' + state.startDate + ' to ' + state.endDate + '</div></div>' +
            '<div class="border-l pl-4"><div class="text-xs text-slate-600 mb-1">Sites</div><div class="font-semibold text-slate-900">' + (state.site === 'all' ? 'All Sites' : state.site) + '</div></div>' +
            '<div class="border-l pl-4"><div class="text-xs text-slate-600 mb-1">Last Updated</div><div class="font-semibold text-slate-900">' + new Date().toLocaleString() + '</div></div>' +
            porBadgeHtml +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<button onclick="viewAllHistoricVersions()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">📚 Historic Versions</button>' +
            '<button onclick="exportLatestProductionPlan()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">📊 Export Excel</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- What this page shows -->' +
      '<div class="bg-blue-50 border border-blue-200 rounded-xl p-5">' +
        '<div class="text-sm font-bold text-slate-900 mb-2">What this page shows:</div>' +
        '<div class="text-sm text-slate-700 leading-relaxed mb-3">This plan shows two truths at once: what we <strong>could build</strong> (Capacity) and what we <strong>can actually build</strong> (Materials/CTB) — so you can quickly see whether a gap is driven by capacity readiness or material readiness.</div>' +
        '<div class="text-sm text-slate-700 leading-relaxed"><strong>How to read it:</strong> If Capacity is healthy but Input/Ship is capped, the constraint is likely CTB/materials. If Capacity itself is below demand, the constraint is capacity/line readiness.</div>' +
      '</div>' +

      '<!-- Summary Strip -->' +
      '<div class="grid grid-cols-2 gap-6">' +
        '<div class="border-2 border-blue-300 bg-blue-50 rounded-xl p-5 shadow-sm">' +
          '<div class="text-sm font-bold text-blue-900 mb-4">Cut-off: This Week (Sat, Jan 25, 2026)</div>' +
          '<div class="space-y-3">' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Forecast</span><span class="text-lg font-bold text-slate-900">' + (weekSummary.cumForecast / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Capacity</span><span class="text-lg font-bold text-slate-900">' + (weekSummary.cumCapacity / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum CTB</span><span class="text-lg font-bold text-slate-900">' + (weekSummary.cumCTB / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline border-t-2 border-blue-200 pt-3 mt-3"><span class="text-xs text-slate-700">Cum Ship</span><span class="text-lg font-bold text-blue-700">' + (weekSummary.cumShip / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Gap vs Forecast</span><span class="text-lg font-bold ' + weekGapColor + '">' + (weekSummary.gap >= 0 ? '+' : '') + (weekSummary.gap / 1000).toFixed(1) + 'k</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="border-2 border-slate-300 bg-slate-50 rounded-xl p-5 shadow-sm">' +
          '<div class="text-sm font-bold text-slate-900 mb-4">Cut-off: Year End (Dec 31, 2026)</div>' +
          '<div class="space-y-3">' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Forecast</span><span class="text-lg font-bold text-slate-900">' + (yearSummary.cumForecast / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum Capacity</span><span class="text-lg font-bold text-slate-900">' + (yearSummary.cumCapacity / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Cum CTB</span><span class="text-lg font-bold text-slate-900">' + (yearSummary.cumCTB / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline border-t-2 border-slate-200 pt-3 mt-3"><span class="text-xs text-slate-700">Cum Ship</span><span class="text-lg font-bold text-blue-700">' + (yearSummary.cumShip / 1000).toFixed(1) + 'k</span></div>' +
            '<div class="flex justify-between items-baseline"><span class="text-xs text-slate-700">Gap vs Forecast</span><span class="text-lg font-bold ' + yearGapColor + '">' + (yearSummary.gap >= 0 ? '+' : '') + (yearSummary.gap / 1000).toFixed(1) + 'k</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Primary Constraint -->' +
      '<div class="bg-white border-2 rounded-xl p-4 shadow-sm">' +
        '<div class="flex items-center justify-between flex-wrap gap-3">' +
          '<div><div class="text-xs font-bold text-slate-500 mb-1">PRIMARY BINDING CONSTRAINT (THIS PERIOD)</div><div class="text-lg font-bold ' + constraintColor + '">' + constraintLabel + '</div></div>' +
          '<div><div class="text-xs font-bold text-slate-500 mb-1">GAP (YEAR END: DELIVERABLE VS FORECAST)</div><div class="text-lg font-bold ' + yearGapColor + '">' + (yearSummary.gap >= 0 ? '+' : '') + (yearSummary.gap / 1000).toFixed(1) + 'k units</div></div>' +
          '<div class="text-sm text-slate-600">' + constraintDesc + '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Granularity Toggle -->' +
      '<div class="flex items-center justify-between">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-sm font-semibold text-slate-700">View:</span>' +
          '<div class="flex gap-2">' +
            '<button onclick="switchPlanGranularity(\'daily\')" class="px-4 py-2 rounded-lg text-sm font-semibold ' + (granularity === 'daily' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700') + '">Daily</button>' +
            '<button onclick="switchPlanGranularity(\'weekly\')" class="px-4 py-2 rounded-lg text-sm font-semibold ' + (granularity === 'weekly' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700') + '">Weekly</button>' +
            '<button onclick="switchPlanGranularity(\'monthly\')" class="px-4 py-2 rounded-lg text-sm font-semibold ' + (granularity === 'monthly' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700') + '">Monthly</button>' +
          '</div>' +
        '</div>' +
        '<div class="flex gap-2"><button onclick="viewLatestPlanFullReport()" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition">📊 View Full Report</button></div>' +
      '</div>' +

      '<!-- Truth Table -->' +
      '<div class="bg-white border-2 rounded-xl p-6 shadow-sm">' +
        '<div class="text-sm font-bold text-slate-900 mb-4">Production Plan Truth Table ' + combinedModeLabel + '</div>' +
        '<div class="overflow-x-auto">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead class="bg-slate-100">' +
              '<tr class="border-b-2">' +
                '<th class="px-2 py-2 text-left font-bold border-r-2" rowspan="2">' + dateColLabel + '</th>' +
                '<th class="px-2 py-2 text-center font-bold border-r-2 bg-slate-200" colspan="2">Demand / Supply</th>' +
                '<th class="px-2 py-2 text-center font-bold border-r-2 bg-blue-50" colspan="2">Capacity Track</th>' +
                '<th class="px-2 py-2 text-center font-bold border-r-2 bg-green-50" colspan="6">' + realityTrackLabel + '</th>' +
                constrainedHeaderGroup +
                '<th class="px-2 py-2 text-center font-bold bg-orange-50" colspan="2">Gap / Constraint</th>' +
              '</tr>' +
              '<tr class="border-b-2">' +
                '<th class="px-2 py-2 text-right font-semibold bg-slate-200">Cum<br/>Forecast</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-slate-200 border-r-2">Cum<br/>CTB</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-blue-50">' + periodLabel + '<br/>Capacity</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-blue-50 border-r-2">Cum<br/>Capacity</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">' + periodLabel + '<br/>Input</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">Cum<br/>Input</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">' + periodLabel + '<br/>Output</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">Cum<br/>Output</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50">' + periodLabel + '<br/>Ship</th>' +
                '<th class="px-2 py-2 text-right font-semibold bg-green-50' + cumShipBorderClass + '">Cum<br/>Ship</th>' +
                constrainedSubHeaders +
                '<th class="px-2 py-2 text-right font-semibold bg-orange-50">Gap<br/>(Cum)</th>' +
                '<th class="px-2 py-2 text-center font-semibold bg-orange-50">Binding<br/>Driver</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + truthTableRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
  } // end if (state.planResults)

  // --- Simulation Library HTML ---
  var simLibraryHtml = (function() {
    var projects = SimulationManager.getProjects();
    var allSimulations = SimulationManager.getSimulations();
    var projectSimIds = new Set();
    projects.forEach(function(proj) { proj.simulationIds.forEach(function(id) { projectSimIds.add(id); }); });
    var standaloneSimulations = allSimulations.filter(function(sim) { return !projectSimIds.has(sim.id); });

    var formatNumber = function(num) { return num.toLocaleString('en-US'); };
    var formatDate = function(dateStr) {
      var date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    var renderSimCard = function(sim, showVariantButton, projectId) {
      var summary = sim.results.summary;
      var weeklyM = sim.results.weeklyMetrics;
      var weeksWithGap = weeklyM.filter(function(w) { return w.gap < 0; });
      var gapColor = weeksWithGap.length === 0 ? 'text-green-600' : 'text-red-600';

      var variantBtn = '';
      if (showVariantButton && projectId) {
        variantBtn = '<button onclick="createVariantFromSimulation(\'' + projectId + '\', \'' + sim.id + '\')" class="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">+ Create Variant</button>';
      }

      return '<div class="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">' +
        '<div class="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">' +
          '<div class="flex items-start justify-between">' +
            '<div class="flex-1"><h4 class="font-semibold text-gray-800 mb-1">' + sim.name + '</h4>' +
            (sim.description ? '<p class="text-xs text-gray-600">' + sim.description + '</p>' : '') +
            '</div><span class="text-2xl">📊</span>' +
          '</div>' +
        '</div>' +
        '<div class="p-4 space-y-2 text-sm border-b border-gray-100">' +
          '<div class="flex justify-between"><span class="text-gray-600">Created:</span><span class="font-medium text-gray-800">' + formatDate(sim.createdAt) + '</span></div>' +
          '<div class="flex justify-between"><span class="text-gray-600">Output:</span><span class="font-medium text-gray-800">' + formatNumber(summary.totalOutput) + ' units</span></div>' +
          '<div class="flex justify-between"><span class="text-gray-600">Attainment:</span><span class="font-medium text-gray-800">' + summary.overallAttainment.toFixed(1) + '%</span></div>' +
          '<div class="flex justify-between"><span class="text-gray-600">Gap Weeks:</span><span class="font-medium ' + gapColor + '">' + weeksWithGap.length + '</span></div>' +
        '</div>' +
        '<div class="p-4 border-t border-gray-200 space-y-2">' +
          '<button onclick="viewSimulationReport(\'' + sim.id + '\')" class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">View Report</button>' +
          variantBtn +
          '<button onclick="promptPromoteSimulationToPOR(\'' + sim.id + '\')" class="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium">⬆️ Promote to POR</button>' +
          '<button onclick="confirmDeleteSimulation(\'' + sim.id + '\')" class="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">🗑️ Delete</button>' +
        '</div>' +
      '</div>';
    };

    if (projects.length === 0 && allSimulations.length === 0) {
      return '<div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">' +
        '<div class="text-gray-400 text-4xl mb-3">📊</div>' +
        '<h4 class="text-md font-semibold text-gray-700 mb-2">No Simulations Yet</h4>' +
        '<p class="text-gray-600 text-sm">Generate your first simulation above, then it will appear here.</p>' +
      '</div>';
    }

    var html = '';

    if (projects.length > 0) {
      html += '<div class="mb-6"><h4 class="text-md font-semibold text-gray-700 mb-4">📁 Projects</h4><div class="space-y-6">';
      projects.forEach(function(project) {
        var sims = SimulationManager.getProjectSimulations(project.id);
        html += '<div class="border-2 border-purple-200 rounded-xl bg-purple-50/50 overflow-hidden">';
        html += '<div class="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex-1"><h5 class="font-bold text-purple-900">' + project.name + '</h5>' +
            (project.description ? '<p class="text-sm text-purple-700 mt-1">' + project.description + '</p>' : '') +
            '<p class="text-xs text-purple-600 mt-1">' + sims.length + ' simulation' + (sims.length !== 1 ? 's' : '') + ' • Created ' + formatDate(project.createdAt) + '</p></div>' +
            '<button onclick="deleteProject(\'' + project.id + '\')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm">Delete Project</button>' +
          '</div></div>';
        if (sims.length === 0) {
          html += '<div class="p-8 text-center"><p class="text-gray-500 text-sm">No simulations in this project yet</p></div>';
        } else {
          html += '<div class="p-4"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
          sims.forEach(function(sim) { html += renderSimCard(sim, true, project.id); });
          html += '</div></div>';
        }
        html += '</div>';
      });
      html += '</div></div>';
    }

    if (standaloneSimulations.length > 0) {
      html += '<div><h4 class="text-md font-semibold text-gray-700 mb-4">🔬 Standalone Simulations</h4>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
      standaloneSimulations.forEach(function(sim) { html += renderSimCard(sim, false, null); });
      html += '</div></div>';
    }

    return html;
  })();

  // --- Build full merged page ---
  tabContent.innerHTML = `
    <div class="space-y-8">

      <!-- ========== SECTION 1: Plan Inputs ========== -->
      <div>
        <div class="mb-4">
          <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
            Plan Inputs
          </h3>
          <p class="text-sm text-slate-600 mt-1 ml-10">Upload forecast & CTB data, configure capacity and working parameters.</p>
        </div>

        <div class="space-y-4 ml-0">
          <!-- AI Assistant Tip -->
          <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-5">
            <div class="flex items-start gap-3">
              <span class="text-3xl">💡</span>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-purple-900 mb-2">New to Production Planning?</h3>
                <p class="text-sm text-purple-700 mb-3">
                  Not sure how to configure your plan? Use our <strong>AI Assistant</strong> to help you get started!
                  Just describe what you want in plain language.
                </p>
                <div class="flex gap-2">
                  <button
                    onclick="openProductionPlanAIChat()"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-sm flex items-center gap-2">
                    💬 AI Assistant
                  </button>
                  <div class="text-xs text-purple-600 self-center italic">
                    Try: "Create a 90-day plan for SZ and WH sites with Sunday OT"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Forecast Section -->
          <div class="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 cursor-pointer" onclick="toggleSection('forecastContent', 'forecastToggle')">
              <div class="flex items-center gap-3">
                <span id="forecastToggle" class="text-purple-600 text-lg transition-transform">▼</span>
                <div>
                  <div class="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <span>📊</span>
                    <span>Demand Forecast</span>
                  </div>
                  <div class="text-sm text-slate-600 mt-1">Upload and manage weekly forecast data</div>
                </div>
              </div>
              <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button onclick="uploadForecast()" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center gap-2">
                  <span>📤</span>
                  <span>Upload</span>
                </button>
                <button onclick="viewForecastHistory()" class="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 flex items-center gap-2">
                  <span>📜</span>
                  <span>History</span>
                </button>
                <button onclick="compareForecastVersions()" class="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 flex items-center gap-2">
                  <span>🔄</span>
                  <span>Compare</span>
                </button>
                <button onclick="deleteCurrentForecast()" class="px-4 py-2 border border-red-600 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center gap-2">
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
            <div id="forecastContent" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div class="text-sm text-purple-900 mb-3">
                <span class="font-semibold">Version:</span> <span id="forecastVersion">Not uploaded</span> |
                <span class="font-semibold">Released:</span> <span id="forecastReleaseDate">-</span>
              </div>
              <div class="text-sm font-semibold text-purple-900 mb-2">Recent 4 Weeks Summary:</div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead class="bg-purple-100">
                    <tr>
                      <th class="px-3 py-2 text-left">Week</th>
                      <th class="px-3 py-2 text-right">Weekly Forecast</th>
                      <th class="px-3 py-2 text-right">Cum Forecast</th>
                    </tr>
                  </thead>
                  <tbody id="forecastSummaryTable">
                    <tr><td colspan="3" class="px-3 py-4 text-center text-slate-500">No forecast data uploaded yet</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-3 text-center">
                <button onclick="viewAllForecastWeeks()" class="text-sm text-purple-600 hover:text-purple-800 font-semibold">
                  👁️ View All Weekly Details →
                </button>
              </div>
            </div>
          </div>

          <!-- CTB Section -->
          <div class="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 cursor-pointer" onclick="toggleSection('ctbContent', 'ctbToggle')">
              <div class="flex items-center gap-3">
                <span id="ctbToggle" class="text-orange-600 text-lg transition-transform">▼</span>
                <div>
                  <div class="text-lg font-bold text-orange-900 flex items-center gap-2">
                    <span>📦</span>
                    <span>CTB (Clear to Build)</span>
                  </div>
                  <div class="text-sm text-slate-600 mt-1">Upload and manage weekly CTB data by site</div>
                </div>
              </div>
              <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button onclick="uploadCTB()" class="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 flex items-center gap-2">
                  <span>📤</span>
                  <span>Upload</span>
                </button>
                <button onclick="viewCTBHistory()" class="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-50 flex items-center gap-2">
                  <span>📜</span>
                  <span>History</span>
                </button>
                <button onclick="compareCTBVersions()" class="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-50 flex items-center gap-2">
                  <span>🔄</span>
                  <span>Compare</span>
                </button>
              </div>
            </div>
            <div id="ctbContent" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div class="text-sm text-orange-900 mb-3">
                <span class="font-semibold">Version:</span> <span id="ctbVersion">Not uploaded</span> |
                <span class="font-semibold">Updated:</span> <span id="ctbUpdateDate">-</span>
              </div>
              <div class="text-sm font-semibold text-orange-900 mb-2">Recent 4 Weeks Summary (by Site):</div>
              <div id="ctbSummaryBySite" class="space-y-4">
                <div class="text-center text-slate-500 py-4">No CTB data uploaded yet</div>
              </div>
              <div class="mt-3 text-center">
                <button onclick="viewAllCTBWeeks()" class="text-sm text-orange-600 hover:text-orange-800 font-semibold">
                  👁️ View All Weekly Details →
                </button>
              </div>
            </div>
          </div>

          <!-- Configure Panel -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <div class="text-xl font-bold text-slate-900">Production Plan Configuration</div>
                <div class="text-sm text-slate-600 mt-1">Add capacity units (Site → Line → Shift) to define what the report will cover</div>
              </div>
              <div class="flex gap-2">
                <button id="saveConfigBtn" onclick="saveAllConfiguration()"
                        class="px-6 py-3 bg-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-300 whitespace-nowrap flex items-center justify-center gap-2"
                        title="Save all configuration changes to browser storage">
                  <span>✅ Configuration Saved</span>
                </button>
                <button onclick="resetToDefaultConfig()"
                        class="px-6 py-3 border-2 border-slate-300 rounded-lg text-sm text-slate-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700 font-semibold"
                        title="Reset to default sites and lines from seed data file">
                  🔄 Reset to Default
                </button>
              </div>
            </div>

            <div class="space-y-6">
              <!-- Section 1: Program & Timeline -->
              <div class="bg-white rounded-lg border border-blue-200 p-5">
                <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span>📦</span>
                  <span>Program & Timeline</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">Program</label>
                    <div class="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm text-slate-700">Product A</div>
                  </div>
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">Vendor</label>
                    <div class="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm text-slate-700">Vendor X</div>
                  </div>
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">Start Date</label>
                    <input type="date" id="configStartDate" value="2026-10-01" class="w-full border rounded px-3 py-2 text-sm" onchange="validateReportDateRange(); markConfigAsModified();">
                  </div>
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">End Date</label>
                    <input type="date" id="configEndDate" value="2026-10-31" class="w-full border rounded px-3 py-2 text-sm" onchange="validateReportDateRange(); markConfigAsModified();">
                    <div id="endDateError" class="text-xs text-red-600 mt-1 hidden"></div>
                  </div>
                </div>
              </div>

              <!-- Section 2: Capacity Configuration -->
              <div class="bg-white rounded-lg border border-blue-200 p-5">
                <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span>🏭</span>
                  <span>Capacity Configuration (Site → Line → Shift)</span>
                </div>
                <div id="capacitySitesContainer" class="space-y-6"></div>
                <div class="mt-4">
                  <button onclick="addSiteCapacity()"
                          class="w-full border-2 border-dashed border-blue-300 rounded-lg py-3 text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-50 font-semibold">
                    + Add Site
                  </button>
                </div>
              </div>

              <!-- Section 3: Working Parameters -->
              <div class="bg-white rounded-lg border border-blue-200 p-5">
                <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 cursor-pointer" onclick="toggleSection('workingParamsContent', 'workingParamsToggle')">
                  <span id="workingParamsToggle" class="text-blue-600 transition-transform">▼</span>
                  <span>⏰</span>
                  <span>Working Parameters</span>
                </div>
                <div id="workingParamsContent" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-1">Default Shift Hours</label>
                      <input type="number" id="configShiftHours" value="10" min="1" max="24" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                      <div class="text-xs text-slate-500 mt-1">Hours per shift (can be overridden per line)</div>
                    </div>
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-1">Working Days Pattern</label>
                      <select id="configWorkingDays" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                        <option value="MON_SAT" selected>Mon-Sat (6 days)</option>
                        <option value="MON_FRI">Mon-Fri (5 days)</option>
                        <option value="MON_SUN">Mon-Sun (7 days)</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-1">Shipment Lag (Workdays)</label>
                      <input type="number" id="configShipmentLag" value="2" min="0" max="10" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                      <div class="text-xs text-slate-500 mt-1">Days from output to shipment-ready</div>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-1">Max Daily Shipment (Units)</label>
                      <input type="number" id="configMaxDailyShipment" value="30000" min="0" step="1000" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                      <div class="text-xs text-slate-500 mt-1">Maximum units that can ship per day (logistics limit)</div>
                    </div>
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-1">📦 Pallet Size (Units/Pallet)</label>
                      <input type="number" id="configPalletSize" value="480" min="1" step="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                      <div class="text-xs text-slate-500 mt-1">Shipment will be rounded to multiples of this (e.g., 480 = full pallets only)</div>
                    </div>
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-1">Shipment Start Date</label>
                      <input type="date" id="configShipmentStartDate" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                      <div class="text-xs text-slate-500 mt-1">First date when shipment can begin (leave empty to use forecast start date)</div>
                    </div>
                  </div>
                </div>

                <div class="mt-4 col-span-full">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="configConsiderHolidays" checked class="rounded" onchange="markConfigAsModified()">
                    <span class="text-sm font-semibold text-slate-700">Consider holidays when calculating working days</span>
                  </label>
                </div>

                <div class="mt-3 col-span-full flex gap-3">
                  <div class="flex-1">
                    <button onclick="openHolidayCalendarManager()"
                            class="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-sm flex items-center justify-center gap-2">
                      <span>📅</span>
                      <span>Manage Holiday Calendar</span>
                      <span class="text-xs opacity-75">(China & Vietnam 2026)</span>
                    </button>
                    <div class="text-xs text-slate-500 mt-1">Configure public holidays for sites</div>
                  </div>
                  <div class="flex-1">
                    <button onclick="openCurvePresetsManager()"
                            class="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-teal-700 shadow-sm flex items-center justify-center gap-2">
                      <span>📈</span>
                      <span>Manage Curve Presets</span>
                      <span class="text-xs opacity-75">(UPH & Yield)</span>
                    </button>
                    <div class="text-xs text-slate-500 mt-1">Configure default ramp curves</div>
                  </div>
                </div>

                <!-- Inventory Audit Configuration -->
                <div class="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                  <div class="flex items-center justify-between mb-3 cursor-pointer" onclick="toggleSection('inventoryAuditContent', 'inventoryAuditToggle')">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">📦</span>
                      <div class="font-bold text-purple-900">Inventory Audit</div>
                    </div>
                    <span id="inventoryAuditToggle" class="text-purple-600 text-xl transition-transform">▼</span>
                  </div>
                  <div id="inventoryAuditContent">
                    <div class="text-xs text-purple-700 mb-4">
                      Semi-annual inventory audit required by Customs and Finance. Complete production halt during audit (no input, no output, no shipment)
                    </div>
                    <div class="mb-4">
                      <label class="text-xs text-slate-600 font-semibold block mb-2">Middle Year</label>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="text-xs text-slate-500 block mb-1">Days</label>
                          <select id="configAuditMiddleDays" class="w-full border rounded px-3 py-2 text-sm" onchange="updateAuditDates('middle'); markConfigAsModified();">
                            <option value="1" selected>1 day</option>
                            <option value="2">2 days</option>
                          </select>
                        </div>
                        <div id="configAuditMiddleDatesContainer">
                          <label class="text-xs text-slate-500 block mb-1">Date</label>
                          <input type="date" id="configAuditMiddleDate1" value="2026-06-30" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="text-xs text-slate-600 font-semibold block mb-2">End Year</label>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="text-xs text-slate-500 block mb-1">Days</label>
                          <select id="configAuditEndDays" class="w-full border rounded px-3 py-2 text-sm" onchange="updateAuditDates('end'); markConfigAsModified();">
                            <option value="1" selected>1 day</option>
                            <option value="2">2 days</option>
                          </select>
                        </div>
                        <div id="configAuditEndDatesContainer">
                          <label class="text-xs text-slate-500 block mb-1">Date</label>
                          <input type="date" id="configAuditEndDate1" value="2026-12-31" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 4: Output Flow-Time Factors -->
              <div class="bg-white rounded-lg border border-blue-200 p-5">
                <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 cursor-pointer" onclick="toggleSection('flowTimeContent', 'flowTimeToggle')">
                  <span id="flowTimeToggle" class="text-blue-600 transition-transform">▼</span>
                  <span>📈</span>
                  <span>Output Flow-Time Factors</span>
                </div>
                <div id="flowTimeContent" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">Day 1 Factor</label>
                    <input type="number" id="configDay1Factor" value="0.5" step="0.1" min="0" max="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                    <div class="text-xs text-slate-500 mt-1">First day output multiplier</div>
                  </div>
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">Day 2 Factor</label>
                    <input type="number" id="configDay2Factor" value="1.0" step="0.1" min="0" max="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                    <div class="text-xs text-slate-500 mt-1">Second day output multiplier</div>
                  </div>
                  <div>
                    <label class="text-xs text-slate-600 font-semibold block mb-1">Day 3+ Factor</label>
                    <input type="number" id="configDay3Factor" value="1.0" step="0.1" min="0" max="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                    <div class="text-xs text-slate-500 mt-1">Day 3+ output multiplier</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Configuration Tips -->
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <div class="text-2xl">💡</div>
              <div class="flex-1">
                <div class="font-semibold text-amber-900 mb-1">Configuration Tips</div>
                <ul class="text-sm text-amber-800 space-y-1">
                  <li>• Use the hierarchical structure: Add <strong>Site</strong> → Add <strong>Line</strong> → Add <strong>Shift</strong></li>
                  <li>• Configure holiday schedules at the <strong>site level</strong> (follow legal holidays or custom)</li>
                  <li>• Select <strong>UPH and Yield curves</strong> for each Line × Shift combination using dropdowns</li>
                  <li>• Different shifts of the same line can have different ramp start dates and curves</li>
                  <li>• Ramp curves are <strong>workday-indexed</strong> - they skip Sundays and holidays</li>
                  <li>• <strong>Unconstrained mode</strong> shows pure capacity, <strong>Constrained mode</strong> applies CTB material limits, <strong>Combined mode</strong> shows both scenarios side-by-side for easy comparison</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== SECTION 2: Simulation Engine ========== -->
      <div>
        <div class="mb-4">
          <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span class="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            Simulation Engine
          </h3>
          <p class="text-sm text-slate-600 mt-1 ml-10">Load scenario data or generate a new simulation.</p>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl">
            <button onclick="loadDemoDataForProductionPlan()"
                    class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 shadow-sm">
              🧪 Load Demo Data
            </button>
            <div class="flex items-center gap-3">
              <button onclick="resetConfigurationToDefault()"
                      class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50">
                Reset to Default
              </button>
              <button onclick="generatePlanFromConfig()"
                      class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                🚀 Generate New Simulation
              </button>
            </div>
          </div>

          <!-- Configuration Summary Card -->
          <div id="configSummaryCard" class="hidden bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4 flex-1">
                <span id="configSummaryIcon" class="text-4xl">🚀</span>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-lg font-bold text-slate-900" id="configSummaryName">Q4 Ramp-Up (Oct-Dec)</span>
                    <span class="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">DEMO LOADED</span>
                  </div>
                  <div class="text-sm text-slate-700 mb-3" id="configSummaryDescription">National Day holiday, new product ramp, year-end sprint</div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">📅 Period:</span>
                      <span class="text-slate-900 font-mono" id="configSummaryPeriod">2026-10-01 ~ 2026-12-27</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">📊 Forecast:</span>
                      <span class="text-slate-900" id="configSummaryForecast">13 weeks</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">🏭 Sites:</span>
                      <span class="text-slate-900" id="configSummarySites">WF, VN02</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">📦 CTB:</span>
                      <span class="text-slate-900" id="configSummaryCTB">Variable constraints</span>
                    </div>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-1" id="configSummaryHighlights"></div>
                </div>
              </div>
              <button onclick="clearConfigSummary()" class="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4" title="Clear demo selection">✕</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Simulation results are now in the Simulations tab -->

    </div>
  `;

  // Post-render initialization (same as renderProductionPlanGenerate)
  renderCapacityUnitsConfig();
  loadProgramConfig();

  // Load forecast data
  try {
    const fv = JSON.parse(localStorage.getItem('productionPlan_forecast_versions') || '[]');
    if (fv.length > 0 && typeof window.updateForecastSummary === 'function') {
      window.updateForecastSummary(fv[fv.length - 1]);
    }
  } catch (error) {
    console.error('[Render] Error loading forecast data:', error);
  }

  // Load CTB data
  try {
    const cv = JSON.parse(localStorage.getItem('productionPlan_ctb_versions') || '[]');
    if (cv.length > 0 && typeof window.updateCTBSummary === 'function') {
      window.updateCTBSummary(cv[cv.length - 1]);
    }
  } catch (error) {
    console.error('[Render] Error loading CTB data:', error);
  }
}

// 2.1 Latest Production Plan (read-only view)
function renderProductionPlanLatest() {
  const state = window.productionPlanState;

  console.log('[Render] renderProductionPlanLatest called. State:', {
    mode: state.mode,
    hasPlanResults: !!state.planResults,
    planResultsType: state.planResults ? (state.planResults.mode || 'normal') : 'none'
  });

  // Load latest forecast data from localStorage
  const forecastVersions = JSON.parse(localStorage.getItem('productionPlan_forecast_versions') || '[]');
  if (forecastVersions.length > 0) {
    const latestForecast = forecastVersions[forecastVersions.length - 1];
    PRODUCTION_PLAN_SEED_DATA.weeklyDemand = latestForecast.data.map(row => ({
      week_id: row.week_id,
      program_id: 'product_a',
      demand_qty: row.weekly_forecast,
      notes: `From ${latestForecast.fileName}`
    }));
    console.log('[Plan Render] Loaded forecast data:', latestForecast.version, 'with', PRODUCTION_PLAN_SEED_DATA.weeklyDemand.length, 'weeks');
  }

  //Initialize engine with seed data if not exists
  if (!state.engine) {
    state.engine = new ProductionPlanEngine(PRODUCTION_PLAN_SEED_DATA);
  }

  // Generate plan(s) if not yet generated or mode changed
  let needsRegeneration = false;

  if (!state.planResults) {
    console.log('[Render] No planResults, needs regeneration');
    needsRegeneration = true;
  } else if (state.mode === 'combined') {
    // If current mode is combined but planResults is not combined structure
    needsRegeneration = !state.planResults.mode || state.planResults.mode !== 'combined';
    console.log('[Render] Combined mode check:', { needsRegeneration, hasMode: !!state.planResults.mode });
  } else {
    // If current mode is not combined but planResults has combined structure
    needsRegeneration = state.planResults.mode === 'combined';
    console.log('[Render] Non-combined mode check:', { needsRegeneration, isCombinedStructure: state.planResults.mode === 'combined' });
  }

  if (needsRegeneration) {
    console.log('[Render] Regenerating plan for mode:', state.mode);
    try {
      if (state.mode === 'combined') {
        // Generate both unconstrained and constrained plans
        const unconstrainedPlan = state.engine.generatePlan(state.startDate, state.endDate, 'unconstrained');
        const constrainedPlan = state.engine.generatePlan(state.startDate, state.endDate, 'constrained');

        // Validate plans
        if (!unconstrainedPlan || !unconstrainedPlan.programResults || !unconstrainedPlan.weeklyMetrics) {
          console.error('[Render] Unconstrained plan validation failed:', unconstrainedPlan);
          throw new Error('Unconstrained plan generation failed');
        }
        if (!constrainedPlan || !constrainedPlan.programResults || !constrainedPlan.weeklyMetrics) {
          console.error('[Render] Constrained plan validation failed:', constrainedPlan);
          throw new Error('Constrained plan generation failed');
        }

        // Calculate summary for both plans
        unconstrainedPlan.summary = calculatePlanSummaryMetrics(unconstrainedPlan);
        constrainedPlan.summary = calculatePlanSummaryMetrics(constrainedPlan);

        state.planResults = {
          unconstrained: unconstrainedPlan,
          constrained: constrainedPlan,
          mode: 'combined'
        };
        console.log('[Render] Combined plans generated successfully');
      } else {
        const plan = state.engine.generatePlan(state.startDate, state.endDate, state.mode);

        // Validate plan
        if (!plan || !plan.programResults || !plan.weeklyMetrics) {
          console.error('[Render] Plan validation failed:', plan);
          throw new Error('Plan generation failed - missing required data');
        }

        console.log('[Render] Plan generated:', {
          programResultsLength: plan.programResults.length,
          weeklyMetricsLength: plan.weeklyMetrics.length
        });

        // Calculate summary metrics
        plan.summary = calculatePlanSummaryMetrics(plan);

        state.planResults = plan;
      }
    } catch (error) {
      console.error('[Render] Error during plan generation:', error);
      showNotification('❌ Error generating plan: ' + error.message, 'error');
      // Set empty structure to prevent further errors
      state.planResults = {
        programResults: [],
        weeklyMetrics: []
      };
    }
  }

  const isCombinedMode = state.planResults && state.planResults.mode === 'combined';
  const results = isCombinedMode ? state.planResults.unconstrained : state.planResults;
  const resultsConstrained = isCombinedMode ? state.planResults.constrained : null;

  console.log('[Render] Prepared results:', {
    isCombinedMode,
    hasResults: !!results,
    hasProgramResults: !!(results && results.programResults),
    hasWeeklyMetrics: !!(results && results.weeklyMetrics)
  });

  const weeklyMetrics = (results && results.weeklyMetrics) ? results.weeklyMetrics : [];

  // Determine current granularity (default: weekly)
  const granularity = state.viewGranularity || 'weekly';

  // Get the month to display - use the start date of the plan
  // Extract YYYY-MM from state.startDate (e.g., "2026-10-01" -> "2026-10")
  const planStartMonth = state.startDate ? state.startDate.substring(0, 7) : null;

  console.log('[Render] Display month:', planStartMonth, 'from startDate:', state.startDate);

  // Get data based on granularity with smart filtering
  let currentData = [];
  let hasMoreData = false; // Track if there's more data to show

  if (results && results.programResults) {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)

    if (granularity === 'weekly') {
      // Weekly view: Show current week + next 3 weeks (total 4 weeks)
      const fourWeeksLater = new Date(currentWeekStart);
      fourWeeksLater.setDate(currentWeekStart.getDate() + 28); // 4 weeks

      currentData = weeklyMetrics.slice(0, 4); // Show first 4 weeks
      hasMoreData = weeklyMetrics.length > 4;

    } else if (granularity === 'monthly') {
      // Monthly view: Show from current month to December
      const monthlyData = aggregateByMonth(results.programResults);
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      currentData = monthlyData.filter(m => {
        if (!m.month_id) return false;
        const [year, month] = m.month_id.split('-').map(Number);
        // Show from current month to December of current year
        return year === currentYear && month >= currentMonth;
      });

      hasMoreData = monthlyData.length > currentData.length;

    } else {
      // Daily view: Show current week + next week (14 days)
      const twoWeeksLater = new Date(currentWeekStart);
      twoWeeksLater.setDate(currentWeekStart.getDate() + 14);

      const twoWeeksLaterStr = twoWeeksLater.toISOString().split('T')[0];
      const currentWeekStartStr = currentWeekStart.toISOString().split('T')[0];

      currentData = results.programResults.filter(d => {
        return d.date >= currentWeekStartStr && d.date < twoWeeksLaterStr;
      });

      hasMoreData = results.programResults.length > currentData.length;
    }

    console.log('[Render] Filtered data:', {
      granularity,
      totalResults: results.programResults.length,
      filteredCount: currentData.length,
      hasMoreData
    });
  }

  // Store hasMoreData in state for button rendering
  state.hasMoreData = hasMoreData;

  // Calculate summary metrics for two cutoff dates
  const thisWeekSaturday = '2026-01-25'; // This week Saturday (W04)
  const yearEnd = '2026-12-31'; // Year end

  const weekSummary = results && results.programResults ?
    calculateCutoffSummary(results.programResults, thisWeekSaturday) :
    { cumForecast: 0, cumCTB: 0, cumCapacity: 0, cumShip: 0, gap: 0 };
  const yearSummary = results && results.programResults ?
    calculateCutoffSummary(results.programResults, yearEnd) :
    { cumForecast: 0, cumCTB: 0, cumCapacity: 0, cumShip: 0, gap: 0 };

  // Analyze primary constraint
  const constraintAnalysis = results && results.programResults ?
    analyzePrimaryConstraint(results.programResults) :
    { primaryConstraint: 'Mixed', ctbLimitedDays: 0, capacityLimitedDays: 0, ctbLimitedUnits: 0, capacityLimitedUnits: 0, ctbLimitedPct: '0', capacityLimitedPct: '0' };

  const html = `
    <div class="space-y-6">
      <!-- Subpage Navigation -->
      <div class="bg-white border rounded-xl p-4">
        <div class="flex gap-2">
          <button onclick="switchProductionPlanSubpage('latest')"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
            📊 Latest Production Plan
          </button>
          <button onclick="switchProductionPlanSubpage('generate')"
                  class="px-4 py-2 rounded-lg border hover:bg-slate-50 text-slate-700">
            ⚙️ Generate Report
          </button>
        </div>
      </div>

      <!-- Context Header (Simplified) -->
      <div class="bg-white border rounded-xl p-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-4">
            <div>
              <div class="text-xs text-slate-600 mb-1">Program</div>
              <div class="font-semibold text-slate-900">Product A</div>
            </div>
            <div class="border-l pl-4">
              <div class="text-xs text-slate-600 mb-1">Date Range</div>
              <div class="font-semibold text-slate-900">${state.startDate} to ${state.endDate}</div>
            </div>
            <div class="border-l pl-4">
              <div class="text-xs text-slate-600 mb-1">Sites</div>
              <div class="font-semibold text-slate-900">${state.site === 'all' ? 'All Sites' : state.site}</div>
            </div>
            <div class="border-l pl-4">
              <div class="text-xs text-slate-600 mb-1">Last Updated</div>
              <div class="font-semibold text-slate-900">${new Date().toLocaleString()}</div>
            </div>
            ${(function() {
              const porVersion = typeof getCurrentPOR === 'function' ? getCurrentPOR() : null;
              if (porVersion) {
                return `
                  <div class="border-l pl-4">
                    <div class="text-xs text-slate-600 mb-1">Plan of Record</div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded font-bold">★ POR</span>
                      <span class="font-semibold text-slate-900 text-xs">${porVersion.version}</span>
                    </div>
                  </div>
                `;
              }
              return '';
            })()}
          </div>
          <div class="flex items-center gap-2">
            <button onclick="viewAllHistoricVersions()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">
              📚 Historic Versions
            </button>
            <button onclick="exportLatestProductionPlan()" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
              📊 Export Excel
            </button>
          </div>
        </div>
      </div>

      <!-- What this page shows -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div class="text-sm font-bold text-slate-900 mb-2">What this page shows:</div>
        <div class="text-sm text-slate-700 leading-relaxed mb-3">
          This plan shows two truths at once: what we <strong>could build</strong> (Capacity) and
          what we <strong>can actually build</strong> (Materials/CTB) — so you can quickly see
          whether a gap is driven by capacity readiness or material readiness.
        </div>
        <div class="text-sm text-slate-700 leading-relaxed">
          <strong>How to read it:</strong> If Capacity is healthy but Input/Ship is capped, the constraint is likely
          CTB/materials. If Capacity itself is below demand, the constraint is capacity/line readiness.
        </div>
      </div>

      <!-- Summary Strip: Two-Column Cutoff Comparison -->
      <div class="grid grid-cols-2 gap-6">
        <!-- This Week Cutoff (W04 Saturday) -->
        <div class="border-2 border-blue-300 bg-blue-50 rounded-xl p-5 shadow-sm">
          <div class="text-sm font-bold text-blue-900 mb-4">Cut-off: This Week (Sat, Jan 25, 2026)</div>
          <div class="space-y-3">
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Cum Forecast</span>
              <span class="text-lg font-bold text-slate-900">${(weekSummary.cumForecast / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Cum Capacity</span>
              <span class="text-lg font-bold text-slate-900">${(weekSummary.cumCapacity / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Cum CTB</span>
              <span class="text-lg font-bold text-slate-900">${(weekSummary.cumCTB / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline border-t-2 border-blue-200 pt-3 mt-3">
              <span class="text-xs text-slate-700">Cum Ship</span>
              <span class="text-lg font-bold text-blue-700">${(weekSummary.cumShip / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Gap vs Forecast</span>
              <span class="text-lg font-bold ${weekSummary.gap >= 0 ? 'text-green-700' : 'text-red-700'}">
                ${weekSummary.gap >= 0 ? '+' : ''}${(weekSummary.gap / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        <!-- Year End Cutoff (Dec 31, 2026) -->
        <div class="border-2 border-slate-300 bg-slate-50 rounded-xl p-5 shadow-sm">
          <div class="text-sm font-bold text-slate-900 mb-4">Cut-off: Year End (Dec 31, 2026)</div>
          <div class="space-y-3">
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Cum Forecast</span>
              <span class="text-lg font-bold text-slate-900">${(yearSummary.cumForecast / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Cum Capacity</span>
              <span class="text-lg font-bold text-slate-900">${(yearSummary.cumCapacity / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Cum CTB</span>
              <span class="text-lg font-bold text-slate-900">${(yearSummary.cumCTB / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline border-t-2 border-slate-200 pt-3 mt-3">
              <span class="text-xs text-slate-700">Cum Ship</span>
              <span class="text-lg font-bold text-blue-700">${(yearSummary.cumShip / 1000).toFixed(1)}k</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-slate-700">Gap vs Forecast</span>
              <span class="text-lg font-bold ${yearSummary.gap >= 0 ? 'text-green-700' : 'text-red-700'}">
                ${yearSummary.gap >= 0 ? '+' : ''}${(yearSummary.gap / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Primary Constraint Summary -->
      <div class="bg-white border-2 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div class="text-xs font-bold text-slate-500 mb-1">PRIMARY BINDING CONSTRAINT (THIS PERIOD)</div>
            <div class="text-lg font-bold ${constraintAnalysis.primaryConstraint === 'CTB' ? 'text-orange-700' : constraintAnalysis.primaryConstraint === 'Capacity' ? 'text-red-700' : 'text-green-700'}">
              ${constraintAnalysis.primaryConstraint === 'CTB' ? '📦 CTB-limited' : constraintAnalysis.primaryConstraint === 'Capacity' ? '⚙️ Capacity-limited' : '✅ No binding constraint'}
            </div>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-500 mb-1">GAP (YEAR END: DELIVERABLE VS FORECAST)</div>
            <div class="text-lg font-bold ${yearSummary.gap >= 0 ? 'text-green-700' : 'text-red-700'}">
              ${yearSummary.gap >= 0 ? '+' : ''}${(yearSummary.gap / 1000).toFixed(1)}k units
            </div>
          </div>
          <div class="text-sm text-slate-600">
            ${constraintAnalysis.primaryConstraint === 'CTB' ?
              `CTB limited ${constraintAnalysis.ctbLimitedPct}% of days (${constraintAnalysis.ctbLimitedUnits.toLocaleString()} units short)` :
              constraintAnalysis.primaryConstraint === 'Capacity' ?
              `Capacity limited ${constraintAnalysis.capacityLimitedPct}% of days (${constraintAnalysis.capacityLimitedUnits.toLocaleString()} units short)` :
              'Both capacity and materials are sufficient'
            }
          </div>
        </div>
      </div>

      <!-- Granularity Toggle & Actions -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-slate-700">View:</span>
          <div class="flex gap-2">
            <button onclick="switchPlanGranularity('daily')"
                    class="px-4 py-2 rounded-lg text-sm font-semibold ${granularity === 'daily' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700'}">
              Daily
            </button>
            <button onclick="switchPlanGranularity('weekly')"
                    class="px-4 py-2 rounded-lg text-sm font-semibold ${granularity === 'weekly' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700'}">
              Weekly
            </button>
            <button onclick="switchPlanGranularity('monthly')"
                    class="px-4 py-2 rounded-lg text-sm font-semibold ${granularity === 'monthly' ? 'bg-blue-600 text-white' : 'border hover:bg-slate-50 text-slate-700'}">
              Monthly
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="viewLatestPlanFullReport()" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition">
            📊 View Full Report
          </button>
        </div>
      </div>

      <!-- Main Truth Table (4 or 5 Column Groups depending on mode) -->
      <div class="bg-white border-2 rounded-xl p-6 shadow-sm">
        <div class="text-sm font-bold text-slate-900 mb-4">
          Production Plan Truth Table
          ${isCombinedMode ? '<span class="ml-2 text-xs font-normal text-blue-600">(Combined View: Unconstrained vs Constrained)</span>' : ''}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs border-collapse">
            <thead class="bg-slate-100">
              <!-- Column Group Headers -->
              <tr class="border-b-2">
                <th class="px-2 py-2 text-left font-bold border-r-2" rowspan="2">${granularity === 'daily' ? 'Date' : granularity === 'weekly' ? 'Week' : 'Month'}</th>
                <th class="px-2 py-2 text-center font-bold border-r-2 bg-slate-200" colspan="2">Demand / Supply</th>
                <th class="px-2 py-2 text-center font-bold border-r-2 bg-blue-50" colspan="2">Capacity Track</th>
                <th class="px-2 py-2 text-center font-bold border-r-2 bg-green-50" colspan="6">Reality Track${isCombinedMode ? '<br/><span class="text-xs font-normal">(Unconstrained)</span>' : ''}</th>
                ${isCombinedMode ? `<th class="px-2 py-2 text-center font-bold border-r-2 bg-purple-50" colspan="6">Reality Track<br/><span class="text-xs font-normal">(Constrained)</span></th>` : ''}
                <th class="px-2 py-2 text-center font-bold bg-orange-50" colspan="2">Gap / Constraint</th>
              </tr>
              <!-- Sub-column Headers -->
              <tr class="border-b-2">
                <th class="px-2 py-2 text-right font-semibold bg-slate-200">Cum<br/>Forecast</th>
                <th class="px-2 py-2 text-right font-semibold bg-slate-200 border-r-2">Cum<br/>CTB</th>
                <th class="px-2 py-2 text-right font-semibold bg-blue-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Capacity</th>
                <th class="px-2 py-2 text-right font-semibold bg-blue-50 border-r-2">Cum<br/>Capacity</th>
                <!-- Unconstrained Reality Track -->
                <th class="px-2 py-2 text-right font-semibold bg-green-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Input</th>
                <th class="px-2 py-2 text-right font-semibold bg-green-50">Cum<br/>Input</th>
                <th class="px-2 py-2 text-right font-semibold bg-green-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Output</th>
                <th class="px-2 py-2 text-right font-semibold bg-green-50">Cum<br/>Output</th>
                <th class="px-2 py-2 text-right font-semibold bg-green-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Ship</th>
                <th class="px-2 py-2 text-right font-semibold bg-green-50 ${isCombinedMode ? '' : 'border-r-2'}">Cum<br/>Ship</th>
                <!-- Constrained Reality Track (only in Combined mode) -->
                ${isCombinedMode ? `
                  <th class="px-2 py-2 text-right font-semibold bg-purple-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Input</th>
                  <th class="px-2 py-2 text-right font-semibold bg-purple-50">Cum<br/>Input</th>
                  <th class="px-2 py-2 text-right font-semibold bg-purple-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Output</th>
                  <th class="px-2 py-2 text-right font-semibold bg-purple-50">Cum<br/>Output</th>
                  <th class="px-2 py-2 text-right font-semibold bg-purple-50">${granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly'}<br/>Ship</th>
                  <th class="px-2 py-2 text-right font-semibold bg-purple-50 border-r-2">Cum<br/>Ship</th>
                ` : ''}
                <th class="px-2 py-2 text-right font-semibold bg-orange-50">Gap<br/>(Cum)</th>
                <th class="px-2 py-2 text-center font-semibold bg-orange-50">Binding<br/>Driver</th>
              </tr>
            </thead>
            <tbody>
              ${currentData.map((row, idx) => {
                const dateLabel = granularity === 'daily' ? row.date :
                                 granularity === 'weekly' ? getWeekDisplayDate(row.week_id) : row.month_id;
                const isSunday = granularity === 'daily' && DateUtils.isSunday(row.date);

                // Calculate cumulative values
                const cumForecast = row.cum_demand || (idx > 0 ? currentData.slice(0, idx + 1).reduce((sum, r) => sum + (r.demand || 0), 0) : row.demand || 0);
                const cumCTB = idx > 0 ? currentData.slice(0, idx + 1).reduce((sum, r) => sum + ((r.ctb_available || r.capacity_unconstrained) || 0), 0) : (row.ctb_available || row.capacity_unconstrained || 0);
                const cumCapacity = idx > 0 ? currentData.slice(0, idx + 1).reduce((sum, r) => sum + (r.capacity_unconstrained || 0), 0) : (row.capacity_unconstrained || 0);

                const dailyInput = granularity === 'daily' ? (row.input_final || 0) : (row.input || 0);
                const cumInput = row.cum_input || (idx > 0 ? currentData.slice(0, idx + 1).reduce((sum, r) => sum + ((granularity === 'daily' ? r.input_final : r.input) || 0), 0) : dailyInput);

                const dailyOutput = granularity === 'daily' ? (row.output_final || 0) : (row.output || 0);
                const cumOutput = row.cum_output || (idx > 0 ? currentData.slice(0, idx + 1).reduce((sum, r) => sum + ((granularity === 'daily' ? r.output_final : r.output) || 0), 0) : dailyOutput);

                const dailyShip = granularity === 'daily' ? (row.shipment_final || 0) : (row.shipments || 0);
                const cumShip = row.cum_shipment || (idx > 0 ? currentData.slice(0, idx + 1).reduce((sum, r) => sum + ((granularity === 'daily' ? r.shipment_final : r.shipments) || 0), 0) : dailyShip);

                const gap = cumShip - cumForecast;
                const bindingDriver = granularity === 'daily' ? getDailyConstraint(row) : '-';

                // Get constrained data if in combined mode
                let dailyInputC = 0, cumInputC = 0, dailyOutputC = 0, cumOutputC = 0, dailyShipC = 0, cumShipC = 0;
                if (isCombinedMode && resultsConstrained) {
                  const constrainedData = granularity === 'weekly' ?
                    resultsConstrained.weeklyMetrics.filter(w => w.week_id && w.week_id.substring(0, 7) === currentMonth) :
                    granularity === 'monthly' ?
                    aggregateByMonth(resultsConstrained.programResults).filter(m => m.month_id === currentMonth) :
                    resultsConstrained.programResults.filter(d => d.date && d.date.substring(0, 7) === currentMonth);

                  const rowC = constrainedData[idx];
                  if (rowC) {
                    dailyInputC = granularity === 'daily' ? (rowC.input_final || 0) : (rowC.input || 0);
                    cumInputC = rowC.cum_input || (idx > 0 ? constrainedData.slice(0, idx + 1).reduce((sum, r) => sum + ((granularity === 'daily' ? r.input_final : r.input) || 0), 0) : dailyInputC);

                    dailyOutputC = granularity === 'daily' ? (rowC.output_final || 0) : (rowC.output || 0);
                    cumOutputC = rowC.cum_output || (idx > 0 ? constrainedData.slice(0, idx + 1).reduce((sum, r) => sum + ((granularity === 'daily' ? r.output_final : r.output) || 0), 0) : dailyOutputC);

                    dailyShipC = granularity === 'daily' ? (rowC.shipment_final || 0) : (rowC.shipments || 0);
                    cumShipC = rowC.cum_shipment || (idx > 0 ? constrainedData.slice(0, idx + 1).reduce((sum, r) => sum + ((granularity === 'daily' ? r.shipment_final : r.shipments) || 0), 0) : dailyShipC);
                  }
                }

                const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';

                return `
                  <tr class="${bgColor} ${isSunday ? 'text-slate-400' : ''} hover:bg-blue-50 border-b">
                    <td class="px-2 py-2 font-mono text-xs border-r-2">${dateLabel}</td>
                    <td class="px-2 py-2 text-right font-mono">${Math.round(cumForecast).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono border-r-2">${Math.round(cumCTB).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono">${Math.round(row.capacity_unconstrained || 0).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono border-r-2">${Math.round(cumCapacity).toLocaleString()}</td>
                    <!-- Unconstrained Reality Track -->
                    <td class="px-2 py-2 text-right font-mono">${Math.round(dailyInput).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono">${Math.round(cumInput).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono">${Math.round(dailyOutput).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono">${Math.round(cumOutput).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono text-blue-700">${Math.round(dailyShip).toLocaleString()}</td>
                    <td class="px-2 py-2 text-right font-mono text-blue-700 ${isCombinedMode ? '' : 'border-r-2'}">${Math.round(cumShip).toLocaleString()}</td>
                    <!-- Constrained Reality Track (only in Combined mode) -->
                    ${isCombinedMode ? `
                      <td class="px-2 py-2 text-right font-mono text-purple-700">${Math.round(dailyInputC).toLocaleString()}</td>
                      <td class="px-2 py-2 text-right font-mono text-purple-700">${Math.round(cumInputC).toLocaleString()}</td>
                      <td class="px-2 py-2 text-right font-mono text-purple-700">${Math.round(dailyOutputC).toLocaleString()}</td>
                      <td class="px-2 py-2 text-right font-mono text-purple-700">${Math.round(cumOutputC).toLocaleString()}</td>
                      <td class="px-2 py-2 text-right font-mono text-purple-700 font-semibold">${Math.round(dailyShipC).toLocaleString()}</td>
                      <td class="px-2 py-2 text-right font-mono text-purple-700 font-semibold border-r-2">${Math.round(cumShipC).toLocaleString()}</td>
                    ` : ''}
                    <td class="px-2 py-2 text-right font-mono ${gap >= 0 ? 'text-green-700' : 'text-red-700'} font-semibold">
                      ${gap >= 0 ? '+' : ''}${Math.round(gap).toLocaleString()}
                    </td>
                    <td class="px-2 py-2 text-center text-xs font-semibold ${bindingDriver === 'CTB' ? 'text-orange-700' : bindingDriver === 'Capacity' ? 'text-red-700' : 'text-slate-500'}">
                      ${bindingDriver}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Simulations Library Section -->
      ${(function() {
        const simulations = SimulationManager.getSimulations();

      if (simulations.length === 0) {
        return '';
      }

      // Sort by creation date (most recent first)
      simulations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const formatNumber = (num) => num.toLocaleString('en-US');
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };

      // Split simulations into recent (first 2) and older (rest)
      const recentSimulations = simulations.slice(0, 2);
      const olderSimulations = simulations.slice(2);

      const renderSimulationCard = (sim) => {
        const summary = sim.results.mode === 'combined' ? sim.results.constrained.summary : sim.results.summary;
        const weeksWithGap = summary.weeksWithGap || [];
        const modeLabel = sim.config.mode === 'unconstrained' ? 'Capacity Only' :
                         sim.config.mode === 'constrained' ? 'CTB Applied' :
                         'Side-by-Side';

        return `
          <div class="bg-white border-2 border-slate-300 rounded-xl p-5 hover:shadow-lg transition-shadow">
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="font-bold text-slate-900 mb-1">${sim.name}</div>
                <div class="text-xs text-slate-600">${sim.description || 'No description'}</div>
              </div>
              <div class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">${modeLabel}</div>
            </div>

            <!-- Metrics -->
            <div class="grid grid-cols-3 gap-3 mb-3">
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-xs text-gray-600 mb-1">Total Output</div>
                <div class="text-sm font-bold text-blue-600">${formatNumber(summary.totalOutput)}</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <div class="text-xs text-gray-600 mb-1">Attainment</div>
                <div class="text-sm font-bold text-green-600">${summary.overallAttainment.toFixed(1)}%</div>
              </div>
              <div class="bg-${weeksWithGap.length > 0 ? 'red' : 'green'}-50 p-3 rounded-lg">
                <div class="text-xs text-gray-600 mb-1">Weeks w/ Gap</div>
                <div class="text-sm font-bold text-${weeksWithGap.length > 0 ? 'red' : 'green'}-600">${weeksWithGap.length}</div>
              </div>
            </div>

            <!-- Info -->
            <div class="text-xs text-gray-600 mb-3">
              <div>Created: ${formatDate(sim.createdAt)}</div>
              <div>Period: ${sim.config.dateRange.start} to ${sim.config.dateRange.end}</div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                onclick="viewSimulationReport('${sim.id}')"
                class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                📊 View Report
              </button>
              <button
                onclick="promptPromoteSimulationToPOR('${sim.id}')"
                class="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                ⬆️ Promote to POR
              </button>
              <button
                onclick="confirmDeleteSimulation('${sim.id}')"
                class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                title="Delete simulation">
                🗑️
              </button>
            </div>
          </div>
        `;
      };

      const recentHtml = recentSimulations.map(renderSimulationCard).join('');
      const olderHtml = olderSimulations.map(renderSimulationCard).join('');

      return `
        <div class="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mt-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-lg font-bold text-slate-900 cursor-pointer hover:text-purple-700 transition" onclick="switchProductionPlanTab('simulations')">
                📂 Simulation Library →
              </div>
              <div class="text-sm text-slate-600 mt-1">Saved simulations ready to promote to POR. Click title to view all.</div>
            </div>
            <div class="flex gap-2">
              <button
                onclick="openCreateProjectDialog()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold">
                + New Project
              </button>
              <button
                onclick="switchProductionPlanSubpage('generate')"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-semibold">
                + New Simulation
              </button>
            </div>
          </div>

          <!-- Recent Simulations (Always Visible) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${recentHtml}
          </div>

          <!-- Older Simulations (Collapsible) -->
          ${olderSimulations.length > 0 ? `
            <div class="mt-4">
              <button
                id="toggleOlderSimulations"
                onclick="toggleOlderSimulations()"
                class="w-full px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition text-sm font-semibold flex items-center justify-center gap-2">
                <span id="olderSimulationsToggleIcon">▼</span>
                <span id="olderSimulationsToggleText">Show ${olderSimulations.length} Older Simulation${olderSimulations.length > 1 ? 's' : ''}</span>
              </button>
              <div id="olderSimulations" style="display: none;" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                ${olderHtml}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    })()}

      <!-- Fiscal Calendar Reference (Collapsible) -->
      <div class="bg-white border-2 rounded-xl shadow-sm">
        <button id="fiscalCalendarToggle" onclick="toggleFiscalCalendar()"
                class="w-full px-6 py-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 flex items-center justify-between">
          <span>▶ Show Fiscal Calendar (2026)</span>
          <span class="text-xs text-slate-500">4-4-5 Week Structure</span>
        </button>

        <div id="fiscalCalendarContent" style="display: none;" class="p-6 border-t">
          <div class="mb-4">
            <div class="text-sm font-semibold text-slate-900 mb-2">Fiscal Calendar Rules:</div>
            <ul class="text-xs text-slate-700 space-y-1 list-disc list-inside">
              <li>Each <strong>quarter</strong> has exactly <strong>13 weeks</strong></li>
              <li>Each quarter follows a <strong>5-4-4 pattern</strong>: Month 1 = 5 weeks, Month 2 = 4 weeks, Month 3 = 4 weeks</li>
              <li>Weeks run from <strong>Sunday to Saturday</strong></li>
              <li>Week 1 of January 2026 starts on December 28, 2025 and ends on January 3, 2026</li>
            </ul>
          </div>

          ${(() => {
            const fiscalCal = generateFiscalCalendar2026();
            return fiscalCal.map(quarter => `
              <div class="mb-6 border-2 rounded-lg overflow-hidden">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
                  <div class="text-white font-bold">${quarter.quarter} — ${quarter.months.map(m => m.name.split(' ')[0]).join(', ')}</div>
                  <div class="text-blue-100 text-xs">13 weeks total (5+4+4 pattern)</div>
                </div>
                <div class="grid grid-cols-3 gap-0">
                  ${quarter.months.map((month, idx) => `
                    <div class="border-r last:border-r-0 ${idx === 0 ? 'bg-amber-50' : 'bg-slate-50'}">
                      <div class="px-3 py-2 border-b ${idx === 0 ? 'bg-amber-100' : 'bg-slate-100'}">
                        <div class="text-xs font-bold text-slate-900">${month.name}</div>
                        <div class="text-xs text-slate-600">${month.weeks} weeks ${idx === 0 ? '(M1)' : idx === 1 ? '(M2)' : '(M3)'}</div>
                      </div>
                      <div class="p-3 space-y-2">
                        ${month.weekDetails.map(week => `
                          <div class="text-xs">
                            <div class="font-mono font-semibold text-blue-700">${week.week}</div>
                            <div class="text-slate-600">${week.start} to ${week.end}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// 2.2 Generate Report (Configure + Generate new plan)
function renderProductionPlanGenerate() {
  const state = window.productionPlanState;

  // Initialize engine if needed
  if (!state.engine) {
    state.engine = new ProductionPlanEngine(PRODUCTION_PLAN_SEED_DATA);
  }

  const html = `
    <div class="space-y-4">
      <!-- AI Assistant Tip -->
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-5">
        <div class="flex items-start gap-3">
          <span class="text-3xl">💡</span>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-purple-900 mb-2">New to Production Planning?</h3>
            <p class="text-sm text-purple-700 mb-3">
              Not sure how to configure your plan? Use our <strong>AI Assistant</strong> to help you get started!
              Just describe what you want in plain language.
            </p>
            <div class="flex gap-2">
              <button
                onclick="openProductionPlanAIChat()"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-sm flex items-center gap-2">
                💬 AI Assistant
              </button>
              <div class="text-xs text-purple-600 self-center italic">
                Try: "Create a 90-day plan for SZ and WH sites with Sunday OT"
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subpage Navigation -->
      <div class="bg-white border rounded-xl p-4">
        <div class="flex gap-2">
          <button onclick="switchProductionPlanSubpage('latest')"
                  class="px-4 py-2 rounded-lg border hover:bg-slate-50 text-slate-700">
            📊 Latest Production Plan
          </button>
          <button onclick="switchProductionPlanSubpage('generate')"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
            ⚙️ Generate Report
          </button>
        </div>
      </div>

      <!-- Forecast Section -->
      <div class="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4 cursor-pointer" onclick="toggleSection('forecastContent', 'forecastToggle')">
          <div class="flex items-center gap-3">
            <span id="forecastToggle" class="text-purple-600 text-lg transition-transform">▼</span>
            <div>
              <div class="text-lg font-bold text-purple-900 flex items-center gap-2">
                <span>📊</span>
                <span>Demand Forecast</span>
              </div>
              <div class="text-sm text-slate-600 mt-1">Upload and manage weekly forecast data</div>
            </div>
          </div>
          <div class="flex items-center gap-2" onclick="event.stopPropagation()">
            <button onclick="uploadForecast()" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center gap-2">
              <span>📤</span>
              <span>Upload</span>
            </button>
            <button onclick="viewForecastHistory()" class="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 flex items-center gap-2">
              <span>📜</span>
              <span>History</span>
            </button>
            <button onclick="compareForecastVersions()" class="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 flex items-center gap-2">
              <span>🔄</span>
              <span>Compare</span>
            </button>
            <button onclick="deleteCurrentForecast()" class="px-4 py-2 border border-red-600 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center gap-2">
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div id="forecastContent" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="text-sm text-purple-900 mb-3">
            <span class="font-semibold">Version:</span> <span id="forecastVersion">Not uploaded</span> |
            <span class="font-semibold">Released:</span> <span id="forecastReleaseDate">-</span>
          </div>
          <div class="text-sm font-semibold text-purple-900 mb-2">Recent 4 Weeks Summary:</div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-purple-100">
                <tr>
                  <th class="px-3 py-2 text-left">Week</th>
                  <th class="px-3 py-2 text-right">Weekly Forecast</th>
                  <th class="px-3 py-2 text-right">Cum Forecast</th>
                </tr>
              </thead>
              <tbody id="forecastSummaryTable">
                <tr><td colspan="3" class="px-3 py-4 text-center text-slate-500">No forecast data uploaded yet</td></tr>
              </tbody>
            </table>
          </div>
          <div class="mt-3 text-center">
            <button onclick="viewAllForecastWeeks()" class="text-sm text-purple-600 hover:text-purple-800 font-semibold">
              👁️ View All Weekly Details →
            </button>
          </div>
        </div>
      </div>

      <!-- CTB Section -->
      <div class="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4 cursor-pointer" onclick="toggleSection('ctbContent', 'ctbToggle')">
          <div class="flex items-center gap-3">
            <span id="ctbToggle" class="text-orange-600 text-lg transition-transform">▼</span>
            <div>
              <div class="text-lg font-bold text-orange-900 flex items-center gap-2">
                <span>📦</span>
                <span>CTB (Clear to Build)</span>
              </div>
              <div class="text-sm text-slate-600 mt-1">Upload and manage weekly CTB data by site</div>
            </div>
          </div>
          <div class="flex items-center gap-2" onclick="event.stopPropagation()">
            <button onclick="uploadCTB()" class="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 flex items-center gap-2">
              <span>📤</span>
              <span>Upload</span>
            </button>
            <button onclick="viewCTBHistory()" class="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-50 flex items-center gap-2">
              <span>📜</span>
              <span>History</span>
            </button>
            <button onclick="compareCTBVersions()" class="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-50 flex items-center gap-2">
              <span>🔄</span>
              <span>Compare</span>
            </button>
          </div>
        </div>

        <div id="ctbContent" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="text-sm text-orange-900 mb-3">
            <span class="font-semibold">Version:</span> <span id="ctbVersion">Not uploaded</span> |
            <span class="font-semibold">Updated:</span> <span id="ctbUpdateDate">-</span>
          </div>
          <div class="text-sm font-semibold text-orange-900 mb-2">Recent 4 Weeks Summary (by Site):</div>
          <div id="ctbSummaryBySite" class="space-y-4">
            <div class="text-center text-slate-500 py-4">No CTB data uploaded yet</div>
          </div>
          <div class="mt-3 text-center">
            <button onclick="viewAllCTBWeeks()" class="text-sm text-orange-600 hover:text-orange-800 font-semibold">
              👁️ View All Weekly Details →
            </button>
          </div>
        </div>
      </div>

      <!-- Configure Panel -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="text-xl font-bold text-slate-900">Production Plan Configuration</div>
            <div class="text-sm text-slate-600 mt-1">Add capacity units (Site → Line → Shift) to define what the report will cover</div>
          </div>
          <div class="flex gap-2">
            <button id="saveConfigBtn" onclick="saveAllConfiguration()"
                    class="px-6 py-3 bg-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-300 whitespace-nowrap flex items-center justify-center gap-2"
                    title="Save all configuration changes to browser storage">
              <span>✅ Configuration Saved</span>
            </button>
            <button onclick="resetToDefaultConfig()"
                    class="px-6 py-3 border-2 border-slate-300 rounded-lg text-sm text-slate-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700 font-semibold"
                    title="Reset to default sites and lines from seed data file">
              🔄 Reset to Default
            </button>
          </div>
        </div>

        <!-- Configuration Form -->
        <div class="space-y-6">
          <!-- Section 1: Program & Timeline -->
          <div class="bg-white rounded-lg border border-blue-200 p-5">
            <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>📦</span>
              <span>Program & Timeline</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">Program</label>
                <div class="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm text-slate-700">Product A</div>
              </div>
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">Vendor</label>
                <div class="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm text-slate-700">Vendor X</div>
              </div>
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">Start Date</label>
                <input type="date" id="configStartDate" value="2026-10-01" class="w-full border rounded px-3 py-2 text-sm" onchange="validateReportDateRange(); markConfigAsModified();">
              </div>
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">End Date</label>
                <input type="date" id="configEndDate" value="2026-10-31" class="w-full border rounded px-3 py-2 text-sm" onchange="validateReportDateRange(); markConfigAsModified();">
                <div id="endDateError" class="text-xs text-red-600 mt-1 hidden"></div>
              </div>
            </div>
          </div>

          <!-- Section 2: Capacity Configuration (Site → Line → Shift) -->
          <div class="bg-white rounded-lg border border-blue-200 p-5">
            <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>🏭</span>
              <span>Capacity Configuration (Site → Line → Shift)</span>
            </div>

            <div id="capacitySitesContainer" class="space-y-6">
              <!-- Sites with their lines and shifts will be rendered here -->
            </div>

            <div class="mt-4">
              <button onclick="addSiteCapacity()"
                      class="w-full border-2 border-dashed border-blue-300 rounded-lg py-3 text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-50 font-semibold">
                + Add Site
              </button>
            </div>
          </div>

          <!-- Section 3: Working Parameters -->
          <div class="bg-white rounded-lg border border-blue-200 p-5">
            <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 cursor-pointer" onclick="toggleSection('workingParamsContent', 'workingParamsToggle')">
              <span id="workingParamsToggle" class="text-blue-600 transition-transform">▼</span>
              <span>⏰</span>
              <span>Working Parameters</span>
            </div>
            <div id="workingParamsContent" class="space-y-4">
              <!-- Row 1: Basic Working Parameters -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-1">Default Shift Hours</label>
                  <input type="number" id="configShiftHours" value="10" min="1" max="24" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                  <div class="text-xs text-slate-500 mt-1">Hours per shift (can be overridden per line)</div>
                </div>
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-1">Working Days Pattern</label>
                  <select id="configWorkingDays" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                    <option value="MON_SAT" selected>Mon-Sat (6 days)</option>
                    <option value="MON_FRI">Mon-Fri (5 days)</option>
                    <option value="MON_SUN">Mon-Sun (7 days)</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-1">Shipment Lag (Workdays)</label>
                  <input type="number" id="configShipmentLag" value="2" min="0" max="10" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                  <div class="text-xs text-slate-500 mt-1">Days from output to shipment-ready</div>
                </div>
              </div>

              <!-- Row 2: Shipment Control Parameters -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-1">Max Daily Shipment (Units)</label>
                  <input type="number" id="configMaxDailyShipment" value="30000" min="0" step="1000" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                  <div class="text-xs text-slate-500 mt-1">Maximum units that can ship per day (logistics limit)</div>
                </div>
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-1">📦 Pallet Size (Units/Pallet)</label>
                  <input type="number" id="configPalletSize" value="480" min="1" step="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                  <div class="text-xs text-slate-500 mt-1">Shipment will be rounded to multiples of this (e.g., 480 = full pallets only)</div>
                </div>
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-1">Shipment Start Date</label>
                  <input type="date" id="configShipmentStartDate" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                  <div class="text-xs text-slate-500 mt-1">First date when shipment can begin (leave empty to use forecast start date)</div>
                </div>
              </div>
            </div>

              <div class="mt-4 col-span-full">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="configConsiderHolidays" checked class="rounded" onchange="markConfigAsModified()">
                  <span class="text-sm font-semibold text-slate-700">Consider holidays when calculating working days</span>
                </label>
              </div>

              <div class="mt-3 col-span-full flex gap-3">
                <div class="flex-1">
                  <button onclick="openHolidayCalendarManager()"
                          class="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-sm flex items-center justify-center gap-2">
                    <span>📅</span>
                    <span>Manage Holiday Calendar</span>
                    <span class="text-xs opacity-75">(China & Vietnam 2026)</span>
                  </button>
                  <div class="text-xs text-slate-500 mt-1">Configure public holidays for sites</div>
                </div>
                <div class="flex-1">
                  <button onclick="openCurvePresetsManager()"
                          class="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-teal-700 shadow-sm flex items-center justify-center gap-2">
                    <span>📈</span>
                    <span>Manage Curve Presets</span>
                    <span class="text-xs opacity-75">(UPH & Yield)</span>
                  </button>
                  <div class="text-xs text-slate-500 mt-1">Configure default ramp curves</div>
                </div>
              </div>

              <!-- Inventory Audit Configuration -->
              <div class="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                <div class="flex items-center justify-between mb-3 cursor-pointer" onclick="toggleSection('inventoryAuditContent', 'inventoryAuditToggle')">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">📦</span>
                    <div class="font-bold text-purple-900">Inventory Audit</div>
                  </div>
                  <span id="inventoryAuditToggle" class="text-purple-600 text-xl transition-transform">▼</span>
                </div>
                <div id="inventoryAuditContent">
                  <div class="text-xs text-purple-700 mb-4">
                    Semi-annual inventory audit required by Customs and Finance. Complete production halt during audit (no input, no output, no shipment)
                  </div>

                <!-- Middle Year Audit -->
                <div class="mb-4">
                  <label class="text-xs text-slate-600 font-semibold block mb-2">Middle Year</label>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs text-slate-500 block mb-1">Days</label>
                      <select id="configAuditMiddleDays" class="w-full border rounded px-3 py-2 text-sm" onchange="updateAuditDates('middle'); markConfigAsModified();">
                        <option value="1" selected>1 day</option>
                        <option value="2">2 days</option>
                      </select>
                    </div>
                    <div id="configAuditMiddleDatesContainer">
                      <label class="text-xs text-slate-500 block mb-1">Date</label>
                      <input type="date" id="configAuditMiddleDate1" value="2026-06-30" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                    </div>
                  </div>
                </div>

                <!-- End Year Audit -->
                <div>
                  <label class="text-xs text-slate-600 font-semibold block mb-2">End Year</label>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs text-slate-500 block mb-1">Days</label>
                      <select id="configAuditEndDays" class="w-full border rounded px-3 py-2 text-sm" onchange="updateAuditDates('end'); markConfigAsModified();">
                        <option value="1" selected>1 day</option>
                        <option value="2">2 days</option>
                      </select>
                    </div>
                    <div id="configAuditEndDatesContainer">
                      <label class="text-xs text-slate-500 block mb-1">Date</label>
                      <input type="date" id="configAuditEndDate1" value="2026-12-31" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Output Flow-Time Factors -->
          <div class="bg-white rounded-lg border border-blue-200 p-5">
            <div class="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 cursor-pointer" onclick="toggleSection('flowTimeContent', 'flowTimeToggle')">
              <span id="flowTimeToggle" class="text-blue-600 transition-transform">▼</span>
              <span>📈</span>
              <span>Output Flow-Time Factors</span>
            </div>
            <div id="flowTimeContent" class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">Day 1 Factor</label>
                <input type="number" id="configDay1Factor" value="0.5" step="0.1" min="0" max="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                <div class="text-xs text-slate-500 mt-1">First day output multiplier</div>
              </div>
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">Day 2 Factor</label>
                <input type="number" id="configDay2Factor" value="1.0" step="0.1" min="0" max="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                <div class="text-xs text-slate-500 mt-1">Second day output multiplier</div>
              </div>
              <div>
                <label class="text-xs text-slate-600 font-semibold block mb-1">Day 3+ Factor</label>
                <input type="number" id="configDay3Factor" value="1.0" step="0.1" min="0" max="1" class="w-full border rounded px-3 py-2 text-sm" onchange="markConfigAsModified()">
                <div class="text-xs text-slate-500 mt-1">Day 3+ output multiplier</div>
              </div>
            </div>
          </div>

          <!-- Configuration Summary (shown after loading demo data) -->
          <div id="configSummaryCard" class="hidden bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mt-6">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4 flex-1">
                <span id="configSummaryIcon" class="text-4xl">🚀</span>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-lg font-bold text-slate-900" id="configSummaryName">Q4 Ramp-Up (Oct-Dec)</span>
                    <span class="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">DEMO LOADED</span>
                  </div>
                  <div class="text-sm text-slate-700 mb-3" id="configSummaryDescription">National Day holiday, new product ramp, year-end sprint</div>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">📅 Period:</span>
                      <span class="text-slate-900 font-mono" id="configSummaryPeriod">2026-10-01 ~ 2026-12-27</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">📊 Forecast:</span>
                      <span class="text-slate-900" id="configSummaryForecast">13 weeks</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">🏭 Sites:</span>
                      <span class="text-slate-900" id="configSummarySites">WF, VN02</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-700">📦 CTB:</span>
                      <span class="text-slate-900" id="configSummaryCTB">Variable constraints</span>
                    </div>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-1" id="configSummaryHighlights">
                    <!-- Highlights will be populated here -->
                  </div>
                </div>
              </div>
              <button onclick="clearConfigSummary()" class="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4" title="Clear demo selection">✕</button>
            </div>
          </div>

          <!-- Generate Button -->
          <div class="flex items-center justify-between pt-4 border-t">
            <button onclick="loadDemoDataForProductionPlan()"
                    class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 shadow-sm">
              🧪 Load Demo Data
            </button>
            <div class="flex items-center gap-3">
              <button onclick="resetConfigurationToDefault()"
                      class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50">
                Reset to Default
              </button>
              <button onclick="generatePlanFromConfig()"
                      class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                🚀 Generate New Simulation
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Info -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="text-2xl">💡</div>
          <div class="flex-1">
            <div class="font-semibold text-amber-900 mb-1">Configuration Tips</div>
            <ul class="text-sm text-amber-800 space-y-1">
              <li>• Use the hierarchical structure: Add <strong>Site</strong> → Add <strong>Line</strong> → Add <strong>Shift</strong></li>
              <li>• Configure holiday schedules at the <strong>site level</strong> (follow legal holidays or custom)</li>
              <li>• Select <strong>UPH and Yield curves</strong> for each Line × Shift combination using dropdowns</li>
              <li>• Different shifts of the same line can have different ramp start dates and curves</li>
              <li>• Ramp curves are <strong>workday-indexed</strong> - they skip Sundays and holidays</li>
              <li>• <strong>Unconstrained mode</strong> shows pure capacity, <strong>Constrained mode</strong> applies CTB material limits, <strong>Combined mode</strong> shows both scenarios side-by-side for easy comparison</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;

  // Render initial capacity units from seed data
  renderCapacityUnitsConfig();

  // Load and display saved program config (including startDate and endDate)
  loadProgramConfig();

  // Load and display saved Forecast data if available
  try {
    const forecastVersions = JSON.parse(localStorage.getItem('productionPlan_forecast_versions') || '[]');
    if (forecastVersions.length > 0 && typeof window.updateForecastSummary === 'function') {
      window.updateForecastSummary(forecastVersions[forecastVersions.length - 1]);
      console.log('[Render] Loaded and displayed forecast data');
    }
  } catch (error) {
    console.error('[Render] Error loading forecast data:', error);
  }

  // Load and display saved CTB data if available
  try {
    const ctbVersions = JSON.parse(localStorage.getItem('productionPlan_ctb_versions') || '[]');
    if (ctbVersions.length > 0 && typeof window.updateCTBSummary === 'function') {
      window.updateCTBSummary(ctbVersions[ctbVersions.length - 1]);
      console.log('[Render] Loaded and displayed CTB data');
    }
  } catch (error) {
    console.error('[Render] Error loading CTB data:', error);
  }
}

// Switch between subpages
function switchProductionPlanSubpage(subpage) {
  window.productionPlanState.activeSubpage = subpage;

  // Save subpage state to localStorage
  try {
    localStorage.setItem('productionPlan_activeSubpage', subpage);
    console.log('[Production Plan] Saved activeSubpage to localStorage:', subpage);
  } catch (error) {
    console.error('[Production Plan] Error saving activeSubpage:', error);
  }

  // Render the appropriate subpage
  if (subpage === 'latest') {
    renderProductionPlanLatest();
  } else if (subpage === 'generate') {
    renderProductionPlanGenerate();
  }
}

// Export to window for onclick handlers
window.switchProductionPlanSubpage = switchProductionPlanSubpage;

// ==================== Report Date Range Validation ====================

/**
 * Validate that End Date is not earlier than Start Date
 */
function validateReportDateRange() {
  const startDateInput = document.getElementById('configStartDate');
  const endDateInput = document.getElementById('configEndDate');
  const errorDiv = document.getElementById('endDateError');

  // Get values
  const startDate = startDateInput?.value;
  const endDate = endDateInput?.value;

  // Both dates must be filled
  if (!startDate || !endDate) {
    return true; // Don't show error if not both filled yet
  }

  // Compare dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    // Show error
    if (errorDiv) {
      errorDiv.textContent = '⚠️ End Date cannot be earlier than Start Date';
      errorDiv.classList.remove('hidden');
    }
    if (endDateInput) {
      endDateInput.style.borderColor = '#dc2626';
    }
    return false;
  } else {
    // Clear error
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
    if (endDateInput) {
      endDateInput.style.borderColor = '#cbd5e1';
    }
    return true;
  }
}

// Export to window for onclick handlers
window.validateReportDateRange = validateReportDateRange;

// ==================== NEW: Simulation & POR Management Functions ====================

/**
 * Render Simulation Library Tab
 */
function renderSimulationLibrary() {
  const tabContent = document.getElementById('tabContent');
  if (!tabContent) return;

  const projects = SimulationManager.getProjects();
  const allSimulations = SimulationManager.getSimulations();

  // Get standalone simulations (not in any project)
  const projectSimIds = new Set();
  projects.forEach(proj => proj.simulationIds.forEach(id => projectSimIds.add(id)));
  const standaloneSimulations = allSimulations.filter(sim => !projectSimIds.has(sim.id));

  const formatNumber = (num) => num.toLocaleString('en-US');
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderSimCard = (sim, showVariantButton = false, projectId = null) => {
    const summary = sim.results.summary;
    const weeklyMetrics = sim.results.weeklyMetrics;
    const weeksWithGap = weeklyMetrics.filter(w => w.gap < 0);

    return `
      <div class="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
        <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-800 mb-1">${sim.name}</h4>
              ${sim.description ? `<p class="text-xs text-gray-600">${sim.description}</p>` : ''}
            </div>
            <span class="text-2xl">📊</span>
          </div>
        </div>

        <div class="p-4 space-y-2 text-sm border-b border-gray-100">
          <div class="flex justify-between">
            <span class="text-gray-600">Created:</span>
            <span class="font-medium text-gray-800">${formatDate(sim.createdAt)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Output:</span>
            <span class="font-medium text-gray-800">${formatNumber(summary.totalOutput)} units</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Attainment:</span>
            <span class="font-medium text-gray-800">${summary.overallAttainment.toFixed(1)}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Gap Weeks:</span>
            <span class="font-medium ${weeksWithGap.length === 0 ? 'text-green-600' : 'text-red-600'}">${weeksWithGap.length}</span>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200 space-y-2">
          <button onclick="viewSimulationReport('${sim.id}')" class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            View Report
          </button>
          ${showVariantButton ? `
            <button onclick="createVariantFromSimulation('${projectId}', '${sim.id}')" class="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
              + Create Variant
            </button>
          ` : ''}
          <button onclick="deleteSimulation('${sim.id}')" class="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
            Delete
          </button>
        </div>
      </div>
    `;
  };

  tabContent.innerHTML = `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">📚 Simulation Library</h3>
        <p class="text-sm text-gray-600 mt-1">Organize simulations into projects for comparison</p>
      </div>
      <div class="flex gap-2">
        <button onclick="openCreateProjectDialog()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
          + New Project
        </button>
        <button onclick="switchProductionPlanTab('generate')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          + New Simulation
        </button>
      </div>
    </div>

    <!-- Projects Section -->
    ${projects.length > 0 ? `
      <div class="mb-8">
        <h4 class="text-md font-semibold text-gray-700 mb-4">📁 Projects</h4>
        <div class="space-y-6">
          ${projects.map(project => {
            const sims = SimulationManager.getProjectSimulations(project.id);
            return `
              <div class="border-2 border-purple-200 rounded-xl bg-purple-50/50 overflow-hidden">
                <div class="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h5 class="font-bold text-purple-900">${project.name}</h5>
                      ${project.description ? `<p class="text-sm text-purple-700 mt-1">${project.description}</p>` : ''}
                      <p class="text-xs text-purple-600 mt-1">${sims.length} simulation${sims.length !== 1 ? 's' : ''} • Created ${formatDate(project.createdAt)}</p>
                    </div>
                    <button onclick="deleteProject('${project.id}')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm">
                      Delete Project
                    </button>
                  </div>
                </div>

                ${sims.length === 0 ? `
                  <div class="p-8 text-center">
                    <p class="text-gray-500 text-sm">No simulations in this project yet</p>
                    <button onclick="switchProductionPlanTab('generate')" class="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                      Generate First Simulation
                    </button>
                  </div>
                ` : `
                  <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      ${sims.map(sim => renderSimCard(sim, true, project.id)).join('')}
                    </div>
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Standalone Simulations -->
    ${standaloneSimulations.length > 0 ? `
      <div>
        <h4 class="text-md font-semibold text-gray-700 mb-4">🔬 Standalone Simulations</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${standaloneSimulations.map(sim => renderSimCard(sim, false)).join('')}
        </div>
      </div>
    ` : (projects.length === 0 ? `
      <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div class="text-gray-400 text-5xl mb-4">📊</div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No Simulations Yet</h3>
        <p class="text-gray-600 mb-6">Create your first project or simulation to get started</p>
        <div class="flex gap-3 justify-center">
          <button onclick="openCreateProjectDialog()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
            Create Project
          </button>
          <button onclick="switchProductionPlanTab('generate')" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Generate Simulation
          </button>
        </div>
      </div>
    ` : '')}
  `;
}

/**
 * Open dialog to create a new project
 */
function openCreateProjectDialog() {
  console.log('[openCreateProjectDialog] Opening project creation dialog');
  const dialog = document.createElement('div');
  dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  dialog.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-800">Create New Project</h3>
        <p class="text-sm text-gray-600 mt-1">Group simulations for comparison</p>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
          <input type="text" id="newProjectName" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="e.g., Holiday Overtime Scenarios">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="newProjectDesc" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Optional: Describe the purpose of this project"></textarea>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="text-xs font-medium text-blue-900 mb-1">Base Conditions (Optional)</div>
          <p class="text-xs text-blue-700">You can add base conditions later when generating simulations</p>
        </div>
      </div>

      <div class="p-6 border-t border-gray-200 flex gap-3">
        <button onclick="closeProjectDialog()" class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
          Cancel
        </button>
        <button onclick="confirmCreateProject()" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
          Create Project
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  setTimeout(() => document.getElementById('newProjectName').focus(), 100);
}

/**
 * Close project dialog
 */
function closeProjectDialog() {
  const dialog = document.querySelector('.fixed.inset-0');
  if (dialog) dialog.remove();
}
window.closeProjectDialog = closeProjectDialog;

/**
 * Confirm and create new project
 */
function confirmCreateProject() {
  console.log('[confirmCreateProject] Called');
  const name = document.getElementById('newProjectName').value.trim();
  const description = document.getElementById('newProjectDesc').value.trim();
  console.log('[confirmCreateProject] Name:', name, 'Description:', description);

  if (!name) {
    alert('Please enter a project name');
    return;
  }

  const projectId = SimulationManager.createProject({
    name: name,
    description: description,
    baseConditions: {}
  });
  console.log('[confirmCreateProject] Created project with ID:', projectId);

  closeProjectDialog();

  // Check if we're in simulation flow
  console.log('[confirmCreateProject] _inSimulationFlow:', window._inSimulationFlow);
  if (window._inSimulationFlow) {
    // Store the newly created project ID
    window.pendingSimulationProject = {
      type: 'existing',
      projectId: projectId
    };
    console.log('[confirmCreateProject] Stored pendingSimulationProject:', window.pendingSimulationProject);

    // Clean up flow flag
    delete window._inSimulationFlow;

    // Show planning mode modal
    console.log('[confirmCreateProject] Showing planning mode modal');
    showPlanningModeModal();
  } else {
    // Normal project creation flow
    console.log('[confirmCreateProject] Normal flow - rendering library');
    renderSimulationLibrary();
    alert(`Project "${name}" created successfully!`);
  }
}
window.openCreateProjectDialog = openCreateProjectDialog;
window.confirmCreateProject = confirmCreateProject;

/**
 * Create a variant from an existing simulation
 */
function createVariantFromSimulation(projectId, simulationId) {
  const project = SimulationManager.getProjectById(projectId);
  const simulation = SimulationManager.getSimulations().find(s => s.id === simulationId);

  if (!project || !simulation) {
    alert('Project or simulation not found');
    return;
  }

  const dialog = document.createElement('div');
  dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  dialog.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-800">Create Variant</h3>
        <p class="text-sm text-gray-600 mt-1">Based on: "${simulation.name}"</p>
      </div>

      <div class="p-6">
        <p class="text-sm text-gray-700 mb-4">Choose how you want to create a variant of this simulation:</p>

        <div class="space-y-3">
          <!-- Manual Configuration -->
          <button onclick="createVariantManually('${projectId}', '${simulationId}')" class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
            <div class="flex items-start gap-3">
              <span class="text-2xl">⚙️</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-800 group-hover:text-blue-700">Manual Configuration</div>
                <p class="text-sm text-gray-600 mt-1">Adjust working parameters, holiday calendar, or ramp curves manually through the configuration pages</p>
              </div>
            </div>
          </button>

          <!-- AI Assistant (Placeholder) -->
          <button onclick="createVariantWithAI('${projectId}', '${simulationId}')" class="w-full text-left p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group relative">
            <div class="absolute top-2 right-2">
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Coming Soon</span>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-2xl">🤖</span>
              <div class="flex-1">
                <div class="font-semibold text-gray-800 group-hover:text-purple-700">AI Assistant</div>
                <p class="text-sm text-gray-600 mt-1">Use natural language to describe changes (e.g., "Enable Sunday OT for Q1", "Add 2 days Mid-Autumn holiday in September")</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="p-6 border-t border-gray-200">
        <button onclick="closeVariantDialog()" class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
}

/**
 * Close variant dialog
 */
function closeVariantDialog() {
  const dialog = document.querySelector('.fixed.inset-0');
  if (dialog) dialog.remove();
}

/**
 * Create variant manually (navigate to config pages)
 */
function createVariantManually(projectId, simulationId) {
  closeVariantDialog();

  const simulation = SimulationManager.getSimulations().find(s => s.id === simulationId);
  if (!simulation) return;

  // Store context for variant creation
  sessionStorage.setItem('variantContext', JSON.stringify({
    projectId: projectId,
    baseSimulationId: simulationId,
    baseSimulationName: simulation.name
  }));

  alert(`Variant mode activated!\n\nYou can now adjust configurations (Working Parameters, Holiday Calendar, Ramp Curves) and generate a new simulation. It will automatically be added to the project.`);

  // Navigate to Working Parameters tab
  switchProductionPlanTab('generate');
}

/**
 * Create variant with AI (placeholder)
 */
function createVariantWithAI(projectId, simulationId) {
  closeVariantDialog();

  const dialog = document.createElement('div');
  dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  dialog.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
      <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🤖</span>
          <div>
            <h3 class="text-lg font-bold text-gray-800">AI Configuration Assistant</h3>
            <p class="text-sm text-gray-600 mt-1">Coming Soon</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-2">
            <span class="text-lg">⚠️</span>
            <div class="text-sm text-yellow-800">
              <div class="font-semibold mb-1">Feature Under Development</div>
              <p>The AI Assistant for natural language configuration adjustment is currently under development. For now, please use Manual Configuration to create variants.</p>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="font-semibold text-purple-900 mb-2">Planned Features:</div>
          <ul class="text-sm text-purple-800 space-y-1">
            <li>• Natural language config changes (e.g., "Enable Sunday OT for March")</li>
            <li>• Smart holiday adjustments (e.g., "Add 2 days for Mid-Autumn")</li>
            <li>• Ramp curve modifications (e.g., "Use aggressive ramp for Line 1")</li>
            <li>• Batch scenario generation for comparison</li>
          </ul>
        </div>
      </div>

      <div class="p-6 border-t border-gray-200">
        <button onclick="closeAIPlaceholderDialog()" class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
          Got It
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
}

/**
 * Close AI placeholder dialog
 */
function closeAIPlaceholderDialog() {
  const dialog = document.querySelector('.fixed.inset-0');
  if (dialog) dialog.remove();
}

/**
 * Delete a project
 */
function deleteProject(projectId) {
  const project = SimulationManager.getProjectById(projectId);
  if (!project) return;

  const sims = SimulationManager.getProjectSimulations(projectId);
  const confirmMsg = sims.length > 0
    ? `Are you sure you want to delete project "${project.name}"?\n\nThis will remove ${sims.length} simulation${sims.length !== 1 ? 's' : ''} from the project (simulations will become standalone).`
    : `Are you sure you want to delete project "${project.name}"?`;

  if (!confirm(confirmMsg)) return;

  SimulationManager.deleteProject(projectId);
  renderSimulationLibrary();
}

// Export project management functions to window
window.createVariantFromSimulation = createVariantFromSimulation;
window.closeVariantDialog = closeVariantDialog;
window.createVariantManually = createVariantManually;
window.createVariantWithAI = createVariantWithAI;
window.closeAIPlaceholderDialog = closeAIPlaceholderDialog;
window.deleteProject = deleteProject;

/**
 * Delete a simulation
 */
function deleteSimulation(simId) {
  const simulation = SimulationManager.getSimulations().find(s => s.id === simId);
  if (!simulation) return;

  if (!confirm(`Are you sure you want to delete simulation "${simulation.name}"?\n\nThis action cannot be undone.`)) return;

  // Remove from any projects first
  const projects = SimulationManager.getProjects();
  projects.forEach(project => {
    if (project.simulationIds.includes(simId)) {
      SimulationManager.removeSimulationFromProject(project.id, simId);
    }
  });

  // Delete the simulation
  const simulations = SimulationManager.getSimulations();
  const index = simulations.findIndex(s => s.id === simId);
  if (index !== -1) {
    simulations.splice(index, 1);
    localStorage.setItem('productionPlan_simulations', JSON.stringify(simulations));
  }

  renderSimulationLibrary();
}

/**
 * View simulation report
 */
function viewSimulationReport(simId) {
  const simulation = SimulationManager.getSimulations().find(s => s.id === simId);
  if (!simulation) {
    alert('Simulation not found');
    return;
  }

  // Store simulation for report view
  sessionStorage.setItem('viewingSimulation', JSON.stringify(simulation));

  // Navigate to report view (we'll implement this in the report generation section)
  alert(`Opening report for "${simulation.name}"...\n\nReport view functionality will be implemented in the Generate Report section.`);

  // For now, log the simulation data
  console.log('Simulation Report:', simulation);
}

/**
 * Render Current POR Tab
 */
function renderCurrentPOR() {
  const tabContent = document.getElementById('tabContent');
  if (!tabContent) return;

  const currentPOR = SimulationManager.getCurrentPOR();

  if (!currentPOR) {
    tabContent.innerHTML = `
      <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div class="text-gray-400 text-5xl mb-4">✅</div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No POR Yet</h3>
        <p class="text-gray-600 mb-6">Generate a simulation and promote it to create your first Plan of Record</p>
        <button
          onclick="switchProductionPlanTab('generate')"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Generate New Simulation
        </button>
      </div>
    `;
    return;
  }

  const formatNumber = (num) => num.toLocaleString('en-US');
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  tabContent.innerHTML = `
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800">Current POR (Plan of Record)</h3>
      <p class="text-sm text-gray-600 mt-1">Official production plan version</p>
    </div>

    <!-- POR Card -->
    <div class="bg-white border-2 border-blue-200 rounded-xl shadow-md">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-3">
              <span class="text-3xl">✅</span>
              <div>
                <h3 class="text-xl font-bold text-gray-800">POR ${currentPOR.version}</h3>
                <p class="text-sm text-gray-600">${currentPOR.name}</p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-600">Generated</div>
            <div class="text-sm font-medium text-gray-800">${formatDate(currentPOR.createdAt)}</div>
          </div>
        </div>
        ${currentPOR.promotedFrom ? `
          <div class="mt-3 text-sm text-gray-600">
            Promoted from: <span class="font-medium">"${currentPOR.name}" (Simulation)</span>
          </div>
        ` : ''}
      </div>

      <!-- Configuration -->
      <div class="p-6 border-b border-gray-200">
        <h4 class="font-semibold text-gray-800 mb-3">Configuration</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-gray-600 mb-1">Mode</div>
            <div class="font-medium text-gray-800">${currentPOR.config.mode}</div>
          </div>
          <div>
            <div class="text-gray-600 mb-1">Period</div>
            <div class="font-medium text-gray-800">${currentPOR.config.dateRange.start} to ${currentPOR.config.dateRange.end}</div>
          </div>
          <div>
            <div class="text-gray-600 mb-1">Sites</div>
            <div class="font-medium text-gray-800">${currentPOR.config.sites.join(', ')}</div>
          </div>
          <div>
            <div class="text-gray-600 mb-1">Ramp Curve</div>
            <div class="font-medium text-gray-800">${currentPOR.config.rampCurve}</div>
          </div>
          <div>
            <div class="text-gray-600 mb-1">Sunday OT</div>
            <div class="font-medium text-gray-800">${currentPOR.config.otEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
          </div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="p-6 border-b border-gray-200">
        <h4 class="font-semibold text-gray-800 mb-3">Key Metrics</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Total Output</div>
            <div class="text-lg font-bold text-blue-600">${formatNumber(currentPOR.results.summary.totalOutput)}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Total Shipment</div>
            <div class="text-lg font-bold text-green-600">${formatNumber(currentPOR.results.summary.totalShipment)}</div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Attainment</div>
            <div class="text-lg font-bold text-purple-600">${currentPOR.results.summary.overallAttainment.toFixed(1)}%</div>
          </div>
          <div class="bg-${currentPOR.results.summary.weeksWithGap.length > 0 ? 'red' : 'green'}-50 p-4 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Weeks with Gap</div>
            <div class="text-lg font-bold text-${currentPOR.results.summary.weeksWithGap.length > 0 ? 'red' : 'green'}-600">${currentPOR.results.summary.weeksWithGap.length}</div>
          </div>
        </div>
      </div>

      <!-- Changes from Previous POR -->
      ${currentPOR.changesFromPrevious ? `
        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-gray-800">Changes from Previous POR</h4>
            <button
              onclick="generatePORChangeSummary('${currentPOR.id}')"
              class="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition">
              🤖 AI Summary
            </button>
          </div>
          <div id="porAISummary_${currentPOR.id}" class="mb-4 hidden"></div>

          ${currentPOR.changesFromPrevious.configChanges.length > 0 ? `
            <div class="mb-4">
              <div class="text-sm font-medium text-gray-700 mb-2">Configuration Changes:</div>
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-left text-gray-600">Parameter</th>
                      <th class="px-3 py-2 text-left text-gray-600">Previous</th>
                      <th class="px-3 py-2 text-left text-gray-600">Current</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${currentPOR.changesFromPrevious.configChanges.map(change => `
                      <tr class="border-t border-gray-200">
                        <td class="px-3 py-2 font-medium text-gray-800">${change.parameter}</td>
                        <td class="px-3 py-2 text-gray-600">${change.oldValue}</td>
                        <td class="px-3 py-2 text-blue-600 font-medium">${change.newValue} 🔄</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          ${currentPOR.changesFromPrevious.summaryChanges.length > 0 ? `
            <div>
              <div class="text-sm font-medium text-gray-700 mb-2">Metrics Changes:</div>
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-left text-gray-600">Metric</th>
                      <th class="px-3 py-2 text-left text-gray-600">Previous</th>
                      <th class="px-3 py-2 text-left text-gray-600">Current</th>
                      <th class="px-3 py-2 text-left text-gray-600">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${currentPOR.changesFromPrevious.summaryChanges.map(change => {
                      const deltaStr = change.deltaPercent !== null
                        ? `${change.deltaPercent > 0 ? '+' : ''}${change.deltaPercent.toFixed(1)}%`
                        : `${change.delta > 0 ? '+' : ''}${change.delta}`;
                      const color = change.delta > 0 ? 'green' : change.delta < 0 ? 'red' : 'gray';
                      return `
                        <tr class="border-t border-gray-200">
                          <td class="px-3 py-2 font-medium text-gray-800">${change.metric}</td>
                          <td class="px-3 py-2 text-gray-600">${formatNumber(change.oldValue)}</td>
                          <td class="px-3 py-2 text-gray-800">${formatNumber(change.newValue)}</td>
                          <td class="px-3 py-2 text-${color}-600 font-medium">${deltaStr} ${change.delta > 0 ? '📈' : change.delta < 0 ? '📉' : ''}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="p-6 border-t border-gray-200 flex space-x-3">
        <button
          onclick="viewSimulationReport('${currentPOR.id}')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          📄 View Full Report
        </button>
        <button
          onclick="ExcelExport.exportPOR(SimulationManager.getCurrentPOR())"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium">
          📥 Export to Excel
        </button>
        <button
          onclick="switchProductionPlanTab('history')"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
          📜 View Version History
        </button>
      </div>
    </div>
  `;
}

/**
 * Render POR History Tab
 */
function renderPORHistory() {
  const tabContent = document.getElementById('tabContent');
  if (!tabContent) return;

  const history = SimulationManager.getPORHistory();
  const currentPOR = SimulationManager.getCurrentPOR();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  tabContent.innerHTML = `
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800">POR Version History</h3>
      <p class="text-sm text-gray-600 mt-1">Track changes across Plan of Record versions</p>
    </div>

    ${!currentPOR && history.length === 0 ? `
      <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div class="text-gray-400 text-5xl mb-4">📜</div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No POR History</h3>
        <p class="text-gray-600">Version history will appear here after you create PORs</p>
      </div>
    ` : `
      <div class="space-y-4">
        ${currentPOR ? `
          <div class="bg-white border-2 border-green-200 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">✅</span>
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-gray-800">POR ${currentPOR.version}</span>
                    <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Current</span>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">${currentPOR.name}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-600">Created</div>
                <div class="text-sm font-medium text-gray-800">${formatDate(currentPOR.createdAt)}</div>
              </div>
            </div>
            ${currentPOR.notes ? `
              <div class="mt-3 text-sm text-gray-600">
                <span class="font-medium">Notes:</span> ${currentPOR.notes}
              </div>
            ` : ''}
            <div class="mt-4 flex space-x-2">
              <button
                onclick="viewSimulationReport('${currentPOR.id}')"
                class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                View Report
              </button>
            </div>
          </div>
        ` : ''}

        ${history.map(por => `
          <div class="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">📋</span>
                <div>
                  <div class="font-bold text-gray-800">POR ${por.version}</div>
                  <div class="text-sm text-gray-600 mt-1">${por.name}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-600">Created</div>
                <div class="text-sm font-medium text-gray-800">${formatDate(por.createdAt)}</div>
              </div>
            </div>
            ${por.notes ? `
              <div class="mt-3 text-sm text-gray-600">
                <span class="font-medium">Notes:</span> ${por.notes}
              </div>
            ` : ''}
            <div class="mt-4 flex space-x-2">
              <button
                onclick="viewSimulationReport('${por.id}')"
                class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                View Report
              </button>
              ${currentPOR ? `
                <button
                  onclick="comparePORVersions('${currentPOR.version}', '${por.version}')"
                  class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                  Compare with Current
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

// ==================== Action Handlers ====================

/**
 * View simulation report in new window
 */
window.viewSimulationReport = function(simId) {
  // Save to localStorage with temporary ID
  const planId = 'temp_' + Date.now();

  let planData;
  if (simId.startsWith('POR_')) {
    // It's a POR
    const por = SimulationManager.getCurrentPOR();
    if (por && por.id === simId) {
      planData = { results: por.results, config: por.config };
    } else {
      const history = SimulationManager.getPORHistory();
      const historicalPOR = history.find(p => p.id === simId);
      if (historicalPOR) {
        planData = { results: historicalPOR.results, config: historicalPOR.config };
      }
    }
  } else {
    // It's a simulation
    const sim = SimulationManager.getSimulationById(simId);
    if (sim) {
      planData = { results: sim.results, config: sim.config };
    }
  }

  if (planData) {
    localStorage.setItem('productionPlan_' + planId, JSON.stringify(planData));

    const reportWindow = window.open(
      'production_plan_report.html?planId=' + planId,
      '_blank',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (!reportWindow) {
      alert('Please allow pop-ups for this site to view the report.');
    }
  } else {
    alert('Simulation or POR not found.');
  }
};

/**
 * View full report for latest production plan
 */
window.viewLatestPlanFullReport = function() {
  const state = window.productionPlanState;

  if (!state.planResults) {
    alert('No plan data available.');
    return;
  }

  // Save to localStorage with temporary ID
  const planId = 'temp_' + Date.now();
  const planData = {
    results: state.planResults,
    config: {
      mode: state.mode,
      dateRange: {
        start: state.startDate,
        end: state.endDate
      }
    },
    generatedAt: new Date().toISOString()
  };

  localStorage.setItem('productionPlan_' + planId, JSON.stringify(planData));

  const reportWindow = window.open(
    'production_plan_report.html?planId=' + planId,
    '_blank',
    'width=1200,height=800,scrollbars=yes,resizable=yes'
  );

  if (!reportWindow) {
    alert('Please allow pop-ups for this site to view the report.');
  }
};

/**
 * Toggle older simulations visibility
 */
window.toggleOlderSimulations = function() {
  const olderSimsContainer = document.getElementById('olderSimulations');
  const toggleIcon = document.getElementById('olderSimulationsToggleIcon');
  const toggleText = document.getElementById('olderSimulationsToggleText');

  if (olderSimsContainer.style.display === 'none') {
    olderSimsContainer.style.display = 'grid';
    toggleIcon.textContent = '▲';
    const count = olderSimsContainer.children.length;
    toggleText.textContent = `Hide ${count} Older Simulation${count > 1 ? 's' : ''}`;
  } else {
    olderSimsContainer.style.display = 'none';
    toggleIcon.textContent = '▼';
    const count = olderSimsContainer.children.length;
    toggleText.textContent = `Show ${count} Older Simulation${count > 1 ? 's' : ''}`;
  }
};

/**
 * Confirm and delete a simulation
 */
window.confirmDeleteSimulation = function(simId) {
  // Find the simulation to get its name
  const sim = SimulationManager.getSimulationById(simId);
  const simName = sim ? sim.name : 'this simulation';

  if (confirm(`Are you sure you want to delete "${simName}"?\n\nThis action cannot be undone.`)) {
    const success = SimulationManager.deleteSimulation(simId);
    if (success) {
      showNotification('✅ Simulation deleted successfully', 'success');
      renderProductionPlan(); // Refresh the view
      console.log('[UI] Simulation deleted:', simId);
    } else {
      alert('Failed to delete simulation.');
    }
  }
};

/**
 * Delete a simulation (kept for backwards compatibility)
 */
window.deleteSimulation = function(simId) {
  confirmDeleteSimulation(simId);
};

/**
 * Prompt to promote simulation to POR
 */
window.promptPromoteSimulationToPOR = function(simId) {
  const simulation = SimulationManager.getSimulationById(simId);
  if (!simulation) {
    alert('Simulation not found.');
    return;
  }

  const currentPOR = SimulationManager.getCurrentPOR();
  const nextVersion = calculateNextVersionHelper(currentPOR, simulation.config);

  // Show modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-800">Promote to POR</h3>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to promote:
        </p>
        <div class="bg-blue-50 p-3 rounded-lg mb-4">
          <div class="font-medium text-gray-800">"${simulation.name}"</div>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          to the new Plan of Record?
        </p>
        ${currentPOR ? `
          <p class="text-sm text-gray-600 mb-4">
            This will replace the current POR:<br>
            <span class="font-medium">${currentPOR.version} → ${nextVersion}</span>
          </p>
        ` : ''}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional):</label>
          <textarea
            id="porNotes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Responding to Spring Festival demand peak, enabled Sunday OT"></textarea>
        </div>
      </div>
      <div class="p-6 border-t border-gray-200 flex space-x-3">
        <button
          onclick="this.closest('.fixed').remove()"
          class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          Cancel
        </button>
        <button
          onclick="confirmPromoteToPOR('${simId}')"
          class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
          Confirm Promotion
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// Helper function for version calculation
function calculateNextVersionHelper(currentPOR, newConfig) {
  if (!currentPOR) return 'v1.0';

  const currentVersion = currentPOR.version;
  const [, major, minor] = currentVersion.match(/v(\d+)\.(\d+)/) || ['', '0', '0'];

  const isMajorChange = (
    currentPOR.config.mode !== newConfig.mode ||
    JSON.stringify(currentPOR.config.sites) !== JSON.stringify(newConfig.sites)
  );

  if (isMajorChange) {
    return `v${parseInt(major) + 1}.0`;
  } else {
    return `v${major}.${parseInt(minor) + 1}`;
  }
}

/**
 * Confirm promotion to POR
 */
window.confirmPromoteToPOR = function(simId) {
  const notes = document.getElementById('porNotes').value;

  const newPOR = SimulationManager.promoteSimulationToPOR(simId, notes);

  if (newPOR) {
    // Close modal
    document.querySelector('.fixed.inset-0').remove();

    // Show success message
    alert(`✅ Simulation promoted to POR ${newPOR.version} successfully!`);

    // Switch to POR tab
    window.productionPlanState.activeTab = 'por';
    renderProductionPlan();
  } else {
    alert('Failed to promote simulation to POR.');
  }
};

// Note: processNaturalLanguageQuery and applyAIConfig functions removed
// AI configuration is now handled through the unified openProductionPlanAIChat function

/**
 * Generate AI summary of POR changes
 */
window.generatePORChangeSummary = async function(porId) {
  if (typeof window.AI_SYSTEM === 'undefined') {
    alert('AI System not available.');
    return;
  }

  const summaryDiv = document.getElementById(`porAISummary_${porId}`);
  if (!summaryDiv) return;

  const currentPOR = SimulationManager.getCurrentPOR();
  if (!currentPOR || !currentPOR.changesFromPrevious) return;

  // Show loading
  summaryDiv.className = 'mb-4 p-4 bg-purple-50 border border-purple-300 rounded-lg';
  summaryDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="animate-spin w-5 h-5 border-3 border-purple-600 border-t-transparent rounded-full"></div>
      <span class="text-purple-900 text-sm">AI is analyzing version changes...</span>
    </div>
  `;
  summaryDiv.classList.remove('hidden');

  try {
    const configChanges = currentPOR.changesFromPrevious.configChanges;
    const summaryChanges = currentPOR.changesFromPrevious.summaryChanges;

    const prompt = `You are analyzing changes between two versions of a production plan (Plan of Record).

Previous Version: ${currentPOR.previousVersion || 'Unknown'}
Current Version: ${currentPOR.version}

Configuration Changes:
${configChanges.map(c => `- ${c.parameter}: ${c.oldValue} → ${c.newValue}`).join('\n')}

Metrics Changes:
${summaryChanges.map(c => {
  const delta = c.deltaPercent !== null
    ? `${c.deltaPercent > 0 ? '+' : ''}${c.deltaPercent.toFixed(1)}%`
    : `${c.delta > 0 ? '+' : ''}${c.delta}`;
  return `- ${c.metric}: ${c.oldValue.toLocaleString()} → ${c.newValue.toLocaleString()} (${delta})`;
}).join('\n')}

Provide a 2-3 sentence executive summary:
1. What changed and why it matters
2. Key impact (positive/negative)
3. Recommendation (approve/review/reject)

Be concise and business-focused.`;

    const response = await window.AI_SYSTEM.chat(prompt);

    summaryDiv.className = 'mb-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg';
    summaryDiv.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">🤖</span>
        <div class="flex-1">
          <h5 class="font-bold text-purple-900 mb-2">AI Executive Summary</h5>
          <div class="text-sm text-slate-800 whitespace-pre-wrap">${response}</div>
          <div class="mt-3 text-xs text-purple-600 italic">
            💡 AI-generated summary. Always validate with domain knowledge.
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('[POR AI Summary] Error:', error);
    summaryDiv.className = 'mb-4 p-4 bg-red-50 border border-red-300 rounded-lg';
    summaryDiv.innerHTML = `
      <p class="text-sm text-red-900">Failed to generate AI summary: ${error.message}</p>
    `;
  }
};

/**
 * Open Production Plan AI Assistant (Unified)
 * Handles both configuration requests and analysis questions
 */
window.openProductionPlanAIChat = function() {
  if (typeof window.AI_SYSTEM === 'undefined') {
    alert('AI System not available. Please make sure the chatbot is initialized.');
    return;
  }

  // Get context
  const currentPOR = SimulationManager.getCurrentPOR();
  const simulations = SimulationManager.getSimulations();
  const state = window.productionPlanState;
  const today = new Date().toISOString().split('T')[0];

  // Enhanced context with configuration capabilities
  const context = `
**Production Plan AI Assistant**

**Current Context**:
- Today's date: ${today}
- Current POR: ${currentPOR ? `${currentPOR.version} (${currentPOR.name})` : 'None'}
- Available Simulations: ${simulations.length}
- Active Tab: ${state.activeTab}

**I can help you with**:

1. **Configure New Plans** (Natural Language → Configuration)
   - Example: "Create a 90-day constrained plan for SZ and WH sites with Sunday OT enabled"
   - I'll extract the configuration and guide you to apply it

2. **Analyze Existing Plans**
   - Compare simulations
   - Explain gaps and constraints
   - Identify bottlenecks

3. **Answer Questions**
   - "Why is Week 23 showing a gap?"
   - "What's the difference between constrained and unconstrained mode?"
   - "How do I improve attainment?"

4. **Suggest Optimizations**
   - Recommend configuration changes
   - Identify improvement opportunities

**Configuration Options**:
- Modes: constrained (respects limits), unconstrained (no limits), combined (both)
- Sites: SZ, WH, CD, TJ, SH
- OT Settings: Sunday OT enabled/disabled
- Shift Hours: 8h, 16h, or 24h
- Working Days: 5, 6, or 7 days/week

How can I help you today?
`;

  // Open AI Drawer
  if (typeof window.openAIDrawer === 'function') {
    window.openAIDrawer(context);
  } else {
    alert('AI Drawer not available.');
  }
};

/**
 * Compare POR versions (placeholder)
 */
window.comparePORVersions = function(versionA, versionB) {
  alert(`POR comparison feature coming soon!\nComparing ${versionA} vs ${versionB}`);
  // TODO: Implement detailed comparison view
};

/**
 * Show Save Simulation Modal after plan generation
 */
window.showSaveSimulationModal = function(planResults, config) {
  // Extract summary for default name
  const summary = planResults.mode === 'combined'
    ? planResults.constrained.summary
    : planResults.summary;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const defaultName = `Production Plan - ${config.mode} - ${formatDate(config.startDate)}`;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-800">Save Simulation</h3>
        <p class="text-sm text-gray-600 mt-1">Give this simulation a name for future reference</p>
      </div>
      <div class="p-6">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Simulation Name <span class="text-red-500">*</span>
            </label>
            <button
              type="button"
              onclick="generateAINameAndDescription()"
              class="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition">
              ✨ AI Suggest
            </button>
          </div>
          <input
            type="text"
            id="simName"
            value="${defaultName}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Spring Festival Peak Response Plan A">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="simDescription"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Assumes CTB is sufficient, Sunday OT enabled"></textarea>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="text-xs font-semibold text-gray-700 mb-2">Preview:</div>
          <div class="text-sm space-y-1">
            <div><span class="text-gray-600">Mode:</span> <span class="font-medium">${config.mode}</span></div>
            <div><span class="text-gray-600">Period:</span> <span class="font-medium">${config.startDate} to ${config.endDate}</span></div>
            <div><span class="text-gray-600">Total Output:</span> <span class="font-medium">${summary.totalOutput.toLocaleString()} units</span></div>
            <div><span class="text-gray-600">Attainment:</span> <span class="font-medium">${summary.overallAttainment.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>
      <div class="p-6 border-t border-gray-200 flex space-x-3">
        <button
          onclick="this.closest('.fixed').remove()"
          class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          Cancel
        </button>
        <button
          onclick="confirmSaveSimulation()"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Save Simulation
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Store data temporarily
  window._tempSimulationData = { planResults, config };
};

/**
 * Generate AI-powered name and description for simulation
 */
window.generateAINameAndDescription = async function() {
  if (typeof window.AI_SYSTEM === 'undefined') {
    alert('AI System not available. Please make sure the chatbot is initialized.');
    return;
  }

  const { planResults, config } = window._tempSimulationData;
  const summary = planResults.mode === 'combined'
    ? planResults.constrained.summary
    : planResults.summary;

  const nameInput = document.getElementById('simName');
  const descInput = document.getElementById('simDescription');

  // Save original values
  const originalName = nameInput.value;
  const originalDesc = descInput.value;

  // Show loading
  nameInput.value = 'Generating...';
  nameInput.disabled = true;
  descInput.value = 'AI is analyzing...';
  descInput.disabled = true;

  try {
    const prompt = `Generate a concise name and description for a production plan simulation:

Config:
- Mode: ${config.mode}
- Period: ${config.startDate} to ${config.endDate}
- Sites: ${config.sites?.join(', ') || 'Multiple sites'}

Results:
- Total Output: ${summary.totalOutput.toLocaleString()} units
- Attainment: ${summary.overallAttainment.toFixed(1)}%
- Weeks with Gap: ${summary.weeksWithGap?.length || 0}

Provide:
1. **Name** (max 60 chars, descriptive and professional)
2. **Description** (max 150 chars, summarize key assumptions and results)

Format your response as:
NAME: [your suggested name]
DESCRIPTION: [your suggested description]`;

    const response = await window.AI_SYSTEM.chat(prompt);

    // Parse response
    const nameMatch = response.match(/NAME:\s*(.+)/i);
    const descMatch = response.match(/DESCRIPTION:\s*(.+)/i);

    if (nameMatch && nameMatch[1]) {
      nameInput.value = nameMatch[1].trim();
    } else {
      nameInput.value = originalName;
    }

    if (descMatch && descMatch[1]) {
      descInput.value = descMatch[1].trim();
    } else {
      descInput.value = originalDesc;
    }

  } catch (error) {
    console.error('[AI Name Generator] Error:', error);
    nameInput.value = originalName;
    descInput.value = originalDesc;
    alert('Failed to generate AI suggestions: ' + error.message);
  } finally {
    nameInput.disabled = false;
    descInput.disabled = false;
  }
};

/**
 * Confirm and save simulation
 */
window.confirmSaveSimulation = function() {
  const name = document.getElementById('simName').value.trim();
  if (!name) {
    alert('Please enter a simulation name.');
    return;
  }

  const description = document.getElementById('simDescription').value.trim();
  const { planResults, config } = window._tempSimulationData;

  // Calculate summary
  const summary = planResults.mode === 'combined'
    ? {
        totalOutput: planResults.constrained.summary.totalOutput,
        totalShipment: planResults.constrained.summary.totalShipment,
        overallAttainment: planResults.constrained.summary.overallAttainment,
        weeksWithGap: planResults.constrained.weeklyMetrics.filter(w => w.gap < 0).map(w => w.week_id)
      }
    : {
        totalOutput: planResults.summary.totalOutput,
        totalShipment: planResults.summary.totalShipment,
        overallAttainment: planResults.summary.overallAttainment,
        weeksWithGap: planResults.weeklyMetrics.filter(w => w.gap < 0).map(w => w.week_id)
      };

  // Prepare results
  const results = planResults.mode === 'combined'
    ? {
        mode: 'combined',
        unconstrained: {
          programResults: planResults.unconstrained.programResults,
          weeklyMetrics: planResults.unconstrained.weeklyMetrics,
          siteResults: planResults.unconstrained.siteResults,
          summary: planResults.unconstrained.summary
        },
        constrained: {
          programResults: planResults.constrained.programResults,
          weeklyMetrics: planResults.constrained.weeklyMetrics,
          siteResults: planResults.constrained.siteResults,
          summary: planResults.constrained.summary
        }
      }
    : {
        mode: config.mode, // Add mode field for single mode
        programResults: planResults.programResults,
        weeklyMetrics: planResults.weeklyMetrics,
        siteResults: planResults.siteResults,
        summary: planResults.summary
      };

  results.summary = summary;

  // Enhanced config
  const seedData = PRODUCTION_PLAN_SEED_DATA;
  const enhancedConfig = {
    mode: config.mode,
    dateRange: {
      start: config.startDate,
      end: config.endDate
    },
    sites: seedData.sites ? seedData.sites.map(s => s.site_id) : [],
    rampCurve: 'standard', // TODO: Get from config
    otEnabled: false, // TODO: Get from config
    shiftHours: config.shiftHours,
    workingDays: config.workingDays,
    weeklyDemand: seedData.weeklyDemand || [] // Include demand forecast data
  };

  // Create simulation
  const simId = SimulationManager.createSimulation({
    name,
    description,
    tags: [],
    config: enhancedConfig,
    results
  });

  console.log('[UI] Simulation saved:', simId);

  // Handle project association
  if (window.pendingSimulationProject) {
    const projectSelection = window.pendingSimulationProject;

    if (projectSelection.type === 'existing') {
      // Add to existing project
      window.SimulationManager.addSimulationToProject(projectSelection.projectId, simId);
      console.log('[UI] Simulation added to existing project:', projectSelection.projectId);
    } else if (projectSelection.type === 'new') {
      // Create new project and add simulation to it
      const newProjectId = window.SimulationManager.createProject({
        name: projectSelection.projectName,
        description: projectSelection.projectDescription || '',
        baseConditions: config
      });
      window.SimulationManager.addSimulationToProject(newProjectId, simId);
      console.log('[UI] New project created and simulation added:', newProjectId);
    }
    // else: standalone - no project association

    // Cleanup project selection
    delete window.pendingSimulationProject;
  }

  // Close modal immediately - remove ALL fixed overlays to be absolutely sure
  const allModals = document.querySelectorAll('.fixed.inset-0');
  console.log('[UI] Found modals to remove:', allModals.length);
  allModals.forEach((modal, index) => {
    console.log('[UI] Removing modal #' + index);
    modal.remove();
  });

  // Cleanup temp data immediately
  delete window._tempSimulationData;

  // Switch to Simulations tab and re-render
  window.productionPlanState.activeTab = 'simulations';
  renderProductionPlan();

  // Show success message
  showNotification('✅ Simulation saved successfully!', 'success');

  // Open report in new window after a short delay to ensure modal is fully closed
  setTimeout(() => {
    viewSimulationReport(simId);
  }, 100);
};

// Render capacity configuration with hierarchical structure (Site → Line → Shift)
function renderCapacityUnitsConfig() {
  const seedData = PRODUCTION_PLAN_SEED_DATA;
  const container = document.getElementById('capacitySitesContainer');

  if (!container) return;

  const units = seedData.capacityUnits || [];
  const sites = seedData.sites || [];

  // Check if there are any sites at all
  if (sites.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-500">
        <div class="text-4xl mb-2">🏭</div>
        <div class="text-sm">No sites configured. Click "+ Add Site" to start.</div>
      </div>
    `;
    return;
  }

  // Group units by site, starting with all sites from sites array
  const siteGroups = {};

  // First, initialize all sites from sites array
  sites.forEach(site => {
    siteGroups[site.site_id] = {
      site_id: site.site_id,
      site_name: site.site_name,
      country: site.country,
      holiday_config: 'legal', // default to legal holidays
      lines: {}
    };
  });

  // Then, populate with capacity units data
  units.forEach((unit, idx) => {
    // Update site if it exists in sites array
    if (siteGroups[unit.site_id]) {
      // Override holiday config from unit if exists
      siteGroups[unit.site_id].holiday_config = unit.holiday_config || 'legal';
    } else {
      // This shouldn't happen, but handle legacy data
      siteGroups[unit.site_id] = {
        site_id: unit.site_id,
        site_name: unit.site_id,
        country: 'CN', // default to CN
        holiday_config: unit.holiday_config || 'legal',
        lines: {}
      };
    }

    // Group by line within site
    if (!siteGroups[unit.site_id].lines[unit.line_id]) {
      siteGroups[unit.site_id].lines[unit.line_id] = {
        line_id: unit.line_id,
        line_type: unit.line_type,
        shifts: []
      };
    }

    siteGroups[unit.site_id].lines[unit.line_id].shifts.push({
      ...unit,
      originalIndex: idx
    });
  });

  container.innerHTML = Object.values(siteGroups).map(site => {
    const linesHtml = Object.values(site.lines).map(line => {
      const shiftsHtml = line.shifts.map(shift => `
        <div class="ml-8 border-l-2 border-slate-300 pl-4 py-3 bg-white">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="font-semibold text-slate-900">${shift.shift_type} Shift</div>
              <div class="text-xs text-slate-500 mt-1">${shift.unit_id}</div>
            </div>
            <button onclick="removeCapacityUnit(${shift.originalIndex})" class="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs">
              🗑️ Remove
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label class="text-xs text-slate-600 block mb-1">Base UPH</label>
              <input type="number" value="${shift.base_uph}" class="w-full border rounded px-2 py-1 text-sm"
                     onchange="updateCapacityUnitField(${shift.originalIndex}, 'base_uph', this.value)">
            </div>
            <div>
              <label class="text-xs text-slate-600 block mb-1">Shift Hours</label>
              <input type="number" value="${shift.shift_hours}" class="w-full border rounded px-2 py-1 text-sm"
                     onchange="updateCapacityUnitField(${shift.originalIndex}, 'shift_hours', this.value)">
            </div>
            <div>
              <label class="text-xs text-slate-600 block mb-1">Ramp Start Date</label>
              <input type="date" value="${shift.ramp_start_date}" class="w-full border rounded px-2 py-1 text-sm"
                     onchange="updateCapacityUnitField(${shift.originalIndex}, 'ramp_start_date', this.value)">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-600 block mb-1">UPH Ramp Curve</label>
              <select class="w-full border rounded px-2 py-1 text-sm"
                      onchange="updateCapacityUnitField(${shift.originalIndex}, 'uph_ramp_curve_preset', this.value)">
                <option value="standard_30d" ${shift.uph_ramp_curve_preset === 'standard_30d' || !shift.uph_ramp_curve_preset ? 'selected' : ''}>Standard 30-day Ramp</option>
                <option value="fast_20d" ${shift.uph_ramp_curve_preset === 'fast_20d' ? 'selected' : ''}>Fast 20-day Ramp</option>
                <option value="slow_45d" ${shift.uph_ramp_curve_preset === 'slow_45d' ? 'selected' : ''}>Slow 45-day Ramp</option>
                <option value="custom" ${shift.uph_ramp_curve_preset === 'custom' ? 'selected' : ''}>Custom Curve (${shift.uph_ramp_curve?.factors?.length || 0} points)</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-600 block mb-1">Yield Curve</label>
              <select class="w-full border rounded px-2 py-1 text-sm"
                      onchange="updateCapacityUnitField(${shift.originalIndex}, 'yield_ramp_curve_preset', this.value)">
                <option value="standard_30d" ${shift.yield_ramp_curve_preset === 'standard_30d' || !shift.yield_ramp_curve_preset ? 'selected' : ''}>Standard 30-day Yield</option>
                <option value="fast_20d" ${shift.yield_ramp_curve_preset === 'fast_20d' ? 'selected' : ''}>Fast 20-day Yield</option>
                <option value="slow_45d" ${shift.yield_ramp_curve_preset === 'slow_45d' ? 'selected' : ''}>Slow 45-day Yield</option>
                <option value="custom" ${shift.yield_ramp_curve_preset === 'custom' ? 'selected' : ''}>Custom Curve (${shift.yield_ramp_curve?.factors?.length || 0} points)</option>
              </select>
            </div>
          </div>
        </div>
      `).join('');

      return `
        <div class="ml-6 border-l-2 border-blue-300 pl-4 py-2 bg-blue-50/30">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold text-blue-900">📍 Line ${line.line_id} <span class="text-xs font-normal text-slate-600">(${line.line_type})</span></div>
            <button onclick="addShiftToLine('${site.site_id}', '${line.line_id}')"
                    class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              + Add Shift
            </button>
          </div>
          ${shiftsHtml}
        </div>
      `;
    }).join('');

    const countryFlag = site.country === 'CN' ? '🇨🇳' : '🇻🇳';
    const countryName = site.country === 'CN' ? 'China' : 'Vietnam';

    return `
      <div class="border-2 border-blue-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-slate-50">
        <div class="flex items-center justify-between mb-3 cursor-pointer" onclick="toggleSection('siteContent_${site.site_id}', 'siteToggle_${site.site_id}')">
          <div class="flex items-center gap-3">
            <span id="siteToggle_${site.site_id}" class="text-blue-600 text-lg transition-transform">▼</span>
            <div>
              <div class="text-lg font-bold text-blue-900">🏭 Site: ${site.site_name}</div>
              <div class="text-xs text-slate-600 mt-1">${countryFlag} ${countryName} Holidays</div>
            </div>
          </div>
          <button onclick="event.stopPropagation(); removeSite('${site.site_id}')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-semibold">
            🗑️ Remove Site
          </button>
        </div>

        <div id="siteContent_${site.site_id}">
          <div class="mb-3 pb-3 border-b border-blue-200">
            <label class="text-xs text-slate-600 font-semibold block mb-2">Holiday Configuration</label>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="holiday_${site.site_id}" value="legal" ${site.holiday_config === 'legal' ? 'checked' : ''}
                       class="rounded-full" onchange="updateSiteHolidayConfig('${site.site_id}', 'legal')">
                <span class="text-sm">Follow Legal Holidays</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="holiday_${site.site_id}" value="custom" ${site.holiday_config === 'custom' ? 'checked' : ''}
                       class="rounded-full" onchange="updateSiteHolidayConfig('${site.site_id}', 'custom')">
                <span class="text-sm">Custom Holiday Schedule</span>
              </label>
            </div>
          </div>

          <div class="space-y-3">
            ${linesHtml}
            <button onclick="addLineToSite('${site.site_id}')"
                    class="w-full border-2 border-dashed border-blue-300 rounded-lg py-2 text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-100 font-semibold">
              + Add Line to ${site.site_name}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update save button state after rendering
  updateSaveButtonState();
}

// Hierarchical capacity configuration management functions

function addSiteCapacity() {
  // Create modal for site configuration
  const modalHTML = `
    <div id="addSiteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full" style="background: white; border-radius: 12px; padding: 32px; max-width: 480px; width: 90%;">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-slate-900 mb-2" style="font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">🏭 Add New Production Site</h2>
          <p class="text-sm text-slate-600" style="font-size: 14px; color: #64748b;">Configure the site location and country settings</p>
        </div>

        <!-- Site Name Input -->
        <div class="mb-6" style="margin-bottom: 24px;">
          <label class="block text-sm font-semibold text-slate-700 mb-2" style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px;">
            Site Name <span class="text-red-500">*</span>
          </label>
          <input type="text" id="siteNameInput" placeholder="e.g., WF, VN01, Wistron Fab"
                 class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                 style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 16px;">
          <div class="text-xs text-slate-500 mt-2" style="font-size: 12px; color: #64748b; margin-top: 8px;">
            This will be used as the site identifier
          </div>
        </div>

        <!-- Country Selection -->
        <div class="mb-6" style="margin-bottom: 24px;">
          <label class="block text-sm font-semibold text-slate-700 mb-3" style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px;">
            Country <span class="text-red-500">*</span>
          </label>
          <div class="text-xs text-slate-500 mb-3" style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
            This will determine which public holiday calendar to use
          </div>
          <div class="grid grid-cols-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button type="button" onclick="selectCountry('CN')" id="country_CN"
                    class="px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    style="padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">
              🇨🇳 China
            </button>
            <button type="button" onclick="selectCountry('VN')" id="country_VN"
                    class="px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    style="padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">
              🇻🇳 Vietnam
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4" style="display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid #e2e8f0; margin-top: 24px;">
          <button onclick="closeAddSiteModal()"
                  class="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-colors"
                  style="flex: 1; padding: 12px 24px; background: #e2e8f0; border-radius: 8px; font-weight: 600; cursor: pointer; border: none;">
            Cancel
          </button>
          <button onclick="confirmAddSite()"
                  class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  style="flex: 1; padding: 12px 24px; background: #2563eb; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none;">
            Add Site
          </button>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Focus on site name input
  setTimeout(() => {
    document.getElementById('siteNameInput')?.focus();
  }, 100);
}

// Global variable to store country selection
let selectedCountry = null;

function selectCountry(country) {
  selectedCountry = country;

  // Reset all buttons
  document.getElementById('country_CN').style.borderColor = '#cbd5e1';
  document.getElementById('country_CN').style.background = 'white';
  document.getElementById('country_VN').style.borderColor = '#cbd5e1';
  document.getElementById('country_VN').style.background = 'white';

  // Highlight selected
  const btn = document.getElementById(`country_${country}`);
  btn.style.borderColor = '#2563eb';
  btn.style.background = '#eff6ff';
}

function closeAddSiteModal() {
  const modal = document.getElementById('addSiteModal');
  if (modal) {
    modal.remove();
  }
  selectedCountry = null;
}

function confirmAddSite() {
  const siteName = document.getElementById('siteNameInput')?.value.trim();

  // Validation
  if (!siteName) {
    alert('⚠️ Please enter a Site Name');
    return;
  }

  if (!selectedCountry) {
    alert('⚠️ Please select a Country');
    return;
  }

  // Auto-generate site_id from site_name (remove spaces, convert to uppercase)
  const siteId = siteName.replace(/\s+/g, '').toUpperCase();

  // Check if site already exists in sites array
  const existingSite = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
  if (existingSite) {
    alert(`⚠️ Site "${siteName}" already exists`);
    return;
  }

  // Add site to sites array
  PRODUCTION_PLAN_SEED_DATA.sites.push({
    site_id: siteId,
    site_name: siteName,
    country: selectedCountry
  });

  // Mark as modified (user will save manually)
  markConfigAsModified();

  // Close modal
  closeAddSiteModal();

  // Re-render and show success
  renderCapacityUnitsConfig();

  const countryName = selectedCountry === 'CN' ? 'China' : 'Vietnam';
  showNotification(`✅ Site ${siteName} added with ${countryName} holiday calendar. Now click "Add Line" to configure production lines.`, 'success');
}

function removeSite(siteId) {
  // Get site name for confirmation
  const siteInfo = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
  const siteName = siteInfo ? siteInfo.site_name : siteId;

  if (!confirm(`Remove site "${siteName}" and all its lines/shifts?`)) return;

  // Remove all units for this site
  PRODUCTION_PLAN_SEED_DATA.capacityUnits = PRODUCTION_PLAN_SEED_DATA.capacityUnits.filter(
    unit => unit.site_id !== siteId
  );

  // Remove site from sites array
  PRODUCTION_PLAN_SEED_DATA.sites = PRODUCTION_PLAN_SEED_DATA.sites.filter(
    site => site.site_id !== siteId
  );

  // Mark as modified (user will save manually)
  markConfigAsModified();

  renderCapacityUnitsConfig();
  showNotification(`✅ Site "${siteName}" removed (not saved yet)`, 'info');
}

function addLineToSite(siteId) {
  // Find site info to get site_name
  const siteInfo = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
  const siteName = siteInfo ? siteInfo.site_name : siteId;

  // Create modal for line configuration
  const modalHTML = `
    <div id="addLineModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full" style="background: white; border-radius: 12px; padding: 32px; max-width: 480px; width: 90%;">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-slate-900 mb-2" style="font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">Add New Line to ${siteName}</h2>
          <p class="text-sm text-slate-600" style="font-size: 14px; color: #64748b;">Configure the production line and shift settings</p>
        </div>

        <!-- Line ID Input -->
        <div class="mb-6" style="margin-bottom: 24px;">
          <label class="block text-sm font-semibold text-slate-700 mb-2" style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px;">
            Line ID <span class="text-red-500">*</span>
          </label>
          <input type="text" id="lineIdInput" placeholder="e.g., L1, L2, L3"
                 class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                 style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 16px;">
        </div>

        <!-- Line Type Selection -->
        <div class="mb-6" style="margin-bottom: 24px;">
          <label class="block text-sm font-semibold text-slate-700 mb-3" style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px;">
            Line Type <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button type="button" onclick="selectLineType('AUTO')" id="lineType_AUTO"
                    class="px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    style="padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">
              🤖 AUTO
            </button>
            <button type="button" onclick="selectLineType('MANUAL')" id="lineType_MANUAL"
                    class="px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    style="padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">
              👷 MANUAL
            </button>
          </div>
        </div>

        <!-- Shift Configuration -->
        <div class="mb-6" style="margin-bottom: 24px;">
          <label class="block text-sm font-semibold text-slate-700 mb-3" style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px;">
            Shift Configuration <span class="text-red-500">*</span>
          </label>
          <div class="space-y-2" style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" onclick="selectShiftConfig('DAY')" id="shiftConfig_DAY"
                    class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                    style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; text-align: left; font-weight: 500;">
              ☀️ Day Shift Only
            </button>
            <button type="button" onclick="selectShiftConfig('NIGHT')" id="shiftConfig_NIGHT"
                    class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                    style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; text-align: left; font-weight: 500;">
              🌙 Night Shift Only
            </button>
            <button type="button" onclick="selectShiftConfig('BOTH')" id="shiftConfig_BOTH"
                    class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                    style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; text-align: left; font-weight: 500;">
              ☀️🌙 Day & Night Shifts
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4" style="display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid #e2e8f0; margin-top: 24px;">
          <button onclick="closeAddLineModal()"
                  class="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-colors"
                  style="flex: 1; padding: 12px 24px; background: #e2e8f0; border-radius: 8px; font-weight: 600; cursor: pointer; border: none;">
            Cancel
          </button>
          <button onclick="confirmAddLine('${siteId}')"
                  class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  style="flex: 1; padding: 12px 24px; background: #2563eb; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none;">
            Add Line
          </button>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Focus on line ID input
  setTimeout(() => {
    document.getElementById('lineIdInput')?.focus();
  }, 100);
}

// Global variables to store selections
let selectedLineType = null;
let selectedShiftConfig = null;

function selectLineType(type) {
  selectedLineType = type;

  // Reset all buttons
  document.getElementById('lineType_AUTO').style.borderColor = '#cbd5e1';
  document.getElementById('lineType_AUTO').style.background = 'white';
  document.getElementById('lineType_MANUAL').style.borderColor = '#cbd5e1';
  document.getElementById('lineType_MANUAL').style.background = 'white';

  // Highlight selected
  const btn = document.getElementById(`lineType_${type}`);
  btn.style.borderColor = '#2563eb';
  btn.style.background = '#eff6ff';
}

function selectShiftConfig(config) {
  selectedShiftConfig = config;

  // Reset all buttons
  ['DAY', 'NIGHT', 'BOTH'].forEach(c => {
    const btn = document.getElementById(`shiftConfig_${c}`);
    btn.style.borderColor = '#cbd5e1';
    btn.style.background = 'white';
  });

  // Highlight selected
  const btn = document.getElementById(`shiftConfig_${config}`);
  btn.style.borderColor = '#2563eb';
  btn.style.background = '#eff6ff';
}

function closeAddLineModal() {
  const modal = document.getElementById('addLineModal');
  if (modal) {
    modal.remove();
  }
  selectedLineType = null;
  selectedShiftConfig = null;
}

function confirmAddLine(siteId) {
  const lineId = document.getElementById('lineIdInput')?.value.trim();

  // Validation
  if (!lineId) {
    alert('⚠️ Please enter a Line ID');
    return;
  }

  if (!selectedLineType) {
    alert('⚠️ Please select a Line Type (AUTO or MANUAL)');
    return;
  }

  if (!selectedShiftConfig) {
    alert('⚠️ Please select a Shift Configuration');
    return;
  }

  // Check if line already exists
  const existingLine = PRODUCTION_PLAN_SEED_DATA.capacityUnits.find(
    u => u.site_id === siteId && u.line_id === lineId
  );

  if (existingLine) {
    alert(`⚠️ Line ${lineId} already exists in ${siteId}`);
    return;
  }

  // Create shifts based on selection
  const shiftsToCreate = selectedShiftConfig === 'BOTH'
    ? ['DAY', 'NIGHT']
    : [selectedShiftConfig];

  shiftsToCreate.forEach(shiftType => {
    const newUnit = {
      unit_id: `${siteId}_${lineId}_${shiftType}`,
      program_id: 'product_a',
      site_id: siteId,
      line_id: lineId,
      line_type: selectedLineType,
      shift_type: shiftType,
      base_uph: 120,
      shift_hours: 10,
      ramp_start_date: '2026-10-05',
      holiday_config: 'legal',
      uph_ramp_curve_preset: 'standard_30d',
      uph_ramp_curve: {
        length_workdays: 30,
        factors: [
          0.50, 0.55, 0.60, 0.65, 0.70, 0.72, 0.74, 0.76, 0.78, 0.80,
          0.82, 0.84, 0.86, 0.88, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95,
          0.96, 0.97, 0.98, 0.98, 0.99, 0.99, 1.00, 1.00, 1.00, 1.00
        ]
      },
      yield_ramp_curve_preset: 'standard_30d',
      yield_ramp_curve: {
        length_workdays: 30,
        factors: [
          0.70, 0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.84, 0.85, 0.86,
          0.87, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95, 0.95,
          0.96, 0.96, 0.97, 0.97, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98
        ]
      }
    };

    PRODUCTION_PLAN_SEED_DATA.capacityUnits.push(newUnit);
  });

  // Mark as modified (user will save manually)
  markConfigAsModified();

  // Close modal
  closeAddLineModal();

  // Re-render and show success
  renderCapacityUnitsConfig();

  // Get site name for notification
  const siteInfo = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
  const siteName = siteInfo ? siteInfo.site_name : siteId;

  const shiftText = selectedShiftConfig === 'BOTH' ? 'Day & Night shifts' : `${selectedShiftConfig} shift`;
  showNotification(`✅ Line ${lineId} (${selectedLineType}) with ${shiftText} added to ${siteName}`, 'success');
}

function addShiftToLine(siteId, lineId) {
  const shiftType = prompt('Enter Shift Type (DAY or NIGHT):')?.toUpperCase();
  if (!shiftType || (shiftType !== 'DAY' && shiftType !== 'NIGHT')) {
    showNotification('⚠️ Invalid shift type. Must be DAY or NIGHT.', 'warning');
    return;
  }

  // Check if this shift already exists
  const existingShift = PRODUCTION_PLAN_SEED_DATA.capacityUnits.find(
    u => u.site_id === siteId && u.line_id === lineId && u.shift_type === shiftType
  );
  if (existingShift) {
    // Get site name for warning
    const siteInfo = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
    const siteName = siteInfo ? siteInfo.site_name : siteId;
    showNotification(`⚠️ ${shiftType} shift already exists for ${siteName} Line ${lineId}`, 'warning');
    return;
  }

  // Get line type from existing units
  const existingLine = PRODUCTION_PLAN_SEED_DATA.capacityUnits.find(
    u => u.site_id === siteId && u.line_id === lineId
  );
  const lineType = existingLine ? existingLine.line_type : 'AUTO';

  // Create new capacity unit
  const newUnit = {
    unit_id: `${siteId}_${lineId}_${shiftType}`,
    program_id: 'product_a',
    site_id: siteId,
    line_id: lineId,
    line_type: lineType,
    shift_type: shiftType,
    base_uph: 100,
    shift_hours: 10,
    ramp_start_date: '2026-10-01',
    holiday_config: 'legal',
    uph_ramp_curve_preset: 'standard_30d',
    uph_ramp_curve: {
      length_workdays: 30,
      factors: [
        0.50, 0.55, 0.60, 0.65, 0.70, 0.72, 0.74, 0.76, 0.78, 0.80,
        0.82, 0.84, 0.86, 0.88, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95,
        0.96, 0.97, 0.98, 0.98, 0.99, 0.99, 1.00, 1.00, 1.00, 1.00
      ]
    },
    yield_ramp_curve_preset: 'standard_30d',
    yield_ramp_curve: {
      length_workdays: 30,
      factors: [
        0.70, 0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.84, 0.85, 0.86,
        0.87, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95, 0.95,
        0.96, 0.96, 0.97, 0.97, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98
      ]
    }
  };

  PRODUCTION_PLAN_SEED_DATA.capacityUnits.push(newUnit);
  markConfigAsModified(); // Mark as modified (user will save manually)
  renderCapacityUnitsConfig();

  // Get site name for notification
  const siteInfo = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
  const siteName = siteInfo ? siteInfo.site_name : siteId;

  showNotification(`✅ ${shiftType} shift added to ${siteName} Line ${lineId} (not saved yet)`, 'info');
}

function removeCapacityUnit(index) {
  const unit = PRODUCTION_PLAN_SEED_DATA.capacityUnits[index];
  // Get site name for confirmation
  const siteInfo = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === unit.site_id);
  const siteName = siteInfo ? siteInfo.site_name : unit.site_id;

  if (!confirm(`Remove ${unit.shift_type} shift from ${siteName} Line ${unit.line_id}?`)) return;

  PRODUCTION_PLAN_SEED_DATA.capacityUnits.splice(index, 1);

  // Mark as modified (user will save manually)
  markConfigAsModified();

  renderCapacityUnitsConfig();
  showNotification('✅ Shift removed (not saved yet)', 'info');
}

function updateSiteHolidayConfig(siteId, configType) {
  if (configType === 'custom') {
    // Open custom holiday editor
    openCustomHolidayEditor(siteId);
  } else {
    // Update all units for this site
    PRODUCTION_PLAN_SEED_DATA.capacityUnits.forEach(unit => {
      if (unit.site_id === siteId) {
        unit.holiday_config = configType;
        delete unit.custom_holidays; // Remove custom holidays when switching to legal
      }
    });

    markConfigAsModified(); // Mark as modified (user will save manually)
    showNotification(`✅ ${siteId} now follows legal holidays (not saved yet)`, 'info');
  }
}

function openCustomHolidayEditor(siteId) {
  // Get site's country
  const siteData = PRODUCTION_PLAN_SEED_DATA.sites.find(s => s.site_id === siteId);
  const country = siteData?.country || 'CN';

  // Get legal holidays for this country
  const legalHolidays = PRODUCTION_PLAN_SEED_DATA.countryHolidays[country] || [];

  // Get existing custom holidays for this site
  const siteUnit = PRODUCTION_PLAN_SEED_DATA.capacityUnits.find(u => u.site_id === siteId);
  const customHolidays = siteUnit?.custom_holidays || JSON.parse(JSON.stringify(legalHolidays)); // Deep copy

  // Open popup window
  const editorWindow = window.open('', '_blank', 'width=900,height=700');
  const doc = editorWindow.document;

  doc.write('<!DOCTYPE html><html><head>');
  doc.write('<title>Custom Holiday Schedule - ' + siteId + '</title>');
  doc.write('<script src="https://cdn.tailwindcss.com"></script>');
  doc.write('</head><body class="bg-slate-50 p-6">');

  doc.write('<div class="max-w-4xl mx-auto">');
  doc.write('<div class="bg-white rounded-lg shadow-lg p-6">');
  doc.write('<div class="flex items-center justify-between mb-6">');
  doc.write('<div>');
  doc.write('<h1 class="text-2xl font-bold text-slate-900">Custom Holiday Schedule</h1>');
  doc.write('<p class="text-sm text-slate-600 mt-1">Site: <strong>' + siteId + '</strong> (Country: ' + country + ')</p>');
  doc.write('</div>');
  doc.write('<button onclick="window.close()" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">✕ Close</button>');
  doc.write('</div>');

  doc.write('<div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">');
  doc.write('<div class="text-sm text-blue-900">');
  doc.write('<strong>💡 Instructions:</strong> Below are the legal holidays for ' + country + '. ');
  doc.write('You can edit the start date, end date, and add notes for each holiday. ');
  doc.write('For example, if National Day is legally 7 days (Oct 1-7) but the factory only rests 3 days, ');
  doc.write('you can change the end date to Oct 3.');
  doc.write('</div>');
  doc.write('</div>');

  // Holiday list
  doc.write('<div id="holidayList" class="space-y-4">');

  customHolidays.forEach(function(holiday, idx) {
    doc.write('<div class="border border-slate-200 rounded-lg p-4 bg-slate-50">');
    doc.write('<div class="flex items-center justify-between mb-3">');
    doc.write('<div class="font-semibold text-slate-900">' + holiday.name + '</div>');
    doc.write('<button onclick="removeHoliday(' + idx + ')" class="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm">🗑️ Remove</button>');
    doc.write('</div>');

    doc.write('<div class="grid grid-cols-2 gap-4 mb-2">');
    doc.write('<div>');
    doc.write('<label class="text-xs text-slate-600 block mb-1">Start Date</label>');
    doc.write('<input type="date" id="start_' + idx + '" value="' + holiday.start + '" class="w-full border rounded px-3 py-2 text-sm">');
    doc.write('</div>');
    doc.write('<div>');
    doc.write('<label class="text-xs text-slate-600 block mb-1">End Date</label>');
    doc.write('<input type="date" id="end_' + idx + '" value="' + holiday.end + '" class="w-full border rounded px-3 py-2 text-sm">');
    doc.write('</div>');
    doc.write('</div>');

    doc.write('<div>');
    doc.write('<label class="text-xs text-slate-600 block mb-1">Notes</label>');
    doc.write('<input type="text" id="notes_' + idx + '" value="' + (holiday.notes || '') + '" ');
    doc.write('class="w-full border rounded px-3 py-2 text-sm" placeholder="e.g., Factory working on Oct 4-7">');
    doc.write('</div>');

    doc.write('</div>');
  });

  doc.write('</div>');

  // Add new holiday button
  doc.write('<button onclick="addNewHoliday()" class="mt-4 w-full border-2 border-dashed border-blue-300 rounded-lg py-3 text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-50 font-semibold">');
  doc.write('+ Add Custom Holiday');
  doc.write('</button>');

  // Save button
  doc.write('<div class="mt-6 flex items-center justify-end gap-3">');
  doc.write('<button onclick="window.close()" class="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">');
  doc.write('Cancel');
  doc.write('</button>');
  doc.write('<button onclick="saveCustomHolidays()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">');
  doc.write('💾 Save Custom Schedule');
  doc.write('</button>');
  doc.write('</div>');

  doc.write('</div>');
  doc.write('</div>');

  // JavaScript for the popup
  doc.write('<script>');
  doc.write('var holidays = ' + JSON.stringify(customHolidays) + ';');
  doc.write('var siteId = "' + siteId + '";');

  doc.write('function removeHoliday(idx) {');
  doc.write('  if (!confirm("Remove this holiday?")) return;');
  doc.write('  holidays.splice(idx, 1);');
  doc.write('  location.reload();');
  doc.write('}');

  doc.write('function addNewHoliday() {');
  doc.write('  var name = prompt("Enter holiday name:");');
  doc.write('  if (!name) return;');
  doc.write('  var start = prompt("Enter start date (YYYY-MM-DD):");');
  doc.write('  if (!start) return;');
  doc.write('  var end = prompt("Enter end date (YYYY-MM-DD):");');
  doc.write('  if (!end) return;');
  doc.write('  holidays.push({ name: name, start: start, end: end, notes: "" });');
  doc.write('  location.reload();');
  doc.write('}');

  doc.write('function saveCustomHolidays() {');
  doc.write('  var updatedHolidays = holidays.map(function(h, idx) {');
  doc.write('    return {');
  doc.write('      name: h.name,');
  doc.write('      start: document.getElementById("start_" + idx).value,');
  doc.write('      end: document.getElementById("end_" + idx).value,');
  doc.write('      notes: document.getElementById("notes_" + idx).value');
  doc.write('    };');
  doc.write('  });');
  doc.write('  ');
  doc.write('  if (window.opener && window.opener.saveCustomHolidaysToSite) {');
  doc.write('    window.opener.saveCustomHolidaysToSite(siteId, updatedHolidays);');
  doc.write('    alert("✅ Custom holiday schedule saved for " + siteId);');
  doc.write('    window.close();');
  doc.write('  }');
  doc.write('}');

  doc.write('</script>');
  doc.write('</body></html>');
  doc.close();
}

// Function to receive data from popup
function saveCustomHolidaysToSite(siteId, customHolidays) {
  // Update all units for this site with custom holidays
  PRODUCTION_PLAN_SEED_DATA.capacityUnits.forEach(unit => {
    if (unit.site_id === siteId) {
      unit.holiday_config = 'custom';
      unit.custom_holidays = customHolidays;
    }
  });

  markConfigAsModified(); // Mark as modified (user will save manually)
  showNotification(`✅ Custom holiday schedule updated for ${siteId} (not saved yet)`, 'info');
  renderCapacityUnitsConfig();
}

// Expose to window for popup access
window.saveCustomHolidaysToSite = saveCustomHolidaysToSite;

function editUphRampCurve(index) {
  showNotification('⚠️ UPH Ramp Curve editor coming soon!', 'info');
}

function editYieldRampCurve(index) {
  showNotification('⚠️ Yield Ramp Curve editor coming soon!', 'info');
}

function resetConfigurationToDefault() {
  if (!confirm('Reset all configuration to default values?')) return;

  // Reset form values
  document.getElementById('configStartDate').value = '2026-10-01';
  document.getElementById('configEndDate').value = '2026-10-31';
  document.getElementById('configShiftHours').value = '10';
  document.getElementById('configWorkingDays').value = 'MON_SAT';
  document.getElementById('configShipmentLag').value = '2';
  document.getElementById('configPalletSize').value = '480';
  document.getElementById('configConsiderHolidays').checked = true;
  document.getElementById('configDay1Factor').value = '0.5';
  document.getElementById('configDay2Factor').value = '1.0';
  document.getElementById('configDay3Factor').value = '1.0';
  document.getElementById('configMaxDailyShipment').value = '30000';
  document.getElementById('configShipmentStartDate').value = '';  // Empty = use forecast start date

  showNotification('✅ Configuration reset to default', 'success');
}

// Toggle section collapse/expand
function toggleSection(contentId, toggleId) {
  const content = document.getElementById(contentId);
  const toggle = document.getElementById(toggleId);

  if (!content || !toggle) return;

  if (content.style.display === 'none') {
    content.style.display = '';
    toggle.textContent = '▼';
    toggle.style.transform = 'rotate(0deg)';
  } else {
    content.style.display = 'none';
    toggle.textContent = '▶';
    toggle.style.transform = 'rotate(-90deg)';
  }
}

// Load demo data for Production Plan testing - Show preset selection
function loadDemoDataForProductionPlan() {
  // Check if demo presets are available
  if (typeof PRODUCTION_PLAN_DEMO_PRESETS === 'undefined') {
    alert('⚠️ Demo presets not loaded. Please ensure production_plan_demo_presets.js is included.');
    return;
  }

  // Build preset selection cards
  const presetCards = Object.entries(PRODUCTION_PLAN_DEMO_PRESETS).map(([key, preset]) => {
    return `
      <button onclick="confirmLoadDemoData('${key}')" class="w-full text-left border-2 border-slate-200 rounded-lg p-5 hover:border-blue-500 hover:bg-blue-50 transition-all group">
        <div class="flex items-start gap-4">
          <span class="text-3xl">${preset.scenario.icon}</span>
          <div class="flex-1">
            <div class="font-bold text-slate-900 text-lg group-hover:text-blue-700 mb-1">${preset.name}</div>
            <div class="text-sm text-slate-600 mb-3">${preset.description}</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-1">
                <span class="font-semibold text-slate-700">📅 Period:</span>
                <span class="text-slate-600">${preset.dateRange.start} ~ ${preset.dateRange.end}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-semibold text-slate-700">📊 Weeks:</span>
                <span class="text-slate-600">${preset.weeklyDemand.length} weeks</span>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              ${preset.scenario.highlights.map(h => `<span class="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">${h}</span>`).join('')}
            </div>
          </div>
        </div>
      </button>
    `;
  }).join('');

  // Preset selection modal
  const presetModal = document.createElement('div');
  presetModal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  presetModal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="text-2xl font-bold text-slate-900">🧪 Select Demo Data Preset</div>
          <div class="text-sm text-slate-600 mt-1">Choose a demo scenario to populate the system with realistic test data</div>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">✕</button>
      </div>

      <div class="space-y-3">
        ${presetCards}
      </div>

      <div class="mt-6 pt-6 border-t border-slate-200">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-2">
            <span class="text-blue-600">ℹ️</span>
            <div class="text-sm text-blue-800">
              <strong>Note:</strong> Loading a demo preset will auto-fill the date range and populate CTB, Forecast, and Capacity data. You can then generate the production plan immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(presetModal);
}

// Global variable to store current configuration
window.CURRENT_PLAN_CONFIG = null;

function confirmLoadDemoData(presetKey) {
  // Close modal
  const modal = document.querySelector('.fixed.inset-0.bg-black\\/50');
  if (modal) modal.remove();

  // Apply the selected preset
  if (typeof applyDemoPreset !== 'function') {
    alert('⚠️ Error: applyDemoPreset function not found. Please check production_plan_demo_presets.js');
    return;
  }

  try {
    applyDemoPreset(presetKey);

    const preset = PRODUCTION_PLAN_DEMO_PRESETS[presetKey];

    // Store configuration globally for later use in report
    window.CURRENT_PLAN_CONFIG = {
      presetKey: presetKey,
      name: preset.name,
      description: preset.description,
      icon: preset.scenario.icon,
      dateRange: preset.dateRange,
      highlights: preset.scenario.highlights,
      weeklyDemand: preset.weeklyDemand,
      ctbPattern: preset.ctbPattern
    };

    // Auto-fill configuration fields with demo data
    const startDate = document.getElementById('configStartDate');
    const endDate = document.getElementById('configEndDate');

    if (startDate) startDate.value = preset.dateRange.start;
    if (endDate) endDate.value = preset.dateRange.end;

    // Update configuration summary card
    updateConfigSummaryCard(preset);

    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 max-w-md';
    notification.innerHTML = `
      <span class="text-2xl">${preset.scenario.icon}</span>
      <div>
        <div class="font-bold">${preset.name} Loaded!</div>
        <div class="text-sm opacity-90">Date range: ${preset.dateRange.start} ~ ${preset.dateRange.end} (${preset.weeklyDemand.length} weeks)</div>
      </div>
    `;
    document.body.appendChild(notification);

    // Auto-remove notification after 3 seconds
    setTimeout(() => notification.remove(), 3000);

    console.log(`✅ Demo preset loaded: ${preset.name}`);
    console.log(`  Start Date: ${preset.dateRange.start}`);
    console.log(`  End Date: ${preset.dateRange.end}`);
    console.log('  Capacity Units:', PRODUCTION_PLAN_SEED_DATA.capacityUnits?.length || 0);
    console.log('  CTB Data Points:', PRODUCTION_PLAN_SEED_DATA.ctbDaily?.length || 0);
    console.log('  Forecast Weeks:', PRODUCTION_PLAN_SEED_DATA.weeklyDemand?.length || 0);
  } catch (error) {
    console.error('Error loading demo preset:', error);
    alert(`❌ Failed to load demo preset: ${error.message}`);
  }
}

function updateConfigSummaryCard(preset) {
  const card = document.getElementById('configSummaryCard');
  if (!card) return;

  // Get unique sites from capacity units
  const sites = [...new Set(PRODUCTION_PLAN_SEED_DATA.capacityUnits.map(u => u.site_id))];

  // Update card content
  document.getElementById('configSummaryIcon').textContent = preset.scenario.icon;
  document.getElementById('configSummaryName').textContent = preset.name;
  document.getElementById('configSummaryDescription').textContent = preset.description;
  document.getElementById('configSummaryPeriod').textContent = `${preset.dateRange.start} ~ ${preset.dateRange.end}`;
  document.getElementById('configSummaryForecast').textContent = `${preset.weeklyDemand.length} weeks`;
  document.getElementById('configSummarySites').textContent = sites.join(', ').toUpperCase();
  document.getElementById('configSummaryCTB').textContent = preset.ctbPattern.replace(/_/g, ' ');

  // Update highlights
  const highlightsContainer = document.getElementById('configSummaryHighlights');
  highlightsContainer.innerHTML = preset.scenario.highlights.map(h =>
    `<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded border border-green-300">${h}</span>`
  ).join('');

  // Show the card
  card.classList.remove('hidden');
}

function clearConfigSummary() {
  const card = document.getElementById('configSummaryCard');
  if (card) {
    card.classList.add('hidden');
  }
  window.CURRENT_PLAN_CONFIG = null;
}

// Calculate summary metrics from plan results
function calculatePlanSummaryMetrics(plan) {
  // Validate input
  if (!plan || !plan.weeklyMetrics || !Array.isArray(plan.weeklyMetrics)) {
    console.error('[calculatePlanSummaryMetrics] Invalid plan structure:', plan);
    return {
      totalOutput: 0,
      totalShipment: 0,
      totalDemand: 0,
      overallAttainment: 0,
      weeksWithGap: []
    };
  }

  const totalOutput = plan.weeklyMetrics.reduce((sum, w) => sum + (w.output || 0), 0);
  const totalShipment = plan.weeklyMetrics.reduce((sum, w) => sum + (w.shipments || 0), 0);
  const totalDemand = plan.weeklyMetrics.reduce((sum, w) => sum + (w.demand || 0), 0);
  const overallAttainment = totalDemand > 0 ? (totalShipment / totalDemand) * 100 : 100;
  const weeksWithGap = plan.weeklyMetrics.filter(w => (w.gap || 0) < 0).map(w => w.week_id);

  return {
    totalOutput,
    totalShipment,
    totalDemand,
    overallAttainment,
    weeksWithGap
  };
}

function generatePlanFromConfig() {
  // Show project selection modal first
  showProjectSelectionModal();
}

function showProjectSelectionModal() {
  // Get all existing projects
  const projects = window.SimulationManager.getProjects();

  // Build dropdown options: existing projects + "Create New Project"
  const projectOptions = [
    ...projects.map(p => `<option value="${p.id}">${p.name}</option>`),
    `<option value="__create_new__">+ Create New Project</option>`
  ];

  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
      <div class="text-2xl font-bold text-slate-900 mb-2">Select Project Association</div>
      <div class="text-sm text-slate-600 mb-6">Choose how to organize this simulation</div>

      <div class="space-y-4">
        <label class="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <input type="radio" name="projectAssociation" value="project" class="mt-1" checked>
          <div class="flex-1">
            <div class="font-semibold text-slate-900">Associate with Project</div>
            <div class="text-sm text-slate-600 mt-1">Add to existing project or create a new one</div>
            <select id="projectSelect" class="mt-3 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              ${projectOptions.join('')}
            </select>
          </div>
        </label>

        <label class="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
          <input type="radio" name="projectAssociation" value="standalone" class="mt-1">
          <div class="flex-1">
            <div class="font-semibold text-slate-900">Standalone Simulation</div>
            <div class="text-sm text-slate-600 mt-1">Don't associate with any project (independent simulation)</div>
          </div>
        </label>
      </div>

      <div class="flex items-center justify-end gap-3 mt-8">
        <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50">
          Cancel
        </button>
        <button onclick="proceedToModeSelection()" class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          Next →
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function handleProjectSelection() {
  const projectSelect = document.getElementById('projectSelect');
  const newProjectFields = document.getElementById('newProjectFields');

  if (projectSelect.value === '__create_new__') {
    newProjectFields.style.display = 'block';
  } else {
    newProjectFields.style.display = 'none';
  }
}

function toggleProjectFields() {
  const selectedValue = document.querySelector('input[name="projectAssociation"]:checked').value;
  const newProjectFields = document.getElementById('newProjectFields');

  if (selectedValue === 'standalone') {
    newProjectFields.style.display = 'none';
  } else {
    // Check if "Create New Project" is selected in dropdown
    handleProjectSelection();
  }
}

function proceedToModeSelection() {
  const selectedValue = document.querySelector('input[name="projectAssociation"]:checked').value;
  console.log('[proceedToModeSelection] selectedValue:', selectedValue);

  if (selectedValue === 'project') {
    const projectSelect = document.getElementById('projectSelect');
    const selectedProjectId = projectSelect.value;
    console.log('[proceedToModeSelection] selectedProjectId:', selectedProjectId);

    if (selectedProjectId === '__create_new__') {
      console.log('[proceedToModeSelection] Creating new project - opening dialog');
      // User wants to create a new project - show project creation dialog
      // Close current modal first
      document.querySelector('.fixed.inset-0').remove();

      // Mark that we're in simulation flow
      window._inSimulationFlow = true;

      // Open project creation dialog
      console.log('[proceedToModeSelection] Calling openCreateProjectDialog()');
      openCreateProjectDialog();
      return;
    } else {
      console.log('[proceedToModeSelection] Using existing project:', selectedProjectId);
      // User selected an existing project
      window.pendingSimulationProject = {
        type: 'existing',
        projectId: selectedProjectId
      };
    }
  } else {
    console.log('[proceedToModeSelection] Standalone simulation');
    // Standalone
    window.pendingSimulationProject = {
      type: 'standalone'
    };
  }

  // Close this modal
  document.querySelector('.fixed.inset-0').remove();

  // Show planning mode modal
  showPlanningModeModal();
}

// Export functions to window for onclick handlers
window.showProjectSelectionModal = showProjectSelectionModal;
window.handleProjectSelection = handleProjectSelection;
window.toggleProjectFields = toggleProjectFields;
window.proceedToModeSelection = proceedToModeSelection;

function showPlanningModeModal() {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
      <div class="text-2xl font-bold text-slate-900 mb-2">Select Planning Mode</div>
      <div class="text-sm text-slate-600 mb-6">Choose which scenario(s) to include in the production plan report</div>

      <div class="space-y-4">
        <label class="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <input type="radio" name="planningMode" value="unconstrained" class="mt-1" checked>
          <div class="flex-1">
            <div class="font-semibold text-slate-900">Unconstrained (Capacity Only)</div>
            <div class="text-sm text-slate-600 mt-1">Shows pure production capacity without CTB material constraints</div>
          </div>
        </label>

        <label class="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
          <input type="radio" name="planningMode" value="constrained" class="mt-1">
          <div class="flex-1">
            <div class="font-semibold text-slate-900">Constrained (CTB Applied)</div>
            <div class="text-sm text-slate-600 mt-1">Applies Clear-to-Build material limits to production plan</div>
          </div>
        </label>

        <label class="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
          <input type="radio" name="planningMode" value="combined" class="mt-1">
          <div class="flex-1">
            <div class="font-semibold text-slate-900">Both Scenarios (Side-by-Side)</div>
            <div class="text-sm text-slate-600 mt-1">Displays both unconstrained and constrained plans for easy comparison</div>
          </div>
        </label>
      </div>

      <div class="flex items-center justify-end gap-3 mt-8">
        <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50">
          Cancel
        </button>
        <button onclick="proceedWithPlanGeneration()" class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          🚀 Generate Simulation
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function proceedWithPlanGeneration() {
  // Get selected mode
  const selectedMode = document.querySelector('input[name="planningMode"]:checked').value;

  // ========================================
  // LOAD LATEST FORECAST DATA FROM LOCALSTORAGE
  // ========================================
  const forecastVersions = JSON.parse(localStorage.getItem('productionPlan_forecast_versions') || '[]');
  if (forecastVersions.length > 0) {
    const latestForecast = forecastVersions[forecastVersions.length - 1];
    // Convert forecast data to weeklyDemand format
    // week_id is now in format "yyyy/mm/dd" (Saturday date representing the week)
    PRODUCTION_PLAN_SEED_DATA.weeklyDemand = latestForecast.data.map(row => ({
      week_id: row.week_id,  // Already in "yyyy/mm/dd" format
      program_id: 'product_a',
      demand_qty: row.weekly_forecast,
      notes: `From ${latestForecast.fileName}`
    }));
    console.log('[Plan Generation] ✅ Loaded forecast data:', latestForecast.fileName);
    console.log('[Plan Generation]   - Weeks:', PRODUCTION_PLAN_SEED_DATA.weeklyDemand.length);
    console.log('[Plan Generation]   - First week:', PRODUCTION_PLAN_SEED_DATA.weeklyDemand[0]);
    console.log('[Plan Generation]   - Total demand:', PRODUCTION_PLAN_SEED_DATA.weeklyDemand.reduce((sum, w) => sum + w.demand_qty, 0).toLocaleString());

    // ⚠️ CRITICAL: Reinitialize engine with updated forecast data
    // Engine constructor copies weeklyDemand array, so we must reinitialize after loading new forecast
    const state = window.productionPlanState;
    state.engine = new ProductionPlanEngine(PRODUCTION_PLAN_SEED_DATA);
    console.log('[Plan Generation] ✅ Engine reinitialized with updated forecast data');
  }

  // ========================================
  // DATA VALIDATION BEFORE GENERATION
  // ========================================
  const validationErrors = [];
  const seedData = PRODUCTION_PLAN_SEED_DATA;

  // Check 1: Forecast data (required for all modes)
  if (!seedData.weeklyDemand || seedData.weeklyDemand.length === 0) {
    validationErrors.push('❌ <strong>Forecast data is missing</strong><br>Please upload weekly demand forecast data before generating the plan.');
  }

  // Check 2: CTB data (required for Constrained mode only)
  // Note: Unconstrained mode does NOT require CTB data (infinite material assumption)
  if (selectedMode === 'constrained') {
    if (!seedData.ctbDaily || seedData.ctbDaily.length === 0) {
      validationErrors.push('❌ <strong>CTB (Clear-to-Build) data is missing</strong><br>Constrained mode requires daily CTB material availability data.');
    }
  }

  // Combined mode: Warn if CTB missing, but allow generation (will show Unconstrained only)
  if (selectedMode === 'combined') {
    if (!seedData.ctbDaily || seedData.ctbDaily.length === 0) {
      console.warn('[Validation] CTB data missing for Combined mode. Will generate Unconstrained scenario only.');
    }
  }

  // Check 3: Capacity configuration (required for all modes)
  if (!seedData.capacityUnits || seedData.capacityUnits.length === 0) {
    validationErrors.push('❌ <strong>Capacity configuration is missing</strong><br>Please configure at least one production line with shift settings.');
  }

  // Check 4: Sites configuration
  if (!seedData.sites || seedData.sites.length === 0) {
    validationErrors.push('❌ <strong>Sites configuration is missing</strong><br>Please add at least one production site.');
  }

  // If there are validation errors, show them and stop
  if (validationErrors.length > 0) {
    const errorModal = document.createElement('div');
    errorModal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center';
    errorModal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div class="flex items-start gap-4 mb-6">
          <div class="text-4xl">⚠️</div>
          <div class="flex-1">
            <div class="text-2xl font-bold text-red-900 mb-2">Cannot Generate Production Plan</div>
            <div class="text-sm text-slate-600">The following required data is missing:</div>
          </div>
        </div>

        <div class="space-y-3 mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          ${validationErrors.map(err => `<div class="text-sm text-red-900">${err}</div>`).join('<div class="border-t border-red-200 my-2"></div>')}
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="font-semibold text-blue-900 mb-2">💡 What you need to do:</div>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• <strong>Forecast data</strong>: Upload weekly demand forecast (required for all modes)</li>
            <li>• <strong>CTB data</strong>: Upload daily material availability (required for Constrained/Combined modes)</li>
            <li>• <strong>Capacity config</strong>: Add production lines and shifts in the configuration section</li>
            <li>• <strong>Sites</strong>: Configure at least one production site</li>
          </ul>
        </div>

        <div class="flex justify-end gap-3">
          <button onclick="this.closest('.fixed').remove()"
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            OK, I'll Add Missing Data
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorModal);
    return; // Stop execution
  }

  // Close modal
  document.querySelector('.fixed.inset-0').remove();

  // Gather configuration
  const startDateValue = document.getElementById('configStartDate').value;
  const endDateValue = document.getElementById('configEndDate').value;

  // Validate that end date is not earlier than start date
  if (!validateReportDateRange()) {
    alert('⚠️ Please fix the date validation error: End Date cannot be earlier than Start Date');
    return;
  }

  const config = {
    program: 'product_a', // Fixed value
    startDate: startDateValue,
    endDate: endDateValue,
    mode: selectedMode, // From modal selection
    shiftHours: parseFloat(document.getElementById('configShiftHours').value),
    workingDays: document.getElementById('configWorkingDays').value,
    shipmentLag: parseInt(document.getElementById('configShipmentLag').value),
    palletSize: parseInt(document.getElementById('configPalletSize').value) || 1,
    considerHolidays: document.getElementById('configConsiderHolidays').checked,
    outputFactors: {
      day1: parseFloat(document.getElementById('configDay1Factor').value),
      day2: parseFloat(document.getElementById('configDay2Factor').value),
      day3_plus: parseFloat(document.getElementById('configDay3Factor').value)
    },
    maxDailyShipment: parseInt(document.getElementById('configMaxDailyShipment').value) || 0,
    shipmentStartDate: document.getElementById('configShipmentStartDate').value || null
  };

  // ========================================
  // UPDATE PRODUCTION_PLAN_SEED_DATA.programConfig WITH UI VALUES
  // ========================================
  PRODUCTION_PLAN_SEED_DATA.programConfig.default_shift_hours = {
    DAY: config.shiftHours,
    NIGHT: config.shiftHours
  };
  PRODUCTION_PLAN_SEED_DATA.programConfig.weekly_window = config.workingDays;
  PRODUCTION_PLAN_SEED_DATA.programConfig.shipment_lag_workdays = config.shipmentLag;
  PRODUCTION_PLAN_SEED_DATA.programConfig.considerHolidays = config.considerHolidays;
  PRODUCTION_PLAN_SEED_DATA.programConfig.output_factors = config.outputFactors;
  PRODUCTION_PLAN_SEED_DATA.programConfig.max_daily_shipment = config.maxDailyShipment;
  PRODUCTION_PLAN_SEED_DATA.programConfig.shipment_start_date = config.shipmentStartDate;

  console.log('[Generate] Updated programConfig with UI values:', PRODUCTION_PLAN_SEED_DATA.programConfig);

  // Show loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center';
  loadingOverlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-md">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      <div class="text-xl font-bold">Generating Production Plan...</div>
      <div class="text-sm text-slate-600 text-center">
        Calculating capacity, applying ramp curves, checking constraints...
      </div>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  // Simulate processing
  setTimeout(() => {
    try {
      // Update state with new configuration
      const state = window.productionPlanState;
      state.program = config.program;
      state.startDate = config.startDate;
      state.endDate = config.endDate;
      state.mode = config.mode;

      console.log('[Generate] Starting plan generation with config:', config);

      // ========================================
      // DIAGNOSTIC: Log all seed data before generation
      // ========================================
      console.log('[Generate] 📊 DATA DIAGNOSTIC REPORT:');
      console.log('[Generate]   - weeklyDemand:', PRODUCTION_PLAN_SEED_DATA.weeklyDemand?.length || 0, 'weeks');
      if (PRODUCTION_PLAN_SEED_DATA.weeklyDemand && PRODUCTION_PLAN_SEED_DATA.weeklyDemand.length > 0) {
        const firstWeek = PRODUCTION_PLAN_SEED_DATA.weeklyDemand[0];
        const lastWeek = PRODUCTION_PLAN_SEED_DATA.weeklyDemand[PRODUCTION_PLAN_SEED_DATA.weeklyDemand.length - 1];
        console.log('[Generate]     First week:', firstWeek.week_id, 'Demand:', firstWeek.demand_qty);
        console.log('[Generate]     Last week:', lastWeek.week_id, 'Demand:', lastWeek.demand_qty);
      }
      console.log('[Generate]   - ctbDaily:', PRODUCTION_PLAN_SEED_DATA.ctbDaily?.length || 0, 'records');
      console.log('[Generate]   - capacityUnits:', PRODUCTION_PLAN_SEED_DATA.capacityUnits?.length || 0, 'units');
      console.log('[Generate]   - sites:', PRODUCTION_PLAN_SEED_DATA.sites?.length || 0, 'sites');
      console.log('[Generate]   - Date Range: ', config.startDate, 'to', config.endDate);

      // Generate new plan(s) based on mode
      if (config.mode === 'combined') {
        // Generate both unconstrained and constrained plans
        console.log('[Generate] Generating combined mode plans...');
        const unconstrainedPlan = state.engine.generatePlan(config.startDate, config.endDate, 'unconstrained');
        const constrainedPlan = state.engine.generatePlan(config.startDate, config.endDate, 'constrained');

        // Validate plans
        if (!unconstrainedPlan || !unconstrainedPlan.programResults || !unconstrainedPlan.weeklyMetrics) {
          throw new Error('Unconstrained plan generation failed - missing required data');
        }
        if (!constrainedPlan || !constrainedPlan.programResults || !constrainedPlan.weeklyMetrics) {
          throw new Error('Constrained plan generation failed - missing required data');
        }

        // Calculate summary for both plans
        unconstrainedPlan.summary = calculatePlanSummaryMetrics(unconstrainedPlan);
        constrainedPlan.summary = calculatePlanSummaryMetrics(constrainedPlan);

        state.planResults = {
          unconstrained: unconstrainedPlan,
          constrained: constrainedPlan,
          mode: 'combined'
        };
        console.log('[Generate] ✅ Combined plans generated successfully:', {
          unconstrainedResults: unconstrainedPlan.programResults.length,
          constrainedResults: constrainedPlan.programResults.length
        });

        // Check if data is empty and warn user
        if (unconstrainedPlan.programResults.length === 0 || constrainedPlan.programResults.length === 0) {
          loadingOverlay.remove();

          const warningModal = document.createElement('div');
          warningModal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center';
          warningModal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
              <div class="flex items-start gap-4 mb-6">
                <div class="text-4xl">⚠️</div>
                <div class="flex-1">
                  <div class="text-2xl font-bold text-orange-900 mb-2">Report Generated with Empty Data</div>
                  <div class="text-sm text-slate-600">The plan was generated but contains no data rows.</div>
                </div>
              </div>

              <div class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
                <div class="font-semibold text-orange-900 mb-2">🔍 Possible Causes:</div>
                <ul class="text-sm text-orange-800 space-y-2">
                  <li>• <strong>Date Range Mismatch</strong>: Your report dates (${config.startDate} to ${config.endDate}) may not overlap with your forecast data dates</li>
                  <li>• <strong>Forecast Data Issue</strong>: Check if your uploaded forecast covers the report date range</li>
                  <li>• <strong>Capacity Configuration</strong>: Ensure you have configured at least one production line</li>
                </ul>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div class="font-semibold text-blue-900 mb-2">💡 Recommended Actions:</div>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>1. Check Console logs for detailed diagnostic information</li>
                  <li>2. Verify your forecast data date range matches your report dates</li>
                  <li>3. Ensure at least one production line is configured</li>
                  <li>4. Try adjusting the Start Date and End Date to match your forecast data</li>
                </ul>
              </div>

              <div class="flex justify-end gap-3">
                <button onclick="this.closest('.fixed').remove()"
                        class="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700">
                  OK, I'll Check the Data
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(warningModal);
          return; // Don't show save modal
        }
      } else {
        console.log('[Generate] Generating single mode plan:', config.mode);
        const plan = state.engine.generatePlan(config.startDate, config.endDate, config.mode);

        // Validate plan
        if (!plan || !plan.programResults || !plan.weeklyMetrics) {
          console.error('[Generate] Plan validation failed. Plan object:', plan);
          throw new Error('Plan generation failed - missing required data (programResults or weeklyMetrics)');
        }

        console.log('[Generate] ✅ Plan generated:', {
          mode: config.mode,
          programResultsLength: plan.programResults.length,
          weeklyMetricsLength: plan.weeklyMetrics.length,
          siteResultsLength: plan.siteResults?.length || 0
        });

        // DIAGNOSTIC: Check if results are empty
        if (plan.programResults.length === 0) {
          console.warn('[Generate] ⚠️ WARNING: programResults is EMPTY! This will result in a blank report.');
          console.warn('[Generate] ⚠️ Possible causes:');
          console.warn('[Generate]    - Date range mismatch: weeklyDemand date range does not overlap with report date range');
          console.warn('[Generate]    - Missing capacity units');
          console.warn('[Generate]    - Data format issues');
        }
        if (plan.weeklyMetrics.length === 0) {
          console.warn('[Generate] ⚠️ WARNING: weeklyMetrics is EMPTY!');
        }

        // Calculate summary metrics
        plan.summary = calculatePlanSummaryMetrics(plan);

        state.planResults = plan;

        // Check if data is empty and warn user
        if (plan.programResults.length === 0 || plan.weeklyMetrics.length === 0) {
          loadingOverlay.remove();

          const warningModal = document.createElement('div');
          warningModal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center';
          warningModal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
              <div class="flex items-start gap-4 mb-6">
                <div class="text-4xl">⚠️</div>
                <div class="flex-1">
                  <div class="text-2xl font-bold text-orange-900 mb-2">Report Generated with Empty Data</div>
                  <div class="text-sm text-slate-600">The plan was generated but contains no data rows.</div>
                </div>
              </div>

              <div class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
                <div class="font-semibold text-orange-900 mb-2">🔍 Possible Causes:</div>
                <ul class="text-sm text-orange-800 space-y-2">
                  <li>• <strong>Date Range Mismatch</strong>: Your report dates (${config.startDate} to ${config.endDate}) may not overlap with your forecast data dates</li>
                  <li>• <strong>Forecast Data Issue</strong>: Check if your uploaded forecast covers the report date range</li>
                  <li>• <strong>Capacity Configuration</strong>: Ensure you have configured at least one production line</li>
                </ul>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div class="font-semibold text-blue-900 mb-2">💡 Recommended Actions:</div>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>1. Check Console logs for detailed diagnostic information</li>
                  <li>2. Verify your forecast data date range matches your report dates</li>
                  <li>3. Ensure at least one production line is configured</li>
                  <li>4. Try adjusting the Start Date and End Date to match your forecast data</li>
                </ul>
              </div>

              <div class="flex justify-end gap-3">
                <button onclick="this.closest('.fixed').remove()"
                        class="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700">
                  OK, I'll Check the Data
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(warningModal);
          return; // Don't show save modal
        }
      }

      // Close loading overlay
      loadingOverlay.remove();

      // Show "Save Simulation" modal
      showSaveSimulationModal(state.planResults, config);
    } catch (error) {
      console.error('[Generate] Error generating plan:', error);
      console.error('[Generate] Error stack:', error.stack);
      loadingOverlay.remove();
      showNotification('❌ Error generating plan: ' + error.message, 'error');
    }
  }, 1500);
}

// Production Plan Helper Functions
function updateProductionPlanFilters() {
  const state = window.productionPlanState;
  state.program = document.getElementById('ppProgram').value;
  state.site = document.getElementById('ppSite').value;
  state.startDate = document.getElementById('ppStartDate').value;
  state.endDate = document.getElementById('ppEndDate').value;
  state.mode = document.getElementById('ppMode').value;

  // Auto-regenerate
  regenerateProductionPlan();
}

function regenerateProductionPlan() {
  const state = window.productionPlanState;

  // Show loading state in UI
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'fixed inset-0 bg-black/20 z-50 flex items-center justify-center';
  loadingOverlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <div class="text-lg font-semibold">Generating Production Plan...</div>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  // Simulate processing time for better UX
  setTimeout(() => {
    try {
      // Regenerate plan with new settings
      state.planResults = state.engine.generatePlan(state.startDate, state.endDate, state.mode);

      // Remove loading overlay
      loadingOverlay.remove();

      // Re-render
      renderProductionPlan();

      // Show success notification
      showNotification('✅ Production Plan Generated Successfully!', 'success');
    } catch (error) {
      console.error('Error generating plan:', error);
      loadingOverlay.remove();
      showNotification('❌ Error generating plan: ' + error.message, 'error');
    }
  }, 500);
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-blue-600'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('animate-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function exportProductionPlanToExcel() {
  showNotification('📊 Excel export feature coming soon!', 'info');
}

function openProductionPlanConfig() {
  // This function is deprecated - now using subpage navigation
  window.productionPlanState.activeSubpage = 'generate';
  renderProductionPlan();
}

// 3. Manufacturing Lead-time
function renderManufacturingLeadtime() {
  const html = `
    <div class="bg-white border rounded-xl p-6 mb-4">
      <div class="text-lg font-bold text-slate-900 mb-3">Manufacturing Lead-time Overview</div>
      <div class="text-sm text-slate-600 mb-4">Complete weekly lead-time from material receipt to warehouse</div>

      <!-- Timeline Chart -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border rounded-xl p-6 mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-4">End-to-End Manufacturing Timeline (Weekly Average)</div>

        <!-- Timeline -->
        <div class="relative">
          <!-- Timeline bar -->
          <div class="flex items-center mb-4">
            <div class="flex-1 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold">
              Total: 28 Days
            </div>
          </div>

          <!-- Process breakdown -->
          <div class="grid grid-cols-6 gap-2 text-xs">
            <div class="bg-blue-100 border border-blue-300 rounded p-2 text-center">
              <div class="font-semibold text-blue-900">MIH</div>
              <div class="text-blue-700">4 days</div>
            </div>
            <div class="bg-indigo-100 border border-indigo-300 rounded p-2 text-center">
              <div class="font-semibold text-indigo-900">SMT Input</div>
              <div class="text-indigo-700">3 days</div>
            </div>
            <div class="bg-purple-100 border border-purple-300 rounded p-2 text-center">
              <div class="font-semibold text-purple-900">SMT Output</div>
              <div class="text-purple-700">6 days</div>
            </div>
            <div class="bg-pink-100 border border-pink-300 rounded p-2 text-center">
              <div class="font-semibold text-pink-900">FAT Input</div>
              <div class="text-pink-700">5 days</div>
            </div>
            <div class="bg-rose-100 border border-rose-300 rounded p-2 text-center">
              <div class="font-semibold text-rose-900">Packing</div>
              <div class="text-rose-700">7 days</div>
            </div>
            <div class="bg-red-100 border border-red-300 rounded p-2 text-center">
              <div class="font-semibold text-red-900">WH</div>
              <div class="text-red-700">3 days</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Process Breakdown Table with Percentiles -->
      <div class="text-sm font-semibold text-slate-700 mb-3">Weekly Lead-time Performance (Previous Week)</div>
      <div class="overflow-x-auto mb-6">
        <table class="w-full text-sm">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Process Stage</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Standard (Days)</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-green-50">75% Actual</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-yellow-50">90% Actual</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-blue-50">Average</th>
              <th class="px-4 py-3 text-right font-semibold text-slate-700">Variance</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">MIH (Material In-House)</td>
              <td class="px-4 py-3 text-right">3.0</td>
              <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">3.8</td>
              <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">4.5</td>
              <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">4.2</td>
              <td class="px-4 py-3 text-right text-red-700 font-semibold">+1.2</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⚠️ Delayed</span>
              </td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">SMT Input</td>
              <td class="px-4 py-3 text-right">2.5</td>
              <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">2.8</td>
              <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">3.3</td>
              <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">3.1</td>
              <td class="px-4 py-3 text-right text-red-700 font-semibold">+0.6</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⚠️ Delayed</span>
              </td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">SMT Output</td>
              <td class="px-4 py-3 text-right">5.0</td>
              <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">5.2</td>
              <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">6.1</td>
              <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">5.8</td>
              <td class="px-4 py-3 text-right text-red-700 font-semibold">+0.8</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⚠️ Delayed</span>
              </td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">FAT Input</td>
              <td class="px-4 py-3 text-right">4.0</td>
              <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">4.8</td>
              <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">5.6</td>
              <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">5.2</td>
              <td class="px-4 py-3 text-right text-red-700 font-semibold">+1.2</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">🔴 Critical</span>
              </td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">Packing</td>
              <td class="px-4 py-3 text-right">6.0</td>
              <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">6.3</td>
              <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">7.2</td>
              <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">6.9</td>
              <td class="px-4 py-3 text-right text-red-700 font-semibold">+0.9</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⚠️ Delayed</span>
              </td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">WH (Warehouse)</td>
              <td class="px-4 py-3 text-right">2.5</td>
              <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">2.6</td>
              <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">3.0</td>
              <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">2.8</td>
              <td class="px-4 py-3 text-right text-yellow-700 font-semibold">+0.3</td>
              <td class="px-4 py-3">
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✅ Acceptable</span>
              </td>
            </tr>
            <tr class="bg-slate-100 font-bold">
              <td class="px-4 py-3">Total Lead-time</td>
              <td class="px-4 py-3 text-right">23.0</td>
              <td class="px-4 py-3 text-right bg-green-50 text-green-700">25.5</td>
              <td class="px-4 py-3 text-right bg-yellow-50 text-yellow-700">29.7</td>
              <td class="px-4 py-3 text-right bg-blue-50 text-blue-700 text-lg">28.0</td>
              <td class="px-4 py-3 text-right text-red-700 text-lg">+5.0</td>
              <td class="px-4 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <div class="text-xs font-semibold text-blue-900 mb-1">📊 Percentile Explanation</div>
        <div class="text-sm text-blue-900">
          <strong>75% Actual:</strong> 75% of units complete within this time (best case performance).
          <strong>90% Actual:</strong> 90% of units complete within this time (typical target).
          <strong>Average:</strong> Mean lead-time across all units.
        </div>
      </div>

      <!-- Monthly Tracking Table -->
      <div class="mt-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">Monthly Lead-time Tracking (Total End-to-End)</div>
        <div class="text-xs text-slate-600 mb-3">Plan values are set at beginning of year. Actual values updated at beginning of each month for the previous month.</div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-slate-700">Metric</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Jan</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Feb</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Mar</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Apr</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">May</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Jun</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Jul</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Aug</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Sep</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Oct</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Nov</th>
                <th class="px-3 py-2 text-center font-semibold text-slate-700">Dec</th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-blue-50 hover:bg-blue-100">
                <td class="px-3 py-3 font-semibold text-slate-900">Plan (Days)</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
                <td class="px-3 py-3 text-center text-blue-700 font-semibold">23.0</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-3 py-3 font-semibold text-slate-900">Actual (Days)</td>
                <td class="px-3 py-3 text-center bg-green-50 font-bold text-green-700">22.8</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
                <td class="px-3 py-3 text-center text-slate-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3 text-xs text-slate-600 bg-slate-50 border rounded p-3">
          <strong>Note:</strong> January actual (22.8 days) was updated on Feb 1st. Current week is W04 of January, so Feb-Dec actuals will be populated at the beginning of each subsequent month. Plan remains constant at 23.0 days throughout the year as the baseline target.
        </div>
      </div>

      <div class="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
        <div class="text-xs font-semibold text-red-900 mb-2">⚠️ Critical Bottleneck Identified</div>
        <div class="text-sm text-red-900 mb-2"><strong>FAT Input stage:</strong> +1.2 days variance (30% over standard)</div>
        <div class="text-xs text-red-800"><strong>Improvement Actions:</strong> Increase test capacity, optimize changeover time, add weekend shift for critical SKUs</div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// 4. BTO/CTO Lead-time
function renderBTOCTOLeadtime() {
  const html = `
    <div class="space-y-4">
      <!-- BTO Lead-time -->
      <div class="bg-white border rounded-xl p-6">
        <div class="text-lg font-bold text-slate-900 mb-3">BTO (Build-to-Order) Lead-time</div>
        <div class="text-sm text-slate-600 mb-4">Standard vs actual performance with improvement areas</div>

        <div class="grid grid-cols-2 gap-6 mb-4">
          <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Standard BTO Lead-time</div>
            <div class="text-4xl font-bold text-blue-700">18 days</div>
          </div>
          <div class="bg-red-50 border-2 border-red-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Actual BTO Lead-time (Average)</div>
            <div class="text-4xl font-bold text-red-700">23 days</div>
          </div>
        </div>

        <!-- BTO Stage Breakdown with Percentiles -->
        <div class="text-sm font-semibold text-slate-700 mb-3">Weekly BTO Performance (Previous Week)</div>
        <div class="overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-slate-700">BTO Stage</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Standard</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-green-50">75% Actual</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-yellow-50">90% Actual</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-blue-50">Average</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Gap</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-700">Improvement Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Order Processing</td>
                <td class="px-4 py-3 text-right">1 day</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">1.2</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">1.7</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">1.5</td>
                <td class="px-4 py-3 text-right text-red-700">+0.5</td>
                <td class="px-4 py-3 text-xs">Automate order validation</td>
              </tr>
              <tr class="hover:bg-slate-50 bg-red-50">
                <td class="px-4 py-3 font-medium">Material Kitting</td>
                <td class="px-4 py-3 text-right">2 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">3.5</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">4.8</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">4.0</td>
                <td class="px-4 py-3 text-right text-red-700 font-bold">+2.0</td>
                <td class="px-4 py-3 text-xs font-semibold text-red-700">🔴 Pre-stage critical parts, optimize warehouse layout</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Assembly</td>
                <td class="px-4 py-3 text-right">8 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">9.2</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">10.5</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">10.0</td>
                <td class="px-4 py-3 text-right text-red-700">+2.0</td>
                <td class="px-4 py-3 text-xs">Reduce changeover time, add flex capacity</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Testing & QC</td>
                <td class="px-4 py-3 text-right">4 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">4.2</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">4.8</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">4.5</td>
                <td class="px-4 py-3 text-right text-yellow-700">+0.5</td>
                <td class="px-4 py-3 text-xs">Parallel testing for high-volume SKUs</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Packing & Shipping</td>
                <td class="px-4 py-3 text-right">3 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">2.8</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">3.2</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">3.0</td>
                <td class="px-4 py-3 text-right text-green-700">0.0</td>
                <td class="px-4 py-3 text-xs text-green-700">✅ Meeting standard</td>
              </tr>
              <tr class="bg-slate-100 font-bold">
                <td class="px-4 py-3">Total BTO Lead-time</td>
                <td class="px-4 py-3 text-right">18</td>
                <td class="px-4 py-3 text-right bg-green-50 text-green-700">20.9</td>
                <td class="px-4 py-3 text-right bg-yellow-50 text-yellow-700">25.0</td>
                <td class="px-4 py-3 text-right bg-blue-50 text-blue-700 text-lg">23.0</td>
                <td class="px-4 py-3 text-right text-red-700 text-lg">+5.0</td>
                <td class="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div class="text-xs font-semibold text-blue-900 mb-1">📊 Percentile Explanation</div>
          <div class="text-sm text-blue-900">
            <strong>75% Actual:</strong> 75% of orders complete within this time.
            <strong>90% Actual:</strong> 90% of orders complete within this time.
            <strong>Average:</strong> Mean lead-time across all orders.
          </div>
        </div>

        <!-- BTO Monthly Tracking -->
        <div class="mt-6">
          <div class="text-sm font-semibold text-slate-700 mb-3">BTO Monthly Lead-time Tracking</div>
          <div class="text-xs text-slate-600 mb-3">Plan values are set at beginning of year. Actual values updated at beginning of each month for the previous month.</div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-100">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold text-slate-700">Metric</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Jan</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Feb</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Mar</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Apr</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">May</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Jun</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Jul</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Aug</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Sep</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Oct</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Nov</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Dec</th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-blue-50 hover:bg-blue-100">
                  <td class="px-3 py-3 font-semibold text-slate-900">Plan (Days)</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">18.0</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="px-3 py-3 font-semibold text-slate-900">Actual (Days)</td>
                  <td class="px-3 py-3 text-center bg-red-50 font-bold text-red-700">23.2</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- CTO Lead-time -->
      <div class="bg-white border rounded-xl p-6">
        <div class="text-lg font-bold text-slate-900 mb-3">CTO (Configure-to-Order) Lead-time</div>
        <div class="text-sm text-slate-600 mb-4">Standard vs actual performance with improvement areas</div>

        <div class="grid grid-cols-2 gap-6 mb-4">
          <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Standard CTO Lead-time</div>
            <div class="text-4xl font-bold text-blue-700">12 days</div>
          </div>
          <div class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Actual CTO Lead-time (Average)</div>
            <div class="text-4xl font-bold text-yellow-700">14 days</div>
          </div>
        </div>

        <!-- CTO Stage Breakdown with Percentiles -->
        <div class="text-sm font-semibold text-slate-700 mb-3">Weekly CTO Performance (Previous Week)</div>
        <div class="overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-slate-700">CTO Stage</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Standard</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-green-50">75% Actual</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-yellow-50">90% Actual</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700 bg-blue-50">Average</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Gap</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-700">Improvement Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Configuration Design</td>
                <td class="px-4 py-3 text-right">1 day</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">0.9</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">1.1</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">1.0</td>
                <td class="px-4 py-3 text-right text-green-700">0.0</td>
                <td class="px-4 py-3 text-xs text-green-700">✅ Meeting standard</td>
              </tr>
              <tr class="hover:bg-slate-50 bg-yellow-50">
                <td class="px-4 py-3 font-medium">Part Sourcing</td>
                <td class="px-4 py-3 text-right">3 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">3.5</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">4.5</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">4.0</td>
                <td class="px-4 py-3 text-right text-yellow-700 font-bold">+1.0</td>
                <td class="px-4 py-3 text-xs font-semibold text-yellow-700">⚠️ Buffer stock for common configs</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Custom Assembly</td>
                <td class="px-4 py-3 text-right">5 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">5.5</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">6.5</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">6.0</td>
                <td class="px-4 py-3 text-right text-yellow-700">+1.0</td>
                <td class="px-4 py-3 text-xs">Dedicated CTO line, reduce setup time</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Final Test</td>
                <td class="px-4 py-3 text-right">2 days</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">1.9</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">2.2</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">2.0</td>
                <td class="px-4 py-3 text-right text-green-700">0.0</td>
                <td class="px-4 py-3 text-xs text-green-700">✅ Meeting standard</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">Fulfillment</td>
                <td class="px-4 py-3 text-right">1 day</td>
                <td class="px-4 py-3 text-right bg-green-50 font-semibold text-green-700">0.9</td>
                <td class="px-4 py-3 text-right bg-yellow-50 font-semibold text-yellow-700">1.1</td>
                <td class="px-4 py-3 text-right bg-blue-50 font-bold text-blue-700">1.0</td>
                <td class="px-4 py-3 text-right text-green-700">0.0</td>
                <td class="px-4 py-3 text-xs text-green-700">✅ Meeting standard</td>
              </tr>
              <tr class="bg-slate-100 font-bold">
                <td class="px-4 py-3">Total CTO Lead-time</td>
                <td class="px-4 py-3 text-right">12</td>
                <td class="px-4 py-3 text-right bg-green-50 text-green-700">12.7</td>
                <td class="px-4 py-3 text-right bg-yellow-50 text-yellow-700">15.4</td>
                <td class="px-4 py-3 text-right bg-blue-50 text-blue-700 text-lg">14.0</td>
                <td class="px-4 py-3 text-right text-yellow-700 text-lg">+2.0</td>
                <td class="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div class="text-xs font-semibold text-blue-900 mb-1">📊 Percentile Explanation</div>
          <div class="text-sm text-blue-900">
            <strong>75% Actual:</strong> 75% of orders complete within this time.
            <strong>90% Actual:</strong> 90% of orders complete within this time.
            <strong>Average:</strong> Mean lead-time across all orders.
          </div>
        </div>

        <!-- CTO Monthly Tracking -->
        <div class="mt-6">
          <div class="text-sm font-semibold text-slate-700 mb-3">CTO Monthly Lead-time Tracking</div>
          <div class="text-xs text-slate-600 mb-3">Plan values are set at beginning of year. Actual values updated at beginning of each month for the previous month.</div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-100">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold text-slate-700">Metric</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Jan</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Feb</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Mar</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Apr</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">May</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Jun</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Jul</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Aug</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Sep</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Oct</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Nov</th>
                  <th class="px-3 py-2 text-center font-semibold text-slate-700">Dec</th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-blue-50 hover:bg-blue-100">
                  <td class="px-3 py-3 font-semibold text-slate-900">Plan (Days)</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                  <td class="px-3 py-3 text-center text-blue-700 font-semibold">12.0</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="px-3 py-3 font-semibold text-slate-900">Actual (Days)</td>
                  <td class="px-3 py-3 text-center bg-yellow-50 font-bold text-yellow-700">13.8</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                  <td class="px-3 py-3 text-center text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// 5. FV Management
function renderFVManagement() {
  const html = `
    <div class="bg-white border rounded-xl p-6">
      <div class="text-lg font-bold text-slate-900 mb-3">FV Tracker (Factory Variance)</div>
      <div class="text-sm text-slate-600 mb-4">Track factory variance costs by program and category - Budget vs Actual vs Negotiated</div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Total Budget (2026)</div>
          <div class="text-3xl font-bold text-blue-700">$2.4M</div>
        </div>
        <div class="bg-red-50 border-2 border-red-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Claimed by CM</div>
          <div class="text-3xl font-bold text-red-700">$3.8M</div>
          <div class="text-xs text-red-600 font-semibold mt-1">+158% over budget</div>
        </div>
        <div class="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
          <div class="text-xs font-semibold text-slate-700 mb-2">Final After Negotiation</div>
          <div class="text-3xl font-bold text-green-700">$2.9M</div>
          <div class="text-xs text-green-600 font-semibold mt-1">Saved $900K (24%)</div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="mb-6">
        <div class="text-sm font-semibold text-slate-700 mb-3">By Category (2026 Annual)</div>

        <div class="space-y-4">
          <!-- VXR Category -->
          <div class="border rounded-lg overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 font-semibold text-sm border-b">VXR (Stinson, Ventura)</div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold text-slate-700">Program</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Budget</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Claimed by CM</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Final (Negotiated)</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Savings</th>
                    <th class="px-4 py-2 text-left font-semibold text-slate-700">vs Budget</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">Stinson</td>
                    <td class="px-4 py-2 text-right">$850K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$1,450K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$1,050K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$400K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+24% over</span>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">Ventura</td>
                    <td class="px-4 py-2 text-right">$620K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$980K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$710K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$270K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+15% over</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Wearables Category -->
          <div class="border rounded-lg overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 font-semibold text-sm border-b">Wearables (Hypernova, Ceres)</div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold text-slate-700">Program</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Budget</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Claimed by CM</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Final (Negotiated)</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Savings</th>
                    <th class="px-4 py-2 text-left font-semibold text-slate-700">vs Budget</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">Hypernova</td>
                    <td class="px-4 py-2 text-right">$480K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$720K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$550K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$170K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+15% over</span>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">Ceres</td>
                    <td class="px-4 py-2 text-right">$320K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$520K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$380K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$140K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+19% over</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Smart Glasses Category -->
          <div class="border rounded-lg overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 font-semibold text-sm border-b">Smart Glasses (RBM 2.0, Sprize, Charging Case)</div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold text-slate-700">Program</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Budget</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Claimed by CM</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Final (Negotiated)</th>
                    <th class="px-4 py-2 text-right font-semibold text-slate-700">Savings</th>
                    <th class="px-4 py-2 text-left font-semibold text-slate-700">vs Budget</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">RBM 2.0</td>
                    <td class="px-4 py-2 text-right">$180K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$280K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$210K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$70K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+17% over</span>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">Sprize</td>
                    <td class="px-4 py-2 text-right">$90K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$145K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$105K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$40K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+17% over</span>
                    </td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2 font-medium">Charging Case</td>
                    <td class="px-4 py-2 text-right">$60K</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">$105K</td>
                    <td class="px-4 py-2 text-right font-bold text-blue-700">$70K</td>
                    <td class="px-4 py-2 text-right text-green-700 font-semibold">$35K</td>
                    <td class="px-4 py-2">
                      <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">+17% over</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-green-50 border-l-4 border-green-500 rounded p-4">
          <div class="text-xs font-semibold text-green-900 mb-2">💰 Negotiation Success</div>
          <div class="text-sm text-green-900">Team successfully negotiated down $900K (24%) from initial CM claims, demonstrating strong cost control.</div>
        </div>
        <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded p-4">
          <div class="text-xs font-semibold text-yellow-900 mb-2">⚠️ Budget Pressure</div>
          <div class="text-sm text-yellow-900">Final costs still 21% over budget ($2.9M vs $2.4M). Consider tighter variance controls and prevention strategies for next year.</div>
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// 6. Labor Fulfillment
function renderLaborFulfillment() {
  const html = `
    <div class="space-y-4">
      <!-- Overview Card -->
      <div class="bg-white border rounded-xl p-6">
        <div class="text-lg font-bold text-slate-900 mb-3">Labor Fulfillment — Weekly Headcount Status</div>
        <div class="text-sm text-slate-600 mb-4">Monitor weekly labor availability and fulfillment across all factory sites</div>

        <!-- Summary Metrics -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Overall Fulfillment</div>
            <div class="text-4xl font-bold text-green-700 mb-1">96%</div>
            <div class="inline-block px-2 py-1 bg-green-100 border border-green-300 rounded text-xs font-semibold text-green-800">EXCELLENT</div>
          </div>
          <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Total Headcount Needed</div>
            <div class="text-3xl font-bold text-blue-700">2,450</div>
            <div class="text-xs text-slate-600 mt-1">Direct Labor</div>
          </div>
          <div class="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Current Headcount</div>
            <div class="text-3xl font-bold text-green-700">2,352</div>
            <div class="text-xs text-slate-600 mt-1">+45 temp workers</div>
          </div>
          <div class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 text-center">
            <div class="text-xs font-semibold text-slate-700 mb-2">Gap</div>
            <div class="text-3xl font-bold text-yellow-700">-98</div>
            <div class="text-xs text-slate-600 mt-1">4% shortage</div>
          </div>
        </div>

        <!-- Weekly Trend Chart Placeholder -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border rounded-xl p-6 mb-6">
          <div class="text-sm font-semibold text-slate-700 mb-4">12-Week Labor Fulfillment Trend</div>
          <div class="flex items-end justify-between gap-2 h-40">
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-green-400 rounded-t" style="height: 92%"></div>
              <div class="text-xs text-slate-600 mt-2">W49</div>
              <div class="text-xs font-semibold text-green-700">92%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-green-400 rounded-t" style="height: 94%"></div>
              <div class="text-xs text-slate-600 mt-2">W50</div>
              <div class="text-xs font-semibold text-green-700">94%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-green-400 rounded-t" style="height: 95%"></div>
              <div class="text-xs text-slate-600 mt-2">W51</div>
              <div class="text-xs font-semibold text-green-700">95%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-yellow-400 rounded-t" style="height: 89%"></div>
              <div class="text-xs text-slate-600 mt-2">W52</div>
              <div class="text-xs font-semibold text-yellow-700">89%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-yellow-400 rounded-t" style="height: 88%"></div>
              <div class="text-xs text-slate-600 mt-2">W01</div>
              <div class="text-xs font-semibold text-yellow-700">88%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-green-400 rounded-t" style="height: 93%"></div>
              <div class="text-xs text-slate-600 mt-2">W02</div>
              <div class="text-xs font-semibold text-green-700">93%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full bg-green-400 rounded-t" style="height: 95%"></div>
              <div class="text-xs text-slate-600 mt-2">W03</div>
              <div class="text-xs font-semibold text-green-700">95%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center border-2 border-blue-500 rounded-t">
              <div class="w-full bg-green-400 rounded-t" style="height: 96%"></div>
              <div class="text-xs text-blue-600 mt-2 font-bold">W04</div>
              <div class="text-xs font-semibold text-green-700">96%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center opacity-50">
              <div class="w-full bg-slate-300 rounded-t" style="height: 95%"></div>
              <div class="text-xs text-slate-500 mt-2">W05</div>
              <div class="text-xs text-slate-500">95%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center opacity-50">
              <div class="w-full bg-slate-300 rounded-t" style="height: 94%"></div>
              <div class="text-xs text-slate-500 mt-2">W06</div>
              <div class="text-xs text-slate-500">94%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center opacity-50">
              <div class="w-full bg-slate-300 rounded-t" style="height: 96%"></div>
              <div class="text-xs text-slate-500 mt-2">W07</div>
              <div class="text-xs text-slate-500">96%</div>
            </div>
            <div class="flex-1 flex flex-col justify-end items-center opacity-50">
              <div class="w-full bg-slate-300 rounded-t" style="height: 97%"></div>
              <div class="text-xs text-slate-500 mt-2">W08</div>
              <div class="text-xs text-slate-500">97%</div>
            </div>
          </div>
          <div class="flex items-center justify-center gap-4 mt-4 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-400 rounded"></div>
              <span>≥90% (Good)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>80-90% (At Risk)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-slate-300 rounded"></div>
              <span>Forecast</span>
            </div>
          </div>
        </div>
      </div>

      <!-- By Factory Site -->
      <div class="bg-white border rounded-xl p-6">
        <div class="text-lg font-bold text-slate-900 mb-3">Headcount by Factory Site (Week 2026-W04)</div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-slate-700">Factory Site</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Required</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Direct Labor</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Temp Workers</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Total Available</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Gap</th>
                <th class="px-4 py-3 text-right font-semibold text-slate-700">Fulfillment %</th>
                <th class="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">WF (CN)</td>
                <td class="px-4 py-3 text-right">1,450</td>
                <td class="px-4 py-3 text-right">1,420</td>
                <td class="px-4 py-3 text-right">25</td>
                <td class="px-4 py-3 text-right font-bold">1,445</td>
                <td class="px-4 py-3 text-right text-yellow-700">-5</td>
                <td class="px-4 py-3 text-right font-bold text-green-700">99.7%</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✅ Excellent</span>
                </td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium">VN-02 (VN)</td>
                <td class="px-4 py-3 text-right">850</td>
                <td class="px-4 py-3 text-right">782</td>
                <td class="px-4 py-3 text-right">20</td>
                <td class="px-4 py-3 text-right font-bold">802</td>
                <td class="px-4 py-3 text-right text-red-700 font-bold">-48</td>
                <td class="px-4 py-3 text-right font-bold text-yellow-700">94.4%</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">⚠️ Below Target</span>
                </td>
              </tr>
              <tr class="hover:bg-slate-50 bg-yellow-50">
                <td class="px-4 py-3 font-medium">SZ-01 (CN)</td>
                <td class="px-4 py-3 text-right">150</td>
                <td class="px-4 py-3 text-right">150</td>
                <td class="px-4 py-3 text-right">0</td>
                <td class="px-4 py-3 text-right font-bold">150</td>
                <td class="px-4 py-3 text-right text-green-700">0</td>
                <td class="px-4 py-3 text-right font-bold text-green-700">100%</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✅ Perfect</span>
                </td>
              </tr>
              <tr class="bg-slate-100 font-bold">
                <td class="px-4 py-3">Total</td>
                <td class="px-4 py-3 text-right">2,450</td>
                <td class="px-4 py-3 text-right">2,352</td>
                <td class="px-4 py-3 text-right">45</td>
                <td class="px-4 py-3 text-right">2,397</td>
                <td class="px-4 py-3 text-right text-red-700">-53</td>
                <td class="px-4 py-3 text-right text-lg text-green-700">97.8%</td>
                <td class="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <div class="text-xs font-semibold text-yellow-900 mb-2">⚠️ Action Required</div>
          <div class="text-sm text-yellow-900">VN-02 site has a 48-person shortage (5.6% below target). Recommend recruiting additional temp workers or shifting capacity to WF for critical programs.</div>
        </div>
      </div>

      <!-- By Shift -->
      <div class="bg-white border rounded-xl p-6">
        <div class="text-lg font-bold text-slate-900 mb-3">Labor Distribution by Shift</div>
        
        <div class="grid grid-cols-3 gap-4">
          <div class="border rounded-lg p-4">
            <div class="text-xs text-slate-600 font-semibold mb-2">Day Shift (7am - 7pm)</div>
            <div class="text-3xl font-bold text-slate-900 mb-2">1,450</div>
            <div class="flex items-center gap-2 text-xs">
              <div class="flex-1 bg-slate-200 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: 98%"></div>
              </div>
              <span class="text-green-700 font-semibold">98%</span>
            </div>
            <div class="text-xs text-slate-600 mt-2">Required: 1,480</div>
          </div>

          <div class="border rounded-lg p-4">
            <div class="text-xs text-slate-600 font-semibold mb-2">Night Shift (7pm - 7am)</div>
            <div class="text-3xl font-bold text-slate-900 mb-2">780</div>
            <div class="flex items-center gap-2 text-xs">
              <div class="flex-1 bg-slate-200 rounded-full h-2">
                <div class="bg-yellow-500 h-2 rounded-full" style="width: 93%"></div>
              </div>
              <span class="text-yellow-700 font-semibold">93%</span>
            </div>
            <div class="text-xs text-slate-600 mt-2">Required: 840</div>
          </div>

          <div class="border rounded-lg p-4">
            <div class="text-xs text-slate-600 font-semibold mb-2">Weekend Shift (Sat-Sun)</div>
            <div class="text-3xl font-bold text-slate-900 mb-2">167</div>
            <div class="flex items-center gap-2 text-xs">
              <div class="flex-1 bg-slate-200 rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full" style="width: 64%"></div>
              </div>
              <span class="text-red-700 font-semibold">64%</span>
            </div>
            <div class="text-xs text-slate-600 mt-2">Required: 260</div>
          </div>
        </div>

        <div class="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div class="text-xs font-semibold text-red-900 mb-2">🔴 Critical Shortage</div>
          <div class="text-sm text-red-900">Weekend shift is significantly under-staffed (36% shortage). This impacts ability to run accelerated production schedules. Immediate action required.</div>
        </div>
      </div>
    </div>
  `;

  $("content").innerHTML = html;
}

// 7. Campus Readiness → delegates to campus_planning.js
function renderCampusReadiness() {
  renderCampusPlanning();
}

// ========================================
// NAVIGATION HELPER (v3.0)
// ========================================

// Note: navigateTo function is defined at the top of this file (line 28)
// and exported to window below

// ========================================
// PRODUCTION PLAN HELPERS (v2.0)
// ========================================

/**
 * Aggregate daily data by month
 */
function aggregateByMonth(dailyData) {
  const monthlyMap = {};

  dailyData.forEach(day => {
    const month = day.date.substring(0, 7); // 'YYYY-MM'

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month_id: month,
        forecast: 0,
        ctb: 0,
        capacity: 0,
        input: 0,
        output: 0,
        shipments: 0,
        days: []
      };
    }

    monthlyMap[month].forecast += day.demand || 0;
    monthlyMap[month].ctb += day.ctb_available || day.capacity_unconstrained || 0;
    monthlyMap[month].capacity += day.capacity_unconstrained || 0;
    monthlyMap[month].input += day.input_final || 0;
    monthlyMap[month].output += day.output_final || 0;
    monthlyMap[month].shipments += day.shipment_final || 0;
    monthlyMap[month].days.push(day);
  });

  return Object.values(monthlyMap).map(month => ({
    ...month,
    gap: month.shipments - month.forecast,
    cum_forecast: month.forecast,
    cum_ctb: month.ctb,
    cum_capacity: month.capacity,
    cum_input: month.input,
    cum_output: month.output,
    cum_shipment: month.shipments
  }));
}

/**
 * Calculate summary metrics for the plan
 */
function calculatePlanSummary(dailyData) {
  if (!dailyData || dailyData.length === 0) {
    return {
      cumForecast: 0,
      cumCTB: 0,
      cumCapacity: 0,
      cumShip: 0,
      gap: 0
    };
  }

  const lastDay = dailyData[dailyData.length - 1];

  // Calculate cumulative CTB (sum of all daily CTB available)
  const cumCTB = dailyData.reduce((sum, d) => sum + (d.ctb_available || d.capacity_unconstrained || 0), 0);

  // Calculate cumulative Capacity (sum of all daily capacity)
  const cumCapacity = dailyData.reduce((sum, d) => sum + (d.capacity_unconstrained || 0), 0);

  return {
    cumForecast: lastDay?.cum_demand || 0,
    cumCTB: cumCTB,
    cumCapacity: cumCapacity,
    cumShip: lastDay?.cum_shipment || 0,
    gap: (lastDay?.cum_shipment || 0) - (lastDay?.cum_demand || 0)
  };
}

/**
 * Calculate summary up to a specific cutoff date
 */
function calculateCutoffSummary(dailyData, cutoffDate) {
  if (!dailyData || dailyData.length === 0) {
    return {
      cumForecast: 0,
      cumCTB: 0,
      cumCapacity: 0,
      cumShip: 0,
      gap: 0
    };
  }

  // Filter data up to cutoff date
  const cutoffData = dailyData.filter(d => d.date <= cutoffDate);

  if (cutoffData.length === 0) {
    return {
      cumForecast: 0,
      cumCTB: 0,
      cumCapacity: 0,
      cumShip: 0,
      gap: 0
    };
  }

  const lastDay = cutoffData[cutoffData.length - 1];

  // Calculate cumulative CTB and Capacity
  const cumCTB = cutoffData.reduce((sum, d) => sum + (d.ctb_available || d.capacity_unconstrained || 0), 0);
  const cumCapacity = cutoffData.reduce((sum, d) => sum + (d.capacity_unconstrained || 0), 0);

  return {
    cumForecast: lastDay?.cum_demand || 0,
    cumCTB: cumCTB,
    cumCapacity: cumCapacity,
    cumShip: lastDay?.cum_shipment || 0,
    gap: (lastDay?.cum_shipment || 0) - (lastDay?.cum_demand || 0)
  };
}

/**
 * Analyze primary binding constraint
 */
function analyzePrimaryConstraint(dailyData) {
  let ctbLimitedDays = 0;
  let capacityLimitedDays = 0;
  let ctbLimitedUnits = 0;
  let capacityLimitedUnits = 0;

  dailyData.forEach(day => {
    const ctb = day.ctb_available || day.capacity_unconstrained || 0;
    const capacity = day.capacity_unconstrained || 0;
    const input = day.input_final || 0;

    // Check if CTB is the binding constraint
    if (ctb < capacity && Math.abs(input - ctb) < Math.abs(input - capacity)) {
      ctbLimitedDays++;
      ctbLimitedUnits += (capacity - ctb);
    }
    // Check if Capacity is the binding constraint
    else if (capacity < ctb) {
      capacityLimitedDays++;
      capacityLimitedUnits += (ctb - capacity);
    }
  });

  const totalDays = dailyData.length;
  const primaryConstraint = ctbLimitedDays > capacityLimitedDays ? 'CTB' :
                            capacityLimitedDays > ctbLimitedDays ? 'Capacity' : 'Mixed';

  return {
    primaryConstraint,
    ctbLimitedDays,
    capacityLimitedDays,
    ctbLimitedUnits: Math.round(ctbLimitedUnits),
    capacityLimitedUnits: Math.round(capacityLimitedUnits),
    ctbLimitedPct: ((ctbLimitedDays / totalDays) * 100).toFixed(1),
    capacityLimitedPct: ((capacityLimitedDays / totalDays) * 100).toFixed(1)
  };
}

/**
 * Determine daily binding constraint
 */
function getDailyConstraint(day) {
  const ctb = day.ctb_available || day.capacity_unconstrained || 0;
  const capacity = day.capacity_unconstrained || 0;

  if (ctb === 0 && capacity === 0) return 'None';
  if (Math.abs(ctb - capacity) < 10) return 'None'; // Within tolerance

  if (ctb < capacity) return 'CTB';
  if (capacity < ctb) return 'Capacity';
  return 'None';
}

/**
 * Switch production plan granularity
 */
function switchPlanGranularity(granularity) {
  window.productionPlanState.viewGranularity = granularity;
  renderProductionPlan();
}

/**
 * Generate fiscal calendar data for 2026
 * Each quarter has 13 weeks: M1=5 weeks, M2=4 weeks, M3=4 weeks
 */
function generateFiscalCalendar2026() {
  const fiscalYear = [];

  // Q1: Jan-Mar (13 weeks: 5+4+4)
  fiscalYear.push({
    quarter: 'Q1',
    months: [
      {
        month: '2026-01',
        name: 'January 2026',
        weeks: 5,
        weekDetails: [
          { week: '2026-W01', start: '2025-12-28', end: '2026-01-03' },
          { week: '2026-W02', start: '2026-01-04', end: '2026-01-10' },
          { week: '2026-W03', start: '2026-01-11', end: '2026-01-17' },
          { week: '2026-W04', start: '2026-01-18', end: '2026-01-24' },
          { week: '2026-W05', start: '2026-01-25', end: '2026-01-31' }
        ]
      },
      {
        month: '2026-02',
        name: 'February 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W06', start: '2026-02-01', end: '2026-02-07' },
          { week: '2026-W07', start: '2026-02-08', end: '2026-02-14' },
          { week: '2026-W08', start: '2026-02-15', end: '2026-02-21' },
          { week: '2026-W09', start: '2026-02-22', end: '2026-02-28' }
        ]
      },
      {
        month: '2026-03',
        name: 'March 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W10', start: '2026-03-01', end: '2026-03-07' },
          { week: '2026-W11', start: '2026-03-08', end: '2026-03-14' },
          { week: '2026-W12', start: '2026-03-15', end: '2026-03-21' },
          { week: '2026-W13', start: '2026-03-22', end: '2026-03-28' }
        ]
      }
    ]
  });

  // Q2: Apr-Jun (13 weeks: 5+4+4)
  fiscalYear.push({
    quarter: 'Q2',
    months: [
      {
        month: '2026-04',
        name: 'April 2026',
        weeks: 5,
        weekDetails: [
          { week: '2026-W14', start: '2026-03-29', end: '2026-04-04' },
          { week: '2026-W15', start: '2026-04-05', end: '2026-04-11' },
          { week: '2026-W16', start: '2026-04-12', end: '2026-04-18' },
          { week: '2026-W17', start: '2026-04-19', end: '2026-04-25' },
          { week: '2026-W18', start: '2026-04-26', end: '2026-05-02' }
        ]
      },
      {
        month: '2026-05',
        name: 'May 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W19', start: '2026-05-03', end: '2026-05-09' },
          { week: '2026-W20', start: '2026-05-10', end: '2026-05-16' },
          { week: '2026-W21', start: '2026-05-17', end: '2026-05-23' },
          { week: '2026-W22', start: '2026-05-24', end: '2026-05-30' }
        ]
      },
      {
        month: '2026-06',
        name: 'June 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W23', start: '2026-05-31', end: '2026-06-06' },
          { week: '2026-W24', start: '2026-06-07', end: '2026-06-13' },
          { week: '2026-W25', start: '2026-06-14', end: '2026-06-20' },
          { week: '2026-W26', start: '2026-06-21', end: '2026-06-27' }
        ]
      }
    ]
  });

  // Q3: Jul-Sep (13 weeks: 5+4+4)
  fiscalYear.push({
    quarter: 'Q3',
    months: [
      {
        month: '2026-07',
        name: 'July 2026',
        weeks: 5,
        weekDetails: [
          { week: '2026-W27', start: '2026-06-28', end: '2026-07-04' },
          { week: '2026-W28', start: '2026-07-05', end: '2026-07-11' },
          { week: '2026-W29', start: '2026-07-12', end: '2026-07-18' },
          { week: '2026-W30', start: '2026-07-19', end: '2026-07-25' },
          { week: '2026-W31', start: '2026-07-26', end: '2026-08-01' }
        ]
      },
      {
        month: '2026-08',
        name: 'August 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W32', start: '2026-08-02', end: '2026-08-08' },
          { week: '2026-W33', start: '2026-08-09', end: '2026-08-15' },
          { week: '2026-W34', start: '2026-08-16', end: '2026-08-22' },
          { week: '2026-W35', start: '2026-08-23', end: '2026-08-29' }
        ]
      },
      {
        month: '2026-09',
        name: 'September 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W36', start: '2026-08-30', end: '2026-09-05' },
          { week: '2026-W37', start: '2026-09-06', end: '2026-09-12' },
          { week: '2026-W38', start: '2026-09-13', end: '2026-09-19' },
          { week: '2026-W39', start: '2026-09-20', end: '2026-09-26' }
        ]
      }
    ]
  });

  // Q4: Oct-Dec (13 weeks: 5+4+4)
  fiscalYear.push({
    quarter: 'Q4',
    months: [
      {
        month: '2026-10',
        name: 'October 2026',
        weeks: 5,
        weekDetails: [
          { week: '2026-W40', start: '2026-09-27', end: '2026-10-03' },
          { week: '2026-W41', start: '2026-10-04', end: '2026-10-10' },
          { week: '2026-W42', start: '2026-10-11', end: '2026-10-17' },
          { week: '2026-W43', start: '2026-10-18', end: '2026-10-24' },
          { week: '2026-W44', start: '2026-10-25', end: '2026-10-31' }
        ]
      },
      {
        month: '2026-11',
        name: 'November 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W45', start: '2026-11-01', end: '2026-11-07' },
          { week: '2026-W46', start: '2026-11-08', end: '2026-11-14' },
          { week: '2026-W47', start: '2026-11-15', end: '2026-11-21' },
          { week: '2026-W48', start: '2026-11-22', end: '2026-11-28' }
        ]
      },
      {
        month: '2026-12',
        name: 'December 2026',
        weeks: 4,
        weekDetails: [
          { week: '2026-W49', start: '2026-11-29', end: '2026-12-05' },
          { week: '2026-W50', start: '2026-12-06', end: '2026-12-12' },
          { week: '2026-W51', start: '2026-12-13', end: '2026-12-19' },
          { week: '2026-W52', start: '2026-12-20', end: '2026-12-26' }
        ]
      }
    ]
  });

  return fiscalYear;
}

/**
 * Toggle fiscal calendar visibility
 */
function toggleFiscalCalendar() {
  const calendar = document.getElementById('fiscalCalendarContent');
  const button = document.getElementById('fiscalCalendarToggle');

  if (calendar.style.display === 'none') {
    calendar.style.display = 'block';
    button.textContent = '▼ Hide Fiscal Calendar (2026)';
  } else {
    calendar.style.display = 'none';
    button.textContent = '▶ Show Fiscal Calendar (2026)';
  }
}

// ========================================
// DATA FOUNDATION
// ========================================

/**
 * Get KPI data by product
 * Each product has different performance characteristics
 */
function getKPIDataByProduct(productId) {
  const dataByProduct = {
    'A': { // Product A: Strong performer, exceeding targets
      production: {
        current: 52300,
        target: 50000,
        weeklyTrend: [48000, 49500, 51000, 52300],
        variance: 4.6,
        delta: 2300,
        wow: 2.5,
        mom: 8.9,
        trend: 'up',
        driver: "Yield +2.1pp (WF)",
        owner: "Operations",
        wf: { current: 33500, target: 32000, yield: 96.8 },
        vn02: { current: 18800, target: 18000, yield: 97.2 }
      },
      shipment: {
        current: 50100,
        target: 48000,
        weeklyTrend: [46500, 47800, 49200, 50100],
        variance: 4.4,
        delta: 2100,
        wow: 1.8,
        mom: 7.7,
        trend: 'up',
        driver: "On-time delivery 98%",
        owner: "Logistics",
        wf: { current: 31000, shipped: 30800 },
        vn02: { current: 19100, shipped: 19000 }
      },
      labor: {
        current: 2580,
        target: 2600,
        weeklyTrend: [2520, 2550, 2570, 2580],
        variance: -0.8,
        delta: -20,
        wow: 0.4,
        mom: 2.4,
        trend: 'up',
        fulfillmentRate: 99.2,
        driver: "Fill 99.2%, OT +5%",
        owner: "HR / Operations",
        wf: { current: 1680, target: 1700, fill: 98.8 },
        vn02: { current: 900, target: 900, fill: 100.0 }
      },
      fvCost: {
        current: 268.0,
        target: 275.0,
        weeklyTrend: [272.5, 270.2, 269.1, 268.0],
        variance: -2.5,
        delta: -7.0,
        wow: -0.4,
        mom: -1.6,
        trend: 'down',
        driver: "Process improvement –$5",
        owner: "Finance",
        breakdown: { material: 185.0, labor: 46.0, overhead: 30.0, rework: 7.0 },
        negotiationRate: 24.5
      },
      campus: {
        readiness: 98.2,
        target: 98.0,
        utilization: 82.0,
        utilizationTarget: 80.0,
        weeklyTrend: [97.5, 97.8, 98.0, 98.2],
        variance: 0.2,
        delta: 0.2,
        wow: 0.2,
        mom: 0.7,
        trend: 'up',
        issues: 1,
        driver: "1 issue: Minor maintenance",
        owner: "Facilities",
        wf: { readiness: 98.5, utilization: 84.0, issues: 0 },
        vn02: { readiness: 97.9, utilization: 80.0, issues: 1 }
      },
      // SCO Aligned Metrics
      sco: {
        commitAttainment: { current: 104.4, target: 100, wow: 1.8, trend: [98.5, 100.2, 102.8, 104.4] },
        scheduleAdherence: { current: 104.6, target: 100, wow: 2.5, trend: [96.0, 99.0, 102.0, 104.6] },
        capacityUtilization: { current: 87.2, target: 85, wow: 1.2, trend: [83.5, 85.0, 86.1, 87.2] },
        capacityShortage: { current: 2.1, target: 5.0, wow: -0.3, trend: [3.8, 3.2, 2.4, 2.1] },
        mfgLeadTime: { current: 4.2, target: 5.0, unit: 'days', wow: -0.1, trend: [4.5, 4.4, 4.3, 4.2] },
        ltAchieveRate: { current: 94.5, target: 90, wow: 0.8, trend: [91.2, 92.5, 93.7, 94.5] },
        btoCtoLeadTime: { current: 3.8, target: 4.5, unit: 'days', wow: -0.2, trend: [4.2, 4.0, 4.0, 3.8] },
        btoCtoOnTimeShip: { current: 96.2, target: 90, wow: 0.5, trend: [93.5, 94.8, 95.7, 96.2] }
      }
    },
    'B': { // Product B: Struggling, below targets
      production: {
        current: 38200,
        target: 50000,
        weeklyTrend: [42000, 40500, 39000, 38200],
        variance: -23.6,
        delta: -11800,
        wow: -2.1,
        mom: -9.1,
        trend: 'down',
        driver: "Yield –5.8pp (VN02)",
        owner: "Operations",
        wf: { current: 24500, target: 32000, yield: 88.2 },
        vn02: { current: 13700, target: 18000, yield: 85.5 }
      },
      shipment: {
        current: 35800,
        target: 48000,
        weeklyTrend: [40000, 38500, 37000, 35800],
        variance: -25.4,
        delta: -12200,
        wow: -3.2,
        mom: -10.5,
        trend: 'down',
        driver: "Backlog +28%, Quality holds",
        owner: "Logistics",
        wf: { current: 22000, shipped: 21500 },
        vn02: { current: 13800, shipped: 13500 }
      },
      labor: {
        current: 2180,
        target: 2600,
        weeklyTrend: [2350, 2280, 2230, 2180],
        variance: -16.2,
        delta: -420,
        wow: -2.2,
        mom: -7.2,
        trend: 'down',
        fulfillmentRate: 83.8,
        driver: "Fill 83.8%, High attrition",
        owner: "HR / Operations",
        wf: { current: 1420, target: 1700, fill: 83.5 },
        vn02: { current: 760, target: 900, fill: 84.4 }
      },
      fvCost: {
        current: 312.5,
        target: 275.0,
        weeklyTrend: [305.2, 308.8, 310.5, 312.5],
        variance: 13.6,
        delta: 37.5,
        wow: 0.6,
        mom: 2.4,
        trend: 'up',
        driver: "Rework +$18, Expedite +$12",
        owner: "Finance",
        breakdown: { material: 205.0, labor: 52.5, overhead: 36.0, rework: 19.0 },
        negotiationRate: 8.2
      },
      campus: {
        readiness: 91.2,
        target: 98.0,
        utilization: 72.5,
        utilizationTarget: 80.0,
        weeklyTrend: [93.5, 92.8, 92.0, 91.2],
        variance: -6.9,
        delta: -6.8,
        wow: -0.9,
        mom: -2.5,
        trend: 'down',
        issues: 8,
        driver: "8 issues: Equipment (3 critical)",
        owner: "Facilities",
        wf: { readiness: 92.5, utilization: 74.0, issues: 4 },
        vn02: { readiness: 89.9, utilization: 71.0, issues: 4 }
      },
      sco: {
        commitAttainment: { current: 74.6, target: 100, wow: -3.2, trend: [83.3, 80.2, 77.1, 74.6] },
        scheduleAdherence: { current: 76.4, target: 100, wow: -2.1, trend: [84.0, 81.0, 78.0, 76.4] },
        capacityUtilization: { current: 68.5, target: 85, wow: -1.8, trend: [74.0, 72.0, 70.0, 68.5] },
        capacityShortage: { current: 18.2, target: 5.0, wow: 2.1, trend: [12.5, 14.8, 16.5, 18.2] },
        mfgLeadTime: { current: 7.8, target: 5.0, unit: 'days', wow: 0.5, trend: [6.5, 7.0, 7.3, 7.8] },
        ltAchieveRate: { current: 72.3, target: 90, wow: -2.5, trend: [80.5, 77.2, 74.8, 72.3] },
        btoCtoLeadTime: { current: 6.5, target: 4.5, unit: 'days', wow: 0.8, trend: [5.2, 5.8, 5.7, 6.5] },
        btoCtoOnTimeShip: { current: 68.5, target: 90, wow: -3.2, trend: [78.2, 74.5, 71.8, 68.5] }
      }
    },
    'C': { // Product C: Cost challenges, decent production
      production: {
        current: 47500,
        target: 50000,
        weeklyTrend: [46200, 46800, 47200, 47500],
        variance: -5.0,
        delta: -2500,
        wow: 0.6,
        mom: 2.8,
        trend: 'stable',
        driver: "Yield –1.2pp (both sites)",
        owner: "Operations",
        wf: { current: 30200, target: 32000, yield: 93.5 },
        vn02: { current: 17300, target: 18000, yield: 94.1 }
      },
      shipment: {
        current: 46200,
        target: 48000,
        weeklyTrend: [44800, 45500, 45900, 46200],
        variance: -3.8,
        delta: -1800,
        wow: 0.7,
        mom: 3.1,
        trend: 'stable',
        driver: "Backlog +8%",
        owner: "Logistics",
        wf: { current: 29000, shipped: 28700 },
        vn02: { current: 17200, shipped: 17100 }
      },
      labor: {
        current: 2620,
        target: 2600,
        weeklyTrend: [2550, 2590, 2610, 2620],
        variance: 0.8,
        delta: 20,
        wow: 0.4,
        mom: 2.7,
        trend: 'stable',
        fulfillmentRate: 100.8,
        driver: "Fill 100.8%, OT +32%",
        owner: "HR / Operations",
        wf: { current: 1720, target: 1700, fill: 101.2 },
        vn02: { current: 900, target: 900, fill: 100.0 }
      },
      fvCost: {
        current: 298.0,
        target: 275.0,
        weeklyTrend: [302.5, 300.8, 299.2, 298.0],
        variance: 8.4,
        delta: 23.0,
        wow: -0.4,
        mom: -1.5,
        trend: 'down',
        driver: "Material +$15, Freight +$8",
        owner: "Finance",
        breakdown: { material: 210.0, labor: 51.0, overhead: 32.0, rework: 5.0 },
        negotiationRate: 18.5
      },
      campus: {
        readiness: 95.8,
        target: 98.0,
        utilization: 78.5,
        utilizationTarget: 80.0,
        weeklyTrend: [95.0, 95.4, 95.6, 95.8],
        variance: -2.2,
        delta: -2.2,
        wow: 0.2,
        mom: 0.8,
        trend: 'up',
        issues: 4,
        driver: "4 issues: HVAC (1 critical)",
        owner: "Facilities",
        wf: { readiness: 96.8, utilization: 80.0, issues: 2 },
        vn02: { readiness: 94.8, utilization: 77.0, issues: 2 }
      },
      sco: {
        commitAttainment: { current: 96.3, target: 100, wow: 0.7, trend: [93.3, 94.8, 95.6, 96.3] },
        scheduleAdherence: { current: 95.0, target: 100, wow: 0.6, trend: [92.4, 93.6, 94.4, 95.0] },
        capacityUtilization: { current: 82.8, target: 85, wow: 0.5, trend: [80.5, 81.5, 82.2, 82.8] },
        capacityShortage: { current: 4.8, target: 5.0, wow: -0.2, trend: [6.0, 5.5, 5.0, 4.8] },
        mfgLeadTime: { current: 5.2, target: 5.0, unit: 'days', wow: 0.1, trend: [5.0, 5.1, 5.1, 5.2] },
        ltAchieveRate: { current: 88.2, target: 90, wow: 0.3, trend: [86.5, 87.2, 87.8, 88.2] },
        btoCtoLeadTime: { current: 4.6, target: 4.5, unit: 'days', wow: 0.0, trend: [4.5, 4.6, 4.5, 4.6] },
        btoCtoOnTimeShip: { current: 88.5, target: 90, wow: 0.2, trend: [86.8, 87.5, 88.2, 88.5] }
      }
    },
    'D': { // Product D: Labor shortage impacting output
      production: {
        current: 41200,
        target: 50000,
        weeklyTrend: [43500, 42800, 42000, 41200],
        variance: -17.6,
        delta: -8800,
        wow: -1.9,
        mom: -5.3,
        trend: 'down',
        driver: "Capacity limited by HC",
        owner: "Operations",
        wf: { current: 26000, target: 32000, yield: 94.2 },
        vn02: { current: 15200, target: 18000, yield: 93.8 }
      },
      shipment: {
        current: 40800,
        target: 48000,
        weeklyTrend: [42800, 42000, 41500, 40800],
        variance: -15.0,
        delta: -7200,
        wow: -1.7,
        mom: -4.7,
        trend: 'down',
        driver: "Production constrained",
        owner: "Logistics",
        wf: { current: 25800, shipped: 25500 },
        vn02: { current: 15000, shipped: 14900 }
      },
      labor: {
        current: 2120,
        target: 2600,
        weeklyTrend: [2280, 2220, 2170, 2120],
        variance: -18.5,
        delta: -480,
        wow: -2.3,
        mom: -7.0,
        trend: 'down',
        fulfillmentRate: 81.5,
        driver: "Fill 81.5%, Hiring freeze",
        owner: "HR / Operations",
        wf: { current: 1380, target: 1700, fill: 81.2 },
        vn02: { current: 740, target: 900, fill: 82.2 }
      },
      fvCost: {
        current: 279.5,
        target: 275.0,
        weeklyTrend: [283.0, 281.2, 280.5, 279.5],
        variance: 1.6,
        delta: 4.5,
        wow: -0.4,
        mom: -1.2,
        trend: 'down',
        driver: "Lower volume, fixed costs",
        owner: "Finance",
        breakdown: { material: 192.0, labor: 48.0, overhead: 34.5, rework: 5.0 },
        negotiationRate: 15.8
      },
      campus: {
        readiness: 97.5,
        target: 98.0,
        weeklyTrend: [97.0, 97.2, 97.4, 97.5],
        variance: -0.5,
        delta: -0.5,
        wow: 0.1,
        mom: 0.5,
        trend: 'up',
        issues: 2,
        driver: "2 issues: Safety inspection pending",
        owner: "Facilities",
        wf: { readiness: 98.0, utilization: 81.0, issues: 1 },
        vn02: { readiness: 97.0, utilization: 76.0, issues: 1 }
      },
      sco: {
        commitAttainment: { current: 85.0, target: 100, wow: -1.7, trend: [89.2, 87.5, 86.5, 85.0] },
        scheduleAdherence: { current: 82.4, target: 100, wow: -1.9, trend: [87.0, 85.6, 84.0, 82.4] },
        capacityUtilization: { current: 74.5, target: 85, wow: -1.5, trend: [78.5, 77.0, 76.0, 74.5] },
        capacityShortage: { current: 12.8, target: 5.0, wow: 1.2, trend: [9.5, 10.5, 11.5, 12.8] },
        mfgLeadTime: { current: 6.2, target: 5.0, unit: 'days', wow: 0.3, trend: [5.5, 5.8, 5.9, 6.2] },
        ltAchieveRate: { current: 78.5, target: 90, wow: -1.8, trend: [84.0, 81.5, 80.2, 78.5] },
        btoCtoLeadTime: { current: 5.5, target: 4.5, unit: 'days', wow: 0.4, trend: [4.8, 5.0, 5.1, 5.5] },
        btoCtoOnTimeShip: { current: 76.2, target: 90, wow: -2.0, trend: [82.5, 80.0, 78.2, 76.2] }
      }
    }
  };

  // Add campus utilization data for Product D
  dataByProduct['D'].campus.utilization = 78.5;
  dataByProduct['D'].campus.utilizationTarget = 80.0;

  return dataByProduct[productId] || dataByProduct['A']; // Default to Product A
}

/**
 * Render Production Management page — Factory Execution Control Panel
 */
function renderProductionManagement() {
  const content = $("content");

  // Collect data from command center for Products A-D
  var productIds = ['A', 'B', 'C', 'D'];
  var ioRows = '';
  for (var i = 0; i < productIds.length; i++) {
    var pid = productIds[i];
    var d = window.getCommandCenterData ? window.getCommandCenterData(pid) : null;
    if (!d || !d.weekly_snapshot) continue;
    var c = d.weekly_snapshot;
    var pName = d.program_timeline ? d.program_timeline.program_name : ('Product ' + pid);
    var gapClass = c.gap_units < 0 ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50';
    var limiterMap = { ctb: 'Material (CTB)', yield: 'Yield', capacity: 'Capacity' };
    var limiterLabel = limiterMap[c.primary_limiter] || c.primary_limiter;
    ioRows += '<tr class="hover:bg-slate-50">' +
      '<td class="p-2.5 border border-slate-200 font-semibold">' + pName + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-center">' + c.week_id + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right">' + c.demand_units.toLocaleString() + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right">' + c.capacity_units.toLocaleString() + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right">' + c.ctb_units.toLocaleString() + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right">' + c.expected_output_units.toLocaleString() + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right">' + c.deliverable_ship_units.toLocaleString() + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right ' + gapClass + ' font-semibold">' + c.gap_units.toLocaleString() + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-right ' + gapClass + '">' + c.gap_pct + '%</td>' +
      '<td class="p-2.5 border border-slate-200">' + limiterLabel + '</td>' +
      '</tr>';
  }

  // Line execution seed data
  var lines = [
    { name: 'WF-L1', uph: 42, yield: 70, wip: 1240, status: 'YELLOW', statusColor: 'amber' },
    { name: 'WF-L2', uph: 38, yield: 94, wip: 860, status: 'GREEN', statusColor: 'emerald' },
    { name: 'VN02-L1', uph: 55, yield: 92, wip: 1100, status: 'GREEN', statusColor: 'emerald' }
  ];
  var lineCards = '';
  for (var li = 0; li < lines.length; li++) {
    var ln = lines[li];
    var borderColor = ln.statusColor === 'amber' ? 'border-amber-400' : 'border-emerald-400';
    var badgeBg = ln.statusColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
    var yieldColor = ln.yield < 80 ? 'text-red-600' : (ln.yield < 90 ? 'text-amber-600' : 'text-emerald-600');
    lineCards += '<div class="bg-white rounded-xl border-l-4 ' + borderColor + ' shadow-md p-5">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<h4 class="text-base font-bold text-slate-800">' + ln.name + '</h4>' +
        '<span class="px-2.5 py-1 text-xs font-bold rounded-full ' + badgeBg + '">' + ln.status + '</span>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div class="bg-slate-50 rounded-lg p-3 text-center">' +
          '<div class="text-xs text-slate-500 mb-1">UPH</div>' +
          '<div class="text-xl font-bold text-slate-800">' + ln.uph + '</div>' +
        '</div>' +
        '<div class="bg-slate-50 rounded-lg p-3 text-center">' +
          '<div class="text-xs text-slate-500 mb-1">Yield (FPY)</div>' +
          '<div class="text-xl font-bold ' + yieldColor + '">' + ln.yield + '%</div>' +
        '</div>' +
        '<div class="bg-slate-50 rounded-lg p-3 text-center">' +
          '<div class="text-xs text-slate-500 mb-1">WIP</div>' +
          '<div class="text-xl font-bold text-slate-800">' + ln.wip.toLocaleString() + '</div>' +
        '</div>' +
        '<div class="bg-slate-50 rounded-lg p-3 text-center">' +
          '<div class="text-xs text-slate-500 mb-1">Status</div>' +
          '<div class="text-xl font-bold ' + (ln.statusColor === 'amber' ? 'text-amber-600' : 'text-emerald-600') + '">' + ln.status + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // MIL seed data
  var milIssues = [
    { id: 'MIL-001', issue: 'FPY drop on WF-L1 final assembly', severity: 'HIGH', program: 'Product A', line: 'WF-L1', status: 'Open', owner: 'PQE', days: 3 },
    { id: 'MIL-002', issue: 'IC-77 material shortage', severity: 'HIGH', program: 'Product A', line: 'WF-L1', status: 'Escalated', owner: 'Sourcing', days: 5 },
    { id: 'MIL-003', issue: 'Test fixture calibration drift', severity: 'MED', program: 'Product B', line: 'WF-L2', status: 'In Progress', owner: 'TE', days: 2 },
    { id: 'MIL-004', issue: 'Conveyor belt speed inconsistency', severity: 'LOW', program: 'Product C', line: 'VN02-L1', status: 'Open', owner: 'ME', days: 7 },
    { id: 'MIL-005', issue: 'Labeling misprint on outer carton', severity: 'MED', program: 'Product D', line: 'WF-L2', status: 'Resolved', owner: 'Quality', days: 1 }
  ];
  var milRows = '';
  for (var mi = 0; mi < milIssues.length; mi++) {
    var iss = milIssues[mi];
    var sevBg = iss.severity === 'HIGH' ? 'bg-red-100 text-red-800' : (iss.severity === 'MED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700');
    var statusBg = iss.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : (iss.status === 'Escalated' ? 'bg-red-100 text-red-800' : (iss.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'));
    milRows += '<tr class="hover:bg-slate-50">' +
      '<td class="p-2.5 border border-slate-200 font-mono text-xs font-semibold">' + iss.id + '</td>' +
      '<td class="p-2.5 border border-slate-200">' + iss.issue + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-center"><span class="px-2 py-0.5 text-xs font-bold rounded ' + sevBg + '">' + iss.severity + '</span></td>' +
      '<td class="p-2.5 border border-slate-200">' + iss.program + '</td>' +
      '<td class="p-2.5 border border-slate-200">' + iss.line + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-center"><span class="px-2 py-0.5 text-xs font-semibold rounded ' + statusBg + '">' + iss.status + '</span></td>' +
      '<td class="p-2.5 border border-slate-200">' + iss.owner + '</td>' +
      '<td class="p-2.5 border border-slate-200 text-center font-semibold">' + iss.days + 'd</td>' +
      '</tr>';
  }

  content.innerHTML =
    '<div class="space-y-6">' +

    // Header + Action Bar
    '<div class="bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-50 rounded-xl shadow-md border border-slate-200 p-8">' +
      '<h1 class="text-3xl font-bold mb-2 text-slate-800">Production Management</h1>' +
      '<p class="text-slate-600 mb-5">Factory execution control panel — monitor output, yield, material, and line status</p>' +
      '<div class="flex flex-wrap gap-3">' +
        '<button onclick="generateProductionBrief(\'daily_brief\')" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 shadow-sm flex items-center gap-2" style="cursor:pointer;">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' +
          'Generate Daily Brief</button>' +
        '<button onclick="generateProductionBrief(\'daily_post\')" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-cyan-700 shadow-sm flex items-center gap-2" style="cursor:pointer;">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>' +
          'Generate Daily Post</button>' +
        '<button onclick="generateProductionBrief(\'exec_summary\')" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 shadow-sm flex items-center gap-2" style="cursor:pointer;">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' +
          'Generate Exec Summary</button>' +
        '<button onclick="openReportCenter()" class="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-fuchsia-700 shadow-sm flex items-center gap-2" style="cursor:pointer;">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' +
          'Report Center</button>' +
        '<button onclick="exportProductionSnapshot()" class="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm flex items-center gap-2" style="cursor:pointer;">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' +
          'Export Snapshot</button>' +
      '</div>' +
      '<div class="mt-5 p-3 bg-white/60 border border-slate-200 rounded-xl">' +
        renderProductFilterBar('productionMgmt') +
      '</div>' +
    '</div>' +

    // Section 1: Factory Execution Snapshot
    '<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">' +
      '<h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">' +
        '<span class="w-2 h-2 rounded-full bg-blue-500"></span>Factory Execution Snapshot</h2>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">' +
        // Today's Output
        '<div class="rounded-xl border-l-4 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">' +
          '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Today\'s FATP Output</div>' +
          '<div class="text-2xl font-bold text-slate-800">2,846 <span class="text-sm font-normal text-slate-500">/ 3,308</span></div>' +
          '<div class="flex items-center gap-2 mt-2">' +
            '<div class="flex-1 bg-slate-200 rounded-full h-2"><div class="bg-amber-500 h-2 rounded-full" style="width:86%"></div></div>' +
            '<span class="text-xs font-bold text-amber-600">86%</span>' +
          '</div>' +
          '<div class="flex items-center justify-between mt-2">' +
            '<span class="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-800">YELLOW</span>' +
            '<span class="text-[10px] text-slate-400" title="MES API — auto-refreshed daily">MES &bull; 6:00 AM</span>' +
          '</div>' +
        '</div>' +
        // Yield (FPY)
        '<div class="rounded-xl border-l-4 border-emerald-400 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">' +
          '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Yield (FPY)</div>' +
          '<div class="text-2xl font-bold text-emerald-700">91.2%</div>' +
          '<div class="flex items-center gap-2 mt-2">' +
            '<div class="flex-1 bg-slate-200 rounded-full h-2"><div class="bg-emerald-500 h-2 rounded-full" style="width:91.2%"></div></div>' +
            '<span class="text-xs font-bold text-emerald-600">On Target</span>' +
          '</div>' +
          '<div class="flex items-center justify-between mt-2">' +
            '<span class="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">GREEN</span>' +
            '<span class="text-[10px] text-slate-400" title="Quality system — auto-refreshed daily">Quality &bull; 6:00 AM</span>' +
          '</div>' +
        '</div>' +
        // Material Readiness
        '<div class="rounded-xl border-l-4 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">' +
          '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Material Readiness</div>' +
          '<div class="text-2xl font-bold text-slate-800">2 <span class="text-sm font-normal text-slate-500">shortages</span></div>' +
          '<div class="text-xs text-slate-600 mt-2">IC-77 (WF-L1), Flex Cable (VN02)</div>' +
          '<div class="flex items-center justify-between mt-2">' +
            '<span class="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-800">YELLOW</span>' +
            '<span class="text-[10px] text-slate-400" title="Sourcing upload — last updated">MRP &bull; 8:30 AM</span>' +
          '</div>' +
        '</div>' +
        // Active Alerts
        '<div class="rounded-xl border-l-4 border-red-400 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">' +
          '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Active Alerts</div>' +
          '<div class="text-2xl font-bold text-slate-800">3</div>' +
          '<div class="text-xs text-slate-600 mt-2"><span class="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold rounded mr-1">2 HIGH</span><span class="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">1 MED</span></div>' +
          '<div class="flex items-center justify-between mt-2">' +
            '<span class="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800">RED</span>' +
            '<span class="text-[10px] text-slate-400" title="System-calculated from multiple sources">System &bull; Live</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Section 2: Production IO Status
    '<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">' +
          '<span class="w-2 h-2 rounded-full bg-indigo-500"></span>Production IO Status</h2>' +
        '<div class="flex items-center gap-3 text-[10px] text-slate-400">' +
          '<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Demand: Excel W11</span>' +
          '<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> CTB: Excel 8:30AM</span>' +
          '<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Output: MES 6:00AM</span>' +
          '<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> Capacity: Config v2.1</span>' +
        '</div>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full text-xs border-collapse">' +
          '<thead>' +
            '<tr class="bg-slate-100">' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Program</th>' +
              '<th class="text-center p-2.5 border border-slate-200 font-semibold text-slate-700">Week</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">Demand</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">Capacity</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">CTB</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">Exp. Output</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">Ship</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">Gap</th>' +
              '<th class="text-right p-2.5 border border-slate-200 font-semibold text-slate-700">Gap%</th>' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Primary Limiter</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + ioRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    // Section 3: Line Execution
    '<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">' +
      '<h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">' +
        '<span class="w-2 h-2 rounded-full bg-emerald-500"></span>Line Execution</h2>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' + lineCards + '</div>' +
    '</div>' +

    // Section 4: Manufacturing Issue Tracker
    '<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">' +
      '<h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">' +
        '<span class="w-2 h-2 rounded-full bg-red-500"></span>Manufacturing Issue Tracker (MIL)</h2>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full text-xs border-collapse">' +
          '<thead>' +
            '<tr class="bg-slate-100">' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">ID</th>' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Issue</th>' +
              '<th class="text-center p-2.5 border border-slate-200 font-semibold text-slate-700">Severity</th>' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Program</th>' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Line</th>' +
              '<th class="text-center p-2.5 border border-slate-200 font-semibold text-slate-700">Status</th>' +
              '<th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Owner</th>' +
              '<th class="text-center p-2.5 border border-slate-200 font-semibold text-slate-700">Days Open</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + milRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '</div>';
}

/**
 * Generate Production Brief — opens AI drawer with formatted content
 */
window.generateProductionBrief = function(briefType) {
  var drawerBody = document.getElementById('aiDrawerBody');
  var drawer = document.getElementById('aiDrawer');
  var backdrop = document.getElementById('aiDrawerBackdrop');
  if (!drawerBody || !drawer || !backdrop) return;

  var titles = {
    daily_brief: 'Daily Production Brief',
    daily_post: 'Daily Post (Slack / WeChat)',
    exec_summary: 'Executive Summary'
  };

  // Show loading state
  drawerBody.innerHTML =
    '<div class="flex flex-col items-center justify-center py-12">' +
      '<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>' +
      '<div class="text-sm text-slate-600">Generating ' + (titles[briefType] || 'brief') + '...</div>' +
    '</div>';
  drawer.classList.remove('hidden');
  backdrop.classList.remove('hidden');

  var action = 'production_' + briefType;

  setTimeout(function() {
    var aiResponse = (typeof mockAI === 'function') ? mockAI({}, action, {}) : null;
    if (!aiResponse || !aiResponse.draft) {
      drawerBody.innerHTML = '<div class="p-4 text-sm text-slate-500">No response configured for this brief type.</div>';
      return;
    }

    drawerBody.innerHTML =
      '<div class="space-y-5">' +
        '<div class="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4">' +
          '<div class="flex items-center gap-2 mb-2">' +
            '<span class="text-lg">&#129302;</span>' +
            '<h2 class="text-lg font-bold text-indigo-900">' + (titles[briefType] || 'Production Brief') + '</h2>' +
            '<span class="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-bold rounded">AI GENERATED</span>' +
          '</div>' +
          '<p class="text-xs text-indigo-700">Generated from live factory data — ' + new Date().toLocaleString() + '</p>' +
        '</div>' +
        '<div class="bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-800 leading-relaxed whitespace-pre-line">' +
          aiResponse.draft +
        '</div>' +
      '</div>';
  }, 800);
};

/**
 * Export Production Snapshot — shows toast notification
 */
window.exportProductionSnapshot = function() {
  if (typeof showNotification === 'function') {
    showNotification('Production snapshot exported successfully. Check your downloads folder.', 'success');
  }
};

/**
 * Report Center — modal for template selection, preview, send, and scheduling
 */
window.openReportCenter = function() {
  // Remove existing modal if any
  var existing = document.getElementById('reportCenterModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'reportCenterModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
  modal.innerHTML =
    '<div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeReportCenter()"></div>' +
    '<div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4">' +
      // Header
      '<div class="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-4">' +
        '<div class="flex items-center justify-between">' +
          '<div>' +
            '<h2 class="text-lg font-bold">Report Center</h2>' +
            '<p class="text-violet-200 text-xs">Generate, preview, and distribute reports</p>' +
          '</div>' +
          '<button onclick="closeReportCenter()" class="text-white/70 hover:text-white text-xl" style="cursor:pointer;">&times;</button>' +
        '</div>' +
      '</div>' +
      '<div class="overflow-y-auto p-6 space-y-5" style="max-height: calc(85vh - 60px);">' +
        // Step 1: Template Selection
        '<div>' +
          '<h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">1</span> Select Template</h3>' +
          '<div class="grid grid-cols-3 gap-3">' +
            '<label class="cursor-pointer">' +
              '<input type="radio" name="reportTemplate" value="daily_brief" class="hidden peer" checked>' +
              '<div class="peer-checked:ring-2 peer-checked:ring-violet-500 peer-checked:bg-violet-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-all">' +
                '<div class="text-2xl mb-2">&#128203;</div>' +
                '<div class="text-sm font-semibold text-slate-800">Daily Brief</div>' +
                '<div class="text-xs text-slate-500 mt-1">BOD/EOD structured summary</div>' +
              '</div>' +
            '</label>' +
            '<label class="cursor-pointer">' +
              '<input type="radio" name="reportTemplate" value="weekly_summary" class="hidden peer">' +
              '<div class="peer-checked:ring-2 peer-checked:ring-violet-500 peer-checked:bg-violet-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-all">' +
                '<div class="text-2xl mb-2">&#128200;</div>' +
                '<div class="text-sm font-semibold text-slate-800">Weekly Summary</div>' +
                '<div class="text-xs text-slate-500 mt-1">Commit, gaps, decisions, risks</div>' +
              '</div>' +
            '</label>' +
            '<label class="cursor-pointer">' +
              '<input type="radio" name="reportTemplate" value="exec_report" class="hidden peer">' +
              '<div class="peer-checked:ring-2 peer-checked:ring-violet-500 peer-checked:bg-violet-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-all">' +
                '<div class="text-2xl mb-2">&#127919;</div>' +
                '<div class="text-sm font-semibold text-slate-800">Exec Report</div>' +
                '<div class="text-xs text-slate-500 mt-1">VP-level health + key asks</div>' +
              '</div>' +
            '</label>' +
          '</div>' +
        '</div>' +
        // Step 2: Scope
        '<div>' +
          '<h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">2</span> Report Scope</h3>' +
          '<div class="grid grid-cols-3 gap-3">' +
            '<div>' +
              '<label class="text-xs text-slate-500 mb-1 block">Program</label>' +
              '<select class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">' +
                '<option>All Programs</option><option>Product A</option><option>Product B</option><option>Product C</option><option>Product D</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label class="text-xs text-slate-500 mb-1 block">Site</label>' +
              '<select class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">' +
                '<option>All Sites</option><option>WF</option><option>VN02</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label class="text-xs text-slate-500 mb-1 block">Period</label>' +
              '<select class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">' +
                '<option>This Week (W11)</option><option>Last Week (W10)</option><option>This Month</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Step 3: Send Options
        '<div>' +
          '<h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">3</span> Distribution</h3>' +
          '<div class="space-y-3">' +
            '<div class="flex flex-wrap gap-2">' +
              '<label class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">' +
                '<input type="checkbox" class="rounded text-violet-600"> <span class="text-sm text-slate-700">Email</span>' +
              '</label>' +
              '<label class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">' +
                '<input type="checkbox" class="rounded text-violet-600"> <span class="text-sm text-slate-700">Slack</span>' +
              '</label>' +
              '<label class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">' +
                '<input type="checkbox" class="rounded text-violet-600"> <span class="text-sm text-slate-700">WeChat</span>' +
              '</label>' +
            '</div>' +
            '<div>' +
              '<label class="text-xs text-slate-500 mb-1 block">Send to (people)</label>' +
              '<div class="flex flex-wrap gap-2 border border-slate-200 rounded-lg p-2.5 min-h-[40px]">' +
                '<span class="px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded-full flex items-center gap-1">Wei Chen <button class="text-violet-400 hover:text-violet-600">&times;</button></span>' +
                '<span class="px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded-full flex items-center gap-1">David Liu <button class="text-violet-400 hover:text-violet-600">&times;</button></span>' +
                '<input type="text" class="text-sm text-slate-700 outline-none flex-1 min-w-[100px]" placeholder="Add recipient...">' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Step 4: Schedule (optional)
        '<div class="bg-slate-50 rounded-xl p-4 border border-slate-200">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<h3 class="text-sm font-bold text-slate-800 flex items-center gap-2"><span class="w-5 h-5 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">4</span> Schedule (Optional)</h3>' +
            '<label class="relative inline-flex items-center cursor-pointer">' +
              '<input type="checkbox" id="reportScheduleToggle" class="sr-only peer">' +
              '<div class="w-9 h-5 bg-slate-300 peer-checked:bg-violet-600 rounded-full transition-colors"></div>' +
              '<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>' +
            '</label>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-3 opacity-50" id="reportScheduleFields">' +
            '<div>' +
              '<label class="text-xs text-slate-500 mb-1 block">Frequency</label>' +
              '<select class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">' +
                '<option>Weekly</option><option>Daily</option><option>Bi-weekly</option><option>Monthly</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label class="text-xs text-slate-500 mb-1 block">Day & Time</label>' +
              '<div class="flex gap-2">' +
                '<select class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">' +
                  '<option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>' +
                '</select>' +
                '<input type="time" value="08:00" class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Actions
        '<div class="flex items-center justify-between pt-2">' +
          '<button onclick="previewReport()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50" style="cursor:pointer;">Preview Report</button>' +
          '<div class="flex gap-2">' +
            '<button onclick="closeReportCenter()" class="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900" style="cursor:pointer;">Cancel</button>' +
            '<button onclick="generateAndSendReport()" class="px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-fuchsia-700 shadow-sm" style="cursor:pointer;">Generate & Send</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  // Schedule toggle logic
  var toggle = document.getElementById('reportScheduleToggle');
  var fields = document.getElementById('reportScheduleFields');
  if (toggle && fields) {
    toggle.addEventListener('change', function() {
      fields.style.opacity = this.checked ? '1' : '0.5';
      fields.style.pointerEvents = this.checked ? 'auto' : 'none';
    });
    fields.style.pointerEvents = 'none';
  }
};

window.closeReportCenter = function() {
  var modal = document.getElementById('reportCenterModal');
  if (modal) modal.remove();
};

window.previewReport = function() {
  var selected = document.querySelector('input[name="reportTemplate"]:checked');
  var briefType = selected ? selected.value : 'daily_brief';
  closeReportCenter();
  var typeMap = { daily_brief: 'daily_brief', weekly_summary: 'exec_summary', exec_report: 'exec_summary' };
  generateProductionBrief(typeMap[briefType] || 'daily_brief');
};

window.generateAndSendReport = function() {
  closeReportCenter();
  if (typeof showNotification === 'function') {
    showNotification('Report generated and sent to selected recipients.', 'success');
  }
};

/**
 * Render MO KPIs page V4
 * Tech-style Executive Dashboard with modern visuals
 */
function renderMOKpis() {
  const content = $("content");

  // Get current product from filters (default to A)
  const currentProduct = STATE.filters.product || 'A';

  // Get KPI data for selected product
  const kpiData = getKPIDataByProduct(currentProduct);

  // Calculate sub-scores using SCO-aligned formula
  const sco = kpiData.sco;
  const execScore = Math.round(
    Math.min(100, sco.commitAttainment.current) * 0.30 +
    Math.min(100, sco.scheduleAdherence.current) * 0.25 +
    Math.min(100, sco.capacityUtilization.current / sco.capacityUtilization.target * 100) * 0.20 +
    Math.min(100, sco.btoCtoOnTimeShip.current / sco.btoCtoOnTimeShip.target * 100) * 0.25
  );
  const resourceScore = Math.round(
    (kpiData.labor.fulfillmentRate) * 0.5 +
    (kpiData.campus.readiness) * 0.5
  );
  const costScore = Math.round(100 - Math.abs(kpiData.fvCost.variance));
  const healthScore = Math.round(execScore * 0.45 + resourceScore * 0.30 + costScore * 0.25);

  const formatNumber = (num) => num.toLocaleString('en-US');
  const formatPercent = (num) => (num >= 0 ? '+' : '') + num.toFixed(1) + '%';

  // Generate area chart for trend
  const generateAreaChart = (data, color = '#60a5fa') => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 40;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return x + ',' + y;
    }).join(' ');
    const areaPoints = '0,' + height + ' ' + points + ' ' + width + ',' + height;
    return '<svg width="' + width + '" height="' + height + '" class="inline-block">' +
      '<defs><linearGradient id="gradient-' + color.replace('#','') + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
      '<stop offset="0%" style="stop-color:' + color + ';stop-opacity:0.3" />' +
      '<stop offset="100%" style="stop-color:' + color + ';stop-opacity:0.05" />' +
      '</linearGradient></defs>' +
      '<polygon points="' + areaPoints + '" fill="url(#gradient-' + color.replace('#','') + ')" />' +
      '<polyline points="' + points + '" fill="none" stroke="' + color + '" stroke-width="2"/>' +
      '</svg>';
  };

  // Health bar helper
  const healthBar = function(label, score, color) {
    var barColor = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-red-500';
    if (color) barColor = color;
    return '<div class="flex items-center gap-3">' +
      '<div class="text-xs text-blue-200 w-20">' + label + '</div>' +
      '<div class="flex-1 bg-white/20 rounded-full h-2"><div class="' + barColor + ' h-2 rounded-full transition-all duration-500" style="width:' + Math.min(score, 100) + '%"></div></div>' +
      '<div class="text-sm font-bold text-white w-8 text-right">' + score + '</div>' +
    '</div>';
  };

  // Score color helper
  var scoreColor = function(s) { return s >= 90 ? 'text-emerald-400' : s >= 75 ? 'text-amber-400' : 'text-red-400'; };
  var scoreLabel = function(s) { return s >= 90 ? 'GOOD' : s >= 75 ? 'FAIR' : 'AT RISK'; };

  // Priority actions data — computed from KPI signals
  var prodGapPct = ((kpiData.production.current - kpiData.production.target) / kpiData.production.target * 100).toFixed(1);
  var laborGapHC = kpiData.labor.current - kpiData.labor.target;

  // Build the page
  content.innerHTML =
    '<div class="space-y-6">' +

    // ── Section 1: Header + Operational Health Index ──
    '<div class="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">' +
      '<div class="flex items-center justify-between mb-5">' +
        '<div>' +
          '<h1 class="text-3xl font-bold mb-1">Manufacturing Operations KPIs</h1>' +
          '<p class="text-blue-300 text-sm">Operational health monitor — system health view for MO execution</p>' +
        '</div>' +
        '<div class="text-right">' +
          '<div class="text-xs text-blue-300 uppercase tracking-wider mb-1">Operational Health Index</div>' +
          '<div class="text-5xl font-bold ' + scoreColor(healthScore) + '">' + healthScore + '</div>' +
          '<div class="text-xs font-semibold mt-1 ' + scoreColor(healthScore) + '">' + scoreLabel(healthScore) + '</div>' +
        '</div>' +
      '</div>' +
      // Sub-score bars
      '<div class="space-y-2 mb-5">' +
        healthBar('Execution', execScore) +
        healthBar('Resources', resourceScore) +
        healthBar('Cost', costScore) +
      '</div>' +
      '<div class="flex items-center gap-3 pt-4 border-t border-white/20">' +
        '<label class="text-blue-200 text-sm">Product:</label>' +
        '<select id="moKpisProductSelect" class="bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" onchange="STATE.filters.product = this.value; window.Router ? window.Router.navigate(\'moKpis\', this.value) : render();">' +
          '<option value="A"' + (currentProduct === 'A' ? ' selected' : '') + '>Product A</option>' +
          '<option value="B"' + (currentProduct === 'B' ? ' selected' : '') + '>Product B</option>' +
          '<option value="C"' + (currentProduct === 'C' ? ' selected' : '') + '>Product C</option>' +
          '<option value="D"' + (currentProduct === 'D' ? ' selected' : '') + '>Product D</option>' +
        '</select>' +
        '<div class="text-blue-200 text-xs ml-auto">Viewing: <span class="font-semibold text-white">Product ' + currentProduct + '</span></div>' +
      '</div>' +
    '</div>' +

    // ── Section 2: Priority Actions (moved up!) ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500"></span>Priority Actions</h3>' +
      '<div class="space-y-3">' +
        // HIGH action — cost signal
        '<div class="bg-red-50 border-l-4 border-red-600 rounded-lg p-4">' +
          '<div class="flex items-start justify-between mb-2">' +
            '<div class="flex items-center gap-2">' +
              '<span class="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">HIGH</span>' +
              '<span class="font-semibold text-slate-900">FV cost above target (' + formatPercent(kpiData.fvCost.variance) + ')</span>' +
            '</div>' +
            '<span class="text-xs text-slate-500">SLA: 48h</span>' +
          '</div>' +
          '<div class="text-sm text-slate-600 mb-2">Impact: +$12k weekly exposure | Owner: ' + kpiData.fvCost.owner + ' | Driver: ' + kpiData.fvCost.driver + '</div>' +
          '<div class="mt-3 flex gap-2">' +
            '<button onclick="window.Router && window.Router.navigate(\'fvCostManagement\')" class="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700" style="cursor:pointer;">View Signal</button>' +
            '<button class="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50" style="cursor:pointer;">Request Plan</button>' +
          '</div>' +
        '</div>' +
        // MEDIUM actions row
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' +
          '<div class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">' +
            '<div class="flex items-center gap-2 mb-2">' +
              '<span class="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">MEDIUM</span>' +
              '<span class="text-sm font-semibold text-slate-900">Production gap (' + prodGapPct + '%)</span>' +
            '</div>' +
            '<div class="text-xs text-slate-600 mb-2">' + formatNumber(kpiData.production.current - kpiData.production.target) + ' units vs plan | ' + kpiData.production.owner + ' | 24h</div>' +
            '<button onclick="window.Router && window.Router.navigate(\'productionManagement\')" class="text-xs text-amber-700 font-semibold hover:underline" style="cursor:pointer;">View Signal &rarr;</button>' +
          '</div>' +
          '<div class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">' +
            '<div class="flex items-center gap-2 mb-2">' +
              '<span class="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">MEDIUM</span>' +
              '<span class="text-sm font-semibold text-slate-900">Labor fulfillment (' + kpiData.labor.fulfillmentRate + '%)</span>' +
            '</div>' +
            '<div class="text-xs text-slate-600 mb-2">' + laborGapHC + ' HC gap | ' + kpiData.labor.owner + ' | 72h</div>' +
            '<button class="text-xs text-amber-700 font-semibold hover:underline" style="cursor:pointer;">View Signal &rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Section 3: Product Availability (SCO P0) ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500"></span>Product Availability</h3>' +
      '<p class="text-xs text-slate-500 mb-4">SCO Topline — 4 P0 indicators from CM APS + CM MES + CM WMS</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">' +
        // Commit Attainment
        '<div class="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Commit Attainment</div>' +
            '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div class="text-2xl font-bold text-slate-900">' + sco.commitAttainment.current.toFixed(1) + '%</div>' +
            '<div class="text-sm font-bold ' + (sco.commitAttainment.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(sco.commitAttainment.wow) + '</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.commitAttainment.trend, '#3b82f6') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ' + sco.commitAttainment.target + '%</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM APS + WMS</span>' +
          '</div>' +
        '</div>' +
        // Schedule Adherence
        '<div class="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Schedule Adherence</div>' +
            '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div class="text-2xl font-bold text-slate-900">' + sco.scheduleAdherence.current.toFixed(1) + '%</div>' +
            '<div class="text-sm font-bold ' + (sco.scheduleAdherence.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(sco.scheduleAdherence.wow) + '</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.scheduleAdherence.trend, '#6366f1') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ' + sco.scheduleAdherence.target + '%</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM APS + MES</span>' +
          '</div>' +
        '</div>' +
        // Capacity Utilization
        '<div class="bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">Capacity Utilization</div>' +
            '<span class="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div class="text-2xl font-bold text-slate-900">' + sco.capacityUtilization.current.toFixed(1) + '%</div>' +
            '<div class="text-sm font-bold ' + (sco.capacityUtilization.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(sco.capacityUtilization.wow) + '</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.capacityUtilization.trend, '#06b6d4') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ≥' + sco.capacityUtilization.target + '%</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM APS + MES</span>' +
          '</div>' +
        '</div>' +
        // Capacity Shortage
        '<div class="bg-gradient-to-br from-rose-50 to-white rounded-xl border border-rose-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Capacity Shortage</div>' +
            '<span class="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div class="text-2xl font-bold text-slate-900">' + sco.capacityShortage.current.toFixed(1) + '%</div>' +
            '<div class="text-sm font-bold ' + (sco.capacityShortage.wow <= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(sco.capacityShortage.wow) + '</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.capacityShortage.trend, '#f43f5e') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: <' + sco.capacityShortage.target + '%</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM APS</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Section 3b: Delivery & Agility (SCO) ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Delivery & Agility</h3>' +
      '<p class="text-xs text-slate-500 mb-4">SCO Topline — Lead time and on-time delivery metrics from CM MES via QuatumnBridge</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">' +
        // Manufacturing Lead Time
        '<div class="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Mfg Lead Time</div>' +
            '<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div><div class="text-2xl font-bold text-slate-900">' + sco.mfgLeadTime.current.toFixed(1) + '<span class="text-sm text-slate-400 ml-1">days</span></div></div>' +
            '<div class="text-sm font-bold ' + (sco.mfgLeadTime.wow <= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + (sco.mfgLeadTime.wow >= 0 ? '+' : '') + sco.mfgLeadTime.wow.toFixed(1) + 'd</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.mfgLeadTime.trend, '#10b981') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ≤' + sco.mfgLeadTime.target + ' days</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM MES</span>' +
          '</div>' +
        '</div>' +
        // LT Achieve Rate
        '<div class="bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-teal-600 uppercase tracking-wider">LT Achieve Rate</div>' +
            '<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div class="text-2xl font-bold text-slate-900">' + sco.ltAchieveRate.current.toFixed(1) + '%</div>' +
            '<div class="text-sm font-bold ' + (sco.ltAchieveRate.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(sco.ltAchieveRate.wow) + '</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.ltAchieveRate.trend, '#14b8a6') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ≥' + sco.ltAchieveRate.target + '%</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM MES</span>' +
          '</div>' +
        '</div>' +
        // BTO/CTO Mfg Lead Time
        '<div class="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">BTO/CTO Lead Time</div>' +
            '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div><div class="text-2xl font-bold text-slate-900">' + sco.btoCtoLeadTime.current.toFixed(1) + '<span class="text-sm text-slate-400 ml-1">days</span></div></div>' +
            '<div class="text-sm font-bold ' + (sco.btoCtoLeadTime.wow <= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + (sco.btoCtoLeadTime.wow >= 0 ? '+' : '') + sco.btoCtoLeadTime.wow.toFixed(1) + 'd</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.btoCtoLeadTime.trend, '#a855f7') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ≤' + sco.btoCtoLeadTime.target + ' days</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM MES</span>' +
          '</div>' +
        '</div>' +
        // BTO/CTO On-Time Ship
        '<div class="bg-gradient-to-br from-violet-50 to-white rounded-xl border border-violet-100 p-4">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="text-[10px] font-bold text-violet-600 uppercase tracking-wider">BTO/CTO On-Time Ship</div>' +
            '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div class="text-2xl font-bold text-slate-900">' + sco.btoCtoOnTimeShip.current.toFixed(1) + '%</div>' +
            '<div class="text-sm font-bold ' + (sco.btoCtoOnTimeShip.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(sco.btoCtoOnTimeShip.wow) + '</div>' +
          '</div>' +
          '<div class="mb-2">' + generateAreaChart(sco.btoCtoOnTimeShip.trend, '#8b5cf6') + '</div>' +
          '<div class="flex items-center justify-between text-[10px]">' +
            '<span class="text-slate-500">Target: ≥' + sco.btoCtoOnTimeShip.target + '%</span>' +
            '<span class="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">CM MES</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Section 4: Readiness (SCO) ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-purple-500"></span>Readiness</h3>' +
      '<p class="text-xs text-slate-500 mb-4">SCO Topline — Labor, campus readiness and utilization from CM Labor Tracker + Campus Database</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-5">' +
        // Labor Fulfillment
        '<div class="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-5">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Labor Fulfillment</div>' +
            '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-3">' +
            '<div class="text-2xl font-bold text-slate-900">' + kpiData.labor.fulfillmentRate + '%</div>' +
            '<div class="text-sm font-semibold ' + (kpiData.labor.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(kpiData.labor.wow) + ' WoW</div>' +
          '</div>' +
          '<div class="w-full bg-slate-200 rounded-full h-2.5 mb-3"><div class="bg-purple-500 h-2.5 rounded-full" style="width:' + Math.min(100, kpiData.labor.fulfillmentRate) + '%"></div></div>' +
          '<div class="text-xs text-slate-600">' + formatNumber(kpiData.labor.current) + ' / ' + formatNumber(kpiData.labor.target) + ' HC</div>' +
          '<div class="pt-3 mt-3 border-t border-purple-100 flex items-center justify-between">' +
            '<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded font-medium">CM Labor Tracker · csv</span>' +
            '<span class="text-[10px] text-slate-400">Weekly</span>' +
          '</div>' +
        '</div>' +
        // Campus Readiness On-Time
        '<div class="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-5">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Campus Readiness</div>' +
            '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-3">' +
            '<div class="text-2xl font-bold text-slate-900">' + kpiData.campus.readiness + '%</div>' +
            '<div class="text-sm font-semibold ' + (kpiData.campus.wow >= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(kpiData.campus.wow) + ' WoW</div>' +
          '</div>' +
          '<div class="w-full bg-slate-200 rounded-full h-2.5 mb-3"><div class="bg-amber-500 h-2.5 rounded-full" style="width:' + kpiData.campus.readiness + '%"></div></div>' +
          '<div class="text-xs text-slate-600">Target: ' + kpiData.campus.target + '% | Open issues: ' + kpiData.campus.issues + '</div>' +
          '<div class="pt-3 mt-3 border-t border-amber-100 flex items-center justify-between">' +
            '<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded font-medium">Campus Database · csv</span>' +
            '<span class="text-[10px] text-slate-400">Monthly</span>' +
          '</div>' +
        '</div>' +
        // Campus Utilization
        '<div class="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 p-5">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Campus Utilization</div>' +
            '<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-3">' +
            '<div class="text-2xl font-bold text-slate-900">' + kpiData.campus.utilization + '%</div>' +
            '<div class="text-sm font-semibold ' + (kpiData.campus.utilization >= kpiData.campus.utilizationTarget ? 'text-emerald-600' : 'text-amber-600') + '">' + (kpiData.campus.utilization >= kpiData.campus.utilizationTarget ? 'On target' : 'Below target') + '</div>' +
          '</div>' +
          '<div class="w-full bg-slate-200 rounded-full h-2.5 mb-3"><div class="bg-orange-500 h-2.5 rounded-full" style="width:' + kpiData.campus.utilization + '%"></div></div>' +
          '<div class="text-xs text-slate-600">Target: >' + kpiData.campus.utilizationTarget + '% | Line installed / reserved</div>' +
          '<div class="pt-3 mt-3 border-t border-orange-100 flex items-center justify-between">' +
            '<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded font-medium">Campus Database · csv</span>' +
            '<span class="text-[10px] text-slate-400">Monthly</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Section 5: Cost (SCO) ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Cost</h3>' +
      '<p class="text-xs text-slate-500 mb-4">SCO Topline — FV cost tracking from FV Database via Mulesoft</p>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-5">' +
        // FV Cost per Unit
        '<div class="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-5">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">FV Cost per Unit</div>' +
            '<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div>' +
              '<div class="text-2xl font-bold text-slate-900">$' + kpiData.fvCost.current + '</div>' +
              '<div class="text-xs text-slate-500">Target: $' + kpiData.fvCost.target + '</div>' +
            '</div>' +
            '<div class="text-right">' +
              '<div class="text-lg font-bold ' + (kpiData.fvCost.wow <= 0 ? 'text-emerald-600' : 'text-red-600') + '">' + formatPercent(kpiData.fvCost.wow) + '</div>' +
              '<div class="text-xs text-slate-400">WoW</div>' +
            '</div>' +
          '</div>' +
          '<div class="mb-3">' + generateAreaChart(kpiData.fvCost.weeklyTrend, '#f59e0b') + '</div>' +
          '<div class="pt-3 border-t border-amber-100 flex items-center justify-between">' +
            '<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded font-medium">FV Database · csv</span>' +
            '<button onclick="window.Router && window.Router.navigate(\'fvCostManagement\')" class="text-xs text-amber-600 font-semibold hover:underline" style="cursor:pointer;">View Signal &rarr;</button>' +
          '</div>' +
        '</div>' +
        // FV Negotiation Rate (NEW)
        '<div class="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-5">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">FV Negotiation Rate</div>' +
            '<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span>' +
          '</div>' +
          '<div class="flex items-end justify-between mb-2">' +
            '<div>' +
              '<div class="text-2xl font-bold text-slate-900">' + kpiData.fvCost.negotiationRate + '%</div>' +
              '<div class="text-xs text-slate-500">Target: >20%</div>' +
            '</div>' +
            '<div class="text-right">' +
              '<div class="text-lg font-bold ' + (kpiData.fvCost.negotiationRate >= 20 ? 'text-emerald-600' : 'text-amber-600') + '">' + (kpiData.fvCost.negotiationRate >= 20 ? 'On target' : 'Below') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="w-full bg-slate-200 rounded-full h-2.5 mb-3"><div class="' + (kpiData.fvCost.negotiationRate >= 20 ? 'bg-emerald-500' : 'bg-amber-500') + ' h-2.5 rounded-full" style="width:' + Math.min(100, kpiData.fvCost.negotiationRate / 30 * 100) + '%"></div></div>' +
          '<div class="text-xs text-slate-600">Cost reduction through negotiation / total validated cost</div>' +
          '<div class="pt-3 mt-3 border-t border-green-100 flex items-center justify-between">' +
            '<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded font-medium">FV Database · csv</span>' +
            '<span class="text-[10px] text-slate-400">By need</span>' +
          '</div>' +
        '</div>' +
        // Cost breakdown
        '<div class="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5">' +
          '<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Cost Breakdown (per unit)</div>' +
          '<div class="grid grid-cols-2 gap-2">' +
            '<div class="text-center p-2.5 bg-white rounded-lg border border-slate-100">' +
              '<div class="text-lg font-bold text-slate-800">$' + kpiData.fvCost.breakdown.material + '</div>' +
              '<div class="text-[10px] text-slate-500">Material · ' + Math.round(kpiData.fvCost.breakdown.material / kpiData.fvCost.current * 100) + '%</div>' +
            '</div>' +
            '<div class="text-center p-2.5 bg-white rounded-lg border border-slate-100">' +
              '<div class="text-lg font-bold text-slate-800">$' + kpiData.fvCost.breakdown.labor + '</div>' +
              '<div class="text-[10px] text-slate-500">Labor · ' + Math.round(kpiData.fvCost.breakdown.labor / kpiData.fvCost.current * 100) + '%</div>' +
            '</div>' +
            '<div class="text-center p-2.5 bg-white rounded-lg border border-slate-100">' +
              '<div class="text-lg font-bold text-slate-800">$' + kpiData.fvCost.breakdown.overhead + '</div>' +
              '<div class="text-[10px] text-slate-500">Overhead · ' + Math.round(kpiData.fvCost.breakdown.overhead / kpiData.fvCost.current * 100) + '%</div>' +
            '</div>' +
            '<div class="text-center p-2.5 bg-white rounded-lg border border-slate-100">' +
              '<div class="text-lg font-bold text-slate-800">$' + kpiData.fvCost.breakdown.rework + '</div>' +
              '<div class="text-[10px] text-slate-500">Rework · ' + Math.round(kpiData.fvCost.breakdown.rework / kpiData.fvCost.current * 100) + '%</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Section 6: KPI Item Detail (by SCO Topline) ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">' +
      '<div class="p-6 pb-0">' +
        '<h3 class="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-indigo-500"></span>KPI Item Detail</h3>' +
        '<p class="text-xs text-slate-500 mb-4">Drill down by SCO Topline — real system sources, integration paths, and DRI ownership</p>' +
      '</div>' +
      '<div class="border-b border-slate-200">' +
        '<nav class="flex gap-0 px-6 overflow-x-auto" role="tablist">' +
          '<button id="tab-availability" onclick="switchMOKpiTab(\'availability\')" class="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap">Product Availability</button>' +
          '<button id="tab-agility" onclick="switchMOKpiTab(\'agility\')" class="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Agility</button>' +
          '<button id="tab-delivery" onclick="switchMOKpiTab(\'delivery\')" class="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Timely Delivery</button>' +
          '<button id="tab-readiness" onclick="switchMOKpiTab(\'readiness\')" class="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Readiness</button>' +
          '<button id="tab-cost" onclick="switchMOKpiTab(\'cost\')" class="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Cost</button>' +
        '</nav>' +
      '</div>' +
      '<div class="p-6">' +
        // Product Availability Tab
        '<div id="tab-content-availability">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead><tr class="bg-blue-50/50">' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">SCO Metric</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Pri</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Current</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Target</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Variance</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Trend</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Source</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Integration</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">DRI</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Freq</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Ex-factory Commit Attainment %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.commitAttainment.current.toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">' + sco.commitAttainment.target + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.commitAttainment.current >= sco.commitAttainment.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.commitAttainment.current - sco.commitAttainment.target).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.commitAttainment.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM APS + WMS</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">APS + ASN</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Schedule Adherence %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.scheduleAdherence.current.toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">' + sco.scheduleAdherence.target + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.scheduleAdherence.current >= sco.scheduleAdherence.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.scheduleAdherence.current - sco.scheduleAdherence.target).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.scheduleAdherence.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM APS + MES</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">APS + QB</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Capacity Utilization</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.capacityUtilization.current.toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">≥' + sco.capacityUtilization.target + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.capacityUtilization.current >= sco.capacityUtilization.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.capacityUtilization.current - sco.capacityUtilization.target).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.capacityUtilization.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM APS + MES</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">APS + QB</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Capacity Shortage %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.capacityShortage.current.toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500"><' + sco.capacityShortage.target + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.capacityShortage.current <= sco.capacityShortage.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.capacityShortage.current - sco.capacityShortage.target).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.capacityShortage.wow <= 0 ? '<span class="text-emerald-600">&#9660;</span>' : '<span class="text-red-600">&#9650;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM APS</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">APS</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        // Agility Tab
        '<div id="tab-content-agility" class="hidden">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead><tr class="bg-green-50/50">' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">SCO Metric</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Pri</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Current</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Target</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Variance</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Trend</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Source</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Integration</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">DRI</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Freq</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Manufacturing Lead Time</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.mfgLeadTime.current.toFixed(1) + ' days</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">≤' + sco.mfgLeadTime.target + ' days</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.mfgLeadTime.current <= sco.mfgLeadTime.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.mfgLeadTime.current - sco.mfgLeadTime.target).toFixed(1) + 'd</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.mfgLeadTime.wow <= 0 ? '<span class="text-emerald-600">&#9660;</span>' : '<span class="text-red-600">&#9650;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM MES</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">QuatumnBridge</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Mfg Lead Time Achieve Rate</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.ltAchieveRate.current.toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">≥' + sco.ltAchieveRate.target + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.ltAchieveRate.current >= sco.ltAchieveRate.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.ltAchieveRate.current - sco.ltAchieveRate.target).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.ltAchieveRate.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM MES</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">QuatumnBridge</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        // Timely Delivery Tab
        '<div id="tab-content-delivery" class="hidden">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead><tr class="bg-purple-50/50">' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">SCO Metric</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Pri</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Current</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Target</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Variance</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Trend</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Source</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Integration</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">DRI</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Freq</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">BTO/CTO Mfg Lead Time</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.btoCtoLeadTime.current.toFixed(1) + ' days</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">≤' + sco.btoCtoLeadTime.target + ' days</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.btoCtoLeadTime.current <= sco.btoCtoLeadTime.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.btoCtoLeadTime.current - sco.btoCtoLeadTime.target).toFixed(1) + 'd</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.btoCtoLeadTime.wow <= 0 ? '<span class="text-emerald-600">&#9660;</span>' : '<span class="text-red-600">&#9650;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM MES</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">QuatumnBridge</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">BTO/CTO On-Time Ship %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + sco.btoCtoOnTimeShip.current.toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">≥' + sco.btoCtoOnTimeShip.target + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (sco.btoCtoOnTimeShip.current >= sco.btoCtoOnTimeShip.target ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (sco.btoCtoOnTimeShip.current - sco.btoCtoOnTimeShip.target).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (sco.btoCtoOnTimeShip.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM MES</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded">QuatumnBridge</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        // Readiness Tab
        '<div id="tab-content-readiness" class="hidden">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead><tr class="bg-amber-50/50">' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">SCO Metric</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Pri</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Current</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Target</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Variance</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Trend</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Source</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Integration</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">DRI</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Freq</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Labor Fulfillment %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + kpiData.labor.fulfillmentRate + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">100%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (kpiData.labor.fulfillmentRate >= 95 ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (kpiData.labor.fulfillmentRate - 100).toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-center">' + (kpiData.labor.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">CM Labor Tracker</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded">csv → Mulesoft</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CM</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Weekly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Campus Readiness On-Time %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">P0</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + kpiData.campus.readiness + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">100%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (kpiData.campus.readiness >= 100 ? 'text-emerald-600' : 'text-amber-600') + ' font-semibold">' + (kpiData.campus.readiness - 100).toFixed(1) + '%</td><td class="p-2.5 border-b border-slate-100 text-center">' + (kpiData.campus.wow >= 0 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">Campus Database</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded">csv → Mulesoft</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded">MO</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Monthly</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">Campus Utilization %</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + kpiData.campus.utilization + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">>' + kpiData.campus.utilizationTarget + '%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (kpiData.campus.utilization >= kpiData.campus.utilizationTarget ? 'text-emerald-600' : 'text-amber-600') + ' font-semibold">' + (kpiData.campus.utilization - kpiData.campus.utilizationTarget).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="text-amber-500">&#9644;</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">Campus Database</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded">csv → Mulesoft</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded">MO</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Monthly</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        // Cost Tab
        '<div id="tab-content-cost" class="hidden">' +
          '<table class="w-full text-xs border-collapse">' +
            '<thead><tr class="bg-red-50/50">' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">SCO Metric</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Pri</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Current</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Target</th>' +
              '<th class="text-right p-2.5 border-b border-slate-200 font-semibold text-slate-600">Variance</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Trend</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Source</th>' +
              '<th class="text-left p-2.5 border-b border-slate-200 font-semibold text-slate-600">Integration</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">DRI</th>' +
              '<th class="text-center p-2.5 border-b border-slate-200 font-semibold text-slate-600">Freq</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">FV Negotiation Rate</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">' + kpiData.fvCost.negotiationRate + '%</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">>20%</td><td class="p-2.5 border-b border-slate-100 text-right ' + (kpiData.fvCost.negotiationRate >= 20 ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + (kpiData.fvCost.negotiationRate - 20).toFixed(1) + 'pp</td><td class="p-2.5 border-b border-slate-100 text-center">' + (kpiData.fvCost.negotiationRate >= 20 ? '<span class="text-emerald-600">&#9650;</span>' : '<span class="text-red-600">&#9660;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">FV Database</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded">csv → Mulesoft</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded">MO</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">By need</td></tr>' +
              '<tr class="hover:bg-slate-50"><td class="p-2.5 border-b border-slate-100 font-medium">FV Cost per Unit</td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">P1</span></td><td class="p-2.5 border-b border-slate-100 text-right font-semibold">$' + kpiData.fvCost.current + '</td><td class="p-2.5 border-b border-slate-100 text-right text-slate-500">$' + kpiData.fvCost.target + '</td><td class="p-2.5 border-b border-slate-100 text-right ' + (kpiData.fvCost.variance <= 0 ? 'text-emerald-600' : 'text-red-600') + ' font-semibold">' + formatPercent(kpiData.fvCost.variance) + '</td><td class="p-2.5 border-b border-slate-100 text-center">' + (kpiData.fvCost.wow <= 0 ? '<span class="text-emerald-600">&#9660;</span>' : '<span class="text-red-600">&#9650;</span>') + '</td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded">FV Database</span></td><td class="p-2.5 border-b border-slate-100"><span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded">csv → Mulesoft</span></td><td class="p-2.5 border-b border-slate-100 text-center"><span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded">MO</span></td><td class="p-2.5 border-b border-slate-100 text-center text-slate-500">Monthly</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Section 7: Execution by Site ──
    '<div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">' +
      '<h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-slate-500"></span>Execution by Site</h3>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' +
        // WF Site
        '<div class="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<div class="text-lg font-bold text-slate-900">WF Site</div>' +
            '<div class="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">Primary</div>' +
          '</div>' +
          '<div class="space-y-3">' +
            '<div>' +
              '<div class="flex items-center justify-between mb-1">' +
                '<span class="text-sm text-slate-600">Output</span>' +
                '<span class="text-base font-bold text-slate-900">' + formatNumber(kpiData.production.wf.current) + ' <span class="text-xs font-normal text-slate-400">/ ' + formatNumber(kpiData.production.wf.target) + '</span></span>' +
              '</div>' +
              '<div class="w-full bg-slate-200 rounded-full h-2"><div class="bg-blue-600 h-2 rounded-full" style="width:' + Math.min(100, kpiData.production.wf.current / kpiData.production.wf.target * 100) + '%"></div></div>' +
            '</div>' +
            '<div class="flex items-center justify-between">' +
              '<span class="text-sm text-slate-600">Yield</span>' +
              '<span class="text-base font-bold ' + (kpiData.production.wf.yield >= 95 ? 'text-emerald-600' : kpiData.production.wf.yield >= 90 ? 'text-amber-600' : 'text-red-600') + '">' + kpiData.production.wf.yield + '%</span>' +
            '</div>' +
            '<div class="flex items-center justify-between">' +
              '<span class="text-sm text-slate-600">Labor Fill</span>' +
              '<span class="text-base font-bold text-slate-900">' + kpiData.labor.wf.fill + '%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // VN02 Site
        '<div class="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-5 border border-emerald-100">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<div class="text-lg font-bold text-slate-900">VN02 Site</div>' +
            '<div class="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">Secondary</div>' +
          '</div>' +
          '<div class="space-y-3">' +
            '<div>' +
              '<div class="flex items-center justify-between mb-1">' +
                '<span class="text-sm text-slate-600">Output</span>' +
                '<span class="text-base font-bold text-slate-900">' + formatNumber(kpiData.production.vn02.current) + ' <span class="text-xs font-normal text-slate-400">/ ' + formatNumber(kpiData.production.vn02.target) + '</span></span>' +
              '</div>' +
              '<div class="w-full bg-slate-200 rounded-full h-2"><div class="bg-emerald-600 h-2 rounded-full" style="width:' + Math.min(100, kpiData.production.vn02.current / kpiData.production.vn02.target * 100) + '%"></div></div>' +
            '</div>' +
            '<div class="flex items-center justify-between">' +
              '<span class="text-sm text-slate-600">Yield</span>' +
              '<span class="text-base font-bold ' + (kpiData.production.vn02.yield >= 95 ? 'text-emerald-600' : kpiData.production.vn02.yield >= 90 ? 'text-amber-600' : 'text-red-600') + '">' + kpiData.production.vn02.yield + '%</span>' +
            '</div>' +
            '<div class="flex items-center justify-between">' +
              '<span class="text-sm text-slate-600">Labor Fill</span>' +
              '<span class="text-base font-bold text-slate-900">' + kpiData.labor.vn02.fill + '%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '</div>';
}

// Helper function for tab switching
function switchMOKpiTab(tabName) {
  ['availability', 'agility', 'delivery', 'readiness', 'cost'].forEach(tab => {
    const btn = document.getElementById(`tab-${tab}`);
    const content = document.getElementById(`tab-content-${tab}`);
    
    if (tab === tabName) {
      btn.className = 'px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600';
      content.classList.remove('hidden');
    } else {
      btn.className = 'px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900';
      content.classList.add('hidden');
    }
  });
}


function renderDataFoundation() {
  console.log('[DataFoundation] renderDataFoundation called, subpage:', STATE.dataFoundationSubpage);
  const content = $("content");

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h1 class="text-2xl font-bold text-slate-900">Data Foundation</h1>
        <p class="text-sm text-slate-600 mt-1">Reference documentation for metrics, data sources, and calculation logic</p>
      </div>

      <!-- Subpage Navigation -->
      <div class="bg-white rounded-xl shadow-sm">
        <div class="border-b border-slate-200">
          <nav class="flex gap-1 px-6" role="tablist">
            <button
              onclick="STATE.dataFoundationSubpage = 'alignedIndex'; render();"
              class="px-4 py-3 text-sm font-medium transition-colors ${STATE.dataFoundationSubpage === 'alignedIndex' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'}"
            >
              Aligned Index
            </button>
            <button
              onclick="STATE.dataFoundationSubpage = 'dataSource'; render();"
              class="px-4 py-3 text-sm font-medium transition-colors ${STATE.dataFoundationSubpage === 'dataSource' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'}"
            >
              Data Source
            </button>
            <button
              onclick="STATE.dataFoundationSubpage = 'productionPlanLogic'; render();"
              class="px-4 py-3 text-sm font-medium transition-colors ${STATE.dataFoundationSubpage === 'productionPlanLogic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'}"
            >
              Production Plan Logic
            </button>
          </nav>
        </div>

        <!-- Subpage Content -->
        <div class="p-6">
          <div id="dataFoundationContent"></div>
        </div>
      </div>
    </div>
  `;

  // Render appropriate subpage (after DOM update)
  setTimeout(() => {
    switch (STATE.dataFoundationSubpage) {
      case 'alignedIndex':
        renderAlignedIndex();
        break;
      case 'dataSource':
        renderDataSource();
        break;
      case 'productionPlanLogic':
        renderProductionPlanLogic();
        break;
      default:
        renderAlignedIndex();
    }
  }, 0);
}

/**
 * Render Aligned Index (Metrics Dictionary)
 */
function renderAlignedIndex() {
  console.log('[DataFoundation] renderAlignedIndex called');
  const content = $("dataFoundationContent");
  console.log('[DataFoundation] dataFoundationContent element:', content);

  const kpiGroups = [
    {
      topline: "Product Availability",
      color: "blue",
      icon: "📦",
      metrics: [
        { priority: "P0", name: "Ex-factory to Supply Commit Attainment %", target: "Per project matrix", calculation: "Weighted (actual ship qty / plan qty) by SKU", source: "CM APS + CM WMS", integration: "APS + ASN", dri: "CM", upload: "System Push / Manual", freq: "Weekly" },
        { priority: "P0", name: "Production Schedule Adherence %", target: "Per project matrix", calculation: "Weighted (actual input qty / plan qty) by SKU", source: "CM APS + CM MES", integration: "APS + QuatumnBridge", dri: "CM", upload: "System Push / Manual", freq: "Weekly" },
        { priority: "P0", name: "Capacity Utilization", target: "≥85%", calculation: "Actual output / Installed output capacity", source: "CM APS + CM MES", integration: "APS + QuatumnBridge", dri: "CM", upload: "System Push / Manual", freq: "Weekly" },
        { priority: "P0", name: "Capacity Shortage %", target: "<5%", calculation: "(ExF Request - Ungated Capacity) / ExF Request", source: "CM APS", integration: "APS", dri: "CM", upload: "System Push / Manual", freq: "Weekly" }
      ]
    },
    {
      topline: "Agility",
      color: "green",
      icon: "⚡",
      metrics: [
        { priority: "P1", name: "Manufacturing Lead Time", target: "Per project matrix", calculation: "Median (Ship date - Input date) for units shipped this week", source: "CM MES", integration: "QuatumnBridge", dri: "CM", upload: "System Push", freq: "Weekly" },
        { priority: "P1", name: "Manufacturing Lead Time Achieve Rate", target: "Per project matrix", calculation: "Units within committed LT / total units produced", source: "CM MES", integration: "QuatumnBridge", dri: "CM", upload: "System Push", freq: "Weekly" }
      ]
    },
    {
      topline: "Timely Delivery",
      color: "purple",
      icon: "🚚",
      metrics: [
        { priority: "P0", name: "BTO/CTO Manufacturing Lead Time", target: "Per project matrix", calculation: "Median (Ship date - Input date) for POs shipped this week", source: "CM MES", integration: "QuatumnBridge", dri: "CM", upload: "System Push", freq: "Weekly" },
        { priority: "P0", name: "BTO/CTO On-Time Ship %", target: "Per project matrix", calculation: "PO qty shipped within committed LT / total PO qty", source: "CM MES", integration: "QuatumnBridge", dri: "CM", upload: "System Push", freq: "Weekly" }
      ]
    },
    {
      topline: "Readiness",
      color: "amber",
      icon: "🏗️",
      metrics: [
        { priority: "P0", name: "Labor Fulfillment %", target: "100%", calculation: "Labor demand qty / actual onboarded labor qty", source: "CM Labor Tracker", integration: "csv → Mulesoft", dri: "CM", upload: "Manual", freq: "Weekly" },
        { priority: "P0", name: "Campus Readiness On-Time %", target: "100%", calculation: "Ok2use campus space & facility / total campus demands", source: "Campus Database", integration: "csv → Mulesoft", dri: "MO", upload: "Manual", freq: "Monthly" },
        { priority: "P1", name: "Campus Utilization %", target: ">80%", calculation: "Line installed space / total reserved space", source: "Campus Database", integration: "csv → Mulesoft", dri: "MO", upload: "Manual", freq: "Monthly" }
      ]
    },
    {
      topline: "Cost",
      color: "red",
      icon: "💰",
      metrics: [
        { priority: "P1", name: "FV Negotiation Rate", target: ">20%", calculation: "Cost Reduction through Negotiation / total validated cost", source: "FV Database", integration: "csv → Mulesoft", dri: "MO", upload: "Manual", freq: "By need" },
        { priority: "P1", name: "Factory Variance Cost per Unit", target: "Per project matrix", calculation: "Total FV cost (incurred + projected) / ExF", source: "FV Database", integration: "csv → Mulesoft", dri: "MO", upload: "Manual", freq: "Monthly" }
      ]
    }
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100 text-blue-900', badge: 'bg-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100 text-green-900', badge: 'bg-green-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100 text-purple-900', badge: 'bg-purple-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100 text-amber-900', badge: 'bg-amber-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100 text-red-900', badge: 'bg-red-600' }
  };

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">SCO KPI Framework</h2>
          <p class="text-sm text-slate-500 mt-0.5">Aligned metrics organized by SCO Topline categories</p>
        </div>
        <div class="flex gap-2">
          <span class="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">P0: Phase 1 Must</span>
          <span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">P1: Phase 1 Enhance</span>
        </div>
      </div>

      ${kpiGroups.map(group => {
        const c = colorMap[group.color];
        return `
        <div class="border ${c.border} rounded-xl overflow-hidden">
          <div class="${c.header} px-4 py-2.5 flex items-center gap-2">
            <span class="text-lg">${group.icon}</span>
            <span class="font-bold text-sm">${group.topline}</span>
            <span class="ml-auto text-xs opacity-70">${group.metrics.length} metrics</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-white/60">
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200 w-10">Pri</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Metric Name</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Target</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Calculation</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Data Source</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Integration</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">DRI</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Upload</th>
                  <th class="text-left font-semibold p-2.5 border-b border-slate-200">Freq</th>
                </tr>
              </thead>
              <tbody>
                ${group.metrics.map(m => `
                  <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                    <td class="p-2.5 align-top"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${m.priority === 'P0' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}">${m.priority}</span></td>
                    <td class="p-2.5 font-medium text-slate-800 align-top">${m.name}</td>
                    <td class="p-2.5 text-slate-600 align-top whitespace-nowrap">${m.target}</td>
                    <td class="p-2.5 text-slate-600 align-top">${m.calculation}</td>
                    <td class="p-2.5 align-top"><span class="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium">${m.source}</span></td>
                    <td class="p-2.5 align-top"><span class="px-1.5 py-0.5 ${m.integration.includes('csv') ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'} rounded text-[10px] font-medium">${m.integration}</span></td>
                    <td class="p-2.5 align-top"><span class="px-1.5 py-0.5 ${m.dri === 'CM' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'} rounded text-[10px] font-bold">${m.dri}</span></td>
                    <td class="p-2.5 align-top text-slate-500">${m.upload}</td>
                    <td class="p-2.5 align-top text-slate-500 whitespace-nowrap">${m.freq}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      }).join('')}

      <div class="grid grid-cols-3 gap-3 mt-4">
        <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <div class="text-lg font-bold text-green-700">Tier 1</div>
          <div class="text-xs text-green-600 mt-1">System Push</div>
          <div class="text-[10px] text-slate-500 mt-0.5">CM APS / MES / WMS</div>
        </div>
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <div class="text-lg font-bold text-amber-700">Tier 2</div>
          <div class="text-xs text-amber-600 mt-1">csv → Mulesoft</div>
          <div class="text-[10px] text-slate-500 mt-0.5">Labor / Campus / FV</div>
        </div>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div class="text-lg font-bold text-slate-700">Tier 3</div>
          <div class="text-xs text-slate-600 mt-1">Manual Upload</div>
          <div class="text-[10px] text-slate-500 mt-0.5">Excel → FDOS</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Data Source mapping
 */
function renderDataSource() {
  const content = $("dataFoundationContent");

  const systems = [
    {
      id: "S1", name: "CM APS", desc: "Production planning & scheduling",
      path: "CM APS → APS integration → FDOS", tier: 1, tierLabel: "System Push",
      kpis: ["Commit Attainment", "Schedule Adherence", "Capacity Utilization", "Capacity Shortage"],
      dri: "CM", freq: "Weekly", status: "ready"
    },
    {
      id: "S2", name: "CM MES", desc: "Manufacturing execution & tracking",
      path: "CM MES → QuatumnBridge → FDOS", tier: 1, tierLabel: "System Push",
      kpis: ["Mfg Lead Time", "LT Achieve Rate", "BTO/CTO LT", "On-Time Ship"],
      dri: "CM", freq: "Daily", status: "ready"
    },
    {
      id: "S3", name: "CM WMS", desc: "Warehouse & shipment management",
      path: "CM WMS → ASN → FDOS", tier: 1, tierLabel: "System Push",
      kpis: ["Ex-factory Shipment Actual"],
      dri: "CM", freq: "Daily", status: "ready"
    },
    {
      id: "S4", name: "CM Labor Tracker", desc: "Workforce management",
      path: "csv → Mulesoft → FDOS", tier: 2, tierLabel: "Manual csv",
      kpis: ["Labor Fulfillment"],
      dri: "CM", freq: "Weekly", status: "manual"
    },
    {
      id: "S5", name: "Campus Database", desc: "Facility & space management",
      path: "csv → Mulesoft → FDOS", tier: 2, tierLabel: "Manual csv",
      kpis: ["Campus Readiness", "Campus Utilization"],
      dri: "MO", freq: "Monthly", status: "manual"
    },
    {
      id: "S6", name: "FV Database", desc: "Factory variance cost tracking",
      path: "csv → Mulesoft → FDOS", tier: 2, tierLabel: "Manual csv",
      kpis: ["FV Negotiation Rate", "FV Cost per Unit"],
      dri: "MO", freq: "Weekly-Monthly", status: "manual"
    }
  ];

  const tierColors = {
    1: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    2: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
  };

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Data Source & Integration Map</h2>
          <p class="text-sm text-slate-500 mt-0.5">Real integration paths from CM systems to FDOS</p>
        </div>
      </div>

      <!-- Integration Pipeline Diagram -->
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div class="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Data Pipeline Architecture</div>
        <div class="flex items-center justify-between text-xs">
          <div class="flex-1 text-center">
            <div class="bg-purple-100 border border-purple-300 rounded-lg p-3 mx-2">
              <div class="font-bold text-purple-800">CM Systems</div>
              <div class="text-purple-600 mt-1">APS / MES / WMS<br/>Labor / Campus / FV</div>
            </div>
          </div>
          <div class="text-slate-400 text-lg">→</div>
          <div class="flex-1 text-center">
            <div class="bg-blue-100 border border-blue-300 rounded-lg p-3 mx-2">
              <div class="font-bold text-blue-800">Integration Layer</div>
              <div class="text-blue-600 mt-1">APS / QuatumnBridge<br/>ASN / Mulesoft</div>
            </div>
          </div>
          <div class="text-slate-400 text-lg">→</div>
          <div class="flex-1 text-center">
            <div class="bg-green-100 border border-green-300 rounded-lg p-3 mx-2">
              <div class="font-bold text-green-800">FDOS</div>
              <div class="text-green-600 mt-1">Validation → Calculation<br/>→ Dashboard / Alert</div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Cards -->
      <div class="space-y-3">
        ${systems.map(sys => {
          const tc = tierColors[sys.tier];
          return `
          <div class="border ${tc.border} rounded-xl overflow-hidden">
            <div class="${tc.bg} px-4 py-3 flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg ${tc.badge} flex items-center justify-center text-xs font-bold">${sys.id}</span>
              <div class="flex-1">
                <div class="font-bold text-sm text-slate-800">${sys.name}</div>
                <div class="text-xs text-slate-500">${sys.desc}</div>
              </div>
              <span class="px-2 py-1 ${tc.badge} rounded-full text-[10px] font-bold">Tier ${sys.tier} · ${sys.tierLabel}</span>
              <span class="px-2 py-1 ${sys.dri === 'CM' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'} rounded-full text-[10px] font-bold">DRI: ${sys.dri}</span>
            </div>
            <div class="px-4 py-3 bg-white/80">
              <div class="flex items-center gap-6 text-xs">
                <div>
                  <span class="text-slate-400">Path:</span>
                  <span class="ml-1 font-mono text-slate-700">${sys.path}</span>
                </div>
                <div>
                  <span class="text-slate-400">Freq:</span>
                  <span class="ml-1 font-semibold text-slate-700">${sys.freq}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-1.5 mt-2">
                ${sys.kpis.map(k => `<span class="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600">${k}</span>`).join('')}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- KPI Input Parameter Detail Table -->
      <div class="border border-slate-200 rounded-xl overflow-hidden">
        <div class="bg-slate-100 px-4 py-2.5 font-bold text-sm text-slate-700">KPI Input Parameters Detail</div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50">
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">KPI</th>
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">Input Parameter</th>
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">Source System</th>
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">Integration</th>
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">DRI</th>
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">Upload Mode</th>
                <th class="text-left font-semibold p-2.5 border-b border-slate-200">Refresh</th>
              </tr>
            </thead>
            <tbody>
              ${[
                { kpi: 'Commit Attainment %', param: 'Actual Ship Qty', src: 'CM WMS', intg: 'ASN', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: '', param: 'Plan Qty (by SKU)', src: 'CM APS', intg: 'APS', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: 'Schedule Adherence %', param: 'Actual Input Qty', src: 'CM MES', intg: 'QuatumnBridge', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: '', param: 'Plan Input Qty', src: 'CM APS', intg: 'APS', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: 'Capacity Utilization', param: 'Actual Output', src: 'CM MES', intg: 'QuatumnBridge', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: '', param: 'Installed Capacity', src: 'CM APS', intg: 'APS', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: 'Capacity Shortage %', param: 'ExF Request', src: 'CM APS', intg: 'APS', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: '', param: 'Ungated Capacity', src: 'CM APS', intg: 'APS', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: 'Mfg Lead Time', param: 'Ship Date/Time', src: 'CM MES', intg: 'QuatumnBridge', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: '', param: 'Input Date/Time', src: 'CM MES', intg: 'QuatumnBridge', dri: 'CM', mode: 'System Push', freq: 'Weekly' },
                { kpi: 'Labor Fulfillment %', param: 'Labor Demand Qty', src: 'CM Labor Tracker', intg: 'csv → Mulesoft', dri: 'CM', mode: 'Manual', freq: 'Weekly' },
                { kpi: '', param: 'Onboarded Labor Qty', src: 'CM Labor Tracker', intg: 'csv → Mulesoft', dri: 'CM', mode: 'Manual', freq: 'Weekly' },
                { kpi: 'Campus Readiness %', param: 'Campus Space Demand', src: 'Campus Database', intg: 'csv → Mulesoft', dri: 'MO', mode: 'Manual', freq: 'Monthly' },
                { kpi: '', param: 'Campus Space Available', src: 'Campus Database', intg: 'csv → Mulesoft', dri: 'MO', mode: 'Manual', freq: 'Monthly' },
                { kpi: 'FV Cost per Unit', param: 'Incurred FV Cost', src: 'FV Database', intg: 'csv → Mulesoft', dri: 'MO', mode: 'Manual', freq: 'Weekly' },
                { kpi: '', param: 'Projected FV Cost', src: 'FV Database', intg: 'csv → Mulesoft', dri: 'MO', mode: 'Manual', freq: 'Weekly' }
              ].map(row => `
                <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                  <td class="p-2.5 font-medium text-slate-800 align-top">${row.kpi}</td>
                  <td class="p-2.5 text-slate-600">${row.param}</td>
                  <td class="p-2.5"><span class="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">${row.src}</span></td>
                  <td class="p-2.5"><span class="px-1.5 py-0.5 ${row.intg.includes('csv') ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'} rounded text-[10px]">${row.intg}</span></td>
                  <td class="p-2.5"><span class="px-1.5 py-0.5 ${row.dri === 'CM' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'} rounded text-[10px] font-bold">${row.dri}</span></td>
                  <td class="p-2.5 text-slate-500">${row.mode}</td>
                  <td class="p-2.5 text-slate-500">${row.freq}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 class="font-semibold text-blue-900 mb-2 text-sm">Integration Readiness Summary</h3>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span><strong>Tier 1 (System Push):</strong> CM APS, CM MES, CM WMS — existing integrations, need FDOS connector</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong>Tier 2 (Manual csv):</strong> Labor Tracker, Campus DB, FV DB — csv upload via Mulesoft</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render White Paper (Global Page)
 */
function renderWhitePaper() {
  const content = $("content");

  content.innerHTML = `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Demo Notes -->
      <div class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="text-2xl">📝</div>
          <div>
            <div class="font-bold text-amber-900 mb-2">DEMO NOTES</div>
            <ul class="text-sm text-amber-800 space-y-1.5">
              <li class="flex items-start gap-2">
                <span class="text-amber-600 mt-0.5">•</span>
                <span>Delivery-first decision prototype with mocked data.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-600 mt-0.5">•</span>
                <span>Primary goal: protect weekly commit while avoiding avoidable overbuild.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-600 mt-0.5">•</span>
                <span>Use Simulation mode to test pacing trade-offs.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Executive Summary -->
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8 hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
          <h2 class="text-2xl font-bold text-slate-900">Executive Summary</h2>
        </div>
        <div class="prose prose-slate prose-lg max-w-none space-y-4">
          <p class="text-slate-700 leading-relaxed">
            <strong class="text-slate-900">Enterprise Decision Operations (EDO)</strong> is an integrated internal decision support system designed to transform how our organization manages manufacturing operations and supply chain execution. Built on the foundation of Manufacturing Operations (MO) expertise, this platform addresses critical operational challenges through systematic data integration, standardization, and intelligent automation.
          </p>
          <p class="text-slate-700 leading-relaxed">
            This system serves multiple interconnected purposes: it automates external data integration from contract manufacturers and suppliers, standardizes metrics and indices across the organization to ensure data integrity, and completes the supply chain decision loop by connecting planning, execution, and performance monitoring in a unified environment.
          </p>
          <p class="text-slate-700 leading-relaxed">
            Beyond operational efficiency, EDO represents our evolution toward intelligent workflow reconstruction. By consolidating critical operational data, key performance indicators (KPI), and decision support tools in one platform, we establish a comprehensive knowledge base that reduces manual work, enables AI-powered analysis and recommendations, and supports faster, data-driven decision-making across the manufacturing supply chain.
          </p>
        </div>
      </div>

      <!-- Core Objectives -->
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8 hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🎯</div>
          <h2 class="text-2xl font-bold text-slate-900">Core Objectives</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="group bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">🔗</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                External Data Integration & Automation
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Automate data collection from contract manufacturers, suppliers, and logistics partners. Eliminate manual data entry and email-based processes, establishing real-time or near-real-time data pipelines through API integration and system connections.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-green-50 to-white border-2 border-green-100 rounded-xl p-6 hover:shadow-xl hover:border-green-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">📊</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                Data & Index Standardization
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Establish unified definitions for operational metrics, KPIs, and indices across all programs and sites. Ensure data integrity, consistency, and reliability through standardized calculation logic and validation rules.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-xl p-6 hover:shadow-xl hover:border-purple-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">🔄</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                Supply Chain Decision Loop
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Complete the closed-loop system connecting demand forecasting, production planning, execution monitoring, shipment tracking, and performance analysis. Enable proactive decision-making through real-time visibility and constraint identification.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 rounded-xl p-6 hover:shadow-xl hover:border-orange-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">📈</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                KPI Visualization & Performance Monitoring
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Provide intuitive, role-based dashboards presenting critical operational data and KPIs. Enable stakeholders at all levels to access relevant metrics, identify trends, and monitor performance against targets in real-time.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">⚡</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                Intelligent Workflow Reconstruction
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Evolve beyond traditional MO processes by embedding intelligence into daily workflows. Automate routine tasks, standardize decision frameworks, and free team members to focus on strategic problem-solving and continuous improvement.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-pink-50 to-white border-2 border-pink-100 rounded-xl p-6 hover:shadow-xl hover:border-pink-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">🤖</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                AI-Powered Analysis & Recommendations
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Leverage AI capabilities to analyze operational data, identify patterns and anomalies, generate actionable recommendations, and suggest specific actions. Support decision-makers with data-driven insights and predictive analytics.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-teal-50 to-white border-2 border-teal-100 rounded-xl p-6 hover:shadow-xl hover:border-teal-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">💬</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                Knowledge Base & Chatbot Assistant
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Build an organizational knowledge repository accessible through natural language queries. Enable team members to quickly retrieve data, understand metrics, and access historical context without navigating multiple systems or files.
            </p>
          </div>

          <div class="group bg-gradient-to-br from-red-50 to-white border-2 border-red-100 rounded-xl p-6 hover:shadow-xl hover:border-red-300 transition-all hover:-translate-y-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-3xl">⚙️</div>
              <h3 class="font-bold text-slate-900 text-lg leading-tight mt-1">
                System-Based Work Management
              </h3>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">
              Transform manual, ad-hoc processes into systematic, repeatable workflows managed through the platform. Reduce manual effort, minimize errors, and ensure consistency in operational execution and reporting.
            </p>
          </div>
        </div>
      </div>

      <!-- Development Phases -->
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8 hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🚀</div>
          <h2 class="text-2xl font-bold text-slate-900">Development Phases</h2>
        </div>
        <div class="space-y-4">
          <!-- Phase 1 -->
          <div class="border-l-4 border-blue-500 pl-4 py-2">
            <h3 class="font-semibold text-slate-900 mb-2">Phase 1: Foundation & Core Capabilities</h3>
            <p class="text-sm text-slate-600 mb-3">
              Establish the fundamental system architecture, data models, and core operational modules. Focus on manual data input with standardized templates and calculation engines.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="bg-blue-50 rounded p-3">
                <div class="font-medium text-blue-900 mb-1">Delivery Command Center</div>
                <div class="text-blue-700">Weekly shipment tracking, demand attainment monitoring, gap analysis, constraint identification</div>
              </div>
              <div class="bg-blue-50 rounded p-3">
                <div class="font-medium text-blue-900 mb-1">Production Plan Engine</div>
                <div class="text-blue-700">Site-level capacity planning, input/output modeling, ramp curve simulation, scenario analysis</div>
              </div>
              <div class="bg-blue-50 rounded p-3">
                <div class="font-medium text-blue-900 mb-1">Decision Center Overview</div>
                <div class="text-blue-700">Multi-program aggregation, cross-site visibility, executive summary dashboards</div>
              </div>
              <div class="bg-blue-50 rounded p-3">
                <div class="font-medium text-blue-900 mb-1">Data Foundation</div>
                <div class="text-blue-700">Aligned index definitions, data source mapping, calculation logic documentation</div>
              </div>
            </div>
          </div>

          <!-- Phase 2 -->
          <div class="border-l-4 border-green-500 pl-4 py-2">
            <h3 class="font-semibold text-slate-900 mb-2">Phase 2: External Integration & Automation</h3>
            <p class="text-sm text-slate-600 mb-3">
              Connect with external systems to automate data collection and reduce manual input. Establish API integrations with contract manufacturers, suppliers, and logistics providers.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="bg-green-50 rounded p-3">
                <div class="font-medium text-green-900 mb-1">CM/Supplier API Integration</div>
                <div class="text-green-700">Real-time production data, shipment updates, material availability from WMS/ERP/MES systems</div>
              </div>
              <div class="bg-green-50 rounded p-3">
                <div class="font-medium text-green-900 mb-1">Logistics Integration</div>
                <div class="text-green-700">Shipment tracking, delivery confirmation, transit visibility from 3PL systems</div>
              </div>
              <div class="bg-green-50 rounded p-3">
                <div class="font-medium text-green-900 mb-1">Automated Data Validation</div>
                <div class="text-green-700">Real-time data quality checks, anomaly detection, automatic reconciliation</div>
              </div>
              <div class="bg-green-50 rounded p-3">
                <div class="font-medium text-green-900 mb-1">Alert & Notification System</div>
                <div class="text-green-700">Proactive alerts for constraint triggers, delivery risks, performance deviations</div>
              </div>
            </div>
          </div>

          <!-- Phase 3 -->
          <div class="border-l-4 border-purple-500 pl-4 py-2">
            <h3 class="font-semibold text-slate-900 mb-2">Phase 3: Intelligence & Advanced Analytics</h3>
            <p class="text-sm text-slate-600 mb-3">
              Embed AI capabilities for predictive analytics, automated recommendations, and natural language interaction. Transform from reactive monitoring to proactive optimization.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="bg-purple-50 rounded p-3">
                <div class="font-medium text-purple-900 mb-1">AI Chatbot Assistant</div>
                <div class="text-purple-700">Natural language data queries, metric explanations, historical context retrieval</div>
              </div>
              <div class="bg-purple-50 rounded p-3">
                <div class="font-medium text-purple-900 mb-1">Predictive Analytics</div>
                <div class="text-purple-700">Demand forecasting, constraint prediction, delivery risk scoring, capacity optimization</div>
              </div>
              <div class="bg-purple-50 rounded p-3">
                <div class="font-medium text-purple-900 mb-1">Automated Recommendations</div>
                <div class="text-purple-700">Action suggestions for constraint mitigation, resource allocation, expedite decisions</div>
              </div>
              <div class="bg-purple-50 rounded p-3">
                <div class="font-medium text-purple-900 mb-1">Knowledge Base</div>
                <div class="text-purple-700">Searchable repository of decisions, issue resolutions, best practices, lessons learned</div>
              </div>
            </div>
          </div>

          <!-- Phase 4 -->
          <div class="border-l-4 border-orange-500 pl-4 py-2">
            <h3 class="font-semibold text-slate-900 mb-2">Phase 4: Ecosystem Expansion & Optimization</h3>
            <p class="text-sm text-slate-600 mb-3">
              Extend system capabilities to adjacent processes, establish advanced collaboration tools, and implement continuous optimization mechanisms.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="bg-orange-50 rounded p-3">
                <div class="font-medium text-orange-900 mb-1">Upstream Planning Integration</div>
                <div class="text-orange-700">Demand planning sync, S&OP integration, forecast accuracy tracking</div>
              </div>
              <div class="bg-orange-50 rounded p-3">
                <div class="font-medium text-orange-900 mb-1">Quality & Yield Analytics</div>
                <div class="text-orange-700">Defect tracking, yield analysis, root cause identification, continuous improvement</div>
              </div>
              <div class="bg-orange-50 rounded p-3">
                <div class="font-medium text-orange-900 mb-1">Collaboration Platform</div>
                <div class="text-orange-700">Cross-functional issue tracking, decision documentation, stakeholder communication</div>
              </div>
              <div class="bg-orange-50 rounded p-3">
                <div class="font-medium text-orange-900 mb-1">Advanced Simulation</div>
                <div class="text-orange-700">What-if scenario modeling, optimization algorithms, capacity balancing tools</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Roadmap & Timeline -->
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8 hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">📅</div>
          <h2 class="text-2xl font-bold text-slate-900">Roadmap & Timeline</h2>
        </div>
        <div class="relative">
          <!-- Timeline Line -->
          <div class="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-green-500 via-purple-500 to-orange-500"></div>

          <!-- Timeline Items -->
          <div class="space-y-6">
            <!-- Q1 2026 -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                Q1
              </div>
              <div class="flex-grow pt-2">
                <h3 class="font-semibold text-slate-900 mb-1">Q1 2026: Foundation Launch</h3>
                <p class="text-sm text-slate-600 mb-2">Complete Phase 1 core modules with manual data input capabilities</p>
                <div class="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 inline-block">Jan - Mar 2026</div>
              </div>
            </div>

            <!-- Q2 2026 -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                Q2
              </div>
              <div class="flex-grow pt-2">
                <h3 class="font-semibold text-slate-900 mb-1">Q2 2026: Integration Pilot</h3>
                <p class="text-sm text-slate-600 mb-2">Begin Phase 2 with pilot API integrations for 1-2 key contract manufacturers</p>
                <div class="text-xs text-green-700 bg-green-50 rounded px-2 py-1 inline-block">Apr - Jun 2026</div>
              </div>
            </div>

            <!-- Q3 2026 -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                Q3
              </div>
              <div class="flex-grow pt-2">
                <h3 class="font-semibold text-slate-900 mb-1">Q3 2026: Integration Expansion</h3>
                <p class="text-sm text-slate-600 mb-2">Scale Phase 2 integrations across all major suppliers</p>
                <div class="text-xs text-green-700 bg-green-50 rounded px-2 py-1 inline-block">Jul - Sep 2026</div>
              </div>
            </div>

            <!-- Q4 2026 -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                Q4
              </div>
              <div class="flex-grow pt-2">
                <h3 class="font-semibold text-slate-900 mb-1">Q4 2026: AI Foundation</h3>
                <p class="text-sm text-slate-600 mb-2">Launch Phase 3 with AI chatbot assistant and initial predictive analytics capabilities</p>
                <div class="text-xs text-purple-700 bg-purple-50 rounded px-2 py-1 inline-block">Oct - Dec 2026</div>
              </div>
            </div>

            <!-- 2027 -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-10">
                2027
              </div>
              <div class="flex-grow pt-2">
                <h3 class="font-semibold text-slate-900 mb-1">2027: Intelligence & Ecosystem</h3>
                <p class="text-sm text-slate-600 mb-2">Complete Phase 3 AI capabilities and initiate Phase 4 ecosystem expansion</p>
                <div class="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 inline-block">Jan - Dec 2027</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Success Metrics -->
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8 hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
          <h2 class="text-2xl font-bold text-slate-900">Key Success Metrics</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all">
            <div class="text-3xl mb-3">📉</div>
            <div class="text-base font-bold text-slate-900 mb-2">Manual Work Reduction</div>
            <div class="text-sm text-slate-600 leading-relaxed">Measure reduction in repetitive data collection and reporting tasks through automation</div>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-white border-2 border-green-100 rounded-xl p-5 hover:shadow-md hover:border-green-200 transition-all">
            <div class="text-3xl mb-3">✓</div>
            <div class="text-base font-bold text-slate-900 mb-2">Data Accuracy</div>
            <div class="text-sm text-slate-600 leading-relaxed">Track data integrity improvement through standardized processes and validation</div>
          </div>
          <div class="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all">
            <div class="text-3xl mb-3">⚡</div>
            <div class="text-base font-bold text-slate-900 mb-2">Decision Speed</div>
            <div class="text-sm text-slate-600 leading-relaxed">Monitor acceleration in decision-making through real-time visibility and AI insights</div>
          </div>
          <div class="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 rounded-xl p-5 hover:shadow-md hover:border-orange-200 transition-all">
            <div class="text-3xl mb-3">🔄</div>
            <div class="text-base font-bold text-slate-900 mb-2">Process Standardization</div>
            <div class="text-sm text-slate-600 leading-relaxed">Measure adoption of unified metrics and workflows across all programs and sites</div>
          </div>
          <div class="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all">
            <div class="text-3xl mb-3">👁️</div>
            <div class="text-base font-bold text-slate-900 mb-2">Data Visibility</div>
            <div class="text-sm text-slate-600 leading-relaxed">Track transition from periodic reports to continuous operational monitoring</div>
          </div>
          <div class="bg-gradient-to-br from-teal-50 to-white border-2 border-teal-100 rounded-xl p-5 hover:shadow-md hover:border-teal-200 transition-all">
            <div class="text-3xl mb-3">💬</div>
            <div class="text-base font-bold text-slate-900 mb-2">Knowledge Access</div>
            <div class="text-sm text-slate-600 leading-relaxed">Monitor usage of on-demand information retrieval through AI chatbot assistant</div>
          </div>
        </div>
      </div>

      <!-- Conclusion -->
      <div class="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 border-2 border-purple-200">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">💡</div>
          <h2 class="text-2xl font-bold text-slate-900">Looking Forward</h2>
        </div>
        <div class="prose prose-slate prose-lg max-w-none space-y-4">
          <p class="text-slate-800 leading-relaxed font-medium">
            <strong class="text-slate-900">Enterprise Decision Operations</strong> represents more than a technology implementation—it is a fundamental transformation in how we approach manufacturing operations management. By systematically building capabilities across data integration, standardization, intelligence, and automation, we create a sustainable competitive advantage rooted in operational excellence and informed decision-making.
          </p>
          <p class="text-slate-800 leading-relaxed">
            This platform leverages our deep Manufacturing Operations expertise while positioning us at the forefront of intelligent supply chain management. As we progress through each development phase, we will continuously refine and expand capabilities based on real-world operational needs, user feedback, and emerging technology opportunities.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Team AI Strategy (Global Page - Localhost only)
 */
function renderTeamAIStrategy() {
  const content = $("content");

  content.innerHTML = `
    <!-- Page Header -->
    <div class="max-w-7xl mx-auto mb-8">
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-2">MO 2026 Team AI Strategy</h1>
            <p class="text-lg text-indigo-100">Standardization → Prompt Enablement → Workflow-oriented Augmentation</p>
          </div>
          <div class="text-6xl opacity-20">🤖</div>
        </div>
      </div>
    </div>

    <div class="flex gap-8 max-w-7xl mx-auto">
      <!-- Left Navigation -->
      <nav class="w-64 flex-shrink-0">
        <div class="sticky top-4 bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contents</h3>
          <ul class="space-y-1 text-sm">
            <li><a href="#executive-summary" class="nav-link block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Executive Summary</a></li>
            <li><a href="#ops-work-system" class="nav-link block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Ops Work System Overview</a></li>
            <li><a href="#ops-workflow" class="nav-link block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Ops Workflow & Challenges</a></li>
            <li><a href="#systemic-friction" class="nav-link block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Systemic Friction Patterns</a></li>
            <li><a href="#enablement-layers" class="nav-link block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">From Friction to Enablement</a></li>
            <li><a href="#execution-plan" class="nav-link block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Execution Plan</a></li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="flex-1 space-y-6">
        <!-- 1. Executive Summary -->
        <div id="executive-summary" class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
          <h2 class="text-2xl font-bold text-slate-900">Executive Summary</h2>
        </div>
        <div class="space-y-5">
          <!-- Context -->
          <div>
            <p class="text-slate-700 leading-relaxed">
              We operate in a highly dynamic Operations / Delivery environment, working closely with Contract Manufacturers to ensure factory readiness and sustained execution across the product lifecycle — from NPI and ramp, through mass production, to ongoing changes and end-of-life transitions.
            </p>
            <p class="text-slate-700 leading-relaxed mt-3">
              Our work depends on continuously translating evolving operational information into actionable outputs for different execution rhythms and audiences.
            </p>
          </div>

          <!-- Why change is needed -->
          <div>
            <h3 class="font-bold text-slate-900 mb-2">Why change is needed</h3>
            <p class="text-slate-700 leading-relaxed mb-3">
              AI capabilities have now matured to a point where a significant portion of repetitive, manual work — such as data extraction, restructuring, comparison, and first-draft preparation — can be handled more effectively by machines. Continuing to rely on manual effort for these activities limits how much time teams can spend on higher-value problem solving.
            </p>
            <p class="text-slate-700 leading-relaxed">
              At the same time, increased AI adoption is becoming an explicit organizational direction, requiring teams not just to experiment with tools, but to apply AI in a scalable, governed, and repeatable way.
              From both an organizational and individual perspective, AI represents a productivity shift. Adapting how work is performed is necessary to sustain competitiveness, resilience under change, and execution quality over time.
            </p>
          </div>

          <!-- Our approach and strategy -->
          <div>
            <h3 class="font-bold text-slate-900 mb-2">Our approach and strategy</h3>
            <p class="text-slate-700 leading-relaxed mb-3">
              So we intend to use AI as a force multiplier — not to replace existing systems, but to improve how operational work is defined, translated, and executed within compliance boundaries and current tool ecosystems.
            </p>
            <p class="text-slate-700 leading-relaxed mb-3">
              To do this in a sustainable and scalable way, our Team AI Application Strategy follows a layered progression:
            </p>
            <div class="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border-l-4 border-indigo-500 rounded p-4 mb-3">
              <p class="font-semibold text-slate-900">
                Standardization → Prompt Enablement → Workflow-oriented Augmentation
              </p>
            </div>
            <ul class="space-y-2 text-sm text-slate-700 mb-3 ml-4">
              <li>• <strong>Standardization</strong> establishes shared definitions, structures, and sources of truth across the team</li>
              <li>• <strong>Prompt Enablement</strong> translates that standardized work into AI-readable instructions and repeatable outputs</li>
              <li>• <strong>Workflow-oriented Augmentation</strong> selectively connects high-impact segments into assisted or automated flows</li>
            </ul>
            <p class="text-slate-700 leading-relaxed mb-3">
              Rather than attempting to apply AI across all workflows at once, this progression allows us to first build a stable baseline, and then incrementally augment execution where value and readiness are clear.
            </p>
            <p class="text-slate-700 leading-relaxed mb-3">
              In practice, we anchor this progression on Team OKR Metrics as the first execution entry point, grounding the strategy in a concrete, high-impact operational domain.
            </p>
            <p class="text-slate-700 leading-relaxed">
              This approach strengthens execution resilience, improves agility in responding to change, and increases accuracy and consistency — while remaining controlled, compatible, and scalable.
            </p>
          </div>
        </div>
      </div>

        <!-- 2. Ops Work System Overview -->
        <div id="ops-work-system" class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🏗️</div>
          <h2 class="text-2xl font-bold text-slate-900">Ops Work System Overview</h2>
        </div>

        <p class="text-slate-700 leading-relaxed mb-6">
          Our operations work spans two distinct but tightly interconnected work streams:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Work Stream 1: Project Lifecycle Execution -->
          <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">📊</span>
              <h3 class="font-bold text-blue-900">Work Stream 1: Project Lifecycle Execution</h3>
            </div>
            <p class="text-sm text-blue-700 mb-3 italic">Stage-driven execution across the product lifecycle</p>
            <ul class="space-y-1 text-sm text-blue-800">
              <li>• CM Selection</li>
              <li>• NPI – Factory Readiness</li>
              <li>• PVT / Ramp Execution</li>
              <li>• Sustaining & Change Management</li>
              <li>• EOM Planning</li>
            </ul>
          </div>

          <!-- Work Stream 2: Operating Cadence -->
          <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">⏱️</span>
              <h3 class="font-bold text-green-900">Work Stream 2: Operating Cadence</h3>
            </div>
            <p class="text-sm text-green-700 mb-3 italic">Execution rhythms independent of project stage</p>
            <ul class="space-y-1 text-sm text-green-800">
              <li>• Daily Execution & Coordination</li>
              <li>• Weekly Alignment & Reviews</li>
              <li>• Monthly Performance Tracking</li>
              <li>• Semi-annual Performance Assessment</li>
            </ul>
          </div>
        </div>

        <!-- Key Insight -->
        <div class="bg-gradient-to-r from-slate-50 to-slate-100 border-l-4 border-slate-500 rounded-lg p-5">
          <p class="text-slate-800 font-medium italic">
            Ops work focuses on <strong>translating evolving operational information</strong> into clear, actionable views across different project stages and operating rhythms, <strong>tailored to the needs of different audiences</strong>.
          </p>
        </div>
      </div>

        <!-- 3. Ops Workflow & Challenges -->
        <div id="ops-workflow" class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">🔄</div>
          <h2 class="text-2xl font-bold text-slate-900">Ops Workflow & Challenges</h2>
        </div>

        <p class="text-sm text-slate-600 mb-6 italic">
          Our work spans two work streams: project-driven stages and regular team/individual rhythms. Below are the key activities and challenges in each.
        </p>

        <!-- A. Project-based Workflow (Stage-driven) -->
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
            <h3 class="text-lg font-bold text-blue-900">Project-based Workflow</h3>
            <span class="text-sm text-slate-500">(Stage-driven activities across product lifecycle)</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gradient-to-r from-blue-50 to-blue-100">
                  <th class="px-5 py-4 text-left font-semibold text-blue-900 border-b-2 border-blue-300">Stage</th>
                  <th class="px-5 py-4 text-left font-semibold text-blue-900 border-b-2 border-blue-300">Key Activities</th>
                  <th class="px-5 py-4 text-left font-semibold text-blue-900 border-b-2 border-blue-300">Key Challenges</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-blue-100">
                <tr class="hover:bg-blue-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">CM Selection</td>
                  <td class="px-5 py-4 text-slate-700">Participate in CM evaluation & audit, capacity & risk assessment, selection criteria development</td>
                  <td class="px-5 py-4 text-red-700">Evaluation and audit observations are largely experience-driven and subjective; lack of standardized criteria or scoring framework by supplier type, geography, or product scope; difficult to systematically demonstrate team expertise and consistency across suppliers; individual experience is valuable but inherently partial and non-scalable</td>
                </tr>
                <tr class="hover:bg-blue-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">NPI - Factory Readiness</td>
                  <td class="px-5 py-4 text-slate-700">Facility & operator readiness coordination, capacity planning, proto/EVT/DVT support, launch timeline alignment</td>
                  <td class="px-5 py-4 text-red-700">High explanation cost across functions; readiness status updates require constant reformatting</td>
                </tr>
                <tr class="hover:bg-blue-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900 bg-amber-50">PVT/RAMP</td>
                  <td class="px-5 py-4 text-slate-700 bg-amber-50">
                    <strong>Daily execution monitoring</strong>, daily stand-ups (morning/evening), daily status reports,
                    production plan generation, CTB constraint analysis, multi-scenario simulation, blocker escalation
                  </td>
                  <td class="px-5 py-4 text-red-700 bg-amber-50">Plan versions change frequently as constraints, demand, and readiness evolve; evolving operational information needs to be reformatted repeatedly for different meetings and reports; multi-scenario simulations expand quickly, increasing cognitive and preparation load; high coordination cost to keep narratives aligned across stakeholders</td>
                </tr>
                <tr class="hover:bg-blue-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">Sustaining + EOM</td>
                  <td class="px-5 py-4 text-slate-700">Weekly sustaining reviews, PPR reviews, production/inventory monitoring, change review & validation,
                  liability control, stakeholder alignment, EOM transition planning</td>
                  <td class="px-5 py-4 text-red-700">Change impact assessment relies heavily on individual experience; EOM planning requires extensive historical data aggregation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- B. Cadence-based Workflow (Rhythm-driven) -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
            <h3 class="text-lg font-bold text-green-900">Cadence-based Workflow</h3>
            <span class="text-sm text-slate-500">(Fixed-rhythm team/individual work independent of project stage)</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gradient-to-r from-green-50 to-green-100">
                  <th class="px-5 py-4 text-left font-semibold text-green-900 border-b-2 border-green-300">Cadence</th>
                  <th class="px-5 py-4 text-left font-semibold text-green-900 border-b-2 border-green-300">Key Activities</th>
                  <th class="px-5 py-4 text-left font-semibold text-green-900 border-b-2 border-green-300">Key Challenges</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-green-100">
                <tr class="hover:bg-green-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">Daily</td>
                  <td class="px-5 py-4 text-slate-700">Ongoing project discussions and ad-hoc meetings; rapid issue triage, blocker clarification, and decision follow-ups; during PVT/RAMP: BOD (beginning of day) and EOD (end of day) alignment sessions with suppliers and internal XFN; daily status reports; processing fragmented inputs from multiple channels (meetings, messages, emails, docs)</td>
                  <td class="px-5 py-4 text-red-700">High context-switching cost across topics and projects; information scattered across channels with no single structured view; decisions and insights often lost or inconsistently captured</td>
                </tr>
                <tr class="hover:bg-green-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">Weekly</td>
                  <td class="px-5 py-4 text-slate-700">Weekly status updates and blocker sync; periodic reviews (NPI Review, Sustaining Review, PPR); evolving project information structured differently for different audiences and purposes</td>
                  <td class="px-5 py-4 text-red-700">Repeated manual restructuring of the same information; high explanation cost to maintain consistency across review types; outputs depend heavily on individual writing and framing styles</td>
                </tr>
                <tr class="hover:bg-green-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">Monthly</td>
                  <td class="px-5 py-4 text-slate-700">KPI tracking and trend analysis; month-over-month performance comparison and narrative building</td>
                  <td class="px-5 py-4 text-red-700">Manual data aggregation and calculation; inconsistent storytelling across months; difficult to link metrics back to operational actions</td>
                </tr>
                <tr class="hover:bg-green-50 transition-colors">
                  <td class="px-5 py-4 font-semibold text-slate-900">Semi-annually</td>
                  <td class="px-5 py-4 text-slate-700">Performance review and self-assessment; individual impact documentation and level-based evaluation</td>
                  <td class="px-5 py-4 text-red-700">Heavy reliance on memory and scattered notes; difficult to systematically capture six months of contributions; high preparation cost concentrated in a short time window</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

        <!-- 4. Systemic Friction Patterns -->
        <div id="systemic-friction" class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🔍</div>
          <h2 class="text-2xl font-bold text-slate-900">Systemic Friction Patterns</h2>
        </div>

        <p class="text-slate-700 leading-relaxed mb-6">
          Across both project-based execution and cadence-based work, we observe a set of recurring friction patterns.
          These are not isolated inefficiencies, but structural characteristics of how operational information is currently created, transformed, and reused.
        </p>

        <p class="text-sm text-slate-600 mb-6 italic">
          Each pattern represents a recurring source of friction that cuts across stages, cadences, and deliverables.
        </p>

        <!-- Pattern Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Pattern 1 -->
          <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 class="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
              <span class="text-2xl">🔄</span>
              High Repetition of Information Reformatting
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">👁️</span>
                  <h4 class="font-semibold text-blue-900 text-sm">What we see</h4>
                </div>
                <ul class="text-sm text-blue-800 space-y-1 ml-6">
                  <li>• The same evolving operational information is repeatedly rewritten and restructured</li>
                  <li>• Reformatting happens across project stages, review contexts, and audiences</li>
                  <li>• Output structure varies by individual, even when source information is identical</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">⚠️</span>
                  <h4 class="font-semibold text-blue-900 text-sm">Why it matters</h4>
                </div>
                <ul class="text-sm text-blue-800 space-y-1 ml-6">
                  <li>• Preparation effort scales with the number of forums, not with value created</li>
                  <li>• Output quality depends heavily on individual writing and framing skills</li>
                  <li>• Inconsistent narratives increase explanation cycles and alignment cost</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Pattern 2 -->
          <div class="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 class="font-bold text-purple-900 text-lg mb-4 flex items-center gap-2">
              <span class="text-2xl">📋</span>
              Lack of Standardized Structure and Evaluation Criteria
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">👁️</span>
                  <h4 class="font-semibold text-purple-900 text-sm">What we see</h4>
                </div>
                <ul class="text-sm text-purple-800 space-y-1 ml-6">
                  <li>• Many assessments rely primarily on individual experience and judgment</li>
                  <li>• No consistent structure for capturing observations, risks, or readiness signals</li>
                  <li>• Knowledge remains implicit and fragmented rather than explicit and reusable</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">⚠️</span>
                  <h4 class="font-semibold text-purple-900 text-sm">Why it matters</h4>
                </div>
                <ul class="text-sm text-purple-800 space-y-1 ml-6">
                  <li>• Team-level expertise is difficult to demonstrate systematically</li>
                  <li>• Valuable experience does not scale beyond individuals</li>
                  <li>• Consistency across time, projects, and team members is hard to sustain</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Pattern 3 -->
          <div class="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
            <h3 class="font-bold text-orange-900 text-lg mb-4 flex items-center gap-2">
              <span class="text-2xl">⚡</span>
              High Manual Effort in Dynamic Operating Conditions
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">👁️</span>
                  <h4 class="font-semibold text-orange-900 text-sm">What we see</h4>
                </div>
                <ul class="text-sm text-orange-800 space-y-1 ml-6">
                  <li>• Plans, assumptions, constraints, and priorities evolve frequently</li>
                  <li>• Manual tracking, comparison, and explanation struggle to keep pace with change</li>
                  <li>• Cognitive and coordination load increases rapidly as complexity grows</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">⚠️</span>
                  <h4 class="font-semibold text-orange-900 text-sm">Why it matters</h4>
                </div>
                <ul class="text-sm text-orange-800 space-y-1 ml-6">
                  <li>• Growing share of effort spent on maintaining alignment rather than advancing execution</li>
                  <li>• Responsiveness and agility degrade as complexity rises</li>
                  <li>• Risk of error and misalignment increases under time pressure</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Pattern 4 -->
          <div class="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <h3 class="font-bold text-green-900 text-lg mb-4 flex items-center gap-2">
              <span class="text-2xl">🗂️</span>
              Fragmented Information and Memory-Dependent Workflows
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">👁️</span>
                  <h4 class="font-semibold text-green-900 text-sm">What we see</h4>
                </div>
                <ul class="text-sm text-green-800 space-y-1 ml-6">
                  <li>• Decisions, insights, and context scattered across meetings, messages, emails, and personal notes</li>
                  <li>• No consistent structure for capturing and carrying forward operational context</li>
                  <li>• Important rationale and learnings fade over time</li>
                </ul>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">⚠️</span>
                  <h4 class="font-semibold text-green-900 text-sm">Why it matters</h4>
                </div>
                <ul class="text-sm text-green-800 space-y-1 ml-6">
                  <li>• Work relies heavily on personal memory and last-minute reconstruction</li>
                  <li>• Continuity across cycles is difficult to maintain</li>
                  <li>• Preparation cost concentrates into short, high-pressure time windows</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- 5. From Systemic Friction to Enablement Layers -->
        <div id="enablement-layers" class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">🔗</div>
          <h2 class="text-2xl font-bold text-slate-900">From Systemic Friction to Enablement Layers</h2>
        </div>

        <!-- Introduction -->
        <div class="mb-6">
          <p class="text-slate-700 leading-relaxed mb-3">
            Across both project-based execution and cadence-based work, the friction patterns we observed are not isolated issues to solve one-by-one. They reflect a structural gap in how operational work is defined, translated, and executed across people, tools, and systems.
          </p>
          <p class="text-slate-700 leading-relaxed">
            So instead of mapping "one pattern → one solution", we use a <strong>layered enablement approach</strong> that creates a stable baseline first, then scales impact in a controlled way.
          </p>
        </div>

        <!-- Section Title -->
        <h3 class="text-lg font-bold text-slate-900 mb-5 border-b border-slate-200 pb-2">A Layered Enablement Approach</h3>

        <!-- Three Layers -->
        <div class="space-y-6 mb-8">

          <!-- Layer 1: Standardization -->
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🧱</span>
              <h4 class="text-lg font-bold text-blue-900">Layer 1 — Standardization <span class="text-sm font-normal text-blue-700">(Human ↔ Human alignment)</span></h4>
            </div>

            <div class="mb-3">
              <p class="text-sm font-semibold text-blue-800 mb-2">What it means</p>
              <ul class="space-y-1 text-sm text-blue-900">
                <li>• Establish a shared source of truth for core operational information</li>
                <li>• Standardize input structures (what we capture) and output formats (how we present)</li>
                <li>• Make evaluation criteria explicit where today it is mostly experience-driven</li>
              </ul>
            </div>

            <div class="mb-3">
              <p class="text-sm font-semibold text-blue-800 mb-2">Why it matters</p>
              <ul class="space-y-1 text-sm text-blue-900">
                <li>• Reduces ambiguity and rework across people and forums</li>
                <li>• Makes expertise more visible, consistent, and reusable</li>
                <li>• Creates the foundation required for reliable AI support</li>
              </ul>
            </div>

            <div class="bg-blue-200 border-l-4 border-blue-600 rounded p-3 mt-3">
              <p class="text-sm text-blue-900 italic font-medium">
                Without standardization, AI tends to amplify inconsistency rather than reduce it.
              </p>
            </div>
          </div>

          <!-- Layer 2: Prompt Enablement -->
          <div class="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🧩</span>
              <h4 class="text-lg font-bold text-purple-900">Layer 2 — Prompt Enablement <span class="text-sm font-normal text-purple-700">(Human ↔ AI alignment)</span></h4>
            </div>

            <div class="mb-3">
              <p class="text-sm font-semibold text-purple-800 mb-2">What it means</p>
              <ul class="space-y-1 text-sm text-purple-900">
                <li>• Translate standardized work into AI-readable instructions</li>
                <li>• Build a team-shared Prompt Library as "living manuals" for deliverables</li>
                <li>• Define not only what to ask, but also the expected output structure and quality checks</li>
              </ul>
            </div>

            <div class="mb-3">
              <p class="text-sm font-semibold text-purple-800 mb-2">Why it matters</p>
              <ul class="space-y-1 text-sm text-purple-900">
                <li>• Enables AI to interpret our work reliably and consistently</li>
                <li>• Improves output consistency across deliverables and team members</li>
                <li>• Raises baseline capability without depending on individual writing styles</li>
              </ul>
            </div>

            <div class="bg-purple-200 border-l-4 border-purple-600 rounded p-3 mt-3">
              <p class="text-sm text-purple-900 italic font-medium">
                Prompts here are not "chat tricks" — they are structured interfaces between our work and AI.
              </p>
            </div>
          </div>

          <!-- Layer 3: Automation -->
          <div class="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">⚙️</span>
              <h4 class="text-lg font-bold text-green-900">Layer 3 — Automation <span class="text-sm font-normal text-green-700">(Human ↔ AI ↔ System alignment)</span></h4>
            </div>

            <div class="mb-3">
              <p class="text-sm font-semibold text-green-800 mb-2">What it means</p>
              <ul class="space-y-1 text-sm text-green-900">
                <li>• Connect standardized prompts into repeatable workflows where scope is clear</li>
                <li>• Reduce manual handoffs, coordination overhead, and repeated restructuring</li>
                <li>• Apply automation selectively to high-impact workflow segments while staying compatible with existing systems</li>
              </ul>
            </div>

            <div class="mb-3">
              <p class="text-sm font-semibold text-green-800 mb-2">Why it matters</p>
              <ul class="space-y-1 text-sm text-green-900">
                <li>• Improves execution resilience, agility, and accuracy under dynamic conditions</li>
                <li>• Scales impact without rebuilding from scratch</li>
                <li>• Frees capacity for higher-value problem solving and decision support</li>
              </ul>
            </div>

            <div class="bg-green-200 border-l-4 border-green-600 rounded p-3 mt-3">
              <p class="text-sm text-green-900 italic font-medium">
                Automation follows clarity — it does not precede it.
              </p>
            </div>
          </div>
        </div>

        <!-- Mermaid Diagram -->
        <div class="bg-slate-50 rounded-2xl p-12 mb-6">
          <div class="flex justify-center">
            <div class="mermaid" style="width: 100%; max-width: 1200px;">
flowchart LR
    S["<b style='font-size:28px'>Layer 1: Standardization</b><br/><span style='font-size:20px'>Human ↔ Human alignment</span><br/><span style='font-size:17px'>Shared definitions · Input/Output structures</span>"]

    P["<b style='font-size:28px'>Layer 2: Prompt Enablement</b><br/><span style='font-size:20px'>Human ↔ AI alignment</span><br/><span style='font-size:17px'>Prompt library · Output consistency</span>"]

    A["<b style='font-size:28px'>Layer 3: Automation</b><br/><span style='font-size:20px'>Human ↔ AI ↔ System alignment</span><br/><span style='font-size:17px'>Repeatable workflows · Scoped augmentation</span>"]

    S ---|enables| P
    P ---|enables| A

    style S fill:#e0efff,stroke:#3b82f6,stroke-width:3px
    style P fill:#f3e8ff,stroke:#8b5cf6,stroke-width:3px
    style A fill:#ecfdf5,stroke:#10b981,stroke-width:3px,stroke-dasharray: 6 4
            </div>
          </div>
        </div>

        <!-- Conclusion -->
        <div class="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-5">
          <p class="text-indigo-900 font-medium">
            <strong>How the layers work together:</strong> Standardization enables reliable prompts. Reliable prompts enable scalable automation. Over time, automation outcomes feed back into clearer standards and stronger reuse.
          </p>
        </div>
      </div>

        <!-- 6. Execution Plan: Standardize → Prompt → Automate -->
        <div id="execution-plan" class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
            <h2 class="text-2xl font-bold text-slate-900">Execution Plan: Standardize → Prompt → Automate</h2>
          </div>

          <!-- Entry Point: Team OKR Metrics -->
          <div class="mb-6">
            <h3 class="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Entry Point: Team OKR Metrics</h3>

            <p class="text-slate-700 leading-relaxed mb-3">
              Team OKR Metrics represent the most comprehensive and critical reflection of factory delivery and supply execution health across our manufacturing operations. They span supply commitment, production discipline, capacity readiness, labor fulfillment, and campus enablement — effectively covering the full scope of our operational responsibility.
            </p>

            <p class="text-slate-700 leading-relaxed mb-3">
              Because these metrics sit at the center of how performance is reviewed, risks are discussed, and priorities are adjusted throughout the year, the quality of their interpretation directly impacts execution quality.
            </p>

            <p class="text-slate-700 leading-relaxed mb-3">
              The goal of this phase is not to redefine targets, but to ensure that:
            </p>
            <ul class="space-y-2 text-slate-700 mb-3 ml-6">
              <li>• Everyone interprets each metric in the same way</li>
              <li>• Deviations are discussed on a consistent basis</li>
              <li>• Both humans and AI can reliably reason about metric movements</li>
            </ul>

            <p class="text-slate-700 leading-relaxed">
              By establishing a clear, shared metric reference in Q2, we make OKR execution more controllable, reviews more efficient, and downstream AI enablement feasible without ambiguity — while also improving cross-functional alignment and decision quality across the broader supply chain organization.
            </p>
          </div>
          <!-- Table A: Standardization Plan (Q1-Q2) -->
          <div class="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 class="text-lg font-bold text-blue-900 mb-2">Table A — Standardization Plan (Q1-Q2): Team OKR Metrics</h3>
            <p class="text-sm text-blue-700 mb-4"><strong>Objective:</strong> Create a shared metric reference so Team OKRs can be interpreted consistently across execution reviews, leadership discussions, and AI-assisted analysis.</p>

            <div class="overflow-x-auto">
              <table class="w-full text-sm bg-white rounded-lg">
                <thead class="bg-gradient-to-r from-blue-100 to-blue-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/3">Team OKR Metric</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/3">Actions</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/3">Deliverables</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Ex-factory to Supply Commit Attainment %</td>
                    <td class="px-4 py-3 text-slate-600">Align calculation formula, weighting logic, and common misread scenarios</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry (definition + calculation notes)</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Production Schedule Adherence %</td>
                    <td class="px-4 py-3 text-slate-600">Align deviation criteria and measurement window</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + deviation interpretation notes</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Capacity Utilization</td>
                    <td class="px-4 py-3 text-slate-600">Align capacity baseline assumptions and utilization logic</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + capacity assumption notes</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Manufacturing Lead Time Achieve Rate</td>
                    <td class="px-4 py-3 text-slate-600">Align start/end points and inclusion rules</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + lead time criteria</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">BTO On-time Ship %</td>
                    <td class="px-4 py-3 text-slate-600">Align on-time criteria and exception handling</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + exception handling notes</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">CTO On-time Ship %</td>
                    <td class="px-4 py-3 text-slate-600">Align configuration impact to on-time targets</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + configuration impact notes</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Labor Fulfillment %</td>
                    <td class="px-4 py-3 text-slate-600">Align labor counting rules (regular / OT / temp)</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + labor counting rules</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Campus Readiness On-time %</td>
                    <td class="px-4 py-3 text-slate-600">Align readiness checkpoints and dependency handling</td>
                    <td class="px-4 py-3 text-slate-600">Metric reference entry + readiness dependency notes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Output -->
            <div class="mt-4 bg-blue-100 border-l-4 border-blue-500 rounded p-4">
              <p class="text-sm text-blue-900">
                <strong>Output (Q1-Q2):</strong> A Team OKR Metrics Reference that documents how each metric is calculated, interpreted, and discussed — forming the foundation for consistent execution reviews and subsequent AI prompt enablement.
              </p>
            </div>
          </div>

          <!-- Table B: Prompt Enablement Plan (Q2-Q3) -->
          <div class="bg-purple-50 rounded-xl p-6 mb-6">
            <h3 class="text-lg font-bold text-purple-900 mb-2">Table B — Prompt Enablement Plan (Q2-Q3): Team OKR Understanding & Upstream Signals</h3>
            <p class="text-sm text-purple-700 mb-4">Translating standardized work into AI-readable instructions for interpretation and insight generation</p>

            <div class="overflow-x-auto">
              <table class="w-full text-sm bg-white rounded-lg">
                <thead class="bg-gradient-to-r from-purple-100 to-purple-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/4">Knowledge Domain</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/2">Deliverables (Prompt Library)</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/4">Intended Use</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Team OKR Metrics & OKR Insight <span class="text-slate-500 font-normal">(metric definitions per Table A)</span></td>
                    <td class="px-4 py-3 text-slate-600">
                      <ul class="space-y-1 text-sm">
                        <li>• Metric explanation prompt</li>
                        <li>• Calculation reasoning prompt</li>
                        <li>• Risk & deviation interpretation prompt</li>
                        <li>• OKR insight & narrative drafting prompt</li>
                        <li>• "What changed / why / impact / action" prompt</li>
                      </ul>
                    </td>
                    <td class="px-4 py-3 text-slate-600">Help MO quickly understand metric movements and implications; support leadership-ready OKR and performance narratives</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">CTB & Demand Forecast Understanding</td>
                    <td class="px-4 py-3 text-slate-600">
                      <ul class="space-y-1 text-sm">
                        <li>• CTB logic explanation prompt</li>
                        <li>• Demand signal interpretation prompt</li>
                        <li>• Constraint & risk questioning prompts</li>
                      </ul>
                    </td>
                    <td class="px-4 py-3 text-slate-600">Help MO interpret upstream signals faster; improve risk awareness and scenario discussion; clarify this is for understanding & validation, not ownership</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Production Plan Review</td>
                    <td class="px-4 py-3 text-slate-600">
                      <ul class="space-y-1 text-sm">
                        <li>• Plan explanation prompt</li>
                        <li>• Assumption validation checklist prompt</li>
                        <li>• Scenario challenge prompts</li>
                      </ul>
                    </td>
                    <td class="px-4 py-3 text-slate-600">Review and challenge CM production plans; support structured discussion with stakeholders</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Note -->
            <div class="mt-4 bg-purple-100 border-l-4 border-purple-500 rounded p-4">
              <p class="text-sm text-purple-900">
                <strong>Note:</strong> This prompt work is not about replacing ownership. CTB and Demand Forecast are owned upstream; these prompts help MO understand and validate signals faster to improve execution responsiveness.
              </p>
            </div>
          </div>

          <!-- Table C: Automation Exploration Plan (Q4) -->
          <div class="bg-green-50 rounded-xl p-6">
            <h3 class="text-lg font-bold text-green-900 mb-2">Table C — Automation Exploration Plan (Q4): Selective, High-impact</h3>
            <p class="text-sm text-green-700 mb-4">Selectively connecting standardized prompts into repeatable workflows for high-value use cases</p>

            <div class="overflow-x-auto">
              <table class="w-full text-sm bg-white rounded-lg">
                <thead class="bg-gradient-to-r from-green-100 to-green-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/3">Automation Candidate</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/3">Scope</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700 w-1/3">Deliverables</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">OKR Insight & Narrative Generator</td>
                    <td class="px-4 py-3 text-slate-600">Generate draft OKR insights and narratives from standardized metrics and prompts</td>
                    <td class="px-4 py-3 text-slate-600">OKR insight draft output format; leadership-ready narrative template</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">Product-level Production Plan Simulation (not SKU-level)</td>
                    <td class="px-4 py-3 text-slate-600">Generate product-level plan for scenario discussion and simulation</td>
                    <td class="px-4 py-3 text-slate-600">Product-level simulation output; assumptions & constraint log format</td>
                  </tr>
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">FDOS v1</td>
                    <td class="px-4 py-3 text-slate-600">MO database + standardized templates + navigation paths ready for usage</td>
                    <td class="px-4 py-3 text-slate-600">FDOS v1 (data foundation + key views)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Note -->
            <div class="mt-4 bg-green-100 border-l-4 border-green-500 rounded p-4">
              <p class="text-sm text-green-900">
                <strong>Note:</strong> Automation candidates are chosen based on clear scope, high interpretation cost, and demonstrated value from prompt work. The goal is to support decision-making and reduce manual reformatting—not to replace human judgment or ownership.
              </p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  `;

  // Initialize Mermaid diagrams after DOM update
  setTimeout(() => {
    if (window.mermaid) {
      window.mermaid.run();
    }
  }, 100);

  // Smooth scroll and navigation highlighting
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('[id]');

  // Smooth scroll on click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Highlight active section on scroll
  const observerOptions = {
    root: null,
    rootMargin: '-100px 0px -60% 0px',
    threshold: 0
  };

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('bg-blue-50', 'text-blue-600', 'font-semibold');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('bg-blue-50', 'text-blue-600', 'font-semibold');
          }
        });
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  sections.forEach(section => {
    if (section.id) {
      observer.observe(section);
    }
  });
}

/**
 * Render Production Plan Logic from markdown documentation
 */
async function renderProductionPlanLogic() {
  const content = $("dataFoundationContent");

  // Show loading state
  content.innerHTML = `
    <div class="text-center py-12">
      <div class="text-4xl mb-4">⏳</div>
      <div class="text-slate-600">Loading Production Plan Logic...</div>
    </div>
  `;

  try {
    // Load the markdown documentation
    const response = await fetch('./OUTPUT_LOGIC_DISCUSSION.md');
    if (!response.ok) throw new Error('Failed to load documentation');

    const markdownText = await response.text();

    // Convert markdown to HTML (simple conversion)
    const htmlContent = convertMarkdownToHTML(markdownText);

    content.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-900">Production Plan Generation Logic</h2>
          <a href="./OUTPUT_LOGIC_DISCUSSION.md" target="_blank" class="text-sm text-blue-600 hover:text-blue-800">
            📄 View Original Document
          </a>
        </div>

        <div class="prose prose-sm max-w-none bg-white">
          ${htmlContent}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading Production Plan Logic:', error);
    content.innerHTML = `
      <div class="text-center py-12">
        <div class="text-4xl mb-4">❌</div>
        <div class="text-red-600 font-semibold">Failed to load documentation</div>
        <div class="text-sm text-slate-600 mt-2">${error.message}</div>
        <a href="./OUTPUT_LOGIC_DISCUSSION.md" target="_blank" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Open Document Directly
        </a>
      </div>
    `;
  }
}

/**
 * Simple Markdown to HTML converter
 * Supports: headers, bold, italic, code blocks, lists, tables
 */
function convertMarkdownToHTML(markdown) {
  let html = markdown;

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-100 p-4 rounded-lg overflow-x-auto"><code class="language-$1">$2</code></pre>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-6 mb-3 text-slate-900">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-slate-900 border-b pb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-10 mb-5 text-slate-900">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1 my-2">$&</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="my-3">');
  html = '<p class="my-3">' + html + '</p>';

  // Tables (basic support)
  html = html.replace(/\|(.+)\|/g, function(match) {
    const cells = match.split('|').filter(c => c.trim());
    return '<tr>' + cells.map(c => `<td class="border border-slate-300 px-3 py-2">${c.trim()}</td>`).join('') + '</tr>';
  });
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="w-full border-collapse my-4">$&</table>');

  return html;
}


/**
 * Render Notification Page (Global Page)
 * Includes team calendar and weekly to-do list
 */
function renderNotification() {
  const content = $("content");

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white border-2 border-slate-300 rounded-xl p-6">
        <h1 class="text-2xl font-bold text-slate-900 mb-1">Execution Inbox</h1>
        <p class="text-sm text-slate-600">Operational signals across the factory network that may affect delivery commitments, production stability, or execution coordination.</p>
      </div>

      <!-- ============================================================ -->
      <!-- Section 1: Execution Alerts -->
      <!-- ============================================================ -->
      <div id="execution-alerts-section" class="bg-white border-2 border-red-200 rounded-xl overflow-hidden">
        <div class="bg-red-50 px-6 py-4 border-b border-red-200">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 class="text-lg font-bold text-red-900">Execution Alerts</h2>
            <span class="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full">3 Active</span>
            <button onclick="generateAlertBrief()" id="generate-alert-brief-btn" class="ml-auto px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-medium hover:from-indigo-700 hover:to-purple-700 flex items-center gap-1.5 shadow-sm" style="cursor:pointer;">
              <span>🤖</span> Generate Alert Brief
            </button>
          </div>
          <p class="text-xs text-red-700 mt-1">Each alert shows not only the detected risk, but also the system response chain that turns execution signals into decision-ready actions.</p>
        </div>

        <div class="p-5 space-y-4">

          <!-- ====== Alert 1: Production Output Risk ====== -->
          <div class="border-l-4 border-red-500 bg-red-50 rounded-r-lg overflow-hidden">
            <div class="p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">HIGH</span>
                    <span class="text-sm font-bold text-slate-900">Production Output Risk</span>
                    <span class="text-xs text-slate-500">• Hypernova</span>
                  </div>
                  <div class="text-sm text-slate-700 mb-3">Assembly line output below plan — 12,400 units at risk for W04 shipment commit</div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div class="text-slate-500 mb-0.5">Primary Cause</div>
                      <div class="font-medium text-slate-800">Yield drop on final assembly</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Confidence</div>
                      <div class="font-medium text-red-700">HIGH</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Time Window</div>
                      <div class="font-medium text-slate-800">24 hours</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Owner</div>
                      <div class="font-medium text-slate-800">Factory Operations</div>
                    </div>
                  </div>
                  <!-- Impact Assessment Chain -->
                  <div class="mt-3 bg-white/80 border border-red-100 rounded-lg p-3">
                    <div class="flex items-center gap-1.5 mb-2.5">
                      <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      <span class="text-xs font-bold text-slate-700">Impact Assessment Chain</span>
                    </div>
                    <div class="flex items-stretch gap-0 text-xs">
                      <div class="flex-1 bg-blue-50 border border-blue-200 rounded-l-lg p-2.5 text-center relative">
                        <div class="text-blue-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Input</div>
                        <div class="text-sm font-bold text-blue-800">-</div>
                        <div class="text-blue-500 text-[10px] mt-0.5">No input constraint</div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-red-50 border border-red-200 p-2.5 text-center relative">
                        <div class="text-red-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Output</div>
                        <div class="text-sm font-bold text-red-700">-462/day</div>
                        <div class="text-red-500 text-[10px] mt-0.5">Yield 90%→70%</div>
                        <div class="w-full bg-red-200 rounded-full h-1 mt-1.5"><div class="bg-red-500 h-1 rounded-full" style="width:78%"></div></div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-amber-50 border border-amber-200 p-2.5 text-center relative">
                        <div class="text-amber-500 font-semibold uppercase text-[10px] tracking-wider mb-1">Shipment</div>
                        <div class="text-sm font-bold text-amber-700">-3,234</div>
                        <div class="text-amber-500 text-[10px] mt-0.5">W04 window at risk</div>
                        <div class="w-full bg-amber-200 rounded-full h-1 mt-1.5"><div class="bg-amber-500 h-1 rounded-full" style="width:62%"></div></div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-red-50 border border-red-300 rounded-r-lg p-2.5 text-center ring-1 ring-red-300">
                        <div class="text-red-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Commitment</div>
                        <div class="text-sm font-bold text-red-700">-15.5%</div>
                        <div class="text-red-500 text-[10px] mt-0.5">12,400 units gap</div>
                        <div class="w-full bg-red-200 rounded-full h-1 mt-1.5"><div class="bg-red-600 h-1 rounded-full" style="width:85%"></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-3 pt-3 border-t border-red-200 flex-wrap">
                <button onclick="navigateTo('production-plan');" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">View Production Dashboard</button>
                <button onclick="navigateTo('production-plan');" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Open Production Plan</button>
                <button onclick="toggleQuickNotify('notify-1')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">@ Quick Notify</button>
                <button onclick="toggleExecutionChain('chain-1')" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 ml-auto">Show Execution Chain</button>
              </div>

              <!-- Quick Notify Panel -->
              <div id="notify-1" class="hidden mt-3 bg-white border border-emerald-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-emerald-800">Quick Notify</span>
                  <span class="text-xs text-slate-500">• Production Output Risk • Hypernova</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-3">
                  <span class="text-xs text-slate-500">To:</span>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Wei Chen (Factory Ops)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@David Liu (Planning)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Sarah Wang (MPM)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@James Li (Engineering)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Amy Zhang (Delivery)</button>
                </div>
                <textarea class="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" rows="2" placeholder="Add a message... (e.g. Please review yield drop impact on W04 commit)"></textarea>
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="rounded text-emerald-600" checked> Include alert context</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="rounded text-emerald-600"> Include execution chain</label>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="toggleQuickNotify('notify-1')" class="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
                    <button onclick="sendQuickNotify('notify-1')" class="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">Send Notification</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Execution Chain (expandable) -->
            <div id="chain-1" class="hidden border-t-2 border-red-200 bg-white">
              <div class="px-5 py-4">
                <div class="flex items-center gap-2 mb-4">
                  <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded">FDOS Execution Chain</span>
                  <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">Scenario Pack Prepared</span>
                </div>

                <div class="space-y-4">
                  <!-- Step 1 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <div class="w-0.5 flex-1 bg-blue-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">Signal Detected</div>
                      <div class="text-xs text-slate-600 mb-2">System detected that actual assembly line output has fallen below the current production plan.</div>
                      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-xs text-slate-700">
                        <div>• Final assembly yield dropped from 86% to 70%</div>
                        <div>• Rework queue increased</div>
                        <div>• Line downtime increased by 2 hours</div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 2 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <div class="w-0.5 flex-1 bg-amber-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">System Analysis</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS analyzed the constraint and projected delivery impact.</div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Primary Constraint</div>
                          <div class="text-xs font-medium text-slate-800">Yield degradation on final assembly</div>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Impact Projection</div>
                          <div class="text-xs font-medium text-slate-800">12,400 units at risk</div>
                          <div class="text-xs text-slate-600">~1.5 day shipment delay risk</div>
                          <div class="text-xs text-slate-600">3 customer commits affected</div>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Confidence</div>
                          <div class="text-xs font-bold text-red-700">HIGH</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 3 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                      <div class="w-0.5 flex-1 bg-purple-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">Decision Triggered</div>
                      <div class="text-xs text-slate-600 mb-2">Impact exceeded the weekly commit protection threshold.</div>
                      <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">Decision Threshold Exceeded</span>
                        </div>
                        <div class="grid grid-cols-3 gap-3 text-xs mt-2">
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Candidate</div>
                            <div class="font-medium text-slate-800">Protect W04 shipment commit</div>
                          </div>
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Owner</div>
                            <div class="font-medium text-slate-800">Factory Operations</div>
                          </div>
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Window</div>
                            <div class="font-medium text-slate-800">24 hours</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 4 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-bold text-slate-900 mb-1">Recommended Next Step</div>
                      <div class="text-xs text-slate-600 mb-2">Scenario analysis is ready for review in Decision Center.</div>
                      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div class="text-xs font-semibold text-slate-700 mb-2">Available Scenarios</div>
                        <div class="space-y-1 text-xs text-slate-700">
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Shift capacity from Line 3 → recover ~3,200 units</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Run partial build → recover ~5,000 units</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Delay low-priority SKU → recover ~7,000 units</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 flex-wrap">
                        <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Open in Decision Center</button>
                        <button onclick="navigateTo('production-plan');" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Open Scenario Analysis</button>
                        <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Route to Factory Ops</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ====== Alert 2: Material Readiness Risk ====== -->
          <div class="border-l-4 border-orange-500 bg-orange-50 rounded-r-lg overflow-hidden">
            <div class="p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">MEDIUM</span>
                    <span class="text-sm font-bold text-slate-900">Material Readiness Risk</span>
                    <span class="text-xs text-slate-500">• SmartGlass V2</span>
                  </div>
                  <div class="text-sm text-slate-700 mb-3">CTB shortage detected — potential delay to production input tomorrow</div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div class="text-slate-500 mb-0.5">Material</div>
                      <div class="font-medium text-slate-800">Optical module IC-77</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Confidence</div>
                      <div class="font-medium text-orange-700">MEDIUM</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Time Window</div>
                      <div class="font-medium text-slate-800">36 hours</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Owner</div>
                      <div class="font-medium text-slate-800">MPM</div>
                    </div>
                  </div>
                  <!-- Impact Assessment Chain -->
                  <div class="mt-3 bg-white/80 border border-orange-100 rounded-lg p-3">
                    <div class="flex items-center gap-1.5 mb-2.5">
                      <svg class="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      <span class="text-xs font-bold text-slate-700">Impact Assessment Chain</span>
                    </div>
                    <div class="flex items-stretch gap-0 text-xs">
                      <div class="flex-1 bg-orange-50 border border-orange-200 rounded-l-lg p-2.5 text-center relative ring-1 ring-orange-300">
                        <div class="text-orange-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Input</div>
                        <div class="text-sm font-bold text-orange-700">-2,800</div>
                        <div class="text-orange-500 text-[10px] mt-0.5">IC-77 ETA +2d</div>
                        <div class="w-full bg-orange-200 rounded-full h-1 mt-1.5"><div class="bg-orange-500 h-1 rounded-full" style="width:55%"></div></div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-amber-50 border border-amber-200 p-2.5 text-center relative">
                        <div class="text-amber-500 font-semibold uppercase text-[10px] tracking-wider mb-1">Output</div>
                        <div class="text-sm font-bold text-amber-700">-2,520</div>
                        <div class="text-amber-500 text-[10px] mt-0.5">@90% yield</div>
                        <div class="w-full bg-amber-200 rounded-full h-1 mt-1.5"><div class="bg-amber-500 h-1 rounded-full" style="width:48%"></div></div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-amber-50 border border-amber-200 p-2.5 text-center relative">
                        <div class="text-amber-500 font-semibold uppercase text-[10px] tracking-wider mb-1">Shipment</div>
                        <div class="text-sm font-bold text-amber-700">-2,520</div>
                        <div class="text-amber-500 text-[10px] mt-0.5">+2d ship delay</div>
                        <div class="w-full bg-amber-200 rounded-full h-1 mt-1.5"><div class="bg-amber-500 h-1 rounded-full" style="width:42%"></div></div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-amber-50 border border-amber-200 rounded-r-lg p-2.5 text-center">
                        <div class="text-amber-500 font-semibold uppercase text-[10px] tracking-wider mb-1">Commitment</div>
                        <div class="text-sm font-bold text-amber-700">-5.2%</div>
                        <div class="text-amber-500 text-[10px] mt-0.5">W05 at risk</div>
                        <div class="w-full bg-amber-200 rounded-full h-1 mt-1.5"><div class="bg-amber-500 h-1 rounded-full" style="width:35%"></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-3 pt-3 border-t border-orange-200 flex-wrap">
                <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Check CTB Status</button>
                <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Review Supplier ETA</button>
                <button onclick="toggleQuickNotify('notify-2')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">@ Quick Notify</button>
                <button onclick="toggleExecutionChain('chain-2')" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 ml-auto">Show Execution Chain</button>
              </div>

              <!-- Quick Notify Panel -->
              <div id="notify-2" class="hidden mt-3 bg-white border border-emerald-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-emerald-800">Quick Notify</span>
                  <span class="text-xs text-slate-500">• Material Readiness Risk • SmartGlass V2</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-3">
                  <span class="text-xs text-slate-500">To:</span>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Sarah Wang (MPM)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Kevin Zhao (Sourcing)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@David Liu (Planning)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Wei Chen (Factory Ops)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Amy Zhang (Delivery)</button>
                </div>
                <textarea class="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" rows="2" placeholder="Add a message... (e.g. CTB shortage on IC-77 — need supplier ETA update)"></textarea>
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="rounded text-emerald-600" checked> Include alert context</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="rounded text-emerald-600"> Include execution chain</label>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="toggleQuickNotify('notify-2')" class="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
                    <button onclick="sendQuickNotify('notify-2')" class="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">Send Notification</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Execution Chain (expandable) -->
            <div id="chain-2" class="hidden border-t-2 border-orange-200 bg-white">
              <div class="px-5 py-4">
                <div class="flex items-center gap-2 mb-4">
                  <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded">FDOS Execution Chain</span>
                  <span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">FDOS Analysis Ready</span>
                </div>

                <div class="space-y-4">
                  <!-- Step 1 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <div class="w-0.5 flex-1 bg-blue-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">Signal Detected</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS detected a shortage risk in CTB for optical module IC-77.</div>
                      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-xs text-slate-700">
                        <div>• Supplier ETA slipped by 2 days</div>
                        <div>• CTB below required threshold for next build cycle</div>
                        <div>• Line 2 and Line 4 may be affected</div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 2 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <div class="w-0.5 flex-1 bg-amber-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">System Analysis</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS evaluated the supply constraint and production exposure.</div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Primary Constraint</div>
                          <div class="text-xs font-medium text-slate-800">Material readiness gap for IC-77</div>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Impact Projection</div>
                          <div class="text-xs font-medium text-slate-800">8,000 units exposed</div>
                          <div class="text-xs text-slate-600">2 lines potentially impacted</div>
                          <div class="text-xs text-slate-600">Risk window begins within 36h</div>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Confidence</div>
                          <div class="text-xs font-bold text-orange-700">MEDIUM</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 3 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                      <div class="w-0.5 flex-1 bg-purple-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">Decision Triggered</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS generated a sourcing / material decision candidate due to production impact risk.</div>
                      <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">Decision Threshold Exceeded</span>
                        </div>
                        <div class="grid grid-cols-3 gap-3 text-xs mt-2">
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Candidate</div>
                            <div class="font-medium text-slate-800">Use alternate supplier or delay production input</div>
                          </div>
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Owner</div>
                            <div class="font-medium text-slate-800">MPM / Sourcing</div>
                          </div>
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Window</div>
                            <div class="font-medium text-slate-800">36 hours</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 4 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-bold text-slate-900 mb-1">Recommended Next Step</div>
                      <div class="text-xs text-slate-600 mb-2">Sourcing and CTB mitigation options are ready for review.</div>
                      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div class="text-xs font-semibold text-slate-700 mb-2">Available Options</div>
                        <div class="space-y-1 text-xs text-slate-700">
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Activate alternate supplier → +2% FV cost impact</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Reallocate CTB from Product B</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Delay production input and re-sequence build plan</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 flex-wrap">
                        <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Open in Decision Center</button>
                        <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Open CTB Analysis</button>
                        <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Route to MPM / Sourcing</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ====== Alert 3: Shipment Delay Risk ====== -->
          <div class="border-l-4 border-red-500 bg-red-50 rounded-r-lg overflow-hidden">
            <div class="p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">HIGH</span>
                    <span class="text-sm font-bold text-slate-900">Shipment Delay Risk</span>
                    <span class="text-xs text-slate-500">• Product C</span>
                  </div>
                  <div class="text-sm text-slate-700 mb-3">Logistics ETA slip detected — shipment commit at risk for APAC region</div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div class="text-slate-500 mb-0.5">Cause</div>
                      <div class="font-medium text-slate-800">IC-77 shipment delayed by 2 days</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Confidence</div>
                      <div class="font-medium text-red-700">HIGH</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Time Window</div>
                      <div class="font-medium text-slate-800">48 hours</div>
                    </div>
                    <div>
                      <div class="text-slate-500 mb-0.5">Owner</div>
                      <div class="font-medium text-slate-800">China Delivery Team</div>
                    </div>
                  </div>
                  <!-- Impact Assessment Chain -->
                  <div class="mt-3 bg-white/80 border border-red-100 rounded-lg p-3">
                    <div class="flex items-center gap-1.5 mb-2.5">
                      <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      <span class="text-xs font-bold text-slate-700">Impact Assessment Chain</span>
                    </div>
                    <div class="flex items-stretch gap-0 text-xs">
                      <div class="flex-1 bg-slate-50 border border-slate-200 rounded-l-lg p-2.5 text-center relative">
                        <div class="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Input</div>
                        <div class="text-sm font-bold text-slate-400">-</div>
                        <div class="text-slate-400 text-[10px] mt-0.5">No impact</div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-slate-50 border border-slate-200 p-2.5 text-center relative">
                        <div class="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Output</div>
                        <div class="text-sm font-bold text-slate-400">-</div>
                        <div class="text-slate-400 text-[10px] mt-0.5">No impact</div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-red-50 border border-red-200 p-2.5 text-center relative ring-1 ring-red-300">
                        <div class="text-red-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Shipment</div>
                        <div class="text-sm font-bold text-red-700">-8,200</div>
                        <div class="text-red-500 text-[10px] mt-0.5">+2d logistics delay</div>
                        <div class="w-full bg-red-200 rounded-full h-1 mt-1.5"><div class="bg-red-500 h-1 rounded-full" style="width:72%"></div></div>
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-300 text-lg font-bold">&rarr;</div>
                      </div>
                      <div class="flex-1 bg-red-50 border border-red-300 rounded-r-lg p-2.5 text-center ring-1 ring-red-300">
                        <div class="text-red-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Commitment</div>
                        <div class="text-sm font-bold text-red-700">-10.3%</div>
                        <div class="text-red-500 text-[10px] mt-0.5">APAC commit miss</div>
                        <div class="w-full bg-red-200 rounded-full h-1 mt-1.5"><div class="bg-red-600 h-1 rounded-full" style="width:68%"></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-3 pt-3 border-t border-red-200 flex-wrap">
                <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">View Shipment Details</button>
                <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Check Recovery Options</button>
                <button onclick="toggleQuickNotify('notify-3')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">@ Quick Notify</button>
                <button onclick="toggleExecutionChain('chain-3')" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 ml-auto">Show Execution Chain</button>
              </div>

              <!-- Quick Notify Panel -->
              <div id="notify-3" class="hidden mt-3 bg-white border border-emerald-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-emerald-800">Quick Notify</span>
                  <span class="text-xs text-slate-500">• Shipment Delay Risk • Product C</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-3">
                  <span class="text-xs text-slate-500">To:</span>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Amy Zhang (Delivery)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@David Liu (Planning)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Sarah Wang (MPM)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Kevin Zhao (Sourcing)</button>
                  <button onclick="toggleMention(this)" class="px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors">@Wei Chen (Factory Ops)</button>
                </div>
                <textarea class="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" rows="2" placeholder="Add a message... (e.g. APAC shipment at risk — need logistics recovery options)"></textarea>
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="rounded text-emerald-600" checked> Include alert context</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="rounded text-emerald-600"> Include execution chain</label>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="toggleQuickNotify('notify-3')" class="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
                    <button onclick="sendQuickNotify('notify-3')" class="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">Send Notification</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Execution Chain (expandable) -->
            <div id="chain-3" class="hidden border-t-2 border-red-200 bg-white">
              <div class="px-5 py-4">
                <div class="flex items-center gap-2 mb-4">
                  <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded">FDOS Execution Chain</span>
                  <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">Scenario Pack Prepared</span>
                </div>

                <div class="space-y-4">
                  <!-- Step 1 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <div class="w-0.5 flex-1 bg-blue-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">Signal Detected</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS detected a logistics ETA slip affecting outbound shipment readiness.</div>
                      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-xs text-slate-700">
                        <div>• Shipment ETA delayed by 2 days</div>
                        <div>• APAC delivery window now at risk</div>
                        <div>• Customer commit sensitivity flagged as high</div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 2 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <div class="w-0.5 flex-1 bg-amber-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">System Analysis</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS evaluated downstream shipment exposure and recovery urgency.</div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Primary Constraint</div>
                          <div class="text-xs font-medium text-slate-800">Logistics delay affecting shipment readiness</div>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Impact Projection</div>
                          <div class="text-xs font-medium text-slate-800">APAC commit miss probability: 65%</div>
                          <div class="text-xs text-slate-600">1 major regional shipment exposed</div>
                          <div class="text-xs text-slate-600">Customer impact if no action taken</div>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div class="text-xs text-slate-500 mb-0.5">Confidence</div>
                          <div class="text-xs font-bold text-red-700">HIGH</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 3 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                      <div class="w-0.5 flex-1 bg-purple-200 mt-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                      <div class="text-sm font-bold text-slate-900 mb-1">Decision Triggered</div>
                      <div class="text-xs text-slate-600 mb-2">FDOS generated a logistics recovery decision candidate.</div>
                      <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">Decision Threshold Exceeded</span>
                        </div>
                        <div class="grid grid-cols-3 gap-3 text-xs mt-2">
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Candidate</div>
                            <div class="font-medium text-slate-800">Protect APAC shipment commit</div>
                          </div>
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Owner</div>
                            <div class="font-medium text-slate-800">China Delivery Team</div>
                          </div>
                          <div>
                            <div class="text-slate-500 mb-0.5">Decision Window</div>
                            <div class="font-medium text-slate-800">48 hours</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Step 4 -->
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-bold text-slate-900 mb-1">Recommended Next Step</div>
                      <div class="text-xs text-slate-600 mb-2">Recovery paths are ready for evaluation in Decision Center.</div>
                      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div class="text-xs font-semibold text-slate-700 mb-2">Available Options</div>
                        <div class="space-y-1 text-xs text-slate-700">
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Air freight recovery</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Split shipment by priority</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                            <span>Delay lower-priority outbound order</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 flex-wrap">
                        <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Open in Decision Center</button>
                        <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Open Recovery Analysis</button>
                        <button class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Route to China Delivery</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ============================================================ -->
      <!-- Section 2: Decision Candidates -->
      <!-- ============================================================ -->
      <div class="bg-white border-2 border-blue-200 rounded-xl overflow-hidden">
        <div class="bg-blue-50 px-6 py-4 border-b border-blue-200">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-blue-900">Decision Candidates</h2>
            <span class="ml-auto px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">3 Pending</span>
          </div>
          <p class="text-xs text-blue-700 mt-1">Signals that may require cross-functional decisions — promoted to Decision Center when confirmed</p>
        </div>

        <div class="p-5 space-y-4">
          <!-- Decision 1: Yield Constraint -->
          <div class="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-bold text-slate-900">Yield Constraint Detected</span>
                  <span class="text-xs text-slate-500">• Hypernova</span>
                </div>
                <div class="text-sm text-slate-700">Assembly yield dropped to 70% — production commit at risk for W04</div>
              </div>
            </div>
            <div class="bg-white border border-blue-200 rounded-lg p-3 mb-3">
              <div class="text-xs font-semibold text-slate-700 mb-2">Decision Candidate: Protect weekly commit or reduce SKU mix</div>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700">Shift capacity from Line 3</span>
                <span class="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700">Run partial build</span>
                <span class="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700">Delay lower priority SKUs</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Owner: Factory Ops</span>
              <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Open in Decision Center</button>
            </div>
          </div>

          <!-- Decision 2: Alternative Material -->
          <div class="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-bold text-slate-900">Alternative Material Opportunity</span>
                  <span class="text-xs text-slate-500">• Product B</span>
                </div>
                <div class="text-sm text-slate-700">Primary supplier delay detected — second supplier available with +2% cost impact</div>
              </div>
            </div>
            <div class="bg-white border border-blue-200 rounded-lg p-3 mb-3">
              <div class="text-xs font-semibold text-slate-700 mb-2">Decision Candidate: Use alternate supplier or wait for original delivery</div>
              <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>• Shipment risk reduced by 60% if alternative used</div>
                <div>• FV cost increase estimated at +2%</div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Owner: Sourcing</span>
              <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Open in Decision Center</button>
            </div>
          </div>

          <!-- Decision 3: Demand Signal Shift -->
          <div class="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-bold text-slate-900">Demand Signal Shift</span>
                  <span class="text-xs text-slate-500">• Product D</span>
                </div>
                <div class="text-sm text-slate-700">Demand forecast decreased by 15% — overproduction risk</div>
              </div>
            </div>
            <div class="bg-white border border-blue-200 rounded-lg p-3 mb-3">
              <div class="text-xs font-semibold text-slate-700 mb-2">Decision Candidate: Adjust production plan or maintain buffer</div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Owner: Demand Planning</span>
              <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Open in Decision Center</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- Section 3: Operational Updates -->
      <!-- ============================================================ -->
      <div class="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
        <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-800">Operational Updates</h2>
            <span class="ml-auto px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">3 Updates</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">Important execution changes that do not require immediate decisions</p>
        </div>

        <div class="p-5 space-y-3">
          <!-- Update 1: Engineering Change -->
          <div class="flex items-start gap-4 border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg">🔧</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold text-slate-900">Engineering Change Released</span>
                <span class="text-xs text-slate-500">• Hypernova</span>
              </div>
              <div class="text-sm text-slate-600">ECO-142 assembly process update — new torque specification for hinge module</div>
              <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>Effective starting W05</span>
                <span>Owner: Engineering</span>
              </div>
            </div>
          </div>

          <!-- Update 2: NPI Milestone -->
          <div class="flex items-start gap-4 border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-lg">✅</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold text-slate-900">NPI Milestone Achieved</span>
                <span class="text-xs text-slate-500">• SmartGlass V2</span>
              </div>
              <div class="text-sm text-slate-600">Line qualification completed — production ramp ready</div>
              <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>Owner: Factory Ops</span>
              </div>
            </div>
          </div>

          <!-- Update 3: Factory Capacity -->
          <div class="flex items-start gap-4 border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg">🏭</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-bold text-slate-900">Factory Capacity Update</span>
                <span class="text-xs text-slate-500">• Shenzhen Campus</span>
              </div>
              <div class="text-sm text-slate-600">Line 4 available after maintenance — additional capacity available for next build cycle</div>
              <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>Owner: Site Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- Section: DRI Confirmation & Leader Feedback Loop -->
      <!-- ============================================================ -->
      <div class="bg-white border-2 border-indigo-200 rounded-xl overflow-hidden">
        <div class="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <h2 class="text-lg font-bold text-indigo-900">Information Review Loop</h2>
            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">L3 Validation</span>
          </div>
          <p class="text-xs text-indigo-700 mt-1">System-generated insights sent to DRI for confirmation before Leader review. Leaders can acknowledge, request clarification, or request more info.</p>
        </div>

        <div class="p-5 space-y-4">
          <!-- Item 1: Confirmed by DRI -->
          <div class="border border-emerald-200 rounded-xl overflow-hidden">
            <div class="bg-emerald-50 px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded">CONFIRMED</span>
                <span class="text-sm font-semibold text-slate-800">W04 Commit Risk Assessment — Product A</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">&#10003; Confirmed by Wei Chen (DRI)</span>
                <span>2h ago</span>
              </div>
            </div>
            <div class="px-4 py-3">
              <div class="bg-white border border-slate-100 rounded-lg p-3 mb-3">
                <div class="text-xs text-slate-500 mb-1 font-medium">System-Generated Insight (L3)</div>
                <div class="text-sm text-slate-700">Product A W04 commit gap at -15.5% (12,400 units). Primary driver: yield drop on WF-L1. Recovery options prepared with cost-benefit analysis.</div>
                <div class="mt-2 flex items-center gap-2">
                  <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded">AI Generated</span>
                  <span class="text-[10px] text-slate-400">Source: MES + Plan Engine | Updated: 45 min ago</span>
                </div>
              </div>
              <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-3">
                <div class="text-xs text-emerald-600 font-medium mb-1">DRI Comment (Wei Chen)</div>
                <div class="text-sm text-slate-700">Confirmed. PQE has identified root cause as solder joint defect. Containment action in progress, expecting partial yield recovery by tomorrow.</div>
              </div>
              <!-- Leader Actions -->
              <div class="border-t border-slate-100 pt-3">
                <div class="text-xs text-slate-500 mb-2 font-medium">Leader Response</div>
                <div class="flex gap-2 flex-wrap">
                  <button onclick="leaderAction(this, 'acknowledge')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700" style="cursor:pointer;">&#10003; Acknowledge</button>
                  <button onclick="leaderAction(this, 'clarify')" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50" style="cursor:pointer;">? Request Clarification</button>
                  <button onclick="leaderAction(this, 'more')" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50" style="cursor:pointer;">+ Request More Info</button>
                  <div class="ml-auto flex items-center gap-1">
                    <input type="text" class="border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Add comment...">
                    <button class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700" style="cursor:pointer;">Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Item 2: Pending DRI Confirmation -->
          <div class="border border-amber-200 rounded-xl overflow-hidden">
            <div class="bg-amber-50 px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">PENDING</span>
                <span class="text-sm font-semibold text-slate-800">IC-77 Material Shortage Impact — Product A</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Awaiting Sarah Wang (DRI)</span>
                <span>Sent 4h ago</span>
              </div>
            </div>
            <div class="px-4 py-3">
              <div class="bg-white border border-slate-100 rounded-lg p-3 mb-3">
                <div class="text-xs text-slate-500 mb-1 font-medium">System-Generated Insight (L3)</div>
                <div class="text-sm text-slate-700">IC-77 supplier ETA slip +2 days. Impact: 2,800 units input reduction → 2,520 output loss → W05 commit gap -5.2%. Three recovery options available (expedite $120k / partial $65k / wait $0).</div>
                <div class="mt-2 flex items-center gap-2">
                  <span class="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded">AI Generated</span>
                  <span class="text-[10px] text-slate-400">Source: Sourcing + Plan Engine | Updated: 4h ago</span>
                </div>
              </div>
              <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 flex items-center gap-2">
                <div class="animate-pulse w-2 h-2 bg-amber-500 rounded-full"></div>
                Waiting for DRI to confirm or supplement before making visible to Leader
              </div>
            </div>
          </div>

          <!-- Item 3: Leader has commented -->
          <div class="border border-blue-200 rounded-xl overflow-hidden">
            <div class="bg-blue-50 px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">CLARIFICATION</span>
                <span class="text-sm font-semibold text-slate-800">VN02 Labor Fill Rate — Weekend OT</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">&#10003; Confirmed by James Li (DRI)</span>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Leader asked for clarification</span>
              </div>
            </div>
            <div class="px-4 py-3">
              <div class="bg-white border border-slate-100 rounded-lg p-3 mb-3">
                <div class="text-xs text-slate-500 mb-1 font-medium">System-Generated Insight (L3)</div>
                <div class="text-sm text-slate-700">VN02 weekend OT fill rate at 87%. Impact: -13% UPH if unfilled. 3 open positions need to be covered for Saturday shift.</div>
              </div>
              <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2">
                <div class="text-xs text-blue-600 font-medium mb-1">Leader Comment (Director)</div>
                <div class="text-sm text-slate-700">What's the cost difference between agency temp workers vs internal OT for the 3 positions? Need this for OT budget approval.</div>
                <div class="text-[10px] text-slate-400 mt-1">1h ago</div>
              </div>
              <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 flex items-center gap-2">
                <div class="animate-pulse w-2 h-2 bg-amber-500 rounded-full"></div>
                DRI James Li is preparing updated cost comparison — new information cycle triggered
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- Section 4: Execution Calendar -->
      <!-- ============================================================ -->
      <div class="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
        <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 class="text-lg font-bold text-slate-800">Execution Calendar</h2>
          <p class="text-xs text-slate-500 mt-1">Near-term operational events that influence execution coordination</p>
        </div>

        <div class="p-5 space-y-3">
          <div class="flex items-start gap-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
            <div class="flex-shrink-0 text-center">
              <div class="text-xs font-bold text-blue-800 uppercase">Tue</div>
              <div class="text-lg font-bold text-blue-900">10:00</div>
              <div class="text-xs text-blue-600">AM</div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900">Weekly Commit Review</div>
              <div class="text-xs text-slate-600 mt-1">Review weekly Ex-Factory commit status</div>
              <div class="text-xs text-slate-500 mt-1">Owner: MO Team</div>
            </div>
          </div>

          <div class="flex items-start gap-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
            <div class="flex-shrink-0 text-center">
              <div class="text-xs font-bold text-green-800 uppercase">Thu</div>
              <div class="text-lg font-bold text-green-900">3:00</div>
              <div class="text-xs text-green-600">PM</div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900">NPI Ramp Readiness Review</div>
              <div class="text-xs text-slate-600 mt-1">Confirm ramp readiness for next build cycle — SmartGlass V2</div>
              <div class="text-xs text-slate-500 mt-1">Owner: Factory Ops + Engineering</div>
            </div>
          </div>

          <div class="flex items-start gap-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg p-4">
            <div class="flex-shrink-0 text-center">
              <div class="text-xs font-bold text-purple-800 uppercase">Fri</div>
              <div class="text-lg font-bold text-purple-900">11:00</div>
              <div class="text-xs text-purple-600">AM</div>
            </div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-900">Factory Operations Sync</div>
              <div class="text-xs text-slate-600 mt-1">Cross-functional alignment on production status and risks</div>
              <div class="text-xs text-slate-500 mt-1">Participants: MO / MPM / Planning / Engineering</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- Optional: AI Signal Summary -->
      <!-- ============================================================ -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-lg">🤖</div>
          <div class="flex-1">
            <div class="text-sm font-bold text-indigo-900 mb-2">AI Signal Summary</div>
            <div class="text-sm text-indigo-800 mb-3">AI detected <strong>3 operational signals</strong> that may affect this week's execution.</div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div class="bg-white border border-indigo-200 rounded-lg p-3">
                <div class="font-semibold text-slate-700 mb-1">Primary Constraint</div>
                <div class="text-slate-600">Yield drop on Hypernova assembly line</div>
              </div>
              <div class="bg-white border border-indigo-200 rounded-lg p-3">
                <div class="font-semibold text-slate-700 mb-1">Recommended Attention</div>
                <div class="text-slate-600">Review W04 commit protection scenario</div>
              </div>
              <div class="bg-white border border-indigo-200 rounded-lg p-3">
                <div class="font-semibold text-slate-700 mb-1">Potential Recovery</div>
                <div class="text-slate-600">Capacity reallocation may recover 3,000 units</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

}

// Quick Notify toggle
window.toggleQuickNotify = function(notifyId) {
  const panel = document.getElementById(notifyId);
  if (!panel) return;
  panel.classList.toggle('hidden');
};

// Toggle @mention selection
window.toggleMention = function(btn) {
  if (btn.classList.contains('bg-blue-100')) {
    btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-800');
    btn.classList.add('bg-slate-100', 'border-slate-200', 'text-slate-700');
  } else {
    btn.classList.remove('bg-slate-100', 'border-slate-200', 'text-slate-700');
    btn.classList.add('bg-blue-100', 'border-blue-300', 'text-blue-800');
  }
};

// Send quick notification (demo)
window.sendQuickNotify = function(notifyId) {
  const panel = document.getElementById(notifyId);
  if (!panel) return;
  const selected = panel.querySelectorAll('.bg-blue-100');
  if (selected.length === 0) {
    alert('Please select at least one team member to notify.');
    return;
  }
  const names = Array.from(selected).map(b => b.textContent.trim()).join(', ');
  const msg = panel.querySelector('textarea').value;
  const contextLabel = panel.querySelector('.text-emerald-800').nextElementSibling.textContent.trim();

  // Show success feedback
  panel.innerHTML = '<div class="flex items-center gap-3 py-2"><div class="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div><div><div class="text-xs font-bold text-emerald-800">Notification sent successfully</div><div class="text-xs text-slate-600 mt-0.5">Notified: ' + names + '</div></div></div>';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    panel.classList.add('hidden');
    // Re-render to reset panel state
    renderNotification();
  }, 3000);
};

// Leader action on DRI-confirmed items
window.leaderAction = function(btn, action) {
  var container = btn.closest('.border-t');
  if (!container) return;
  var labels = { acknowledge: 'Acknowledged', clarify: 'Clarification Requested', more: 'More Info Requested' };
  var colors = { acknowledge: 'bg-emerald-100 text-emerald-800', clarify: 'bg-blue-100 text-blue-800', more: 'bg-amber-100 text-amber-800' };
  container.innerHTML =
    '<div class="flex items-center gap-2 py-1">' +
      '<span class="px-2 py-1 text-xs font-bold rounded ' + (colors[action] || 'bg-slate-100 text-slate-700') + '">' + (labels[action] || action) + '</span>' +
      '<span class="text-xs text-slate-500">by Leader — just now</span>' +
    '</div>';
};

// Generate AI Alert Brief — uses the AI Drawer (same mechanism as openAIDrawer)
window.generateAlertBrief = function() {
  const drawerBody = document.getElementById('aiDrawerBody');
  const drawer = document.getElementById('aiDrawer');
  const backdrop = document.getElementById('aiDrawerBackdrop');
  if (!drawerBody || !drawer || !backdrop) return;

  // Show loading state
  drawerBody.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <div class="text-sm text-slate-600">Analyzing execution signals and generating brief...</div>
    </div>
  `;
  drawer.classList.remove('hidden');
  backdrop.classList.remove('hidden');

  // Simulate AI generation delay
  setTimeout(() => {
    drawerBody.innerHTML = `
      <div class="space-y-5">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">🤖</span>
            <h2 class="text-lg font-bold text-indigo-900">AI-Generated Alert Brief</h2>
            <span class="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-bold rounded">AI GENERATED</span>
          </div>
          <p class="text-xs text-indigo-700">Generated from 3 active execution alerts — ${new Date().toLocaleString()}</p>
        </div>

        <!-- Executive Summary -->
        <div>
          <div class="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Executive Summary</div>
          <div class="bg-white border border-indigo-200 rounded-lg p-4">
            <p class="text-sm text-slate-800 leading-relaxed">
              <strong>3 active execution risks</strong> have been detected across the factory network this week.
              The primary constraint is a <strong>yield degradation on Hypernova final assembly</strong>, placing 12,400 units at risk for the W04 shipment commit.
              A secondary material shortage (IC-77) affects SmartGlass V2 production input, and a logistics ETA slip threatens APAC shipment delivery for Product C.
              Immediate attention is required within the next <strong>24–48 hours</strong> to protect weekly delivery commitments.
            </p>
          </div>
        </div>

        <!-- Active Risks Table -->
        <div>
          <div class="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Active Risks Summary</div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse bg-white rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-slate-100">
                  <th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Severity</th>
                  <th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Alert</th>
                  <th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Program</th>
                  <th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Impact</th>
                  <th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Window</th>
                  <th class="text-left p-2.5 border border-slate-200 font-semibold text-slate-700">Owner</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="p-2.5 border border-slate-200"><span class="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold rounded text-xs">HIGH</span></td>
                  <td class="p-2.5 border border-slate-200 font-medium">Production Output Risk</td>
                  <td class="p-2.5 border border-slate-200">Hypernova</td>
                  <td class="p-2.5 border border-slate-200">12,400 units at risk</td>
                  <td class="p-2.5 border border-slate-200">24h</td>
                  <td class="p-2.5 border border-slate-200">Factory Ops</td>
                </tr>
                <tr>
                  <td class="p-2.5 border border-slate-200"><span class="px-1.5 py-0.5 bg-orange-100 text-orange-800 font-bold rounded text-xs">MED</span></td>
                  <td class="p-2.5 border border-slate-200 font-medium">Material Readiness Risk</td>
                  <td class="p-2.5 border border-slate-200">SmartGlass V2</td>
                  <td class="p-2.5 border border-slate-200">8,000 units exposed</td>
                  <td class="p-2.5 border border-slate-200">36h</td>
                  <td class="p-2.5 border border-slate-200">MPM</td>
                </tr>
                <tr>
                  <td class="p-2.5 border border-slate-200"><span class="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold rounded text-xs">HIGH</span></td>
                  <td class="p-2.5 border border-slate-200 font-medium">Shipment Delay Risk</td>
                  <td class="p-2.5 border border-slate-200">Product C</td>
                  <td class="p-2.5 border border-slate-200">APAC commit at risk</td>
                  <td class="p-2.5 border border-slate-200">48h</td>
                  <td class="p-2.5 border border-slate-200">China Delivery</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Key Decisions Required -->
        <div>
          <div class="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Key Decisions Required</div>
          <div class="space-y-2">
            <div class="bg-white border border-indigo-200 rounded-lg p-3 flex items-start gap-3">
              <div class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <div class="text-sm font-bold text-slate-900">Protect W04 Shipment Commit — Hypernova</div>
                <div class="text-xs text-slate-600 mt-0.5">Yield dropped from 86% to 70% on final assembly. Decision required within 24 hours to protect 12,400 units.</div>
                <div class="text-xs text-slate-500 mt-1">Owner: Factory Operations | Options: Shift capacity, partial build, delay low-priority SKUs</div>
              </div>
            </div>
            <div class="bg-white border border-indigo-200 rounded-lg p-3 flex items-start gap-3">
              <div class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <div class="text-sm font-bold text-slate-900">Material Sourcing Decision — SmartGlass V2</div>
                <div class="text-xs text-slate-600 mt-0.5">IC-77 supplier ETA slipped by 2 days. Alternate supplier available at +2% cost. Decision needed within 36 hours.</div>
                <div class="text-xs text-slate-500 mt-1">Owner: MPM / Sourcing | Options: Activate alternate supplier, reallocate CTB, delay production input</div>
              </div>
            </div>
            <div class="bg-white border border-indigo-200 rounded-lg p-3 flex items-start gap-3">
              <div class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <div class="text-sm font-bold text-slate-900">APAC Shipment Recovery — Product C</div>
                <div class="text-xs text-slate-600 mt-0.5">Logistics ETA delayed by 2 days. APAC commit miss probability: 65%. Decision required within 48 hours.</div>
                <div class="text-xs text-slate-500 mt-1">Owner: China Delivery Team | Options: Air freight, split shipment, delay lower-priority order</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommended Actions -->
        <div>
          <div class="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Recommended Immediate Actions</div>
          <div class="bg-white border border-indigo-200 rounded-lg p-4">
            <div class="space-y-2 text-sm text-slate-700">
              <div class="flex items-start gap-2">
                <span class="text-indigo-600 font-bold">1.</span>
                <span><strong>Factory Ops:</strong> Evaluate capacity shift from Line 3 to recover Hypernova output — estimated recovery of 3,200–7,000 units depending on scenario selected.</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-indigo-600 font-bold">2.</span>
                <span><strong>MPM / Sourcing:</strong> Confirm alternate supplier availability for IC-77 and assess FV cost impact before production input deadline.</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-indigo-600 font-bold">3.</span>
                <span><strong>China Delivery:</strong> Initiate air freight assessment for APAC shipment and identify orders eligible for priority split.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>🤖 Generated by FDOS AI</span>
            <span>•</span>
            <span>Based on 3 active signals, 3 execution chains, and 9 scenario options</span>
          </div>
          <div class="flex gap-2">
            <button onclick="copyAlertBrief()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Copy Brief</button>
            <button onclick="navigateTo('portfolio');" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">Open Decision Center</button>
          </div>
        </div>
      </div>
    `;
  }, 1500);
};

// Copy alert brief to clipboard
window.copyAlertBrief = function() {
  const briefContent = document.getElementById('aiDrawerBody');
  if (!briefContent) return;

  const text = briefContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btns = document.querySelectorAll('[onclick="copyAlertBrief()"]');
    btns.forEach(btn => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('bg-green-600');
      btn.classList.remove('bg-indigo-600', 'bg-white');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('bg-green-600');
        if (orig === 'Copy Brief') btn.classList.add('bg-indigo-600');
        else btn.classList.add('bg-white');
      }, 2000);
    });
  });
};

// Toggle execution chain visibility on Notification page
window.toggleExecutionChain = function(chainId) {
  const chain = document.getElementById(chainId);
  if (!chain) return;
  const parentCard = chain.closest('.border-l-4');
  const btn = parentCard ? parentCard.querySelector('[onclick*="toggleExecutionChain"]') : null;
  if (chain.classList.contains('hidden')) {
    chain.classList.remove('hidden');
    if (btn) btn.textContent = 'Hide Execution Chain';
  } else {
    chain.classList.add('hidden');
    if (btn) btn.textContent = 'Show Execution Chain';
  }
};
