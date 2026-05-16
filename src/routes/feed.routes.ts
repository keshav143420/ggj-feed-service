import { Router } from 'express';
import { feedController } from '../controllers/feed.controller';

const router = Router();

router.get('/:userId', feedController.getFeed);

export default router;
