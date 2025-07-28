// Quote Manager
export class QuoteManager {
    constructor() {
        this.quotes = [
            {
                text: "The first step towards getting somewhere is to decide you're not going to stay where you are.",
                author: "J.P. Morgan"
            },
            {
                text: "Recovery is not a race. You don't have to feel guilty if it takes you longer than you thought it would.",
                author: "Unknown"
            },
            {
                text: "The greatest revolution of our generation is the discovery that human beings, by changing the inner attitudes of their minds, can change the outer aspects of their lives.",
                author: "William James"
            },
            {
                text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
                author: "A.A. Milne"
            },
            {
                text: "Progress, not perfection.",
                author: "Recovery Wisdom"
            },
            {
                text: "Every day is a new beginning. Take a deep breath, smile, and start again.",
                author: "Unknown"
            },
            {
                text: "The comeback is always stronger than the setback.",
                author: "Unknown"
            },
            {
                text: "Rock bottom became the solid foundation on which I rebuilt my life.",
                author: "J.K. Rowling"
            },
            {
                text: "You don't have to be perfect; you just have to be better than you were yesterday.",
                author: "Unknown"
            },
            {
                text: "Healing takes time, and asking for help is a courageous step.",
                author: "Mariska Hargitay"
            },
            {
                text: "The only impossible journey is the one you never begin.",
                author: "Tony Robbins"
            },
            {
                text: "Your current situation is not your final destination. The best is yet to come.",
                author: "Unknown"
            },
            {
                text: "Recovery is about progression, not perfection.",
                author: "Unknown"
            },
            {
                text: "Believe you can and you're halfway there.",
                author: "Theodore Roosevelt"
            },
            {
                text: "The only person you are destined to become is the person you decide to be.",
                author: "Ralph Waldo Emerson"
            },
            {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill"
            },
            {
                text: "Don't watch the clock; do what it does. Keep going.",
                author: "Sam Levenson"
            },
            {
                text: "The journey of a thousand miles begins with one step.",
                author: "Lao Tzu"
            },
            {
                text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
                author: "Ralph Waldo Emerson"
            },
            {
                text: "You have been assigned this mountain to show others it can be moved.",
                author: "Mel Robbins"
            },
            {
                text: "Recovery is not about being perfect. It's about being honest.",
                author: "Unknown"
            },
            {
                text: "The strongest people are not those who show strength in front of us, but those who win battles we know nothing about.",
                author: "Unknown"
            },
            {
                text: "Fall seven times, stand up eight.",
                author: "Japanese Proverb"
            },
            {
                text: "Your story isn't over yet.",
                author: "Unknown"
            },
            {
                text: "Recovery is an acceptance that your life is in shambles and you have to change it.",
                author: "Jamie Lee Curtis"
            }
        ];
        
        this.currentQuoteIndex = 0;
        this.rotationInterval = null;
    }

    getCurrentQuote() {
        return this.quotes[this.currentQuoteIndex];
    }

    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    }

    nextQuote() {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
        return this.getCurrentQuote();
    }

    previousQuote() {
        this.currentQuoteIndex = this.currentQuoteIndex === 0 
            ? this.quotes.length - 1 
            : this.currentQuoteIndex - 1;
        return this.getCurrentQuote();
    }

    startRotation(intervalMinutes = 60) {
        this.stopRotation();
        
        // Rotate quotes every hour by default
        this.rotationInterval = setInterval(() => {
            this.nextQuote();
            this.updateQuoteDisplay();
        }, intervalMinutes * 60 * 1000);
    }

    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
        }
    }

    updateQuoteDisplay() {
        const quoteElement = document.getElementById('daily-quote');
        if (quoteElement) {
            const quote = this.getCurrentQuote();
            quoteElement.innerHTML = `
                <p>"${quote.text}"</p>
                <cite>— ${quote.author}</cite>
            `;
        }
    }

    // Get quotes by category (future enhancement)
    getQuotesByCategory(category) {
        // This could be expanded to categorize quotes
        return this.quotes.filter(quote => quote.category === category);
    }

    // Search quotes by text or author
    searchQuotes(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.quotes.filter(quote => 
            quote.text.toLowerCase().includes(term) || 
            quote.author.toLowerCase().includes(term)
        );
    }

    // Get quote of the day based on date
    getQuoteOfTheDay() {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const quoteIndex = dayOfYear % this.quotes.length;
        return this.quotes[quoteIndex];
    }

    // Add custom quote (future enhancement)
    addCustomQuote(text, author) {
        const newQuote = { text, author, custom: true };
        this.quotes.push(newQuote);
        return newQuote;
    }

    // Get total number of quotes
    getTotalQuotes() {
        return this.quotes.length;
    }

    // Set specific quote by index
    setQuoteByIndex(index) {
        if (index >= 0 && index < this.quotes.length) {
            this.currentQuoteIndex = index;
            return this.getCurrentQuote();
        }
        return null;
    }
}