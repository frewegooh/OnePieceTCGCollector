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
const compression = require('compression');
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours



const app = express();
//const PORT = 5000;
const PORT = process.env.PORT || 5000;

const cors = require('cors');
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); 
app.use(compression());

// Add your CSV URLs here
const csvMapping  = {
    'https://tcgcsv.com/tcgplayer/68/3188/ProductsAndPrices.csv': 'RomanceDawnProductsAndPrices.csv', //OP01
    'https://tcgcsv.com/tcgplayer/68/3189/ProductsAndPrices.csv': 'StarterDeck1StrawHatCrewProductsAndPrices.csv', //ST01
    'https://tcgcsv.com/tcgplayer/68/3190/ProductsAndPrices.csv': 'StarterDeck4AnimalKingdomPiratesProductsAndPrices.csv', //ST04
    'https://tcgcsv.com/tcgplayer/68/3191/ProductsAndPrices.csv': 'StarterDeck2WorstGenerationProductsAndPrices.csv', //ST02
    'https://tcgcsv.com/tcgplayer/68/3192/ProductsAndPrices.csv': 'StarterDeck3TheSevenWarlordsofTheSeaProductsAndPrices.csv', //ST03
    'https://tcgcsv.com/tcgplayer/68/17658/ProductsAndPrices.csv': 'SuperPre-ReleaseStarterDeck2WorstGenerationProductsAndPrices.csv', //ST02 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/17659/ProductsAndPrices.csv': 'SuperPre-ReleaseStarterDeck1StrawHatCrewProductsAndPrices.csv', //ST01 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/17660/ProductsAndPrices.csv': 'SuperPre-ReleaseStarterDeck3TheSevenWarlordsoftheSeaProductsAndPrices.csv', //ST03 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/17661/ProductsAndPrices.csv': 'SuperPre-ReleaseStarterDeck4AnimalKingdomPiratesProductsAndPrices.csv', //ST04 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/17675/ProductsAndPrices.csv': 'OnePiecePromotionCardsProductsAndPrices.csv', //Promotional
    'https://tcgcsv.com/tcgplayer/68/17687/ProductsAndPrices.csv': 'StarterDeck5FilmEditionProductsAndPrices.csv', //ST05
    'https://tcgcsv.com/tcgplayer/68/17698/ProductsAndPrices.csv': 'ParamountWarProductsAndPrices.csv', //OP02
    'https://tcgcsv.com/tcgplayer/68/17699/ProductsAndPrices.csv': 'StarterDeck6AbsoluteJusticeProductsAndPrices.csv', //ST06
    'https://tcgcsv.com/tcgplayer/68/22890/ProductsAndPrices.csv': 'PillarsofStrengthProductsAndPrices.csv', //OP03
    'https://tcgcsv.com/tcgplayer/68/22930/ProductsAndPrices.csv': 'StarterDeck7BigMomPiratesProductsAndPrices.csv', //ST07
    'https://tcgcsv.com/tcgplayer/68/22934/ProductsAndPrices.csv': 'ParamountWarPre-ReleaseCardsProductsAndPrices.csv', //OP02 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/22956/ProductsAndPrices.csv': 'StarterDeck8MonkeyDLuffyProductsAndPrices.csv', //ST08
    'https://tcgcsv.com/tcgplayer/68/22957/ProductsAndPrices.csv': 'StarterDeck9YamatoProductsAndPrices.csv', //ST09
    'https://tcgcsv.com/tcgplayer/68/23024/ProductsAndPrices.csv': 'KingdomsofIntrigueProductsAndPrices.csv', //OP04
    'https://tcgcsv.com/tcgplayer/68/23213/ProductsAndPrices.csv': 'AwakeningoftheNewEraProductsAndPrices.csv', //OP05
    'https://tcgcsv.com/tcgplayer/68/23232/ProductsAndPrices.csv': 'PillarsofStrengthPre-ReleaseCardsProductsAndPrices.csv', //OP03 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/23243/ProductsAndPrices.csv': 'UltraDeckTheThreeCaptainsProductsAndPrices.csv', //ST10
    'https://tcgcsv.com/tcgplayer/68/23250/ProductsAndPrices.csv': 'StarterDeck11UtaProductsAndPrices.csv', //ST11
    'https://tcgcsv.com/tcgplayer/68/23272/ProductsAndPrices.csv': 'WingsoftheCaptainProductsAndPrices.csv', //OP06
    'https://tcgcsv.com/tcgplayer/68/23297/ProductsAndPrices.csv': 'KingdomsofIntriguePre-ReleaseCardsProductsAndPrices.csv', //OP04 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/23304/ProductsAndPrices.csv': 'OnePieceCollectionSetsProductsAndPrices.csv', //Collection Sets
    'https://tcgcsv.com/tcgplayer/68/23333/ProductsAndPrices.csv': 'ExtraBoosterMemorialCollectionProductsAndPrices.csv', //EB01
    'https://tcgcsv.com/tcgplayer/68/23348/ProductsAndPrices.csv': 'StarterDeck12ZoroandSanjiProductsAndPrices.csv', //ST12
    'https://tcgcsv.com/tcgplayer/68/23349/ProductsAndPrices.csv': 'UltraDeckTheThreeBrothersProductsAndPrices.csv', //ST13
    'https://tcgcsv.com/tcgplayer/68/23368/ProductsAndPrices.csv': 'AwakeningoftheNewEra1stAnniversaryTournamentCardsProductsAndPrices.csv', //OP05 - 1st Anniversary
    'https://tcgcsv.com/tcgplayer/68/23387/ProductsAndPrices.csv': '500YearsintheFutureProductsAndPrices.csv', //OP07
    'https://tcgcsv.com/tcgplayer/68/23424/ProductsAndPrices.csv': 'WingsoftheCaptainPre-ReleaseCardsProductsAndPrices.csv', //OP06 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/23462/ProductsAndPrices.csv': 'TwoLegendsProductsAndPrices.csv', //OP08
    'https://tcgcsv.com/tcgplayer/68/23489/ProductsAndPrices.csv': 'StarterDeck143D2YProductsAndPrices.csv', //ST14
    'https://tcgcsv.com/tcgplayer/68/23490/ProductsAndPrices.csv': 'StarterDeck15REDEdwardNewgateProductsAndPrices.csv', //ST15
    'https://tcgcsv.com/tcgplayer/68/23491/ProductsAndPrices.csv': 'StarterDeck16GREENUtaProductsAndPrices.csv', //ST16
    'https://tcgcsv.com/tcgplayer/68/23492/ProductsAndPrices.csv': 'StarterDeck17BLUEDonquixoteDoflamingoProductsAndPrices.csv', //ST17
    'https://tcgcsv.com/tcgplayer/68/23493/ProductsAndPrices.csv': 'StarterDeck18PURPLEMonkeyDLuffyProductsAndPrices.csv', //ST18
    'https://tcgcsv.com/tcgplayer/68/23494/ProductsAndPrices.csv': 'StarterDeck19BLACKSmokerProductsAndPrices.csv', //ST19
    'https://tcgcsv.com/tcgplayer/68/23495/ProductsAndPrices.csv': 'StarterDeck20YELLOWCharlotteKatakuriProductsAndPrices.csv', //ST20
    'https://tcgcsv.com/tcgplayer/68/23496/ProductsAndPrices.csv': 'PremiumBooster-TheBest-ProductsAndPrices.csv', //PRB01
    'https://tcgcsv.com/tcgplayer/68/23512/ProductsAndPrices.csv': '500YearsintheFuturePre-ReleaseCardsProductsAndPrices.csv', //OP07 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/23589/ProductsAndPrices.csv': 'EmperorsintheNewWorldProductsAndPrices.csv', //OP09
    'https://tcgcsv.com/tcgplayer/68/23590/ProductsAndPrices.csv': 'EmperorsintheNewWorld2ndAnniversaryTournamentCardsProductsAndPrices.csv', //OP09 2nd Anniversary 
    'https://tcgcsv.com/tcgplayer/68/23737/ProductsAndPrices.csv': 'TwoLegendsPre-ReleaseCardsProductsAndPrices.csv', //OP08 Pre-Release
    'https://tcgcsv.com/tcgplayer/68/23766/ProductsAndPrices.csv': 'RoyalBloodlinesProductsAndPrices.csv', //OP10 
    'https://tcgcsv.com/tcgplayer/68/23834/ProductsAndPrices.csv': 'ExtraBoosterAnime25thCollectionProductsAndPrices.csv', //Anime 25TH collection
    'https://tcgcsv.com/tcgplayer/68/23890/ProductsAndPrices.csv': 'RevisionPackCardsProductsAndPrices.csv', //Revision Pack
    'https://tcgcsv.com/tcgplayer/68/23907/ProductsAndPrices.csv': 'OnePieceDemoDeckCardsProductsAndPrices.csv', //Promotional
    'https://tcgcsv.com/tcgplayer/68/23991/ProductsAndPrices.csv': 'StarterDeckEXGear5ProductsAndPrices.csv', //Promotional
};

