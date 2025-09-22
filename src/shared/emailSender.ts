
import nodemailer from "nodemailer";


export const emailSender = async (
  to: string,
  html: string,
  subject: string
) => {
  try {
   const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "sahin.backend@gmail.com",
        pass: "jgac trhv xkxa esaw",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send the email
   const info = await transporter.sendMail({
      from: "<sahin.backend@gmail.com>",
      to,
      subject,
      html,
    });
    return info.messageId;
  } catch (error) {
    throw new Error("Failed to send email. Please try again later.");
}
};






