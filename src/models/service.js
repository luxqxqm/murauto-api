import { Schema, model } from 'mongoose';

// Groups on the public price list are shown in this order
export const SERVICE_CATEGORIES = [
  'Шиномонтаж',
  'Ремонт',
  'Технічне обслуговування',
  'Діагностика',
];

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: SERVICE_CATEGORIES },
    price: { type: Number, required: true, min: 0, max: 100000 },
    isPriceFrom: { type: Boolean, default: false },
    durationMin: { type: Number, required: true, min: 10, max: 480 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

// Name is unique within a category
serviceSchema.index({ category: 1, name: 1 }, { unique: true });

export const Service = model('Service', serviceSchema);
