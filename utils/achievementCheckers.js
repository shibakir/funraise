const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Функции для проверки различных типов критериев достижений
 */
const achievementCheckers = {
  /**
   * Проверяет достижение "Наибольший банк" - накопление определенной суммы
   * @param {number} id - ID пользователя
   * @param {number} criterionId - ID критерия
   * @param {number} criteriaValue - Требуемая сумма
   * @returns {Promise<boolean>} - Выполнен ли критерий
   */
  async checkBiggestBank(id, criterionId, criteriaValue) {
    // Получаем все транзакции пользователя
    const transactions = await prisma.transaction.findMany({
      where: { userId: id }
    });
    
    // Считаем текущий баланс
    const currentBalance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Проверяем, достиг ли пользователь требуемой суммы
    const isCompleted = currentBalance >= criteriaValue;
    
    if (isCompleted) {
      await updateCriterionProgress(id, criterionId, currentBalance, true);
    } else {
      await updateCriterionProgress(id, criterionId, currentBalance, false);
    }
    
    return isCompleted;
  },
  
  /**
   * Проверяет достижение "Одновременное участие" - участие в нескольких событиях одновременно
   * @param {number} id - ID пользователя
   * @param {number} criterionId - ID критерия
   * @param {number} criteriaValue - Требуемое количество одновременных событий
   * @returns {Promise<boolean>} - Выполнен ли критерий
   */
  async checkSimultaneousParticipation(id, criterionId, criteriaValue) {
    // Получаем текущие активные участия пользователя
    const activeParticipations = await prisma.participation.findMany({
      where: {
        userId: id,
        event: {
          status: 'ACTIVE' // Предполагается, что у событий есть статус ACTIVE
        }
      }
    });
    
    const currentCount = activeParticipations.length;
    const isCompleted = currentCount >= criteriaValue;
    
    if (isCompleted) {
      await updateCriterionProgress(id, criterionId, currentCount, true);
    } else {
      await updateCriterionProgress(id, criterionId, currentCount, false);
    }
    
    return isCompleted;
  },
  
  /**
   * Проверяет достижение "Ветеран платформы" - время с момента регистрации
   * @param {number} id - ID пользователя
   * @param {number} criterionId - ID критерия
   * @param {number} criteriaValue - Требуемое количество дней
   * @returns {Promise<boolean>} - Выполнен ли критерий
   */
  async checkPlatformVeteran(id, criterionId, criteriaValue) {
    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) return false;
    
    // Вычисляем количество дней с момента регистрации
    const registrationDate = new Date(user.createdAt);
    const currentDate = new Date();
    
    const diffTime = currentDate - registrationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const isCompleted = diffDays >= criteriaValue;
    
    if (isCompleted) {
      await updateCriterionProgress(id, criterionId, diffDays, true);
    } else {
      await updateCriterionProgress(id, criterionId, diffDays, false);
    }
    
    return isCompleted;
  },
  
  /**
   * Проверяет достижение "Количество пожертвований" - сколько раз пользователь делал пожертвования
   * @param {number} id - ID пользователя
   * @param {number} criterionId - ID критерия
   * @param {number} criteriaValue - Требуемое количество пожертвований
   * @returns {Promise<boolean>} - Выполнен ли критерий
   */
  async checkDonationsCount(id, criterionId, criteriaValue) {
    // Получаем участия пользователя в событиях типа DONATION
    const donations = await prisma.participation.count({
      where: {
        userId: id,
      }
    });
    
    const isCompleted = donations >= criteriaValue;
    
    if (isCompleted) {
      await updateCriterionProgress(id, criterionId, donations, true);
    } else {
      await updateCriterionProgress(id, criterionId, donations, false);
    }
    
    return isCompleted;
  },
  
  /**
   * Проверяет достижение "Сумма пожертвований" - общая сумма пожертвований
   * @param {number} id - ID пользователя
   * @param {number} criterionId - ID критерия
   * @param {number} criteriaValue - Требуемая сумма пожертвований
   * @returns {Promise<boolean>} - Выполнен ли критерий
   */
  async checkDonationsSum(id, criterionId, criteriaValue) {
    // Получаем участия пользователя в событиях типа DONATION
    const donations = await prisma.participation.findMany({
      where: {
        userId: id,
      }
    });
    
    // Суммируем все пожертвования
    const totalDonations = donations.reduce((sum, donation) => sum + donation.deposit, 0);
    
    const isCompleted = totalDonations >= criteriaValue;
    
    if (isCompleted) {
      await updateCriterionProgress(id, criterionId, totalDonations, true);
    } else {
      await updateCriterionProgress(id, criterionId, totalDonations, false);
    }
    
    return isCompleted;
  },
  
  /**
   * Проверяет достижение "Серия дней" - посещение платформы несколько дней подряд
   * @param {number} id - ID пользователя
   * @param {number} criterionId - ID критерия
   * @param {number} criteriaValue - Требуемое количество дней подряд
   * @returns {Promise<boolean>} - Выполнен ли критерий
   */
  async checkDayStreak(id, criterionId, criteriaValue) {
    // Для этой проверки потребуется дополнительная логика в приложении,
    // которая будет отслеживать дни активности пользователя
    // Здесь представлена упрощенная версия
    
    // Предположим, что у нас есть таблица или поле в пользователе, которое хранит текущую серию дней
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    // TODO: тут нужно посмотреть все отрицательные транзакции пользователя по дате и взять все создания ивентов по дате

    // В реальном приложении здесь бы была логика проверки серии дней
    // Для примера, представим, что это поле существует
    const currentStreak = user.dayStreak || 0;
    
    const isCompleted = currentStreak >= criteriaValue;
    
    if (isCompleted) {
      await updateCriterionProgress(id, criterionId, currentStreak, true);
    } else {
      await updateCriterionProgress(id, criterionId, currentStreak, false);
    }
    
    return isCompleted;
  }
};

