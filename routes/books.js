const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');

// Add Book Page
router.get('/add', ensureAuthenticated, (req, res) => res.render('addBook'));

// Add Book Handle
router.post('/add', ensureAuthenticated, async (req, res) => {
    const { title, author, genre } = req.body;
    const newBook = new Book({ title, author, genre, owner: req.user._id });
    await newBook.save();

    req.user.books.push(newBook);
    await req.user.save();

    req.flash('success_msg', 'Book added successfully');
    res.redirect('/users/dashboard');
});

// Edit Book Page
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
    const book = await Book.findById(req.params.id);
    res.render('editBook', { book });
});

// Edit Book Handle
router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
    const { title, author, genre } = req.body;
    await Book.findByIdAndUpdate(req.params.id, { title, author, genre });
    req.flash('success_msg', 'Book updated successfully');
    res.redirect('/users/dashboard');
});

// Delete Book Handle
router.delete('/delete/:id', ensureAuthenticated, async (req, res) => {
    await Book.findByIdAndRemove(req.params.id);
    req.flash('success_msg', 'Book deleted successfully');
    res.redirect('/users/dashboard');
});

// Discover Books
router.get('/discover', ensureAuthenticated, async (req, res) => {
    const books = await Book.find({ owner: { $ne: req.user._id }, isAvailable: true });
    res.render('books', { books });
});

// Match Books (Simplified)
router.get('/match', ensureAuthenticated, async (req, res) => {
    const matches = await Book.find({
        genre: { $in: req.user.books.map(book => book.genre) },
        owner: { $ne: req.user._id },
        isAvailable: true
    });
    res.render('match', { matches });
});

// Request Book Exchange
router.post('/request/:id', ensureAuthenticated, async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        req.flash('error_msg', 'Book not found');
        return res.redirect('/books/discover');
    }

    // Handle exchange request logic here
    req.flash('success_msg', `Exchange request sent for ${book.title}`);
    res.redirect('/books/discover');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/users/login');
}

module.exports = router;
