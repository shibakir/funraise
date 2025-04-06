import express from 'express';
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../controllers/userController';

import {
    getUserAchievements,
    getUserAchievementById,
    initUserAchievement,
    updateCriterionProgress,
    //checkAndUpdateProgressByType
} from '../controllers/userAchievementController';

const router = express.Router();

// USER ROUTES
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

// USER ACHIEVEMENTS ROUTES
router.get('/:id/achievements', getUserAchievements);
router.get('/:id/achievements/:achievementId', getUserAchievementById);
router.post('/:id/achievements', initUserAchievement);
router.patch('/:id/progress/:progressId', updateCriterionProgress);
//router.post('/:id/achievements/check-progress', checkAndUpdateProgressByType);

export default router; 