import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';


import authRoute from './routes/auth.js';
import postRoute from './routes/posts.js';
import adminRoute from './routes/admin.js';
import aiRoute from './routes/ai.js';

dotenv.config();

const app = express();


app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch((err) => console.log('Database connection error:', err));


app.use('/auth', authRoute);
app.use('/posts', postRoute);
app.use('/admin', adminRoute);
app.use('/ai', aiRoute);


app.get('/', (req, res) => {
    res.send("Akatsuki's Draft Backend is running!");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});