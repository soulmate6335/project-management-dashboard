// src/models/Task.model.ts
import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export type TaskStatus   = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ITask extends Document {
  _id:         Types.ObjectId;
  project:     Types.ObjectId;
  title:       string;
  description?: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assignee?:   Types.ObjectId;
  reporter:    Types.ObjectId;
  dueDate?:    Date;
  order:       number;
  tags:        string[];
  completedAt?: Date;
  createdAt:   Date;
  updatedAt:   Date;
}

export type TaskLean = Omit<ITask, keyof Document> & { _id: Types.ObjectId };

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const taskSchema = new Schema<ITask>(
  {
    project: {
      type:     Schema.Types.ObjectId,
      ref:      'Project',
      required: [true, 'Task must belong to a project'],
      index:    true,
    },
    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      minlength: [2,   'Title must be at least 2 characters'],
      maxlength: [200, 'Title must be 200 characters or fewer'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [5000, 'Description must be 5000 characters or fewer'],
    },
    status: {
      type:    String,
      enum:    ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index:   true,
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index:   true,
    },
    assignee: {
      type:  Schema.Types.ObjectId,
      ref:   'User',
      index: true,
    },
    reporter: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Task must have a reporter'],
    },
    dueDate: {
      type: Date,
    },
    // Tracks position within a board column — used for drag-and-drop ordering
    order: {
      type:    Number,
      default: 0,
    },
    tags: {
      type:    [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 10,
        message:   'A task cannot have more than 10 tags',
      },
    },
    // Set automatically when status transitions to 'done'
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// Primary board view — all tasks in a project, grouped by status
taskSchema.index({ project: 1, status: 1 });
// My tasks view — tasks assigned to a user
taskSchema.index({ assignee: 1, status: 1 });
// Ordered rendering within a column
taskSchema.index({ project: 1, status: 1, order: 1 });
// Due date calendar view
taskSchema.index({ project: 1, dueDate: 1 });
// Text search
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

// ---------------------------------------------------------------------------
// Middleware — auto-set completedAt on status transition
// ---------------------------------------------------------------------------
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = undefined;
    }
  }
  next();
});

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------
taskSchema.virtual('isOverdue').get(function (this: ITask) {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date() > this.dueDate;
});

const Task = model<ITask>('Task', taskSchema);
export default Task;