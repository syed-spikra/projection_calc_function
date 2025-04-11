// controllers/userController.js
import {UserModel,projectModel} from '../models/schema.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

import { calculateProjectMetrics } from '../utils/calculations.js';


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY_ID,
    key_secret: process.env.RAZORPAY_API_KEY_SECRET,
  });

  

const createUser = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const newUser = new UserModel({
      name:"syed",
      description:"saving one entry data",
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const calcCreateUser = async (req,res)=>{
    try {
        const receivedData = await  req.body;
        // console.log('Received data from frontend:', receivedData);
        // const outputData = await calculateProjectMetrics(receivedData);
        // console formatting
        // console.log(JSON.stringify(receivedData, null, 2));
        let newProject = await projectModel({
            userDetails: {
                fullname: receivedData.fullname,
                email: receivedData.email,
                password: receivedData.password,
            },
            projectDetails: {
                projectTitle: receivedData?.projectDetails?.projectTitle,
                projectDescription: receivedData?.projectDetails?.projectDescription,
                projectinput: receivedData?.projectDetails?.projectInput,
                projectoutput: receivedData?.projectDetails?.projectOutput,
            },
            
        });
        let savedProject = await newProject.save();
        let result = {
            message: 'Data received and processed successfully!',
            result_response: savedProject,
        };
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const genOutput = async(req,res)=>{
    try {
        const inputData = await req.body;
        const outputValues = await calculateProjectMetrics(inputData);
        const result = {
            message: 'Data received and processed successfully!',
            processData: outputValues,
        };
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

const createOrder = async(req,res)=>{
    try {
        const { quantity, currency } = req.body;
        const tokensToBuy = quantity * 5;
        let amount;
    
        if (currency === 'INR') {
          amount = Math.round((quantity * 431.85) * 100); // Total amount in paise
        } else if (currency === 'USD') {
          amount = quantity * 5 * 100; // Total amount in cents
        } else {
          return res.status(400).json({ error: 'Unsupported currency' });
        }
    
        const options = {
          amount: amount,
          currency: currency,
          receipt: 'order_' + Date.now(),
          notes: {
            tokens: tokensToBuy
          }
        };
    
        razorpay.orders.create(options, (err, order) => {
          if (err) {
            console.error('Razorpay Order Creation Error:', err);
            return res.status(500).json({ error: 'Failed to create order' });
          }
          res.json(order);
        });
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
}

const confirmPayment = async(req,res)=>{
    try {
        const { order_id, payment_id, razorpay_signature, quantity } = req.body;
        const tokens = quantity * 5; // Calculate tokens again for verification

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_API_KEY_SECRET)
            .update(order_id + '|' + payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Payment is successful
            // TODO: Update your database to credit 'tokens' to the user
            console.log(`Payment successful! Credited ${tokens} tokens.`);
            res.json({ success: true, message: `Payment successful! ${tokens} tokens credited.` });
        } else {
            // Payment failed or signature mismatch
            console.error('Payment verification failed: Signature mismatch');
            res.status(400).json({ error: 'Payment verification failed' });
        }
        } catch (error) {
            console.error('Error verifying payment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
}

const  getuserprojects = async(req,res)=>{
    
    let userEmail = req.params.email;
    console.log(userEmail);
    try {
        const projects = await projectModel.find({ 'userDetails.email': userEmail });
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
}

export { createUser, calcCreateUser, genOutput, createOrder, confirmPayment,getuserprojects};

// Alternatively, if you intend to export only this function as the main export:
// export default createUser;