// Add this mapping near the top with other constants
const setCodeToGroupId = {
    // Main Sets
    'OP09': '23589',
    'OP08': '23462',
    'OP07': '23387',
    'OP06': '23272',
    'OP05': '23213',
    'OP04': '23024',
    'OP03': '22890',
    'OP02': '17698',
    'OP01': '3188',

    // Starter Decks
    'ST20': '23495',
    'ST19': '23494',
    'ST18': '23493',
    'ST17': '23492',
    'ST16': '23491',
    'ST15': '23490',
    'ST14': '23489',
    'ST13': '23349',
    'ST12': '23348',
    'ST11': '23250',
    'ST10': '23243',
    'ST09': '22957',
    'ST08': '22956',
    'ST07': '22930',
    'ST06': '17699',
    'ST05': '17687',
    'ST04': '3190',
    'ST03': '3192',
    'ST02': '3191',
    'ST01': '3189',

    // Pre-Release Sets
    'OP09-PR': '23590', // 2nd Anniversary
    'OP08-PR': '23737',
    'OP07-PR': '23512',
    'OP06-PR': '23424',
    'OP05-PR': '23368', // 1st Anniversary
    'OP04-PR': '23297',
    'OP03-PR': '23232',
    'OP02-PR': '22934',

    // Miscellaneous
    'PRB01': '23496',  // Premium Booster
    'EB01': '23333',   // Extra Booster
    'OP10': '23766',   // Royal Bloodlines
    'DEMO': '23907',   // Demo Deck
    'EX01': '23991',   // Starter Deck EX
    'REV': '23890',    // Revision Pack
    'COL': '23304',    // Collection Sets
    'AN25': '23834'    // Anime 25th Collection
};

