const express = require('express');
const router = express.Router();
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Initialize OAuth2Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register User
router.post('/register', async (req, res) => {
    try {
        console.log("Registration attempt:", req.body);
        const { username, email, password, role, phoneNumber } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from environment");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role: role || 'seeker',
            phoneNumber
        });

        console.log("User created successfully:", user.id);

        // Generate JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                profileImage: user.profileImage,
                address: user.address,
                kycStatus: user.kycStatus
            }
        });
    } catch (error) {
        const fs = require('fs');
        fs.appendFileSync('debug.log', `REGISTRATION ERROR: ${new Date().toISOString()} - ${error.stack}\n`);
        console.error("REGISTRATION ERROR:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email address already in use' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Internal Server Error: ' + error.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from environment");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                profileImage: user.profileImage,
                address: user.address,
                kycStatus: user.kycStatus
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: 'Internal Server Error: ' + error.message });
    }
});

// Google Login
router.post('/google-login', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("CRITICAL: GOOGLE_CLIENT_ID is missing from environment");
            return res.status(500).json({ message: 'Google Client ID not configured on server' });
        }

        let payload;
        try {
            console.log("Verifying Google token...");
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
            console.log("Google Token Payload:", {
                email: payload.email,
                name: payload.name,
                aud: payload.aud
            });
        } catch (err) {
            console.error("Google Token Verification Error:", err.message);
            console.error("Stack Trace:", err.stack);
            return res.status(401).json({ message: 'Invalid or expired Google token' });
        }

        const { email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Email not provided by Google' });
        }

        // Find or Create User
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Register new Google user
            user = await User.create({
                username: name || email.split('@')[0],
                email: email,
                password: Math.random().toString(36).slice(-16), // Random password
                role: 'seeker',
                profileImage: picture
            });
            console.log("New Google user created:", user.id);
        } else {
            console.log("Existing Google user logged in:", user.id);
        }

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from environment");
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Google login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                phoneNumber: user.phoneNumber,
                address: user.address,
                kycStatus: user.kycStatus
            }
        });

    } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;
