import { Schema, model } from 'mongoose';

export const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const SLOT_STEPS = [15, 30, 60];

// Times are "HH:mm" in Europe/Kyiv, the workshop's local time
const daySchema = new Schema(
  {
    isDayOff: { type: Boolean, default: false },
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' },
  },
  { _id: false },
);

const workingDay = (open, close) => ({
  type: daySchema,
  default: () => ({ isDayOff: false, open, close }),
});

const settingsSchema = new Schema(
  {
    workingHours: {
      monday: workingDay('08:00', '18:00'),
      tuesday: workingDay('08:00', '18:00'),
      wednesday: workingDay('08:00', '18:00'),
      thursday: workingDay('08:00', '18:00'),
      friday: workingDay('08:00', '18:00'),
      saturday: workingDay('09:00', '15:00'),
      sunday: {
        type: daySchema,
        default: () => ({ isDayOff: true, open: '09:00', close: '15:00' }),
      },
    },
    slotStepMin: { type: Number, enum: SLOT_STEPS, default: 30 },
    postsCount: { type: Number, min: 1, max: 10, default: 1 },
    // Calendar dates "YYYY-MM-DD" in Kyiv time, e.g. holidays or vacation
    daysOff: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export const Settings = model('Settings', settingsSchema);

// There is only one settings document; it is created with defaults on first use
export const getSettings = () =>
  Settings.findOneAndUpdate(
    {},
    {},
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
