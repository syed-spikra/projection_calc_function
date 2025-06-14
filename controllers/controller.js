// controllers/userController.js
import {UserModel,projectModel,membersModel} from '../models/schema.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

import { calculateProjectMetrics } from '../utils/calculations.js';
import { calculateMemberCapacity } from '../utils/capacitycalc.js';
import { calculateCapacityDashboard } from '../utils/memberscapacity.js';


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
    const existingUser = await UserModel.findOne({ 'usermail': email });
    if (existingUser) {
      return res.status(200).json({
        message: 'Exists',
        userDetails: {
          fullname: existingUser.username,
          email: existingUser.usermail,
          password: existingUser.userpassword,
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

const getmembercapacity = async (req,res) => {
  let userEmail = req.params.email;
  let startTime = await req.body.startTime;
  let endTime = await req.body.endTime;
  try{
    const allmemberslist = await membersModel.find({ 'userDetails.email': userEmail });
    const allprojectslist = await projectModel.find({ 'userDetails.email': userEmail });

    let memcapacity = await calculateMemberCapacity(allmemberslist,allprojectslist,startTime,endTime);
    const result = {
      status: 200,
      message: 'success',
      member_capacity: memcapacity,
    };
    res.status(200).json(result);
  }catch(error){
    console.error('Error fetching members list:', error);
    res.status(500).json({ error: 'Failed to fetch members capacity.' });
  }
}

const getcapacitydashboard = async (req,res) => {
  let userEmail = req.params.email;
  let startTime = await req.body.startTime;
  let endTime = await req.body.endTime;
  let selDept = await req.body.selectedDepartment;
  let projectStatus = await req.body.selectedStatus;
  try{
    // const allmemberslist = await membersModel.find({ 'userDetails.email': userEmail });
    const allprojectslist = await projectModel.find({ 'userDetails.email': userEmail });

    let capDashres = await calculateCapacityDashboard(startTime,endTime,selDept,projectStatus,allprojectslist);
    const result = {
      status: 200,
      message: 'success',
      capdash: capDashres,
    };
    res.status(200).json(result);
  }catch(error){
    console.error('Error fetching capdash:', error);
    res.status(500).json({error: 'Failed to fetch capacity dashboard.'});
  }
}


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

        const existingUser = await UserModel.findOne({ 'usermail': receivedData.email });
        if (!existingUser) {
          let userdetails = {
            fullname: receivedData.username,
            email: receivedData.email,
            password: receivedData.password,
          };
          createuserLead(userdetails);
        } 

        const existingCredits = existingUser.creditcount || 0;
        console.log("user credit count,==", existingCredits);

        if(existingCredits>0){
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
        
        const newCredits = Math.max(0, existingCredits - 0.5);
        const updatedUser = await UserModel.findOneAndUpdate(
          { usermail: receivedData.email },
          { $set: { creditcount: newCredits } },
          { new: true }
        );
        let result = {
          message: 'Data received and processed successfully!',
          result_response: {savedproject:savedProject,
            savedmember:memberres,
            creditupdated:updatedUser
          },
        };
        res.status(201).json(result);
      }else{
        res.json({staus:200,message:"0 credit"});
      }
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
          // const existingMemberIndex = existingMembers.findIndex(
          //   (member) => member.memberName === newMember.memberName && member.memberid === newMember.memberid
          // );
          const existingMemberIndex = existingMembers.findIndex(
            (member) => member.memberName === newMember.memberName
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
            // console.log(`Payment successful! Credited ${tokens} tokens.`);
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

const updateprojectstatus = async (req, res) => {
  try {
      const { email, projectTitle, o_id, stausVal } = req.body;
      const query = {
          'userDetails.email': email,
          'projectDetails.projectTitle': projectTitle,
          _id: o_id
      };
      const updatedProject = await projectModel.findOneAndUpdate(
          query,
          { $set: { 'projectDetails.projectStatus': stausVal } },
          { new: true, runValidators: true }
      ).lean();
      if (!updatedProject) {
          return res.status(404).json({
              error: 'Project not found or not updated',
              message: 'failure',
          });
      }
      res.json({ message: 'success',status:200,});
  } catch (error){
      console.error('Error in updateprojectstatus:', error);
      res.status(500).json({ error: 'Failed to update project status: ' + error.message });
  }
};

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
  const {memberoid, memberName, memberRole, memberDepartment, memberCostperhrs } = req.body;
  // console.log({ memberName, memberRole, memberDepartment, memberCostperhrs });
  try {
    const userDocument = await membersModel.findOneAndUpdate(
      { 'userDetails.email': userEmail,'memberslist._id': memberoid  },
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
  // console.log("=========webhook JSON========");
  // console.log(req.body);

  console.log("=========:::webhook JSON formated:::========");
  let whreceivedData = await req.body;
  console.log(JSON.stringify(whreceivedData, null, 2));

  // console.log("=========:::webhook JSON after validate:::========");
  const receivedPayData = req.body;
  // console.log(receivedPayData);
	const secret = 'astra@projcalc2025';
	const shasum = crypto.createHmac('sha256', secret)
	shasum.update(JSON.stringify(req.body))
	const digest = shasum.digest('hex')

	// console.log(digest, req.headers['x-razorpay-signature']);

	if (digest === req.headers['x-razorpay-signature']) {
		// console.log('request is legit');
		// console.log(JSON.stringify(req.body, null, 2));
    if(receivedPayData.event == "payment.captured"){
      const paydetails = receivedPayData?.payload?.payment?.entity;
      // console.log(paydetails);
      let Usrcurr = paydetails.currency;
      let Usramt = paydetails.amount;
      // Usramt = Usramt/100;
      let Usremail = paydetails.email;
      if((Usrcurr == "USD") && (Usramt == 300)){
        const user = await UserModel.findOne({ usermail: Usremail });
        if (!user) {
          console.log(`User with email ${Usremail} not found.`);
          // might need to create a new user with 5 credits, if the mail is not matched 
          // res.status(500).json({ error: 'payment Failed' });
        }
        const existingCredits = user.creditcount || 0;
        const newCredits = existingCredits + 3;
        const updatedUser = await UserModel.findOneAndUpdate(
          { usermail: Usremail },
          { $set: { creditcount: newCredits } },
          { new: true }
        );
        // console.log(`Successfully added 5 credits to user ${userEmail}`);
        // res.json({status:200,message:"success",creditaddedfor:updatedUser});
      }
      else{
        // console.log("payment failure captured");
        // res.status(500).json({ error: 'payment Failed' });
      }
    }
	} else {
		// console.log("else request is not legit");
	}
	res.json({ status: 'ok' });
}

const  getusertokens = async(req,res)=>{
  let userEmail = req.params.email;
  // console.log(userEmail);
  try {
    const userDetails = await UserModel.find({ 'usermail': userEmail });
    let creditCount = userDetails[0].creditcount;
    res.status(200).json({status:200,message:"Success",creditcount:creditCount});
  } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to user credits' });
  }
}
const getsample = async (req,res)=>{
  console.log(":::::::::::::::get method called [sample test] :::::::::");
  res.json({ status:'ok',message:'api called here for get sample syed' });
}

// const checkNgetallusers = async (req,res)=>{
//   let {securityEmail,securityPassword} = req.body;
//   try {
    
    
//   } catch (error) {
    
//   }
// }

// update exisitng projects with projectstatus field
// const updateProjectsAndGetDetails = async (req,res)=> {
//   try {
//       const updateResult = await projectModel.updateMany(
//           { 'projectDetails.projectStatus': { $exists: false } },
//           { $set: { 'projectDetails.projectStatus': 'Scoping' } }
//       );
//       const updatedProjects = await projectModel.find({});
//       const projectNames = updatedProjects.map(project => {
//           const title = project.projectDetails?.projectTitle;
//           return title || "Untitled Project";
//       });
//       res.json( {
//           projectNames: projectNames,
//           updatedCount: updateResult.modifiedCount
//       });
//   } catch (error) {
//       console.error("Error in updateProjectsAndGetDetails:", error);
//       res.json({ error: 'Failed to update projects: ' + error.message });
//   }
// }

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
  getusertokens,
  getsample,
  getmembercapacity,
  getcapacitydashboard,
  updateprojectstatus,
  // updateProjectsAndGetDetails
  // checkNgetallusers
 };

// Alternatively, if you intend to export only this function as the main export:
// export default createUser;