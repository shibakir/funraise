/**
 * General application constants
 */

// File upload limits
const FILE_LIMITS = {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB in bytes
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// Authentication
const AUTH_CONFIG = {
    JWT_EXPIRES_IN: '15m',           // Access token expiration
    REFRESH_EXPIRES_IN: '7d',        // Refresh token expiration
    BCRYPT_SALT_ROUNDS: 12           // Password hashing rounds
};

// Validation limits
const VALIDATION_LIMITS = {
    USERNAME_MIN_LENGTH: 5,
    USERNAME_MAX_LENGTH: 30,
    PASSWORD_MIN_LENGTH: 5,
    PASSWORD_MAX_LENGTH: 100,
    EVENT_NAME_MIN_LENGTH: 3,
    EVENT_NAME_MAX_LENGTH: 100,
    EVENT_DESCRIPTION_MIN_LENGTH: 15,
    EVENT_DESCRIPTION_MAX_LENGTH: 1000
};

// Database pagination
const PAGINATION = {
    DEFAULT_LIMIT: 30,
    MAX_LIMIT: 100
};

// Event types
const EVENT_TYPES = {
    DONATION: 'DONATION',
    FUNDRAISING: 'FUNDRAISING',
    JACKPOT: 'JACKPOT'
};

// Event statuses
const EVENT_STATUSES = {
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'FINISHED',
    FAILED: 'FAILED'
};

// Transaction types
const TRANSACTION_TYPES = {
    BALANCE_INCOME: 'BALANCE_INCOME',
    BALANCE_OUTCOME: 'BALANCE_OUTCOME',
    EVENT_INCOME: 'EVENT_INCOME',
    EVENT_OUTCOME: 'EVENT_OUTCOME',
    GIFT: 'GIFT'
};

// Condition types and operators
const CONDITION_TYPES = {
    TIME: 'TIME',
    BANK: 'BANK',
    PARTICIPATION: 'PARTICIPATION'
};

const CONDITION_OPERATORS = {
    EQUALS: 'EQUALS',
    GREATER: 'GREATER',
    LESS: 'LESS',
    GREATER_EQUALS: 'GREATER_EQUALS',
    LESS_EQUALS: 'LESS_EQUALS'
};

module.exports = {
    FILE_LIMITS,
    AUTH_CONFIG,
    VALIDATION_LIMITS,
    PAGINATION,
    EVENT_TYPES,
    EVENT_STATUSES,
    TRANSACTION_TYPES,
    CONDITION_TYPES,
    CONDITION_OPERATORS
}; 
