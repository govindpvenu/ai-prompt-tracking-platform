"use server";

import nodemailer from "nodemailer";

export async function sendEmail(data: {
  email: string;
  subject: string;
  text: string;
}) {
  const { email, subject, text } = data;

  // sanity checks
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.error("Missing SMTP env vars");
    return {
      success: false,
      message: "Server email configuration incomplete.",
    };
  }
  const port = Number(SMTP_PORT || 465);
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: subject,
      text: text,
    });

    return {
      success: true,
      message: "Email sent successfully!",
      id: info.messageId,
    };
  } catch (error: unknown) {
    console.error("SMTP error:", error);
    return {
      success: false,
      message: (error as Error)?.message || "Failed to send email.",
    };
  }
}
