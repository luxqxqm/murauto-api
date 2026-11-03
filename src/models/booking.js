import { Schema, model } from 'mongoose';

export const BOOKING_STATUSES = ['new', 'confirmed', 'done', 'canceled'];
export const BOOKING_SOURCES = ['site', 'phone'];

const bookingSchema = new Schema(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    // Stored in UTC (Date always is); converted to Kyiv time only for display and slots
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    clientName: { type: String, required: true, trim: true },
    // Always +380XXXXXXXXX, normalized by validation before saving
    phone: { type: String, required: true },
    car: { type: String, required: true, trim: true },
    plate: { type: String, trim: true },
    comment: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'new' },
    source: { type: String, enum: BOOKING_SOURCES, default: 'site' },
  },
  { timestamps: true, versionKey: false },
);

// Slots and the admin list always search bookings by time
bookingSchema.index({ startAt: 1 });
// Admin search by phone
bookingSchema.index({ phone: 1 });

export const Booking = model('Booking', bookingSchema);
