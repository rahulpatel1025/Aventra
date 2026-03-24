const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// ── Shared HTML shell ──
function emailShell(content) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0;}
  .wrapper{max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
  .header{background:#0f172a;padding:36px 40px;text-align:center;}
  .header h1{color:#ffffff;margin:0;font-size:24px;letter-spacing:-0.03em;}
  .header p{color:#94a3b8;margin:8px 0 0;font-size:14px;}
  .body{padding:40px;}
  .welcome{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px;}
  .subtitle{color:#475569;font-size:15px;margin-bottom:32px;}
  .invoice-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin-bottom:28px;}
  .invoice-box h3{margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;}
  .invoice-row{display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px;color:#475569;}
  .invoice-row.total{border-top:1px solid #e2e8f0;padding-top:12px;margin-top:4px;font-weight:700;font-size:16px;color:#0f172a;}
  .badge{display:inline-block;background:#dcfce7;color:#16a34a;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:24px;}
  .badge-blue{display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:24px;}
  .features{margin-bottom:28px;}
  .features h3{font-size:16px;color:#0f172a;margin-bottom:12px;}
  .features ul{padding-left:20px;color:#475569;font-size:14px;line-height:1.8;}
  .cta{text-align:center;margin:32px 0;}
  .cta a{background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;}
  .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;font-size:12px;color:#94a3b8;}
  .footer a{color:#475569;text-decoration:none;}
  .highlight-box{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:8px;padding:20px 24px;margin-bottom:24px;}
  .highlight-box h3{color:#1d4ed8;font-size:15px;margin:0 0 12px;}
  .highlight-box ul{padding-left:18px;color:#1e3a8a;font-size:14px;line-height:1.9;margin:0;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Aventra Tech Solutions</h1>
    <p>Payment Confirmation & Invoice</p>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Aventra Tech Solutions. All rights reserved.</p>
    <p><a href="https://aventratechsolution.com">aventratechsolution.com</a></p>
  </div>
</div>
</body>
</html>`;
}

// ================= INVOICE EMAIL =================
async function sendInvoiceEmail({
  toEmail,
  studentName,
  courseName,
  amount,
  paymentId,
  purchaseDate,
  paymentMethod = "one_time",
  emiDetails = null,
  referralCode = null,
}) {
  const formattedDate = new Date(purchaseDate).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
  }).format(amount);

  // Payment method row
  let paymentMethodDisplay = "One-time Payment";
  if (paymentMethod === "emi" && emiDetails) {
    const noCost = emiDetails.isNoCostEmi ? " (No Cost EMI)" : "";
    const bank = emiDetails.bank ? ` — ${emiDetails.bank}` : "";
    const tenure = emiDetails.tenure ? ` · ${emiDetails.tenure} months` : "";
    const monthly = emiDetails.monthlyAmount
      ? ` · ₹${emiDetails.monthlyAmount.toLocaleString("en-IN")}/mo`
      : "";
    paymentMethodDisplay = `EMI${noCost}${bank}${tenure}${monthly}`;
  }

  // Referral row — only shown if a code was used
  const referralRow = referralCode
    ? `<div class="invoice-row"><span>Referral Code</span><span style="font-weight:600;color:#0f172a;">${referralCode}</span></div>`
    : "";

  // MINI10 callout box
  const mini10Box = referralCode && referralCode.toUpperCase() === "MINI10"
    ? `<div class="highlight-box">
        <h3>🎯 Your MINI10 Benefits Are Activated</h3>
        <ul>
          <li>100% Internship Support — guaranteed placement after completion</li>
          <li>Dedicated placement coordinator assigned to your profile</li>
          <li>Resume review and LinkedIn profile optimisation</li>
          <li>Mock interviews with industry professionals</li>
          <li>Priority access to Aventra's hiring partner network</li>
          <li>Money-back guarantee if internship not secured</li>
        </ul>
      </div>`
    : "";

  const content = `
    <div class="welcome">Welcome aboard, ${studentName}! 🎉</div>
    <p class="subtitle">Your enrollment is confirmed. You now have full access to your course and dashboard.</p>
    <span class="badge">✅ Payment Successful</span>

    <div class="invoice-box">
      <h3>Invoice Details</h3>
      <div class="invoice-row"><span>Course</span><span>${courseName}</span></div>
      <div class="invoice-row"><span>Date</span><span>${formattedDate}</span></div>
      <div class="invoice-row"><span>Payment ID</span><span style="font-family:monospace;font-size:12px;">${paymentId}</span></div>
      <div class="invoice-row"><span>Payment Method</span><span>${paymentMethodDisplay}</span></div>
      ${referralRow}
      <div class="invoice-row total"><span>Amount Paid</span><span>${formattedAmount}</span></div>
    </div>

    ${mini10Box}

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

    <p style="font-size:13px;color:#94a3b8;text-align:center;">
      Keep this email as your payment receipt. For queries, reply to this email.
    </p>
  `;

  await transporter.sendMail({
    from: `"Aventra Tech Solutions" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Enrollment Confirmed — ${courseName} | Aventra Tech Solutions`,
    html: emailShell(content),
  });

  const log = global.logger || console;
  log.info(`Invoice email sent to ${toEmail}`);
}

// ================= MINI10 BENEFITS EMAIL =================
// Sent as a separate dedicated email when MINI10 referral code is used
async function sendBenefitsEmail({ toEmail, studentName, courseName }) {
  const content = `
    <div class="welcome">Your MINI10 Benefits Are Now Active 🎯</div>
    <p class="subtitle">
      You used the <strong>MINI10</strong> referral code at checkout for <strong>${courseName}</strong>.
      Here's everything that's now unlocked for you:
    </p>

    <span class="badge-blue">🚀 Internship Support Activated</span>

    <div class="highlight-box">
      <h3>Your Exclusive MINI10 Benefits</h3>
      <ul>
        <li><strong>100% Internship Support</strong> — guaranteed placement after course completion</li>
        <li>Dedicated placement coordinator assigned to your profile</li>
        <li>Resume review and LinkedIn profile optimisation by industry experts</li>
        <li>Money-back guarantee if internship is not secured within 90 days of completion</li>
      </ul>
    </div>

    <div class="features">
      <h3>What happens next?</h3>
      <ul>
        <li>Complete your course modules at your own pace</li>
        <li>Our placement team will reach out within 48 hours to schedule your profile review</li>
        <li>Stay active on your dashboard to track your progress</li>
      </ul>
    </div>

    <div class="cta">
      <a href="https://aventratechsolution.com/dashboard">Go to My Dashboard →</a>
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;">
      Questions about your MINI10 benefits? Reply to this email and we'll get back to you within 24 hours.
    </p>
  `;

  await transporter.sendMail({
    from: `"Aventra Tech Solutions" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `🎯 Your MINI10 Internship Benefits Are Active — ${courseName}`,
    html: emailShell(content),
  });

  const log = global.logger || console;
  log.info(`MINI10 benefits email sent to ${toEmail}`);
}

module.exports = { sendInvoiceEmail, sendBenefitsEmail };