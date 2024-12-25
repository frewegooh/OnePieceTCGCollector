const CACHE_NAME = 'card-images-cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

export const getCachedImage = async (imageUrl) => {
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(imageUrl);

    if (!response) {
        // Fetch and convert to WebP
        const fetchedResponse = await fetch(imageUrl);
        const blob = await fetchedResponse.blob();
        
        // Convert to WebP using Canvas
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        
        const webpBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/webp', 0.8);
        });

        response = new Response(webpBlob);
        
        // Cache the WebP version
        const headers = new Headers({
            'Cache-Control': 'public, max-age=604800',
            'Last-Modified': new Date().toUTCString()
        });
        
        const cacheResponse = new Response(webpBlob, { headers });
        await cache.put(imageUrl, cacheResponse);
    }

    return response;
};

export const cleanOldCache = async () => {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const now = new Date().getTime();

    for (const request of keys) {
        const response = await cache.match(request);
        const lastModified = new Date(response.headers.get('Last-Modified')).getTime();
        
        if (now - lastModified > CACHE_DURATION) {
            await cache.delete(request);
        }
    }
};
