const express = require('express');
const router = express.Router();
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
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

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role: role || 'seeker',
            phoneNumber
        });

        console.log("User created successfully:", user.id);

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from environment");
            return res.status(500).json({ message: 'Server configuration error' });
        }
        // Generate JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

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

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
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

        // Verify Google Token
        // In a real scenario with a valid client ID:
        // const ticket = await client.verifyIdToken({
        //     idToken: credential,
        //     audience: process.env.GOOGLE_CLIENT_ID,
        // });
        // const payload = ticket.getPayload();

        // --- SIMULATION FOR DEV PURPOSE IF TOKEN IS DUMMY ---
        // If we are in dev/simulation mode and token is a custom mock
        let payload;
        if (credential === 'mock_google_token') {
            payload = {
                email: 'google.user@example.com',
                name: 'Google User',
                picture: 'https://lh3.googleusercontent.com/a/default-user'
            };
        } else {
            // Real verification (will fail if GOOGLE_CLIENT_ID is not set correctly)
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } catch (err) {
                console.error("Google verify error:", err);
                return res.status(400).json({ message: 'Invalid Google Token' });
            }
        }

        const { email, name, picture } = payload;

        // Find or Create User
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Register new Google user
            user = await User.create({
                username: name,
                email: email,
                password: Math.random().toString(36).slice(-10), // Random password
                role: 'seeker',
                profileImage: picture
            });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
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
