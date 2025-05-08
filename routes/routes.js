// routes/itemRoutes.js
import express from 'express';
const router = express.Router();
import { createUser,
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
    getsample,
    getusertokens,
    getmembercapacity,
    updateprojectstatus,
    // updateProjectsAndGetDetails
    // checkNgetallusers
} from '../controllers/controller.js';

router.get('/api/get-user-projects/:email', getuserprojects);
router.post('/api/update-project-staus', updateprojectstatus);
// router.get('/api/update-allproject-exists-newfield',updateProjectsAndGetDetails);

router.get('/api/get-user-members/:email', getusermembers);
router.delete('/api/delete-memberfrom/:email', deletemember);
router.put('/api/edit-memberfrom/:email',updatemember);
router.post('/api/add-member-foruser', addmember);

router.post('/api/get-all-member-capacity/:email', getmembercapacity);

// router.post('/api/admin/get-all-users', checkNgetallusers);
router.post('/api/createuser', createUser);
router.get('/api/get-loginuser/:email',checkLoginUser);
router.post('/api/process-project-data', calcCreateUser);
router.post('/api/calculate', genOutput);

router.post('/api/payment/create-order', createOrder);
router.post('/api/payment/verify-payment', confirmPayment);

router.get('/api/sampleGETtest', getsample);

router.post('/api/razorpay-webhook', handlewebhook); // astra@projcalc2025
router.get('/api/get-tokens-count/:email', getusertokens);
export default router;