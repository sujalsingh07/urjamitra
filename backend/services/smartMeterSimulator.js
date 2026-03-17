/**
 * Smart Meter Telemetry Simulator
 * Simulates real-time energy generation & consumption for each prosumer.
 * Pushes data every 5 seconds via Socket.IO.
 * Also maintains a DISCOM meter log (in-memory DB for demo).
 */


const METER_TICK_INTERVAL = 5000; // 5 seconds
const User = require('../models/user');

// Auto-listing for surplus energy
const { autoCreateListing } = require('./autoListing');

// In-memory DISCOM meter log: { meterId: [{ timestamp, exportKwh, importKwh, netKwh }] }
const meterLogs = new Map();

// Active meter states: { userId: { meterId, generationKw, consumptionKw, surplusKw, totalExportToday, totalImportToday } }
const meterStates = new Map();
let ticksSincePersist = 0;

function hash01(input) {
  const str = String(input || '');
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function buildUserProfile(userId, isSeller) {
  const n1 = hash01(`${userId}:gen`);
  const n2 = hash01(`${userId}:cons`);
  const n3 = hash01(`${userId}:phase`);

  return {
    // All users have solar panels (residential prosumers). More realistic for P2P energy trading.
    baseGenerationKw: isSeller ? 5 + n1 * 5 : 2 + n1 * 4,  // Non-sellers: 2-6 kW, Sellers: 5-10 kW
    baseConsumptionKw: 1 + n2 * 2,  // Lowered: 1-3 kW (more realistic for household)
    phaseOffset: n3 * Math.PI * 2,
  };
}

/**
 * Register a user's meter with initial simulation parameters.
 * Called when a user logs in or when a listing is created.
 */
function registerMeter(userId, meterId, isSeller = false, persistedSnapshot = null) {
  if (meterStates.has(userId)) return; // Already registered

  const profile = buildUserProfile(userId, isSeller);
  const snapshot = persistedSnapshot && typeof persistedSnapshot === 'object'
    ? persistedSnapshot
    : null;
  const baseGeneration = Number.isFinite(Number(snapshot?.generationKw))
    ? Number(snapshot.generationKw)
    : profile.baseGenerationKw;
  const baseConsumption = Number.isFinite(Number(snapshot?.consumptionKw))
    ? Number(snapshot.consumptionKw)
    : profile.baseConsumptionKw;
  const totalExportToday = Number.isFinite(Number(snapshot?.totalExportToday))
    ? Number(snapshot.totalExportToday)
    : hash01(`${userId}:exp`) * 8;
  const totalImportToday = Number.isFinite(Number(snapshot?.totalImportToday))
    ? Number(snapshot.totalImportToday)
    : hash01(`${userId}:imp`) * 5;

  meterStates.set(userId, {
    meterId: snapshot?.meterId || meterId || `MTR-${userId.toString().substring(0, 8).toUpperCase()}`,
    generationKw: baseGeneration,
    consumptionKw: baseConsumption,
    surplusKw: +(baseGeneration - baseConsumption).toFixed(2),
    totalExportToday: +Number(totalExportToday).toFixed(4),
    totalImportToday: +Number(totalImportToday).toFixed(4),
    profile,
    lastUpdated: new Date()
  });

  if (!meterLogs.has(meterId || userId)) {
    meterLogs.set(meterId || userId, []);
  }
}

async function persistMeterSnapshots() {
  if (meterStates.size === 0) return;

  const now = new Date();
  const ops = Array.from(meterStates.entries()).map(([userId, state]) => ({
    updateOne: {
      filter: { _id: userId },
      update: {
        $set: {
          meterSnapshot: {
            meterId: state.meterId || '',
            generationKw: Number(state.generationKw || 0),
            consumptionKw: Number(state.consumptionKw || 0),
            surplusKw: Number(state.surplusKw || 0),
            totalExportToday: Number(state.totalExportToday || 0),
            totalImportToday: Number(state.totalImportToday || 0),
            updatedAt: now
          }
        }
      }
    }
  }));

  await User.bulkWrite(ops, { ordered: false });
}

function consumeUnusedEnergy(userId, unitsToConsume) {
  const state = meterStates.get(userId);
  if (!state) return null;

  const requested = Number(unitsToConsume || 0);
  if (!Number.isFinite(requested) || requested <= 0) return state;

  const currentUnused = Math.max(0, Number(state.totalExportToday || 0) - Number(state.totalImportToday || 0));
  const consumed = Math.min(currentUnused, requested);
  const nextExport = Math.max(Number(state.totalImportToday || 0), Number(state.totalExportToday || 0) - consumed);

  const nextState = {
    ...state,
    totalExportToday: +nextExport.toFixed(4),
    lastUpdated: new Date()
  };

  meterStates.set(userId, nextState);
  persistMeterSnapshots().catch(() => {});
  return nextState;
}

/**
 * Tick: update all meter states with realistic fluctuations
 */
function tickMeters() {
  const now = new Date();
  const tSec = now.getTime() / 1000;
  
  for (const [userId, state] of meterStates.entries()) {
    let newGeneration, newConsumption, newSurplus;
    const p = state.profile || buildUserProfile(userId, state.generationKw > 2);

    // Solar generation follows realistic Pune, India sun curve
    // Sunrise: 6:30 AM, Peak: 12:15 PM (noon), Sunset: 6:30 PM
    const hourOfDay = now.getHours() + now.getMinutes() / 60;
    const sunriseHour = 6.5;   // 6:30 AM
    const sunsetHour = 18.5;   // 6:30 PM
    const dayDuration = sunsetHour - sunriseHour;  // 12 hours
    const solarFactor = Math.max(0, Math.sin(Math.PI * (hourOfDay - sunriseHour) / dayDuration));
    
    const genWave = 0.35 * Math.sin(tSec / 37 + p.phaseOffset);
    const genNoise = (Math.random() - 0.5) * 0.25;
    newGeneration = Math.max(0, p.baseGenerationKw * solarFactor + genWave + genNoise);

    // Consumption is more stable (less wave oscillation) so surplus grows during peak hours.
    const consWave = 0.15 * Math.sin(tSec / 53 + p.phaseOffset / 2);  // Reduced from 0.45 to 0.15
    const consNoise = (Math.random() - 0.5) * 0.1;  // Reduced from 0.2 to 0.1
    newConsumption = Math.max(0.3, p.baseConsumptionKw + consWave + consNoise);

    // Keep deficit negative so each user can show import vs export behavior.
    newSurplus = newGeneration - newConsumption;

    // kWh exported in this 5-second window
    const exportThisTick = newSurplus > 0 ? (newSurplus / 3600) * (METER_TICK_INTERVAL / 1000) : 0;
    const importThisTick = newSurplus < 0 ? (Math.abs(newSurplus) / 3600) * (METER_TICK_INTERVAL / 1000) : 0;

    meterStates.set(userId, {
      ...state,
      generationKw: +newGeneration.toFixed(2),
      consumptionKw: +newConsumption.toFixed(2),
      surplusKw: +newSurplus.toFixed(2),
      totalExportToday: +(state.totalExportToday + exportThisTick).toFixed(4),
      totalImportToday: +(state.totalImportToday + importThisTick).toFixed(4),
      profile: p,
      lastUpdated: now
    });

    // Auto-create listing if surplus is positive and no active listing exists
    if (+newSurplus.toFixed(2) > 0) {
      // Fetch user location from state if available
      const userLocation = state.location || {};
      autoCreateListing(userId, +newSurplus.toFixed(2), userLocation).catch(() => {});
    }

    // Append to DISCOM meter log
    const logKey = state.meterId;
    if (!meterLogs.has(logKey)) meterLogs.set(logKey, []);
    const log = meterLogs.get(logKey);
    log.push({
      timestamp: now,
      exportKwh: +exportThisTick.toFixed(5),
      importKwh: +importThisTick.toFixed(5),
      netKwh: +(exportThisTick - importThisTick).toFixed(5),
      generationKw: newGeneration,
      consumptionKw: newConsumption
    });
    // Keep only last 500 records per meter
    if (log.length > 500) log.splice(0, log.length - 500);
  }

  ticksSincePersist += 1;
  if (ticksSincePersist >= 6) {
    ticksSincePersist = 0;
    persistMeterSnapshots().catch(() => {});
  }
}

/**
 * Verify DISCOM logs: Check if a meter exported >= requiredKwh in the last N minutes
 */
function verifyMeterExport(meterId, requiredKwh, windowMinutes = 15) {
  const log = meterLogs.get(meterId);
  if (!log || log.length === 0) {
    return { verified: false, actualExport: 0, message: 'No meter logs found' };
  }

  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
  const recentLogs = log.filter(entry => new Date(entry.timestamp) >= cutoff);
  
  const totalExport = recentLogs.reduce((sum, e) => sum + (e.exportKwh || 0), 0);
  const verified = totalExport >= requiredKwh;

  return {
    verified,
    actualExport: +totalExport.toFixed(4),
    requiredExport: requiredKwh,
    windowMinutes,
    recordsChecked: recentLogs.length,
    message: verified
      ? `✅ Export confirmed: ${totalExport.toFixed(3)} kWh exported (required ${requiredKwh} kWh)`
      : `❌ Insufficient export: only ${totalExport.toFixed(3)} kWh in last ${windowMinutes} min`
  };
}

/**
 * Get current meter state for a user
 */
function getMeterState(userId) {
  return meterStates.get(userId) || null;
}

/**
 * Get all active meter states (for broadcast)
 */
function getAllMeterStates() {
  const result = {};
  for (const [userId, state] of meterStates.entries()) {
    result[userId] = state;
  }
  return result;
}

/**
 * Force-seed a meter state (for demo: set Arun as high-solar producer)
 */
function seedMeterForDemo(userId, generationKw, consumptionKw) {
  const existing = meterStates.get(userId);
  if (existing) {
    const p = existing.profile || buildUserProfile(userId, true);
    meterStates.set(userId, {
      ...existing,
      generationKw: +generationKw,
      consumptionKw: +consumptionKw,
      surplusKw: +(generationKw - consumptionKw).toFixed(2),
      profile: {
        ...p,
        baseGenerationKw: +generationKw,
        baseConsumptionKw: +consumptionKw,
      }
    });
  }
}

/**
 * Start the telemetry simulation loop
 */
function startSimulator(io) {
  console.log('⚡ Smart Meter Simulator starting...');
  
  const intervalId = setInterval(() => {
    tickMeters();
    const states = getAllMeterStates();
    
    // Broadcast telemetry to all connected clients
    if (io) {
      io.emit('telemetry:update', {
        timestamp: new Date().toISOString(),
        meters: states
      });
    }
  }, METER_TICK_INTERVAL);

  return intervalId;
}

module.exports = {
  registerMeter,
  verifyMeterExport,
  getMeterState,
  getAllMeterStates,
  startSimulator,
  seedMeterForDemo,
  consumeUnusedEnergy,
  meterStates,
  meterLogs
};
