import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { Booking, Contact, Review, Admin } from '../models/index.js';
import { protect } from '../middleware/auth.js';
import {
  sendBookingConfirmation,
  sendContactNotification,
  sendContactConfirmation,
  sendReviewNotification,
  sendReviewThankYou,
} from '../config/email.js';

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── AUTH ───
export const authRouter = express.Router();
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    admin.lastLogin = new Date(); await admin.save();
    res.json({ success: true, token: sign(admin._id), admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
authRouter.get('/me', protect, (req, res) => res.json({ success: true, admin: req.admin }));
authRouter.get('/stats', protect, async (req, res) => {
  try {
    const [totalBookings, pendingBookings, completedBookings, totalContacts, totalReviews, recentBookings] = await Promise.all([
      Booking.countDocuments(), Booking.countDocuments({ status: 'pending' }), Booking.countDocuments({ status: 'completed' }),
      Contact.countDocuments({ status: 'new' }), Review.countDocuments({ approved: false }), Booking.find().sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ success: true, stats: { totalBookings, pendingBookings, completedBookings, totalContacts, totalReviews, recentBookings } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
authRouter.post('/setup', async (req, res) => {
  try {
    if (await Admin.countDocuments() > 0) return res.status(400).json({ message: 'Admin already exists. Use /login.' });
    const { username, email, password } = req.body;
    const admin = new Admin({ username, email, password });
    await admin.save();
    res.status(201).json({ success: true, token: sign(admin._id), message: 'Admin created! Login at /admin/login' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
authRouter.post('/reset-admin', async (req, res) => {
  try {
    await Admin.deleteMany({});
    const { username, email, password } = req.body;
    const admin = new Admin({ username, email, password });
    await admin.save();
    res.status(201).json({ success: true, token: sign(admin._id), message: 'Admin reset! Login at /admin/login' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
authRouter.get('/debug', async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password');
    res.json({ success: true, count: admins.length, admins });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── BOOKINGS ───
export const bookingRouter = express.Router();
bookingRouter.post('/', [body('name').trim().notEmpty(), body('email').isEmail(), body('phone').trim().notEmpty(), body('service').notEmpty(), body('address').trim().notEmpty(), body('city').trim().notEmpty()], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try { 
    const b = new Booking(req.body); 
    await b.save(); 
    
    // Send confirmation email
    await sendBookingConfirmation(b);
    
    res.status(201).json({ success: true, booking: b, message: `Confirmed! ID: ${b.bookingId}` }); 
  }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
bookingRouter.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Booking.countDocuments(filter);
    res.json({ success: true, bookings, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
bookingRouter.get('/track/:bookingId', async (req, res) => {
  try {
    const b = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!b) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking: b });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
bookingRouter.put('/:id', protect, async (req, res) => {
  try { const b = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, booking: b }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
bookingRouter.delete('/:id', protect, async (req, res) => {
  try { await Booking.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// ─── CONTACTS ───
export const contactRouter = express.Router();
contactRouter.post('/', [body('name').trim().notEmpty(), body('email').isEmail(), body('subject').notEmpty(), body('message').notEmpty()], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try { 
    const c = new Contact(req.body); 
    await c.save(); 
    
    // Send notification email to admin
    await sendContactNotification(c);

    // Send confirmation email to customer
    await sendContactConfirmation(c);
    
    res.status(201).json({ success: true, message: "Message sent! We'll reply within 2 hours." }); 
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});
contactRouter.get('/', protect, async (req, res) => { try { const c = await Contact.find().sort({ createdAt: -1 }); res.json({ success: true, contacts: c }); } catch (e) { res.status(500).json({ message: e.message }); } });
contactRouter.put('/:id', protect, async (req, res) => { try { const c = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, contact: c }); } catch (e) { res.status(500).json({ message: e.message }); } });

// ─── REVIEWS ───
export const reviewRouter = express.Router();
reviewRouter.post('/', [body('name').trim().notEmpty(), body('rating').isInt({ min: 1, max: 5 }), body('review').notEmpty()], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try { 
    const r = new Review(req.body); 
    await r.save(); 
    
    // Send notification email to admin
    await sendReviewNotification(r);

    // Send thank-you email to customer (if email provided)
    await sendReviewThankYou(r);
     res.status(201).json({ success: true, message: 'Thank you for your review! 🎉 We appreciate your feedback.' }); 
   
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});
reviewRouter.get('/public', async (req, res) => { try { const r = await Review.find({ approved: true }).sort({ createdAt: -1 }); res.json({ success: true, reviews: r }); } catch (e) { res.status(500).json({ message: e.message }); } });
reviewRouter.get('/', protect, async (req, res) => { try { const r = await Review.find().sort({ createdAt: -1 }); res.json({ success: true, reviews: r }); } catch (e) { res.status(500).json({ message: e.message }); } });
reviewRouter.put('/:id', protect, async (req, res) => { try { const r = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, review: r }); } catch (e) { res.status(500).json({ message: e.message }); } });
reviewRouter.delete('/:id', protect, async (req, res) => { try { await Review.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e) { res.status(500).json({ message: e.message }); } });
