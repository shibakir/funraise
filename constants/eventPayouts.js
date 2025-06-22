/**
 * Event payout constants and configuration
 */

// Payout percentages for different event types (after commission)
const PAYOUT_PERCENTAGES = {
    DONATION: 0.96,      // 96% payout (4% commission)
    FUNDRAISING: 0.98,   // 98% payout (2% commission)
    JACKPOT: 0.90,       // 90% payout (10% commission)
    DEFAULT: 1.0         // 100% payout (fallback)
};

// Commission rates for different event types
const COMMISSION_RATES = {
    DONATION: 0.04,      // 4% commission
    FUNDRAISING: 0.02,   // 2% commission
    JACKPOT: 0.10,       // 10% commission
    DEFAULT: 0.0         // 0% commission (fallback)
};

// Jackpot randomness configuration
const JACKPOT_CONFIG = {
    RANDOMNESS_COEFFICIENT: 0.2,  // 20% of the bank as base 'tickets'
    MINIMUM_BASE_TICKETS: 5       // Minimum 5 'tickets' for fair selection
};

module.exports = {
    PAYOUT_PERCENTAGES,
    COMMISSION_RATES,
    JACKPOT_CONFIG
}; 