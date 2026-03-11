import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error: ', error);
    return { success: false, error: error.message };
  }
};

export const sendBookingConfirmation = async (booking) => {
  const year = new Date().getFullYear();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1F3A5F; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Sonic Treadmill Repairs</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Hyderabad's Treadmill & Gym Equipment Experts</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1F3A5F; margin-top: 0;">🎉 Booking Confirmed!</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #F97316; margin-top: 0;">Booking Details</h3>
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Name:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          <p><strong>Address:</strong> ${booking.address}, ${booking.city}</p>
          ${booking.preferredDate ? `<p><strong>Preferred Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString()}</p>` : ''}
          ${booking.preferredTime ? `<p><strong>Preferred Time:</strong> ${booking.preferredTime}</p>` : ''}
          ${booking.brand ? `<p><strong>Equipment Brand:</strong> ${booking.brand}</p>` : ''}
          ${booking.model ? `<p><strong>Equipment Model:</strong> ${booking.model}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">📞 What Happens Next?</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Our team will call you within 30 minutes</li>
            <li>We'll confirm the appointment time</li>
            <li>Technician will visit as scheduled</li>
            <li>Get your equipment repaired! 🚀</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="tel:+919999999999" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            📞 Call Us Now
          </a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>© ${year} Sonic Treadmill Repairs. All rights reserved.</p>
          <p>Hyderabad's most trusted treadmill & gym equipment repair service</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: booking.email,
    subject: `Booking Confirmed - ${booking.bookingId}`,
    html,
  });
};

export const sendContactNotification = async (contact) => {
  const year = new Date().getFullYear();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1F3A5F; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Sonic Treadmill Repairs</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">New Contact Form Submission</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1F3A5F; margin-top: 0;">📬 New Contact Message</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${contact.subject}</p>
          <div style="margin-top: 15px;">
            <strong>Message:</strong>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #F97316; margin-top: 5px;">${contact.message}</p>
          </div>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>© ${year} Sonic Treadmill Repairs. All rights reserved.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${contact.email}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            📧 Reply to Customer
          </a>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: process.env.EMAIL_USER, // Send to admin
    subject: `New Contact: ${contact.subject}`,
    html,
  });
};

export const sendContactConfirmation = async (contact) => {
  if (!contact.email) return { success: false, error: 'No email provided' };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1F3A5F; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Sonic Treadmill Repairs</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">We received your message</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1F3A5F; margin-top: 0;">Thank you for contacting us, ${contact.name || ''}!</h2>
        <p style="color:#333; line-height:1.6;">
          We’ve received your message and our team will get back to you within <strong>2 working hours</strong>.
        </p>
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0;">
          <p style="margin:0 0 8px 0;"><strong>Subject:</strong> ${contact.subject}</p>
          <p style="margin:0;"><strong>Your message:</strong></p>
          <p style="margin:8px 0 0 0; white-space:pre-line;">${contact.message}</p>
        </div>
        <p style="color:#555; line-height:1.6;">
          If your request is urgent, you can also call us directly on
          <a href="tel:+919000746240" style="color:#F97316; text-decoration:none;"><strong>+91 90007 46240</strong></a>.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: contact.email,
    subject: 'We have received your message – Sonic Treadmill Repairs',
    html,
  });
};

export const sendReviewNotification = async (review) => {
  const year = new Date().getFullYear();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1F3A5F; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Sonic Treadmill Repairs</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">New Customer Review</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1F3A5F; margin-top: 0;">⭐ New Review Submitted</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${review.name}</p>
          <p><strong>Email:</strong> ${review.email || 'Not provided'}</p>
          <p><strong>Service:</strong> ${review.service || 'Not specified'}</p>
          <p><strong>Rating:</strong> ${'⭐'.repeat(review.rating)} (${review.rating}/5)</p>
          <div style="margin-top: 15px;">
            <strong>Review:</strong>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #F97316; margin-top: 5px;">${review.review}</p>
          </div>
        </div>
        
        <div style="background: ${review.approved ? '#d4edda' : '#fff3cd'}; border: 1px solid ${review.approved ? '#c3e6cb' : '#ffeaa7'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: ${review.approved ? '#155724' : '#856404'};">
            <strong>Status:</strong> ${review.approved ? '✅ Approved' : '⏳ Pending Approval'}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://sonictreadmillrepairs.com/admin/login" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            🔐 Manage Reviews
          </a>
        </div>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>© ${year} Sonic Treadmill Repairs. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: process.env.EMAIL_USER, // Send to admin
    subject: `New Review: ${review.rating}/5 stars`,
    html,
  });
};

export const sendReviewThankYou = async (review) => {
  if (!review.email) return { success: false, error: 'No email provided' };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1F3A5F; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Sonic Treadmill Repairs</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Thank you for your review</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1F3A5F; margin-top: 0;">We appreciate your feedback, ${review.name || ''}!</h2>
        <p style="color:#333; line-height:1.6;">
          Thank you for taking the time to share your experience with Sonic Treadmill Repairs.
        </p>
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0;">
          <p style="margin:0 0 8px 0;"><strong>Rating:</strong> ${'⭐'.repeat(review.rating)} (${review.rating}/5)</p>
          <p style="margin:0;"><strong>Your review:</strong></p>
          <p style="margin:8px 0 0 0; white-space:pre-line;">${review.review}</p>
        </div>
        <p style="color:#555; line-height:1.6;">
          Your review will appear on our website after it is approved by our team.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: review.email,
    subject: 'Thank you for your review – Sonic Treadmill Repairs',
    html,
  });
};
