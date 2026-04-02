const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

router.post("/submit", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    // 1. Configure Hostinger Email
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", // Outgoing server from your screenshot
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // support@aventratechsolution.com
        pass: process.env.EMAIL_PASS, // The password you just created
      },
    });

    // 2. Format the email
    const mailOptions = {
      from: `"Aventra System" <${process.env.EMAIL_USER}>`, 
      to: process.env.EMAIL_USER, // Send it to your support inbox
      replyTo: email, // Lets you easily reply to the student
      subject: `New Contact Form Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">New Message from Aventra Contact Form</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
            ${message}
          </div>
        </div>
      `,
    };

    // 3. Send it
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully!" });

  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

module.exports = router;