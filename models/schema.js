// models/Item.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {type: String},
  usermail: {type: String,required: true},
  userpassword: {type:String},
  creditcount:{type:Number,default:0},
  createdAt: {type: Date,default: Date.now},
});

const teamMemberSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String,default:"not mentioned"},
    role: { type: String,default:"not mentioned" },
    department: { type: String,default:"not mentioned"},
    hours_day: { type: Number},
    cost_rate: { type: Number},
    billable_rate: { type: Number},
    billable_ratio: { type: Number,default:100 }
  });
  
const projectInputSchema = new mongoose.Schema({
    startDate: { type: Date,default: Date.now },
    workHours: { type: Number,default:8},
    totalProjectHours: { type: Number },
    profitTarget: { type: Number },
    teamMemberCount: { type: Number },
    workWeekDays: { type: String },
    teamMembers: [teamMemberSchema] // Array of team member sub-documents
  });


  const memberCostBreakdownSchema = new mongoose.Schema({
    id: {type: String,},
    name: {type: String,},
    role: {type: String,},
    cost_rate: {type: Number,},
    total_hours: {type: Number,},
    member_cost: {type: Number,},
  });
  const memberRevenueBreakdownSchema = new mongoose.Schema({
    id: {type: String,},
    name: {type: String,},
    role: {type: String,},
    billable_rate: {type: Number,},
    billable_ratio: {type: Number,},
    billable_hours: {type: Number,},
    revenue: {type: Number,},
  });

  const projectOutputSchema = new mongoose.Schema({
    teamDailyCapacity: {type: Number,},
    projectedDuration: {type: Number,},
    projectedEndDate: {type: Date,},
    averageBillableRatio: {type: Number,},
    teamCosts: {type: Number,},
    teamCostBreakdown: {
    memberCostBreakdown: [memberCostBreakdownSchema],
    totalCosts: {type: Number,},
    },
    revenueBreakdown: {
    memberRevenueBreakdown: [memberRevenueBreakdownSchema],
    totalRevenue: {type: Number,},
    },
    mainRevenue: {type: Number,},
    profitLoss: {type: Number,},
    profitMargin: {type: Number,},
  });


  const projectSchema = new mongoose.Schema({
    userDetails: {
        fullname: {type:String},
        email: {type:String},
        password: {type:String},
    },
    projectDetails: 
    {
        projectTitle:{type:String},
        projectDescription:{type:String},
        projectinput  : projectInputSchema,
        projectoutput : projectOutputSchema,
    },
  });

  const memberSchema = new mongoose.Schema({
    memberid:{type:String},
    memberName: {type:String},
    memberRole:{type:String},
    memberDepartment: {type:String},
    memberCostperhrs: {type:Number},
    memberEmail: {type:String}
  })
  const userallMembersSchema = new mongoose.Schema({
    userDetails: {
      fullname: {type:String},
      email: {type:String},
      password: {type:String},
    },
    memberslist:[memberSchema]
  });

// module.exports = mongoose.model('modelname', userSchema, 'collectionname');
const UserModel = mongoose.model('userleads',userSchema);
const projectModel = mongoose.model('userprojects',projectSchema);
const membersModel = mongoose.model('usermembers',userallMembersSchema);

export  {UserModel,projectModel,membersModel};

// export default {UserModel};
