import express from 'express';
import cors from 'cors';
import { calculateProjectMetrics } from './calculations.js';
// import {createUsersTable} from './schema.js';
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());


// inputData =  {
//   startDate: '2025-03-29',
//   workHours: 8,
//   totalProjectHours: 120,
//   profitTarget: 20,
//   teamMemberCount: 2,
//   workWeekDays: '5',
//   teamMembers: [
//     {
//       id: 'memb1',
//       name: 'Syed',
//       role: 'TL',
//       department: 'Product',
//       hours_day: 3,
//       cost_rate: 30,
//       billable_rate: 40,
//       billable_ratio: 80
//     },
//     {
//       id: 'memb2',
//       name: 'Guna',
//       role: 'member',
//       department: 'Design',
//       hours_day: 2,
//       cost_rate: 50,
//       billable_rate: 40,
//       billable_ratio: 90
//     }
//   ]
// }



app.get('/',(req,res)=>{
    console.log("server started and connection working..");
    const message ={
        message: 'hello there..'
    }
    res.json(message);
})

app.post('/process-project-data', async(req, res) => {
  const receivedData = req.body;
  console.log('Received data from frontend:', receivedData);

  const outputData = await calculateProjectMetrics(receivedData);
  console.log(JSON.stringify(outputData, null, 2));
  // --- Your Data Processing Logic Goes Here ---
  const result = {
    message: 'Data received and processed successfully!',
    processData: outputData,
  };
  res.json(result);
});


app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Replace this with your actual database setup or data storage mechanism
const users = [];

// Endpoint to handle user signup and saving project data
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
  console.log('New user created:', newUser);
  res.status(201).json({ message: 'Signup successful and project data saved.', user: { id: newUser.id, fullname: newUser.fullname, email: newUser.email } });
});
// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
  // createUsersTable();
});
