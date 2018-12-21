const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Input validation
const validateProfileInput = require('../../validation/profile');
const validateExpirienceInput = require('../../validation/expirience');
const validateEducationInput = require('../../validation/education');

// Load profile model
const Profile = require('../../models/Profile');

// Load user model
const User = require('../../models/Users');

// @route GET api/profile/test
// @desc Tests profile route
// @access Public
router.get('/test', (req, res) => res.json({ msg: 'Profile works' }));

// @route GET api/profile
// @desc Get current users profile
// @access Private
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])
    .then((profile) => {
      const errors = {};

      if (!profile) {
        errors.noprofile = 'There is no profile for this user.';
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch((err) => res.status(404).json(err));
});

// @route GET api/profile/handle/:handle
// @desc Get profile by handle
// @access Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user.';
        res.status(404).json(errors);
      }

      res.status(200).json(profile);
    })
    .catch((err) => res.status(404).json(err));
});

// @route GET api/profile/user/:id
// @desc Get profile by id
// @access Public
router.get('/user/:userId', (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.userId })
    .populate('user', ['name', 'avatar'])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user.';
        res.status(404).json(errors);
      }

      res.status(200).json(profile);
    })
    .catch(() => res.status(404).json({ profile: 'There is no profile for this user.' }));
});

// @route GET api/profile/users
// @desc Get all profiles
// @access Public
router.get('/users', (req, res) => {
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then((profile) => res.status(200).json(profile))
    .catch((err) => res.status(404).json(err));
});

// @route POST api/profile
// @desc Create or edit user profile
// @access Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateProfileInput(req.body);

  // Check validation
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  const profileFields = {};
  profileFields.user = req.user.id;

  if (req.body.handle) profileFields.handle = req.body.handle;
  if (req.body.company) profileFields.company = req.body.company;
  if (req.body.website) profileFields.website = req.body.website;
  if (req.body.location) profileFields.location = req.body.location;
  if (req.body.bio) profileFields.bio = req.body.bio;
  if (req.body.status) profileFields.status = req.body.status;
  if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;

  // Skills split into array
  if (typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',');
  }

  // Social
  profileFields.social = {};
  if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id }).then((profile) => {
    if (profile) {
      // Update
      Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true }).then(
        (profile) => res.json(profile),
      );
    } else {
      // Create

      // Check if handle exist
      Profile.findOne({ handle: profileFields.handle }).then((profile) => {
        if (profile) {
          errors.handle = 'That handle already exist.';
          res.status(400).json(errors);
        }

        // Save profile
        new Profile(profileFields).save().then((profile) => res.json(profile));
      });
    }
  });
});

// @route POST api/profile/expirience
// @desc Add expirience to profile
// @access Private
router.post('/expirience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExpirienceInput(req.body);

  // Check validation
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  Profile.findOne({ user: req.user.id }).then((profile) => {
    const newExp = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    // Add to expirience array
    profile.expirience.unshift(newExp);

    profile.save().then((profile) => res.json(profile));
  });
});

// @route POST api/profile/education
// @desc Add education to profile
// @access Private
router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);

  // Check validation
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  Profile.findOne({ user: req.user.id }).then((profile) => {
    const newEd = {
      school: req.body.school,
      degree: req.body.degree,
      fieldofstudy: req.body.fieldofstudy,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description,
    };

    // Add to eductaion array
    profile.education.unshift(newEd);

    profile.save().then((profile) => res.json(profile));
  });
});

// @route DELETE api/profile/expirience/:exp_id
// @desc Delete expirience from profile
// @access Private
router.delete(
  '/expirience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      // Get remove index
      const removeIndex = profile.expirience.map((item) => item.id).indexOf(req.params.exp_id);

      // Splice out of array
      profile.expirience.splice(removeIndex, 1);

      profile
        .save()
        .then((profile) => res.json(profile))
        .catch((err) => res.status(404).json(err));
    });
  },
);

// @route DELETE api/profile/education/:ed_id
// @desc Delete education from profile
// @access Private
router.delete('/education/:ed_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then((profile) => {
    // Get remove index
    const removeIndex = profile.education.map((item) => item.id).indexOf(req.params.ed_id);

    // Splice out of array
    profile.education.splice(removeIndex, 1);

    profile
      .save()
      .then((profile) => res.json(profile))
      .catch((err) => res.status(404).json(err));
  });
});

// @route DELETE api/profile
// @desc Delete user and profile
// @access Private
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id }).then((profile) => {
    User.findOneAndRemove({ _id: req.user.id }).then((user) => res.json({ success: true }));
  });
});

module.exports = router;
