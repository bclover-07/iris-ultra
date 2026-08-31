export const interventionAlertEmail = (studentName, teacherName, riskReason, recommendations) => ({
  subject: `⚠️ Student Alert: ${studentName} needs attention`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF6B6B, #FF8E53); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Sensei Alert</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
        <p>Dear ${teacherName},</p>
        <p>Student <strong>${studentName}</strong> has been flagged for attention.</p>
        <div style="background: #FFF3E0; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #E65100;">⚠️ Risk Factors</h3>
          <p style="margin: 0; color: #333;">${riskReason}</p>
        </div>
        ${recommendations?.length ? `
        <div style="background: #E8F5E9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #2E7D32;">💡 Recommendations</h3>
          <ul style="margin: 0; padding-left: 20px; color: #333;">
            ${recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          — Sensei AI Learning Platform
        </p>
      </div>
    </div>
  `
});

export const passwordResetEmail = (name, resetUrl) => ({
  subject: '🔑 Sensei — Password Reset Request',
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6C5CE7, #A29BFE); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">🧠 Sensei</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background: #6C5CE7; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `
});

export default { interventionAlertEmail, passwordResetEmail };
