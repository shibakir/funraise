/**
 * Main test file for all services
 * Imports and runs all service tests
 */

// This file tests the service integration without running individual test suites
// Individual service tests are run separately

describe('Services Integration', () => {
    it('should load all services without errors', () => {
        // Check that all services can be imported
        const services = [
            require('../../service/UserService'),
            require('../../service/EventService'),
            require('../../service/ParticipationService'),
            require('../../service/TokenService'),
            require('../../service/AccountService'),
            require('../../service/AchievementService'),
            require('../../service/TransactionService'),
            require('../../service/EndConditionService')
        ];

        // Check that all services export objects
        services.forEach((service, index) => {
            expect(service).toBeDefined();
            expect(typeof service).toBe('object');
        });
    });

    it('should export all services from the index file', () => {
        const servicesIndex = require('../../service/index');
        
        // Check that all main services are exported
        expect(servicesIndex.userService).toBeDefined();
        expect(servicesIndex.eventService).toBeDefined();
        expect(servicesIndex.participationService).toBeDefined();
        expect(servicesIndex.tokenService).toBeDefined();
        expect(servicesIndex.accountService).toBeDefined();
        expect(servicesIndex.achievementService).toBeDefined();
        expect(servicesIndex.transactionService).toBeDefined();
        expect(servicesIndex.endConditionService).toBeDefined();
    });
}); 