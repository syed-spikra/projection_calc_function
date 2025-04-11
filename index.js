import express from 'express';
// import mongoose from 'mongoose';
import connectDB from './config/db.js';
import userRouter from './routes/routes.js';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';


const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const users = [];

app.post('/signup-save-project', (req, res) => {
  const { fullname, email, password, projectDetails } = req.body;

  if (!fullname || !email || !password || !projectDetails) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'User with this email already exists.' });
  }
  const newUser = {
    id: users.length + 1, // Simple ID generation
    fullname,
    email,
    password, // In a real application, you would hash the password!
    projects: [projectDetails] // Assuming each user can have multiple projects
  };
  users.push(newUser);
  // console.log('New user created:', newUser);
  res.status(201).json({ message: 'Signup successful and project data saved.', user: { id: newUser.id, fullname: newUser.fullname, email: newUser.email } });
});


connectDB();
app.use('/', userRouter);

app.listen(port, () => {
  console.log(`the port is started at - ${port}`);
});
