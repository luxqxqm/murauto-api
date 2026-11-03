import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

export const User = model('User', userSchema);
