// controllers/userController.js
import {UserModel,projectModel,membersModel} from '../models/schema.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

import { calculateProjectMetrics } from '../utils/calculations.js';


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY_ID,
    key_secret: process.env.RAZORPAY_API_KEY_SECRET,
  });

  
const createuserLead = async (userDetails)=>{
  try {
    if (!userDetails.email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const newUser = new UserModel({
      username:userDetails.username,
      usermail:userDetails.email,
      userpassword:userDetails.password
    });
    const savedUser = await newUser.save();
    if(savedUser)
      return "Success";
  } catch (error) {
    return "failure";
  }
}
const checkLoginUser = async (req,res)=>{
  const { email } = req.params;

  try {
    const existingUser = await membersModel.findOne({ 'userDetails.email': email });
    if (existingUser) {
      return res.status(200).json({
        message: 'Exists',
        userDetails: {
          fullname: existingUser.userDetails.fullname,
          email: existingUser.userDetails.email,
          password: existingUser.userDetails.password,
        _id: existingUser._id
        },
      });
    } else {
      return res.status(200).json({ message: 'User does not exist.' });
      // Or, if this is part of a user creation flow, proceed to create the user:
      // const newUser = new membersModel(req.body);
      // await newUser.save();
      // return res.status(201).json({ message: 'User created successfully.', user: newUser });
    }
  } catch (error) {
    console.error('Error checking user existence:', error);
    return res.status(500).json({ error: 'Failed to check user existence.' });
  }
}
const createUser = async (req, res) => {
  try {
    let userDetails={
      username: req.body.name,
      email: req.body.email,
      password: req.body.password
    }
    let usercreateres = await createuserLead(userDetails);
    let result = {
      message: 'Data received and processed successfully!',
      result_response: usercreateres,
  };
  res.status(201).json(result);
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
        let membersListArr = receivedData?.projectDetails?.projectInput?.teamMembers.map(member => ({
          memberid: member.id,
          memberName: member.name,
          memberRole: member.role,
          memberDepartment: member.department,
          memberCostperhrs: member.cost_rate
        }));
        let membersReq = {
          userDetails: {
            fullname: receivedData.fullname,
            email: receivedData.email,
            password: receivedData.password,
        },
        memberslist: membersListArr
        }

        const existingUser = await UserModel.findOne({ 'userDetails.email': receivedData.email });
        if (!existingUser) {
          let userdetails = {
            fullname: receivedData.username,
            email: receivedData.email,
            password: receivedData.password,
          };
          createuserLead(userdetails);
        } 

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
        let memberres = await update_R_createmembers(membersReq);
        let savedProject = await newProject.save();
        // let savedMembers = await newMemebrs.upsert();
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
const update_R_createmembers = async(membersListData)=>{
    try {
      const { userDetails, memberslist } = membersListData;
      const existsUserMembers = await membersModel.findOne({'userDetails.email': userDetails.email});
      if (existsUserMembers) {
        const existingMembers = existsUserMembers.memberslist;
        for (const newMember of memberslist) {
          const existingMemberIndex = existingMembers.findIndex(
            (member) => member.memberName === newMember.memberName && member.memberid === newMember.memberid
          );
  
          if (existingMemberIndex > -1) {
            existsUserMembers.memberslist[existingMemberIndex] = {...existsUserMembers.memberslist[existingMemberIndex].toObject(), ...newMember };
          } else {
            existsUserMembers.memberslist.push(newMember);
          }
        }
        await existsUserMembers.save();
        return "success";
        // return res.status(200).json({ message: 'Member details updated/inserted successfully for existing user.' });
  
      } else {
        const newUser = new membersModel({
          userDetails: userDetails,
          memberslist: memberslist,
        });
        await newUser.save();
        return "success";
        // return res.status(201).json({ message: 'New user and member details created successfully.' });
      }
    } catch (error) {
      console.error('Error updating/inserting members:', error);
      return "failure";
      // return res.status(500).json({ error: 'Failed to update/insert member details.' });
    }
  }

const genOutput = async(req,res)=>{
    try {
        const inputData = await req.body;
        const outputValues = await calculateProjectMetrics(inputData);
        const result = {
            status: 200,
            message: 'success',
            processData: outputValues,
        };
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
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
    // console.log(userEmail);
    try {
        const projects = await projectModel.find({ 'userDetails.email': userEmail });
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
}

const getusermembers = async(req,res)=>{
  let userEmail = req.params.email;
  try{
    const allmembers = await membersModel.find({ 'userDetails.email': userEmail });
    res.status(200).json(allmembers);
  }catch(error){
    console.error('Error fetching members list:', error);
    res.status(500).json({ error: 'Failed to fetch members list.' });
  }
}


const deletemember = async(req,res)=>{
  let userEmail = req.params.email;
  const { memberName, memberRole, memberDepartment, memberCostperhrs } = req.body;
  console.log({ memberName, memberRole, memberDepartment, memberCostperhrs });
  try {
    const userDocument = await membersModel.findOneAndUpdate(
      { 'userDetails.email': userEmail },
      {
        $pull: {
          memberslist: {
            memberName: memberName,
            memberRole: memberRole,
            memberDepartment: memberDepartment,
            memberCostperhrs: parseFloat(memberCostperhrs), // Ensure it's a number for comparison
          },
        },
      },
      { new: true } // To get the updated document after the update
    );

    if (!userDocument) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if any member was actually removed
    const memberRemoved = userDocument.memberslist.some(
      (member) =>
        member.memberName === memberName &&
        member.memberRole === memberRole &&
        member.memberDepartment === memberDepartment &&
        member.memberCostperhrs === parseFloat(memberCostperhrs)
    );

    if (memberRemoved) {
      return res.status(200).json({ message: 'Member not found in the list.' });
    }

    res.status(200).json({ message: 'Member deleted successfully.', updatedUser: userDocument });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member.'});
  }
}
const updatemember = async(req,res)=>{
  const userEmail  = req.params.email;
  const { memberoid, memberName, memberRole, memberDepartment, memberCostperhrs } = req.body;

    try {
      const userDocument = await membersModel.findOneAndUpdate(
        { 'userDetails.email': userEmail, 'memberslist._id': memberoid },
        {
          $set: {
            'memberslist.$.memberName': memberName,
            'memberslist.$.memberRole': memberRole,
            'memberslist.$.memberDepartment': memberDepartment,
            'memberslist.$.memberCostperhrs': memberCostperhrs
          },
        },
        { new: true } // To get the updated document after the update
      );
  
      if (!userDocument) {
        return res.status(404).json({ message: 'User or member not found.' });
      }
  
      // Verify if the member was actually updated (optional, but good for confirmation)
      const updatedMember = userDocument.memberslist.find(member => member._id.toString() === memberoid);
      if (!updatedMember ||
          updatedMember.memberName !== memberName ||
          updatedMember.memberRole !== memberRole ||
          updatedMember.memberDepartment !== memberDepartment ||
          updatedMember.memberCostperhrs !== parseFloat(memberCostperhrs)) {
        return res.status(400).json({ message: 'Failed to update member.' });
      }
      res.status(200).json({ message: 'Member updated successfully.', updatedUser: userDocument });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ error: 'Failed to update member.' });
    }
  }
const addmember = async(req,res)=>{
  try {
    let reqdata = req.body;
    let membersListArr = [{
      memberid: reqdata.member.id,
      memberName: reqdata.member.name,
      memberRole: reqdata.member.role,
      memberDepartment: reqdata.member.department,
      memberCostperhrs: reqdata.member.cost_rate}];
      
    let membersReq = {
      userDetails: {
        fullname: reqdata.fullname,
        email: reqdata.email,
        password: reqdata.password,
    },
    memberslist: membersListArr
    }
    let memberres = await update_R_createmembers(membersReq);
    if(memberres == "success"){
      let result = {
        message: 'member addedd successfully!',
        result_response: memberres,
      };
      res.status(201).json(result);
    }
    else{
      console.error("failure to add");
      res.status(500).json({ message: 'Server Error' });  
    } 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  } 
}


const handlewebhook = async(req,res)=>{
  console.log("=========webhook JSON========");
  console.log(req.body);
  console.log("=========:::webhook JSON formated:::========");

  let whreceivedData = await req.body;
  console.log(JSON.stringify(whreceivedData, null, 2));


  console.log("=========:::webhook JSON after validate:::========");
  // do a validation
	const secret = 'astra@projcalc2025';

	const crypto = require('crypto')

	const shasum = crypto.createHmac('sha256', secret)
	shasum.update(JSON.stringify(req.body))
	const digest = shasum.digest('hex')

	console.log(digest, req.headers['x-razorpay-signature'])

	if (digest === req.headers['x-razorpay-signature']) {
		console.log('request is legit');
		// process it
		console.log(JSON.stringify(req.body, null, 2));
	} else {
		console.log("else pass it..");
	}
	res.json({ status: 'ok' });
}

const getsample = async (req,res)=>{
  console.log(":::::::::::::::get method called [sample test] :::::::::");
  res.json({ status:'ok',message:'api called here for get sample syed' });
}
export { createUser,
  checkLoginUser,
  calcCreateUser,
  genOutput,
  createOrder,
  confirmPayment,
  getuserprojects,
  getusermembers,
  deletemember,
  addmember,
  updatemember,
  handlewebhook,
  getsample
 };

// Alternatively, if you intend to export only this function as the main export:
// export default createUser;