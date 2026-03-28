const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        auth: {
            user: process.env.EMAIL_USERNAME || 'yatrahubnepal@gmail.com', // fallback fake or user's email
            pass: process.env.EMAIL_PASSWORD || 'your_app_password', // Replace with real app password later
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'YatraHub <noreply@yatrahub.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Optional HTML support
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