// Add new endpoint for deck imports
app.post('/api/deck-import', async (req, res) => {
    try {
        const { deckList } = req.body;
        const cardMatches = [];

        for (const card of deckList) {
            // Extract set code from extNumber (e.g., 'OP09' from 'OP09-001')
            const setCode = card.extNumber.split('-')[0];
            const groupId = setCodeToGroupId[setCode];
            
            // Find the corresponding CSV file
            const matchingUrl = Object.keys(csvMapping).find(url => url.includes(`/${groupId}/`));
            const fileName = matchingUrl ? csvMapping[matchingUrl] : null;

            if (fileName) {
                const filePath = path.join(__dirname, 'csv-files', fileName);
                const csvText = fs.readFileSync(filePath, 'utf-8');
                const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
                
                const matchedCard = parsedData.find(c => c.extNumber === card.extNumber);
                if (matchedCard) {
                    cardMatches.push({
                        ...matchedCard,
                        quantity: card.quantity
                    });
                }
            }
        }

        res.json(cardMatches);
    } catch (error) {
        console.error("Error importing deck:", error);
        res.status(500).json({ error: "Error importing deck" });
    }
});


const setPriorities = {
    '23589': 1, // OP09
    '23462': 2, // OP08
    '23387': 3, // OP07
    '23272': 4, // OP06
    '23213': 5,  // OP05
    '23024': 6,  // OP04
    '22890': 7,  // OP03
    '17698': 8,  // OP02
    '3188': 9,  // OP01
    '3189': 10,  // ST01
    '3191': 11,  // ST02
    '3192': 12,  // ST03
    '3190': 13,  // ST04
    '17687': 14,  // ST05
    '17699': 15,  // ST06
    '22930': 16,  // ST07
    '22956': 17,  // ST08
    '22957': 18,  // ST09
    '23243': 19,  // ST10
    '23250': 20,  // ST11
    '23348': 21,  // ST12
    '23349': 22,  // ST13
    '23489': 23,  // ST14
    '23490': 24,  // ST15
    '23491': 25,  // ST16
    '23492': 26,  // ST17
    '23493': 27,  // ST18
    '23494': 28,  // ST19
    '23495': 29,  // ST20
    '23512': 30,  // ST20
};

