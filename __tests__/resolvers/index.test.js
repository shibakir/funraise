/**
 * Main file for all GraphQL resolvers tests
 * This file imports and runs all resolvers tests
 */

// import all resolvers tests
require('./authResolvers.test');
require('./eventResolvers.test');
require('./userResolvers.test');
require('./participationResolvers.test');
require('./achievementResolvers.test');
require('./subscriptionResolvers.test');

describe('GraphQL Resolvers Test Suite', () => {
  it('should run all resolvers tests', () => {
    // this test simply ensures that all test files are loaded
    expect(true).toBe(true);
  });
}); 