import express from 'express';
import Quote from '../models/Quote.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get random quote
router.get('/random', async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = { isActive: true };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const quotes = await Quote.find(filter);
    
    if (quotes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quotes found'
      });
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    // Increment usage count
    randomQuote.usageCount += 1;
    await randomQuote.save();

    res.json({
      success: true,
      data: {
        quote: {
          id: randomQuote._id,
          text: randomQuote.text,
          author: randomQuote.author,
          category: randomQuote.category
        }
      }
    });

  } catch (error) {
    console.error('Get random quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quote'
    });
  }
});

// Get quote of the day
router.get('/daily', async (req, res) => {
  try {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    const quotes = await Quote.find({ isActive: true });
    
    if (quotes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quotes found'
      });
    }

    const quoteIndex = dayOfYear % quotes.length;
    const dailyQuote = quotes[quoteIndex];

    res.json({
      success: true,
      data: {
        quote: {
          id: dailyQuote._id,
          text: dailyQuote.text,
          author: dailyQuote.author,
          category: dailyQuote.category
        },
        date: today.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Get daily quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily quote'
    });
  }
});

// Get all quotes (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search = req.query.search;

    const filter = { isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { text: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [quotes, total] = await Promise.all([
      Quote.find(filter)
        .sort({ usageCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('text author category likes usageCount createdAt'),
      Quote.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        quotes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quotes'
    });
  }
});

// Add new quote (authenticated users)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text, author, category = 'general' } = req.body;

    if (!text || !author) {
      return res.status(400).json({
        success: false,
        message: 'Text and author are required'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Quote text must be 500 characters or less'
      });
    }

    if (author.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Author name must be 100 characters or less'
      });
    }

    const validCategories = ['motivation', 'strength', 'perseverance', 'hope', 'recovery', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Check for duplicate quotes
    const existingQuote = await Quote.findOne({ 
      text: { $regex: new RegExp(`^${text.trim()}$`, 'i') }
    });

    if (existingQuote) {
      return res.status(400).json({
        success: false,
        message: 'This quote already exists'
      });
    }

    const quote = new Quote({
      text: text.trim(),
      author: author.trim(),
      category,
      addedBy: req.user.userId
    });

    await quote.save();

    res.status(201).json({
      success: true,
      message: 'Quote added successfully',
      data: {
        quote: {
          id: quote._id,
          text: quote.text,
          author: quote.author,
          category: quote.category
        }
      }
    });

  } catch (error) {
    console.error('Add quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add quote'
    });
  }
});

// Like a quote
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    quote.likes += 1;
    await quote.save();

    res.json({
      success: true,
      message: 'Quote liked successfully',
      data: {
        likes: quote.likes
      }
    });

  } catch (error) {
    console.error('Like quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like quote'
    });
  }
});

// Get quote categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Quote.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: {
        categories: ['all', ...categories]
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

export default router;