require("dotenv").config();
const nodemailer = require("nodemailer");
const fs=require('fs');

// Create a transporter object using SMTP settings
const transporter = nodemailer.createTransport({
    service: "gmail", // Use 'gmail' or any other SMTP service
    auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.PASSWORD // App password or email password
    }
});

// Function to send email
const sendMail = async (to, subject) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to,
            subject,
             html:fs.readFileSync('check.html', 'utf8')
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendMail;