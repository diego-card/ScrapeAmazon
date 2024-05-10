const express = require('express');
const cors = require('cors');
const { fetchAmazonSearchResults } = require('./scraper.js')
const app = express();

app.use(cors());

// Define a route for /api/scrape
app.get('/api/scrape/', async (req, res) => {
    try {
        const keyword = req.query.keyword;

        fetchAmazonSearchResults(keyword).then(arr => res.json(arr));
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

