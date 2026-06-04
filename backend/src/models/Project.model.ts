// src/models/Project.model.ts
import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface IProjectMember {
  user: Types.ObjectId;
  role: 'editor' | 'viewer';
  joinedAt: Date;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: IProjectMember[];
  status: 'active' | 'archived';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Lean version — used when .lean() is called (no Mongoose Document methods)
export type ProjectLean = Omit<IProject, keyof Document> & { _id: Types.ObjectId };

// ---------------------------------------------------------------------------
// Sub-schema
// ---------------------------------------------------------------------------
const memberSchema = new Schema<IProjectMember>(
  {
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:     { type: String, enum: ['editor', 'viewer'], default: 'viewer' },
    joinedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Project schema
// ---------------------------------------------------------------------------
const projectSchema = new Schema<IProject>(
  {
    name: {
      type:      String,
      required:  [true, 'Project name is required'],
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [120, 'Name must be 120 characters or fewer'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Description must be 1000 characters or fewer'],
    },
    owner: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Project must have an owner'],
      index:    true,
    },
    members: {
      type:    [memberSchema],
      default: [],
    },
    status: {
      type:    String,
      enum:    ['active', 'archived'],
      default: 'active',
      index:   true,
    },
    progress: {
      type:    Number,
      min:     [0,   'Progress cannot be negative'],
      max:     [100, 'Progress cannot exceed 100'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// Power the "my projects" list query
projectSchema.index({ owner: 1, status: 1 });
// Power member-based lookups
projectSchema.index({ 'members.user': 1 });
// Text search on name + description
projectSchema.index({ name: 'text', description: 'text' });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------
projectSchema.virtual('memberCount').get(function (this: IProject) {
  return this.members.length;
});

const Project = model<IProject>('Project', projectSchema);
export default Project;