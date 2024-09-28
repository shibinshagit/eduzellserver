// application router
const express = require('express');
const router = express.Router();
const controllers = require('../controllers/Controller');
const applicationControllers = require('../controllers/ApplicationController');

require('dotenv').config();

router.use(express.json(), express.urlencoded({ extended: true }))
  .use((req, res, next) => { res.locals.session = req.session; next(); });



//   router.post('/verify-otp', verifyOtp);



// router.post('/login', controllers.login);
// router.post('/postorder', controllers.postOrder);
// router.get('/users', controllers.getUsers);
// router.get('/statistics', controllers.getDailyStatistics);
// router.put('/updateUser/:id', controllers.editUser);
// router.delete('/deleteUser/:id', controllers.deleteUser);
// router.put('/trashUser/:id', controllers.trashUser);
// router.post('/addLeave/:orderId', controllers.addLeave);

// New routes
router.post('/check-email', controllers.checkEmail);
router.post('/verify-otp', controllers.verifyOtp);
router.post('/create-password', controllers.createPassword);
router.post('/verify-password', controllers.verifyPassword);
router.get('/userData', controllers.getUserProfile);
router.put('/editprofile/:id', controllers.updateUser);

// Export the router
module.exports = router;
