import { Request, Response } from 'express';
import { Feedback } from '../models/feedback.model';
import { analyseFeedback, generateWeeklySummary } from '../services/gemini.service';

// Helper to build consistent API response
const apiResponse = (
  res: Response,
  status: number,
  success: boolean,
  data: unknown = null,
  message = '',
  error = ''
) =>
  res.status(status).json({ success, data, message, error });

// POST /api/feedback — Submit new feedback
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    // Basic input sanitisation
    if (!title?.trim() || !description?.trim() || !category) {
      apiResponse(res, 400, false, null, '', 'Title, description, and category are required');
      return;
    }

    if (description.trim().length < 20) {
      apiResponse(res, 400, false, null, '', 'Description must be at least 20 characters');
      return;
    }

    const feedback = await Feedback.create({
      title: title.trim().slice(0, 120),
      description: description.trim(),
      category,
      submitterName: submitterName?.trim(),
      submitterEmail: submitterEmail?.trim().toLowerCase(),
    });

    // Trigger AI analysis asynchronously — don't block response
    apiResponse(res, 201, true, feedback, 'Feedback submitted successfully');

    // Run Gemini in background after responding
    (async () => {
      const analysis = await analyseFeedback(feedback.title, feedback.description);
      if (analysis) {
        await Feedback.findByIdAndUpdate(feedback._id, {
          ai_category: analysis.category,
          ai_sentiment: analysis.sentiment,
          ai_priority: analysis.priority_score,
          ai_summary: analysis.summary,
          ai_tags: analysis.tags,
          ai_processed: true,
        });
      }
    })();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    if (message.includes('validation')) {
      apiResponse(res, 400, false, null, '', message);
    } else {
      apiResponse(res, 500, false, null, '', 'Failed to submit feedback');
    }
  }
};

// GET /api/feedback — Get all feedback (admin, supports filters + pagination)
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      status,
      sentiment,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (sentiment) filter.ai_sentiment = sentiment;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ai_summary: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'ai_priority', 'ai_sentiment'].includes(sortBy as string)
      ? sortBy as string
      : 'createdAt';

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    apiResponse(res, 200, true, {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to fetch feedback');
  }
};

// GET /api/feedback/stats — Stats bar data
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, open, avgPriorityResult, topTagResult] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: { $ne: 'Resolved' } }),
      Feedback.aggregate([
        { $match: { ai_priority: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$ai_priority' } } },
      ]),
      Feedback.aggregate([
        { $unwind: '$ai_tags' },
        { $group: { _id: '$ai_tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    apiResponse(res, 200, true, {
      total,
      open,
      averagePriority: avgPriorityResult[0]?.avg?.toFixed(1) ?? 'N/A',
      topTag: topTagResult[0]?._id ?? 'N/A',
    });
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to fetch stats');
  }
};

// GET /api/feedback/summary — AI weekly trend summary
export const getWeeklySummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFeedback = await Feedback.find({ createdAt: { $gte: sevenDaysAgo } })
      .select('title description ai_category')
      .limit(50)
      .lean();

    if (recentFeedback.length === 0) {
      apiResponse(res, 200, true, { summary: 'No feedback in the last 7 days.' });
      return;
    }

    const summary = await generateWeeklySummary(recentFeedback);
    apiResponse(res, 200, true, { summary: summary ?? 'Unable to generate summary at this time.' });
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to generate summary');
  }
};

// GET /api/feedback/:id — Get single feedback item
export const getFeedbackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Feedback.findById(req.params.id).lean();
    if (!item) {
      apiResponse(res, 404, false, null, '', 'Feedback not found');
      return;
    }
    apiResponse(res, 200, true, item);
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to fetch feedback');
  }
};

// PATCH /api/feedback/:id — Update status (admin only)
export const updateFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'In Review', 'Resolved'];

    if (!status || !validStatuses.includes(status)) {
      apiResponse(res, 400, false, null, '', `Status must be one of: ${validStatuses.join(', ')}`);
      return;
    }

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      apiResponse(res, 404, false, null, '', 'Feedback not found');
      return;
    }

    apiResponse(res, 200, true, updated, 'Status updated successfully');
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to update status');
  }
};

// POST /api/feedback/:id/reanalyse — Re-trigger AI analysis (admin only)
export const reanalyseFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) {
      apiResponse(res, 404, false, null, '', 'Feedback not found');
      return;
    }

    const analysis = await analyseFeedback(item.title, item.description);
    if (!analysis) {
      apiResponse(res, 502, false, null, '', 'Gemini analysis failed');
      return;
    }

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        ai_category: analysis.category,
        ai_sentiment: analysis.sentiment,
        ai_priority: analysis.priority_score,
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_processed: true,
      },
      { new: true }
    ).lean();

    apiResponse(res, 200, true, updated, 'Re-analysis complete');
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to re-analyse feedback');
  }
};

// DELETE /api/feedback/:id — Delete feedback (admin only)
export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      apiResponse(res, 404, false, null, '', 'Feedback not found');
      return;
    }
    apiResponse(res, 200, true, null, 'Feedback deleted successfully');
  } catch {
    apiResponse(res, 500, false, null, '', 'Failed to delete feedback');
  }
};
