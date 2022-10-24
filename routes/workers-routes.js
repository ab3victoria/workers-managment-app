const express = require('express');
const {check} = require('express-validator');
const workersControllers = require('../controllers/workers-controllers');

const router = express.Router();

router.get('/:wid', workersControllers.getWorkerById);

router.get('/user/:uid', workersControllers.getWorkersByUserId);

router.post('/',[check('title')
.not()
.isEmpty(),
  check('description').isLength({min:5}),
  check('address').not().isEmpty()],
workersControllers.createWorker);

router.patch('/:wid',[
    check('title').not().isEmpty(),
    check('description').isLength({min:5})
], workersControllers.updateWorker);

router.delete('/:wid', workersControllers.deleteWorker);

module.exports = router;
