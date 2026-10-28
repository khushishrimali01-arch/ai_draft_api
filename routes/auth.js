
import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();


router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

       
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email'
            });
        }

    
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists'
            });
        }

       
        const hashedPassword = await bcrypt.hash(password, 10);

       
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'user'
        });

        const savedUser = await newUser.save();

        
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        return res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });

    } catch (err) {
        console.error('Register Error:', err.message);

        if (err.code === 11000) {
            return res.status(409).json({
                message: 'Email already exists'
            });
        }

        return res.status(500).json({
            message: 'Registration failed'
        });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

       
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

       
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing');

            return res.status(500).json({
                message: 'Server configuration error'
            });
        }

       
        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

       
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (err) {
        console.error('Login Error:', err.message);

        return res.status(500).json({
            message: 'Login failed'
        });
    }
});

export default router;
