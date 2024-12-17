const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const Papa = require('papaparse');
const axios = require('axios');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = 'card-tracker-images';
let cardCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const app = express();
//const PORT = 5000;
const PORT = process.env.PORT || 5000;

// Update the download-image endpoint
app.get('/download-image', async (req, res) => {
    const { imageUrl } = req.query;
    if (!imageUrl) {
        return res.status(400).send('Image URL is required.');
    }

    const updatedUrl = imageUrl.replace('_200w.jpg', '_400w.jpg');
    const imageName = path.basename(updatedUrl);
    const localPath = path.join(__dirname, 'public', 'images', imageName);

    // Local development: just serve existing images
    if (process.env.NODE_ENV !== 'production') {
        try {
            if (await fs.pathExists(localPath)) {
                return res.sendFile(localPath);
            }
            return res.status(404).send('Image not found locally');
        } catch (error) {
            console.log("Local file error:", error.message);
            return res.status(500).send('Error accessing local image.');
        }
    }

    // Production: check Google Cloud Storage
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(imageName);

    try {
        const [exists] = await file.exists();
        if (exists) {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${imageName}`;
            return res.status(200).send(publicUrl);
        }
        return res.status(404).send('Image not found');
    } catch (error) {
        console.log("Error details:", error.message);
        res.status(500).send('Error processing the image.');
    }
});


const cors = require('cors');
app.use(cors()); // Enable CORS for all routes

// Serve React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Endpoint to get combined CSV data
app.get('/api/cards', async (req, res) => {
    try {
        // Return cached data if available and fresh
        if (cardCache && lastCacheTime && (Date.now() - lastCacheTime < CACHE_DURATION)) {
            console.log('Serving cards from cache');
            return res.json(cardCache);
        }
        console.log('Reading cards from CSV files');
        const folderPath = path.join(__dirname, 'csv-files');
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.csv') && file !== 'OnePieceCardGameGroups.csv');

        let allCards = [];
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const csvText = fs.readFileSync(filePath, 'utf-8');
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
            allCards = allCards.concat(parsedData);
        }

        // Update cache
        cardCache = allCards;
        lastCacheTime = Date.now();

        res.json(allCards);
    } catch (error) {
        console.error("Error reading CSV files:", error);
        res.status(500).json({ error: "Error reading CSV files" });
    }
});

// Endpoint to download all images for cards
app.post('/api/download-all-images', async (req, res) => {
    try {
        console.log('Starting image download process...');
        
        const folderPath = path.join(__dirname, 'csv-files');
        const files = fs.readdirSync(folderPath).filter(file => 
            file.endsWith('.csv') && file !== 'OnePieceCardGameGroups.csv'
        );

        console.log(`Found ${files.length} CSV files to process`);

        // Create images directory if it doesn't exist
        const imagesDir = path.join(__dirname, 'public', 'images');
        await fs.ensureDir(imagesDir);

        let allCards = [];
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const csvText = fs.readFileSync(filePath, 'utf-8');
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
            
            // Log the first few URLs from each CSV file
            console.log(`URLs from ${file}:`, parsedData.slice(0, 3).map(card => card.imageUrl));
            
            allCards = allCards.concat(parsedData);
        }

        console.log(`Processing ${allCards.length} cards`);

        let successful = 0;
        let skipped = 0;
        const total = allCards.length;
        const errors = [];

        for (const card of allCards) {
            if (!card.imageUrl) continue;

            const imageUrl = card.imageUrl.replace('_200w.jpg', '_400w.jpg');
            const imageName = path.basename(imageUrl);
            const localPath = path.join(imagesDir, imageName);

            try {
                // Check if image exists
                if (await fs.pathExists(localPath)) {
                    skipped++;
                    continue;
                }

                console.log(`Downloading: ${imageUrl}`);
                
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'arraybuffer',
                    timeout: 5000
                });

                await fs.writeFile(localPath, response.data);
                successful++;
                console.log(`Successfully downloaded: ${imageName}`);
            } catch (error) {
                errors.push(`Failed to download ${imageUrl}: ${error.message}`);
            }
        }

        res.json({ 
            successful, 
            skipped,
            total,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Main process error:', error);
        res.status(500).json({ 
            error: 'Error downloading images',
            details: error.message
        });
    }
});

// Serve React index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
