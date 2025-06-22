const { Event, EventEndCondition, EndCondition } = require('../model');
const { userService } = require('../service');
const { EVENT_TYPES } = require('../constants/application');

async function seedTestData() {
    try {
        console.log('Seeding test data...');

        // Create test users
        const users = await Promise.all([
            // mock user DO NOT DELETE
            userService.create({
                email: 'user1@test.com',
                username: 'user1',
                password: 'password1',
            }),
            userService.create({
                email: 'user2@test.com',
                username: 'user2',
                password: 'password2',
            }),
            userService.create({
                email: 'user3@test.com',
                username: 'user3',
                password: 'password3',
            })
        ]);

        // Create events
        const events = await Promise.all([
            // Event 1: DONATION type
            Event.create({
                name: 'Support your Top streamer',
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                bankAmount: 0,
                status: 'IN_PROGRESS',
                type: EVENT_TYPES.DONATION,
                imageUrl: 'https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fh8uvrr60ues71.png',
                userId: users[0].id,
                recipientId: users[1].id
            }),
            // Event 2: FUNDRAISING type
            Event.create({
                name: 'School Fundraiser',
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                bankAmount: 0,
                status: 'IN_PROGRESS',
                type: EVENT_TYPES.FUNDRAISING,
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/First_primary_school_building_in_Nigeria_in_Badagry%2C_Nigeria.jpg',
                userId: users[1].id,
                recipientId: users[2].id
            }),
            // Event 3: JACKPOT type
            Event.create({
                name: 'London jackpot time!',
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                bankAmount: 0,
                status: 'IN_PROGRESS',
                type: EVENT_TYPES.JACKPOT,
                imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Canary-wharf-one.jpg',
                userId: users[2].id,
                recipientId: users[0].id
            })
        ]);

        // Create event end conditions
        for (const event of events) {
            const eventEndCondition = await EventEndCondition.create({
                eventId: event.id,
                isCompleted: false,
                isFailed: false
            });

            // Add different end conditions based on event type
            if (event.type === EVENT_TYPES.DONATION) {
                await EndCondition.create({
                    endConditionId: eventEndCondition.id,
                    name: 'BANK',
                    operator: 'GREATER_EQUALS',
                    value: '1000',
                    isCompleted: false
                });
            } else if (event.type === EVENT_TYPES.FUNDRAISING) {
                await EndCondition.create({
                    endConditionId: eventEndCondition.id,
                    name: 'PARTICIPATION',
                    operator: 'LESS_EQUALS',
                    value: '5',
                    isCompleted: false
                });
            } else if (event.type === EVENT_TYPES.JACKPOT) {
                await EndCondition.create({
                    endConditionId: eventEndCondition.id,
                    name: 'TIME',
                    operator: 'GREATER_EQUALS',
                    value: String(new Date('2025-06-30')),
                    isCompleted: false
                });
            }
        }

        console.log('Test data seeded successfully!');
    } catch (error) {
        console.error('Error seeding test data:', error);
        throw error;
    }
}

module.exports = seedTestData; 