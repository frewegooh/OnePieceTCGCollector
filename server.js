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
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(imageName);

    try {
        // Check if image exists in bucket
        const [exists] = await file.exists();
        if (exists) {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${imageName}`;
            return res.status(200).send(publicUrl);
        }

        // Download and upload to Cloud Storage
        const response = await axios({
            method: 'GET',
            url: updatedUrl,
            responseType: 'arraybuffer'
        });

        await file.save(response.data, {
            contentType: 'image/jpeg'
        });

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${imageName}`;
        res.status(200).send(publicUrl);
    } catch (error) {
        console.error("Error handling image:", error);
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
// Endpoint to download and save a single image
app.get('/download-image', async (req, res) => {
    const { imageUrl } = req.query;

    if (!imageUrl) {
        return res.status(400).send('Image URL is required.');
    }

    // Modify the URL to use the _400w.jpg variant
    const updatedUrl = imageUrl.replace('_200w.jpg', '_400w.jpg');
    const imageName = path.basename(updatedUrl);
    const localPath = path.join(__dirname, 'images', imageName);

    try {
        // Check if the image already exists locally
        if (await fs.pathExists(localPath)) {
            return res.status(200).send(`/images/${imageName}`);
        }

        // Download the image
        const response = await axios({
            method: 'GET',
            url: updatedUrl,
            responseType: 'stream',
        });

        // Save the image locally
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        writer.on('finish', () => res.status(200).send(`/images/${imageName}`));
        writer.on('error', (error) => {
            console.error("Error saving image:", error);
            res.status(500).send('Error saving the image.');
        });
    } catch (error) {
        console.error("Error downloading image:", error);
        res.status(500).send('Error downloading the image.');
    }
});

// Endpoint to download all images for cards
app.post('/api/download-all-images', async (req, res) => {
    try {
        const folderPath = path.join(__dirname, 'csv-files'); // Folder containing CSV files
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.csv') && file !== 'OnePieceCardGameGroups.csv');

        let allCards = [];

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const csvText = fs.readFileSync(filePath, 'utf-8');

            // Parse each CSV file and add `groupID` from filename (if available)
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
            allCards = allCards.concat(parsedData);
        }

        // Download images for all cards
        const promises = allCards.map(async (card) => {
            const imageUrl = card.imageUrl.replace('_200w.jpg', '_400w.jpg');
            const imageName = path.basename(imageUrl);
            const localPath = path.join(__dirname, 'images', imageName);

            // Check if the image already exists locally
            if (await fs.pathExists(localPath)) return;

            try {
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'stream',
                });

                const writer = fs.createWriteStream(localPath);
                response.data.pipe(writer);

                return new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
            } catch (error) {
                console.error(`Error downloading image for ${card.cleanName}:`, error);
            }
        });

        await Promise.all(promises);

        res.status(200).send('Images downloaded successfully.');
    } catch (error) {
        console.error('Error downloading all images:', error);
        res.status(500).json({ error: 'Error downloading all images.' });
    }
});

// Serve React index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
