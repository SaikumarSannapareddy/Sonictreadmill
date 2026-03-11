import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true },
  brand: String, model: String, address: { type: String, required: true },
  city: { type: String, required: true },
  preferredDate: Date, preferredTime: String, description: String,
  status: { type: String, enum: ['pending','confirmed','in-progress','completed','cancelled'], default: 'pending' },
  bookingId: { type: String, unique: true },
  assignedTechnician: String, estimatedCost: Number, finalCost: Number,
  paymentStatus: { type: String, enum: ['unpaid','paid','partial'], default: 'unpaid' },
  notes: String,
}, { timestamps: true });
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) { const n = await mongoose.model('Booking').countDocuments(); this.bookingId = `FF${String(n+1001).padStart(5,'0')}`; }
  next();
});
export const Booking = mongoose.model('Booking', bookingSchema);

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new','read','replied'], default: 'new' },
  reply: String,
}, { timestamps: true });
export const Contact = mongoose.model('Contact', contactSchema);

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  service: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
}, { timestamps: true });
export const Review = mongoose.model('Review', reviewSchema);

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','technician'], default: 'admin' },
  lastLogin: Date,
}, { timestamps: true });
adminSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
adminSchema.methods.comparePassword = async function(p) { return await bcrypt.compare(p, this.password); };
export const Admin = mongoose.model('Admin', adminSchema);
