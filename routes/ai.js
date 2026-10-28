import express from 'express';
import Post from '../models/Post.js';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Access Denied" });
    }

    try {
        const verified = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.JWT_SECRET || 'secretkey'
        );

        req.user = verified;
        next();
    } catch (err) {
        return res.status(400).json({ message: "Invalid Token" });
    }
};

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

router.post('/improve/:postId', verifyToken, async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.postId);

        if (!originalPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (originalPost.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only improve your own post"
            });
        }

        const prompt = `Please improve the following content for a blog post, making it more engaging and professional:

        Title: ${originalPost.title}
        Content: ${originalPost.content}`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        const improvedContent = response.text;

        if (!improvedContent) {
            return res.status(500).json({
                message: "AI did not return any improved content"
            });
        }

        const newDraftPost = new Post({
            title: originalPost.title + " (AI Improved)",
            description: originalPost.description,
            content: improvedContent,
            image: originalPost.image,
            category: originalPost.category,
            createdBy: req.user.id,
            status: 'draft'
        });

        const savedDraft = await newDraftPost.save();

        return res.status(201).json({
            message: "Content improved and saved as a new draft successfully!",
            originalPostId: originalPost._id,
            newDraft: savedDraft
        });

    } catch (err) {
        console.error("AI content improvement error:", err.message);

        return res.status(500).json({
            error: err.message
        });
    }
});

export default router;