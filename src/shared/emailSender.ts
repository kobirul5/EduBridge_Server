
import nodemailer from "nodemailer";


export const emailSender = async (
  to: string,
  html: string,
  subject: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 2525,
      secure: false, 
      auth: {
        user: "88af50003@smtp-brevo.com", 
        pass: "8bpBA0zPsrY473IZ", 
      },
    });
    const mailOptions = {
      from: "<smt.team.pixel@gmail.com>", // Sender's name and email
      to, // Recipient's email
      subject, // Email subject
      text: html.replace(/<[^>]+>/g, ""), // Generate plain text version by stripping HTML tags
      html, // HTML email body
    };
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    return info.messageId;
  } catch (error) {
    throw new Error("Failed to send email. Please try again later.");
}
};