// Update price data function
const updatePriceData = async (existingCards) => {
    for (const [url, filename] of Object.entries(csvMapping)) {
        const response = await axios.get(url);
        const newData = Papa.parse(response.data, { header: true, skipEmptyLines: true }).data;
        
        newData.forEach(newCard => {
            // First verify we have a valid productId
            if (!newCard.productId) {
                //console.log(`Skipping entry without productId from ${filename}`);
                return;
            }

            // Find exact match by productId
            const existingCard = existingCards.find(card => 
                card.productId === newCard.productId && 
                card._source_file === filename
            );

            if (existingCard) {
                //console.log(`Updating prices for productId: ${newCard.productId} from ${filename}`);
                existingCard.lowPrice = newCard.lowPrice;
                existingCard.midPrice = newCard.midPrice;
                existingCard.highPrice = newCard.highPrice;
                existingCard.marketPrice = newCard.marketPrice;
            }
        });
    }
    return existingCards;
};


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
            //console.log("Local file error:", error.message);
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
       // console.log("Error details:", error.message);
        res.status(500).send('Error processing the image.');
    }
});


// Serve React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Endpoint to get combined CSV data
app.get('/api/cards', async (req, res) => {
    try {
        let cards;
        if (cardCache && lastCacheTime && (Date.now() - lastCacheTime < CACHE_DURATION)) {
            cards = cardCache;
        } else {
            const folderPath = path.join(__dirname, 'csv-files');
            const files = fs.readdirSync(folderPath).filter(file => 
                file.endsWith('.csv') && file !== 'OnePieceCardGameGroups.csv'
            );
            
            cards = [];
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const csvText = fs.readFileSync(filePath, 'utf-8');
                const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;

                // Add debug logging here
                parsedData.forEach(card => {
                    if (card.extColor) {
                        card.extColor = card.extColor.split(';').filter(Boolean);
                        //console.log(`File: ${file}`);
                        //console.log(`Card: ${card.name}`);
                        //console.log(`Raw extColor: ${card.extColor}`);
                    }
                });



                // Add source file tracking for each card
                parsedData.forEach(card => {
                    card._source_file = file;
                });
                cards = cards.concat(parsedData);
            }
            
            // Update price data from remote sources
            cards = await updatePriceData(cards);

            // Sort cards by priority sets for display order
            cards.sort((a, b) => {
                const prioritySets = ['OP09', 'OP08', 'OP07', 'OP06', 'OP05', 'OP04', 'OP03', 'OP02', 'OP01'];
                const indexA = prioritySets.indexOf(a.groupId);
                const indexB = prioritySets.indexOf(b.groupId);
                
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                
                return 0;
            });
            
            cardCache = cards;
            lastCacheTime = Date.now();
        }
        
        res.json(cards);
    } catch (error) {
        console.error("Error processing cards:", error);
        res.status(500).json({ error: "Error processing cards" });
    }
});



// New endpoint to force price updates
app.post('/api/update-prices', async (req, res) => {
    try {
        if (cardCache) {
            cardCache = await updatePriceData(cardCache);
            lastCacheTime = Date.now();
            res.json({ success: true, message: "Prices updated successfully" });
        } else {
            res.status(400).json({ error: "No cached data available" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error updating prices" });
    }
});

// Endpoint to download all images for cards
app.post('/api/download-all-images', async (req, res) => {
    try {
        //console.log('Starting image download process...');
        
        const folderPath = path.join(__dirname, 'csv-files');
        const files = fs.readdirSync(folderPath).filter(file => 
            file.endsWith('.csv') && file !== 'OnePieceCardGameGroups.csv'
        );

        //console.log(`Found ${files.length} CSV files to process`);

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

        //console.log(`Processing ${allCards.length} cards`);

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

                //console.log(`Downloading: ${imageUrl}`);
                
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'arraybuffer',
                    timeout: 5000
                });

                await fs.writeFile(localPath, response.data);
                successful++;
                //console.log(`Successfully downloaded: ${imageName}`);
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


