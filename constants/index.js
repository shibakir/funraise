/**
 * Main constants export file
 * Exports all constants from the constants directory
 */

const eventPayouts = require('./eventPayouts');
const application = require('./application');

module.exports = {
    // Event payout constants
    ...eventPayouts,
    
    // Application constants
    ...application
}; 