const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create achievements and their criteria
    const achievements = [
      {
        name: 'Banker',
        description: 'Accumulate a significant amount in the bank',
        iconUrl: '/icons/banker.png',
        criteria: [
          {
            criteriaType: 'BIGGEST_BANK',
            criteriaValue: 1000,
            description: 'Accumulate 1000 coins in the bank'
          },
          {
            criteriaType: 'BIGGEST_BANK',
            criteriaValue: 5000,
            description: 'Accumulate 5000 coins in the bank'
          }
        ]
      },
      {
        name: 'Active Participant',
        description: 'Participate in several events simultaneously',
        iconUrl: '/icons/active_participant.png',
        criteria: [
          {
            criteriaType: 'SIMULTANEOUS_PARTICIPATION',
            criteriaValue: 3,
            description: 'Participate in 3 events simultaneously'
          },
          {
            criteriaType: 'SIMULTANEOUS_PARTICIPATION',
            criteriaValue: 5,
            description: 'Participate in 5 events simultaneously'
          }
        ]
      },
      {
        name: 'Platform Veteran',
        description: 'Spend a long time on the platform',
        iconUrl: '/icons/veteran.png',
        criteria: [
          {
            criteriaType: 'PLATFORM_VETERAN',
            criteriaValue: 30,
            description: 'Registered on the platform for 30 days'
          },
          {
            criteriaType: 'PLATFORM_VETERAN',
            criteriaValue: 100,
            description: 'Registered on the platform for 100 days'
          }
        ]
      },
      {
        name: 'Generous Donor',
        description: 'Make many donations',
        iconUrl: '/icons/donor.png',
        criteria: [
          {
            criteriaType: 'DONATIONS_COUNT',
            criteriaValue: 5,
            description: 'Make 5 donations'
          },
          {
            criteriaType: 'DONATIONS_COUNT',
            criteriaValue: 20,
            description: 'Make 20 donations'
          }
        ]
      },
      {
        name: 'Patron',
        description: 'Donate a significant amount',
        iconUrl: '/icons/patron.png',
        criteria: [
          {
            criteriaType: 'DONATIONS_SUM',
            criteriaValue: 500,
            description: 'Donate a total of 500 coins'
          },
          {
            criteriaType: 'DONATIONS_SUM',
            criteriaValue: 2000,
            description: 'Donate a total of 2000 coins'
          }
        ]
      },
      {
        name: 'Regular User',
        description: 'Visit the platform regularly',
        iconUrl: '/icons/regular.png',
        criteria: [
          {
            criteriaType: 'DAY_STREAK',
            criteriaValue: 2,
            description: 'Visit the platform 2 days in a row'
          },
          {
            criteriaType: 'DAY_STREAK',
            criteriaValue: 7,
            description: 'Visit the platform 7 days in a row'
          }
        ]
      }
    ];

    for (const achievement of achievements) {
      const createdAchievement = await prisma.achievement.create({
        data: {
          name: achievement.name,
          description: achievement.description,
          iconUrl: achievement.iconUrl
        }
      });

      // Create criteria for achievement
      for (const criterion of achievement.criteria) {
        await prisma.achievementCriterion.create({
          data: {
            achievementId: createdAchievement.id,
            criteriaType: criterion.criteriaType,
            criteriaValue: criterion.criteriaValue,
            description: criterion.description
          }
        });
      }

      console.log(`Achievement created: ${achievement.name} with criteria`);
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
