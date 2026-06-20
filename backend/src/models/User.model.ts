// src/models/User.model.ts [BACKEND]
import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id:               Types.ObjectId;
  name:              string;
  email:             string;
  password:          string;
  role:              'admin' | 'member' | 'viewer';
  avatar?:           string | null;
  isActive:          boolean;
  resetToken?:       string | null;
  resetTokenExpiry?: Date | null;
  createdAt:         Date;
  updatedAt:         Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be 80 characters or fewer'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      required: [true, 'Password is required'],
      select:   false, // never returned in queries unless explicitly selected
    },
    role: {
      type:    String,
      enum:    ['admin', 'member', 'viewer'],
      default: 'member',
    },
    avatar: {
      type:    String,
      default: null,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    resetToken: {
      type:    String,
      default: null,
    },
    resetTokenExpiry: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
const User = model<IUser>('User', userSchema);
export default User;