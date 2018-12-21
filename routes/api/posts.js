const express = require('express');
const passport = require('passport');

const router = express.Router();

// Load Input validation
const validatePostInput = require('../../validation/post');

// Load post model
const Post = require('../../models/Post');

// Load profile model
const Profile = require('../../models/Profile');

// @route GET api/posts
// @desc Get all posts
// @access Private
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((err) => res.status(404).json({ post: 'Post was not found.' }));
});

// @route GET api/posts/:post_id
// @desc Get post by id
// @access Private
router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      if (!post) res.status(404).json({ post: 'Post was not found.' });

      res.status(200).json(post);
    })
    .catch((err) => res.status(404).json({ post: 'Post was not found.' }));
});

// @route POST api/posts
// @desc Create post
// @access Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  // Check validation
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id,
  });

  newPost.save().then((post) => res.json(post));
});

// @route DELETE api/posts/:post_id
// @desc Delete post by id
// @access Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then(() => {
    Post.findById(req.params.id)
      .then((post) => {
        if (post.user.toString() !== req.user.id) {
          res.status(401).json({ user: 'User not authorized' });
        }

        post.remove().then((post) => res.status(200).json(post));
      })
      .catch((err) => res.status(404).json({ post: 'Post was not found.' }));
  });
});

// @route POST api/posts/like/:id
// @desc Like post
// @access Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
        return res.status(400).json({ likes: 'User already liked this post.' });
      }

      post.likes.unshift({ user: req.user.id});

      post.save().then((post) => res.json(post));
    })
    .catch((err) => res.status(404).json({ post: 'Post was not found.' }));
});

// @route POST api/posts/unlike/:id
// @desc Unlike post
// @access Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      if (post.likes.filter((like) => like.user.toString() === req.user.id).length === 0) {
        return res.status(400).json({ likes: 'You have not yet liked this post.' });
      }

      const removeIndex = post.likes.map((item) => item.user.toString()).indexOf(req.user.id);

      post.likes.splice(removeIndex, 1);

      post.save().then((post) => res.json(post));
    })
    .catch((err) => res.status(404).json({ post: 'Post was not found.' }));
});

module.exports = router;
