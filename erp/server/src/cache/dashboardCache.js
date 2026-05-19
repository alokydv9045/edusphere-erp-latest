const NodeCache = require('node-cache');

/**
 * Dashboard Cache — In-memory cache for dashboard stats
 * 
 * Reduces 40+ DB queries per dashboard load to 0 on cache hit.
 * TTL: 30 seconds — stats are reasonably fresh while avoiding DB storms.
 * 
 * Cache keys are per-role and per-user to ensure correct data isolation.
 */
const dashboardCache = new NodeCache({ stdTTL: 30, checkperiod: 60, useClones: true });

/**
 * Get cached dashboard stats
 * @param {string} role - User role
 * @param {string} userId - User ID (for student/teacher-specific stats)
 * @returns {object|undefined} Cached stats or undefined
 */
function getCachedStats(role, userId) {
  const key = `dashboard:${role}:${userId}`;
  return dashboardCache.get(key);
}

/**
 * Set dashboard stats in cache
 * @param {string} role - User role
 * @param {string} userId - User ID
 * @param {object} stats - Stats object to cache
 */
function setCachedStats(role, userId, stats) {
  const key = `dashboard:${role}:${userId}`;
  dashboardCache.set(key, stats);
}

/**
 * Invalidate dashboard cache for a specific user
 * @param {string} userId - User ID to invalidate
 */
function invalidateDashboardCache(userId) {
  const keys = dashboardCache.keys();
  keys.forEach(key => {
    if (key.includes(userId)) {
      dashboardCache.del(key);
    }
  });
}

/**
 * Invalidate all dashboard caches (e.g., after bulk operations)
 */
function invalidateAllDashboardCaches() {
  dashboardCache.flushAll();
}

module.exports = {
  getCachedStats,
  setCachedStats,
  invalidateDashboardCache,
  invalidateAllDashboardCaches,
};
