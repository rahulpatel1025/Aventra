const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,    // info@aventratechsolution.com
    pass: process.env.GMAIL_APP_PASS, // your Hostinger email password
  },
});

/**
 * Sends a purchase invoice + welcome email to the student
 */
async function sendInvoiceEmail({ toEmail, studentName, courseName, amount, paymentId, purchaseDate }) {
  const formattedDate = new Date(purchaseDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: #0f172a; padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.03em; }
        .header p { color: #94a3b8; margin: 8px 0 0; font-size: 14px; }
        .body { padding: 40px; }
        .welcome { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .subtitle { color: #475569; font-size: 15px; margin-bottom: 32px; }
        .invoice-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
        .invoice-box h3 { margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
        .invoice-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #475569; }
        .invoice-row.total { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 4px; font-weight: 700; font-size: 16px; color: #0f172a; }
        .badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 24px; }
        .features { margin-bottom: 28px; }
        .features h3 { font-size: 16px; color: #0f172a; margin-bottom: 12px; }
        .features ul { padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8; }
        .cta { text-align: center; margin: 32px 0; }
        .cta a { background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; }
        .footer a { color: #475569; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Aventra Tech Solutions</h1>
          <p>Payment Confirmation & Invoice</p>
        </div>

        <div class="body">
          <div class="welcome">Welcome aboard, ${studentName}! 🎉</div>
          <p class="subtitle">
            Your enrollment is confirmed. You now have full access to your course and dashboard.
          </p>

          <span class="badge">✅ Payment Successful</span>

          <div class="invoice-box">
            <h3>Invoice Details</h3>
            <div class="invoice-row">
              <span>Course</span>
              <span>${courseName}</span>
            </div>
            <div class="invoice-row">
              <span>Date</span>
              <span>${formattedDate}</span>
            </div>
            <div class="invoice-row">
              <span>Payment ID</span>
              <span style="font-family: monospace; font-size: 12px;">${paymentId}</span>
            </div>
            <div class="invoice-row">
              <span>Payment Method</span>
              <span>Razorpay</span>
            </div>
            <div class="invoice-row total">
              <span>Amount Paid</span>
              <span>${formattedAmount}</span>
            </div>
          </div>

          <div class="features">
            <h3>What's included in your program:</h3>
            <ul>
              <li>Industry-aligned curriculum built for real-world delivery</li>
              <li>Hands-on projects following production-grade standards</li>
              <li>Mentorship from experienced engineers and architects</li>
              <li>Resume-ready portfolio and deployment exposure</li>
              <li>Career guidance, interview preparation and placement support</li>
              <li><strong>100% paid internship after completion — else money back</strong></li>
            </ul>
          </div>

          <div class="cta">
            <a href="https://aventratechsolution.com/dashboard">Go to My Dashboard →</a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            Keep this email as your payment receipt. For any queries, reply to this email.
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Aventra Tech Solutions. All rights reserved.</p>
          <p><a href="https://aventratechsolution.com">aventratechsolution.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Aventra Tech Solutions" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Enrollment Confirmed — ${courseName} | Aventra Tech Solutions`,
    html,
  });

  console.log(`📧 Invoice email sent to ${toEmail}`);
}

module.exports = { sendInvoiceEmail };