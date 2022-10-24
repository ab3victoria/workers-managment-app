const uuid = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Worker = require('../models/worker');
const User = require('../models/user');



const getWorkerById = async (req, res, next) => {
  const workerId = req.params.wid;

  let worker;
  try {
    worker = await Worker.findById(workerId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a place.',
      500
    );
    return next(error);
  }

  if (!worker) {
    const error = new HttpError(
      'Could not find a worker for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ worker: worker.toObject({ getters: true }) });
};


const getWorkersByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithWorkers;
  try {
    userWithWorkers = await User.findById(userId).populate('workers');
  } catch (err) {
    const error = new HttpError(
      'Fetching workers list failed, please try again later',
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithWorkers || userWithWorkers.workers.length === 0) {
    return next(
      new HttpError('Could not find workers for the provided user id.', 404)
    );
  }

  res.json({
    workers: userWithWorkers.workers.map(worker =>
      worker.toObject({ getters: true })
    )
  });
};


// const getWorkersByUserId = async (req, res, next) => {
//   const userId = req.params.uid;

//   let userWithWorkers;
//   try {
//     userWithWorkers = await User.findById(userId).populate('workers');
//   } catch (err) {
//     const error = new HttpError(
//       'Fetching workers failed, please try again later',
//       500
//     );
//     return next(error);
//   }

//   // if (!workers || places.length === 0) {
//   if (!userWithWorkers || userWithWorkers.workers.length === 0) {
//     return next(
//       new HttpError('Could not find workers for the provided user id.', 404)
//     );
//   }

//   res.json({
//     workers: userWithWorkers.workers.map(worker =>
//       worker.toObject({ getters: true })
//     )
//   });
// };


const createWorker = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address, creator } = req.body;



  const createdWorker = new Worker({
    title,
    description,
    address,
    image:
      'https://i.postimg.cc/FRDxMGzS/jake-nackos-IF9-TK5-Uy-KI-unsplash.jpg',
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('Creating Worker failed, please try again', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdWorker.save({ session: sess });
    user.workers.push(createdWorker);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating worker failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ worker: createdWorker });
};


const updateWorker = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description } = req.body;
  const workerId = req.params.wid;

  let worker;
  try {
    worker = await Worker.findById(workerId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update worker.',
      500
    );
    return next(error);
  }

  worker.title = title;
  worker.description = description;

  try {
    await worker.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update worker.',
      500
    );
    return next(error);
  }

  res.status(200).json({ worker: worker.toObject({ getters: true }) });
};

const deleteWorker = async (req, res, next) => {
  const workerId = req.params.wid;

  let worker;
  try {
    worker = await Worker.findById(workerId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete worker.',
      500
    );
    return next(error);
  }

  if (!worker) {
    const error = new HttpError('Could not find worker for this id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await worker.remove({ session: sess });
    worker.creator.workers.pull(worker);
    await worker.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete worker.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted worker.' });
};

exports.getWorkerById = getWorkerById;
exports.getWorkersByUserId = getWorkersByUserId;
exports.createWorker = createWorker;
exports.updateWorker = updateWorker;
exports.deleteWorker = deleteWorker;


// const getPlaceById = async (req, res, next) => {
//   const placeId = req.params.wid; // { pid: 'p1' }

//   let place;
//   try {
//     place = await Place.findById(placeId);
//   } catch (err) {
//     const error = new HttpError(
//       'Fetching place failed, please try again.',
//       500
//     );
//     return next(error);
//   }

//   if (!place) {
//     const error = new HttpError('Could not find a place for the provided id.', 404);
//     return next(error);
//   }

//   res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
// };

// const getPlacesByUserId = async (req, res, next) => {
//   const userId = req.params.uid;

//   let places;

//   try {
//     places = await Place.find({ creator: userId });
//   } catch (err) {
//     const error = new HttpError(
//       'Fetching places failed, please try again.',
//       500
//     );
//     return next(error);
//   }

//   if (!places || places.length === 0) {
//     return next(
//       new HttpError('Could not find places for the provided user id.', 404)
//     );
//   }

//   res.json({ places: places.map(place => place.toObject({ getters: true })) });
// };

// const createPlace = async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(
//       new HttpError('Invalid inputs passed, please check your data.', 422)
//     );
//   }

//   const { title, description, address, creator } = req.body;


//   // const title = req.body.title;
//   const createdPlace = new Place({
//     title,
//     description,
//     address,
//     location: {
//       lat: 70.5,
//       lng: -50.5
//     },
//     image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
//     creator
//   });

//   let user;

//   try {
//     user = await User.findById(creator);

//   } catch (err) {
//     const error = new HttpError(
//       'Creating place failed, please try again.',
//       500
//     );
//     return next(error);
//   }

//   if(!user) {
//     const error = new HttpError(
//       'Could not find the user for provided id',
//       404
//     );
//     return next(error);
//   }

//   try {
//     const sess = await mongoose.startSession();
//     sess.startTransaction();
//     await createPlace.save({session: sess});
//     user.places.push(createdPlace);
//     await user.save({session:sess});
//     await sess.commitTransaction();
//   } catch (err) {
//     const error = new HttpError(
//       'Creating place failed, please try again.',
//       500
//     );
//     return next(error);
//   }

//   res.status(201).json({ place: createdPlace });
// };

// const updatePlace = async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(new HttpError('Invalid inputs passed, please check your data.', 422));
//   }

//   const { title, description } = req.body;
//   const placeId = req.params.pid;


//   let place;
//   try {
//     place = await Place.findById(placeId);
//   } catch (err) {
//     const error = new HttpError(
//       'Something went wrong. could not update place'
//       , 500);
//     return next(error);
//   }

//   place.title = title;
//   place.description = description;

//   try {
//     await place.save();
//   } catch (err) {
//     const error = new HttpError(
//       'Something went wrong. could not update place'
//       , 500);
//     return next(error);
//   }

//   res.status(200).json({ place: place.toObject({ getters: true }) });
// };

// const deletePlace = async (req, res, next) => {
//   const placeId = req.params.pid;

//   let place;

//   try {
//     place = await Place.findById(placeId).populate('creator');
//   } catch (err) {
//     const error = new HttpError(
//       'Something went wrong. could not delete place'
//       , 500);
//     return next(error);
//   }

//   if(!place) {
//     const error = new HttpError(
//       'Could not find place with this id. '
//       , 404);
//     return next(error);
//   }
//   try {
//     const sess= await mongoose.startSession();
//     sess.startTransaction();
//     await place.remove({session:sess});
//     place.creator.places.pull(place);
//     await place.creator.save({session:sess});
//     await sess.commitTransaction();
//   } catch (err) {
//     const error = new HttpError(
//       'Something went wrong. could not delete place'
//       , 500);
//     return next(error);
//   }

//   res.status(200).json({ message: 'Deleted place.' });
// };

// exports.getPlaceById = getPlaceById;
// exports.getPlacesByUserId = getPlacesByUserId;
// exports.createPlace = createPlace;
// exports.updatePlace = updatePlace;
// exports.deletePlace = deletePlace;



