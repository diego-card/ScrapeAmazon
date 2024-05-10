const jsdom = require('jsdom');
const axios = require('axios');
const virtualConsole = new jsdom.VirtualConsole;
//Use a virtual console, because JSDOM does not parse the CSS correctly
virtualConsole.on("error", () => { });

async function fetchAmazonSearchResults(keyword) {
    try {
        const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;

        // Set a custom user-agent header. This is required or Amazon rejects
        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            }
        };

        // Send a GET request to the Amazon search URL
        const response = await axios.get(searchUrl, config);

        // Create a JSDOM instance with the HTML content of the response
        const dom = new jsdom.JSDOM(response.data, { virtualConsole });

        // Extract information from the search results page
        const results = [];

        // Iterate over each product listing on the first page
        const productElements = dom.window.document.querySelectorAll('div.s-result-item');
        productElements.forEach((productElement, index) => {
            // Skip the first element
            if (index === 0) return;
      
            const titleElement = productElement.querySelector('span.a-text-normal');
            const title = titleElement ? titleElement.textContent.trim() : 'N/A';

            const ratingElement = productElement.querySelector('span.a-icon-alt');
            const rating = ratingElement ? ratingElement.textContent.trim() : 'N/A';

            const reviewCountElement = productElement.querySelector('span.a-size-base');
            const reviewCount = reviewCountElement ? reviewCountElement.textContent.trim() : 'N/A';
            
            const imageElement = productElement.querySelector('img.s-image');
            const imageURL = imageElement ? imageElement.src : 'N/A';
            
            const naCount = [title, rating, reviewCount].reduce((count, value) => count + (value === 'N/A' ? 1 : 0), 0);

            // Push extracted details to results array if at most one "N/A" is present
            if (naCount <= 1) {
                results.push({
                    title,
                    rating,
                    reviewCount,
                    imageURL
                });
            }
        });

        return results;
    } catch (error) {
        console.error('Error fetching Amazon search results:', error);
        return [];
    }
}

function scrape() {

    const keyword = document.getElementById('keyword').value;
    const url = `http://localhost:3000/api/scrape/?keyword=$${encodeURIComponent(keyword)}`;

    fetch(url)
        .then(response => response.json())
        .then(items => {            
            const catalog = document.querySelector('#result');

            //Reset the contents of catalog
            catalog.innerHTML = '';

            items.forEach(item => {
                const newItem = document.createElement('div');
                newItem.classList.add('item');

                const img = document.createElement('img');
                img.src = item.imageURL;
                img.onerror = function () {
                    // If the image fails to load, set a default image
                    this.src = 'https://www.ncenet.com/wp-content/uploads/2020/04/No-image-found.jpg';
                };
                newItem.appendChild(img);

                const details = document.createElement('div');
                details.classList.add('details');

                const title = document.createElement('h2');
                title.textContent = item.title;
                details.appendChild(title);

                const rating = document.createElement('div');
                rating.classList.add('rating');
                rating.textContent = 'Rating: ' + item.rating;
                details.appendChild(rating);

                const reviewCount = document.createElement('div');
                reviewCount.textContent = 'Reviews: ' + item.reviewCount;
                details.appendChild(reviewCount);

                newItem.appendChild(details);

                catalog.appendChild(newItem);
            });

        })
        .catch(error => {
            console.error('Error:', error);
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `<strong>Error:</strong> An error occurred while scraping data.`;
        });
}

module.exports = {
    scrape: scrape,
    fetchAmazonSearchResults: fetchAmazonSearchResults
}