import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quote from '../models/Quote.js';

dotenv.config();

const quotes = [
  {
    text: "The first step towards getting somewhere is to decide you're not going to stay where you are.",
    author: "J.P. Morgan",
    category: "motivation"
  },
  {
    text: "Recovery is not a race. You don't have to feel guilty if it takes you longer than you thought it would.",
    author: "Unknown",
    category: "recovery"
  },
  {
    text: "The greatest revolution of our generation is the discovery that human beings, by changing the inner attitudes of their minds, can change the outer aspects of their lives.",
    author: "William James",
    category: "strength"
  },
  {
    text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
    author: "A.A. Milne",
    category: "strength"
  },
  {
    text: "Progress, not perfection.",
    author: "Recovery Wisdom",
    category: "recovery"
  },
  {
    text: "Every day is a new beginning. Take a deep breath, smile, and start again.",
    author: "Unknown",
    category: "hope"
  },
  {
    text: "The comeback is always stronger than the setback.",
    author: "Unknown",
    category: "perseverance"
  },
  {
    text: "Rock bottom became the solid foundation on which I rebuilt my life.",
    author: "J.K. Rowling",
    category: "recovery"
  },
  {
    text: "You don't have to be perfect; you just have to be better than you were yesterday.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Healing takes time, and asking for help is a courageous step.",
    author: "Mariska Hargitay",
    category: "recovery"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: "motivation"
  },
  {
    text: "Your current situation is not your final destination. The best is yet to come.",
    author: "Unknown",
    category: "hope"
  },
  {
    text: "Recovery is about progression, not perfection.",
    author: "Unknown",
    category: "recovery"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "motivation"
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson",
    category: "strength"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "perseverance"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "perseverance"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
    category: "motivation"
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson",
    category: "strength"
  },
  {
    text: "You have been assigned this mountain to show others it can be moved.",
    author: "Mel Robbins",
    category: "strength"
  },
  {
    text: "Recovery is not about being perfect. It's about being honest.",
    author: "Unknown",
    category: "recovery"
  },
  {
    text: "The strongest people are not those who show strength in front of us, but those who win battles we know nothing about.",
    author: "Unknown",
    category: "strength"
  },
  {
    text: "Fall seven times, stand up eight.",
    author: "Japanese Proverb",
    category: "perseverance"
  },
  {
    text: "Your story isn't over yet.",
    author: "Unknown",
    category: "hope"
  },
  {
    text: "Recovery is an acceptance that your life is in shambles and you have to change it.",
    author: "Jamie Lee Curtis",
    category: "recovery"
  }
];

async function seedQuotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/never-relapse');
    console.log('Connected to MongoDB');

    // Clear existing quotes
    await Quote.deleteMany({});
    console.log('Cleared existing quotes');

    // Insert new quotes
    await Quote.insertMany(quotes);
    console.log(`Inserted ${quotes.length} quotes`);

    console.log('Quote seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding quotes:', error);
    process.exit(1);
  }
}

seedQuotes();