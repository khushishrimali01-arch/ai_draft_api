
import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import jwt from 'jsonwebtoken';

const router = express.Router();


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Access denied. Token required.'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            message: 'JWT_SECRET is not configured'
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};



router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, description, content, image, category } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const newPost = new Post({
            title,
            description,
            content,
            image,
            category,
            createdBy: req.user.id,
            status: 'draft'
        });

        const savedPost = await newPost.save();

        return res.status(201).json({
            message: 'Post created successfully',
            post: savedPost
        });
    } catch (err) {
        console.error('Create Post Error:', err.message);

        return res.status(500).json({
            message: 'Failed to create post'
        });
    }
});



router.get('/', async (req, res) => {
    try {
        const posts = await Post.find({
            status: 'approved'
        }).populate('createdBy', 'name email');

        return res.status(200).json(posts);
    } catch (err) {
        console.error('Get Posts Error:', err.message);

        return res.status(500).json({
            message: 'Failed to fetch posts'
        });
    }
});



router.get('/my-posts', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find({
            createdBy: req.user.id
        });

        return res.status(200).json(posts);
    } catch (err) {
        console.error('My Posts Error:', err.message);

        return res.status(500).json({
            message: 'Failed to fetch your posts'
        });
    }
});



router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findOne({
            _id: id,
            status: 'approved'
        }).populate('createdBy', 'name email');

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        return res.status(200).json(post);
    } catch (err) {
        console.error('Get Post Error:', err.message);

        return res.status(500).json({
            message: 'Failed to fetch post'
        });
    }
});



router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (post.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'You are not authorized to update this post'
            });
        }

        
        const allowedFields = [
            'title',
            'description',
            'content',
            'image',
            'category'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                post[field] = req.body[field];
            }
        }

        const updatedPost = await post.save();

        return res.status(200).json({
            message: 'Post updated successfully',
            post: updatedPost
        });
    } catch (err) {
        console.error('Update Post Error:', err.message);

        return res.status(500).json({
            message: 'Failed to update post'
        });
    }
});



router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (post.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'You are not authorized to delete this post'
            });
        }

        await post.deleteOne();

        return res.status(200).json({
            message: 'Post deleted successfully'
        });
    } catch (err) {
        console.error('Delete Post Error:', err.message);

        return res.status(500).json({
            message: 'Failed to delete post'
        });
    }
});

export default router;
