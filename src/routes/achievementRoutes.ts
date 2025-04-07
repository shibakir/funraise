import express from 'express';
import {
  getAllAchievements,
  getAchievementById,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  addCriterionToAchievement,
  updateCriterion,
  deleteCriterion
} from '../controllers/achievementController';

const router = express.Router();

// controll abstract achievement
router.get('/', getAllAchievements);
router.get('/:id', getAchievementById);
router.post('/', createAchievement);
router.patch('/:id', updateAchievement);
router.delete('/:id', deleteAchievement);

// controll achievement criterion
router.post('/:id/criterions', addCriterionToAchievement);
router.patch('/criterions/:id', updateCriterion);
router.delete('/criterions/:id', deleteCriterion);

export default router; 