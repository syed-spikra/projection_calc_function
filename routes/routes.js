// routes/itemRoutes.js
import express from 'express';
const router = express.Router();
import { createUser,
    calcCreateUser,
    genOutput,
    createOrder,
    confirmPayment,
    getuserprojects,
    getusermembers,
    deletemember,
    addmember } from '../controllers/controller.js';

router.get('/api/get-user-projects/:email', getuserprojects);
router.get('/api/get-user-members/:email', getusermembers);
router.delete('/api/delete-memberfrom/:email', deletemember);
router.post('/api/add-member-foruser', addmember);
router.post('/api/createuser', createUser);
router.post('/api/process-project-data', calcCreateUser);
router.post('/api/calculate', genOutput);
router.post('/api/payment/create-order', createOrder);
router.post('/api/payment/verify-payment', confirmPayment);

export default router;