/**
 * Вспомогательная функция для обновления прогресса пользователя по критерию
 * @param {number} id - ID пользователя
 * @param {number} criterionId - ID критерия
 * @param {number} currentValue - Текущее значение прогресса
 * @param {boolean} isCompleted - Выполнен ли критерий
 */
async function updateCriterionProgress(id, criterionId, currentValue, isCompleted) {
  try {
    // Находим UserAchievement для данного пользователя и Achievement, к которому относится критерий
    const criterion = await prisma.achievementCriterion.findUnique({
      where: { id: criterionId },
      include: { achievement: true }
    });
    
    if (!criterion) return;
    
    // Находим или создаем UserAchievement
    let userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: id,
          achievementId: criterion.achievementId
        }
      }
    });
    
    if (!userAchievement) {
      userAchievement = await prisma.userAchievement.create({
        data: {
          userId: id,
          achievementId: criterion.achievementId,
          status: 'IN_PROGRESS'
        }
      });
    }
    
    // Находим или создаем UserCriterionProgress
    const progressData = {
      userAchievementId: userAchievement.id,
      criterionId,
      currentValue,
      isCompleted
    };
    
    await prisma.userCriterionProgress.upsert({
      where: {
        userAchievementId_criterionId: {
          userAchievementId: userAchievement.id,
          criterionId
        }
      },
      update: {
        currentValue,
        isCompleted,
        ...(isCompleted && !progressData.completedAt ? { completedAt: new Date() } : {})
      },
      create: {
        ...progressData,
        ...(isCompleted ? { completedAt: new Date() } : {})
      }
    });
    
    // Проверяем, выполнены ли все критерии для данного достижения
    await updateAchievementStatus(userAchievement.id);
  } catch (error) {
    console.error('Error updating criterion progress:', error);
  }
}

/**
 * Обновляет статус достижения пользователя на основе прогресса всех критериев
 * @param {number} userAchievementId - ID достижения пользователя
 */
async function updateAchievementStatus(userAchievementId) {
  try {
    // Получаем все критерии прогресса для данного достижения пользователя
    const criteriaProgress = await prisma.userCriterionProgress.findMany({
      where: { userAchievementId }
    });
    
    // Проверяем, все ли критерии выполнены
    const allCompleted = criteriaProgress.length > 0 && criteriaProgress.every(cp => cp.isCompleted);
    
    if (allCompleted) {
      // Обновляем статус достижения
      await prisma.userAchievement.update({
        where: { id: userAchievementId },
        data: {
          status: 'COMPLETED',
          unlockedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error updating achievement status:', error);
  }
}

/**
 * Проверяет все критерии определенного типа для пользователя
 * @param {string} criteriaType - Тип критерия
 * @param {number} id - ID пользователя
 */
async function checkCriteriaByType(criteriaType, id) {
  try {
    // Получаем все критерии данного типа
    const criteria = await prisma.achievementCriterion.findMany({
      where: { criteriaType }
    });
    
    // Выбираем соответствующую функцию проверки
    let checkerFunction;
    switch (criteriaType) {
      case 'BIGGEST_BANK':
        checkerFunction = achievementCheckers.checkBiggestBank;
        break;
      case 'SIMULTANEOUS_PARTICIPATION':
        checkerFunction = achievementCheckers.checkSimultaneousParticipation;
        break;
      case 'PLATFORM_VETERAN':
        checkerFunction = achievementCheckers.checkPlatformVeteran;
        break;
      case 'DONATIONS_COUNT':
        checkerFunction = achievementCheckers.checkDonationsCount;
        break;
      case 'DONATIONS_SUM':
        checkerFunction = achievementCheckers.checkDonationsSum;
        break;
      case 'DAY_STREAK':
        checkerFunction = achievementCheckers.checkDayStreak;
        break;
      default:
        return; // Неизвестный тип критерия
    }
    
    // Проверяем все критерии данного типа
    for (const criterion of criteria) {
      await checkerFunction(id, criterion.id, criterion.criteriaValue);
    }
  } catch (error) {
    console.error(`Error checking type of criterium ${criteriaType}:`, error);
  }
}

/**
 * Проверяет все критерии для пользователя
 * @param {number} id - ID пользователя
 */
async function checkAllAchievements(id) {
  const criteriaTypes = [
    'BIGGEST_BANK',
    'SIMULTANEOUS_PARTICIPATION',
    'PLATFORM_VETERAN',
    'DONATIONS_COUNT',
    'DONATIONS_SUM',
    'DAY_STREAK'
  ];
  
  for (const type of criteriaTypes) {
    await checkCriteriaByType(type, id);
  }
}

module.exports = {
  achievementCheckers,
  checkCriteriaByType,
  checkAllAchievements
}; 