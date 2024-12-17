const API_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://card-tracker-c0d1f.run.app';

export const getImageUrl = (imageUrl) => {
    return `${API_URL}/download-image?imageUrl=${encodeURIComponent(imageUrl)}`;
};

export default API_URL;