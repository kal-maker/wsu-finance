"use server";

import nodemailer from "nodemailer";
import { render } from "@react-email/render";

export async function sendEmail({ to, subject, react }) {
  try {
    // Get email credentials from environment variables
    const emailUser = process.env.EMAIL_USER || process.env.EMAIL;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;

    if (!emailUser || !emailPassword) {
      throw new Error(
        "Missing email credentials. Please set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file"
      );
    }

    // Convert React element to HTML string using @react-email/render
    if (!react) {
      throw new Error("No email content provided (react prop is required)");
    }
    
    const html = await render(react);

    // Create Nodemailer transporter optimized for Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service instead of manual SMTP
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      // Enhanced security and timeout settings for Gmail
      secure: true, // Use TLS
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates if needed
      },
      // Connection pooling and timeouts
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Send email with retry logic
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: `WSU Finance <${emailUser}>`,
          to: Array.isArray(to) ? to.join(", ") : to,
          subject,
          html,
        });
        console.log("✅ Email sent successfully:", info.messageId);
        return { success: true, data: { messageId: info.messageId } };
      } catch (error) {
        lastError = error;
        console.error(`❌ Email send attempt ${attempt} failed:`, error.message);
        if (attempt < 3) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    // All attempts failed
    console.error("❌ Failed to send email after 3 attempts:", lastError);
    return { success: false, error: lastError.message };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error: error.message };
  }
}
