import mongoose, { Document, Schema } from 'mongoose';
import validator from 'validator';

export interface IFeedback extends Document {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
    },
    category: {
      type: String,
      enum: ['Bug', 'Feature Request', 'Improvement', 'Other'],
      required: [true, 'Category is required'],
    },
    status: {
      type: String,
      enum: ['New', 'In Review', 'Resolved'],
      default: 'New',
    },
    submitterName: { type: String, trim: true },
    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => !v || validator.isEmail(v),
        message: 'Invalid email format',
      },
    },
    ai_category: { type: String },
    ai_sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'] },
    ai_priority: { type: Number, min: 1, max: 10 },
    ai_summary: { type: String },
    ai_tags: [{ type: String }],
    ai_processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ ai_priority: -1 });
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ title: 'text', ai_summary: 'text' });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);