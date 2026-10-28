import express from 'express';
import Post from '../models/Post.js';
import jwt from 'jsonwebtoken';

const router = express.Router();


const verifyAdmin = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: "Access Denied" });
    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET || 'secretkey');
        if (verified.role !== 'admin') return res.status(403).json({ message: "Admin only" });
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};


router.get('/posts/pending', verifyAdmin, async (req, res) => {
    try {
        const posts = await Post.find({ status: 'pending' }).populate('createdBy', 'name email');
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.patch('/posts/approve/:id', verifyAdmin, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json({ message: "Post approved", post });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.patch('/posts/reject/:id', verifyAdmin, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json({ message: "Post rejected", post });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;