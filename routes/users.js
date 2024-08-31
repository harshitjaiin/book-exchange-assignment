const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register Handle
router.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, username, email, password, password2 });
    } else {
        const user = await User.findOne({ email: email });
        if (user) {
            errors.push({ msg: 'Email is already registered' });
            res.render('register', { errors, username, email, password, password2 });
        } else {
            const newUser = new User({ username, email, password });
            await newUser.save();
            req.flash('success_msg', 'You are now registered and can log in');
            res.redirect('/users/login');
        }
    }
});

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    const user = await User.findById(req.user._id).populate('books');
    res.render('dashboard', { user });
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/users/login');
}

module.exports = router;
