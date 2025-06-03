const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.PRODUCTION_URL, 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
    },
});

// Verify Nodemailer transporter setup
transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer verification failed:', error);
    } else {
        console.log('Nodemailer is ready to send emails');
    }
});

app.get('/',async(req,res)=>{
res.send("server is running ");
})

// POST endpoint to send emails
app.post('/api/contact', async (req, res) => {
    const { name, email, description } = req.body;

    // Validate input
    if (!name || !email || !description) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    // Email styles based on ABM Groups theme
    const emailStyles = `
        <style>
            body { font-family: 'Poppins', sans-serif; background-color: #1A1A1A; color: #f0f0f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #2C2C2C; border-radius: 8px; }
            h3 { color: #FFD700; }
            p { color: #f0f0f0; line-height: 1.6; }
            .highlight { color: #FFD700; }
            .footer { margin-top: 20px; font-size: 12px; color: #a0a0a0; text-align: center; }
            .logo { color: #FFD700; font-weight: bold; font-size: 24px; text-align: center; }
        </style>
    `;

    try {
        // 1. Send email to Admin
        await transporter.sendMail({
            from: `"ABM Groups Contact" <${process.env.ADMIN_EMAIL}>`,
            to: process.env.ADMIN_EMAIL,
            subject: 'New Contact Form Submission - ABM Groups',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    ${emailStyles}
                </head>
                <body>
                    <div class="container">
                        <div class="logo">ABM Groups</div>
                        <h3>New Contact Form Submission</h3>
                        <p><strong>Name:</strong> <span class="highlight">${name}</span></p>
                        <p><strong>Email:</strong> <span class="highlight">${email}</span></p>
                        <p><strong>Description:</strong> <span class="highlight">${description}</span></p>
                        <div class="footer">
                            <p>ABM Groups | Kottakupam, Tamil Nadu</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        // 2. Send confirmation email to Customer
        await transporter.sendMail({
            from: `"ABM Groups" <${process.env.ADMIN_EMAIL}>`,
            to: email,
            subject: 'Thank You for Contacting ABM Groups',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    ${emailStyles}
                </head>
                <body>
                    <div class="container">
                        <div class="logo">ABM Groups</div>
                        <h3>Thank You, ${name}!</h3>
                        <p>Dear ${name},</p>
                        <p>Thank you for reaching out to ABM Groups. We have received your message and will get back to you soon.</p>
                        <p>Best Regards,<br><span class="highlight">ABM Groups Team</span></p>
                        <div class="footer">
                            <p>ABM Groups | Kottakupam, Tamil Nadu</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        res.status(200).json({ message: 'Emails sent successfully to admin and user.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send emails. Please try again later.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});