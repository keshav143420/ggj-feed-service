import { Request, Response } from 'express';
import { feedService } from '../services/feed.service';

export const feedController = {
  async getFeed(req: Request, res: Response) {
    try {
      const userId = req.params.userId as string;
      const page = Math.max(1, req.query.page ? parseInt(req.query.page as string) : 1);
      const limit = Math.max(1, req.query.limit ? parseInt(req.query.limit as string) : 20);

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const feed = await feedService.getFeed(userId, page, limit);

      return res.status(200).json({
        data: feed,
        page,
        limit,
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};
