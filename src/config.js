const API_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://card-tracker-962993019749.us-central1.run.app';

export const getImageUrl = (imageUrl) => {
    return `${API_URL}/download-image?imageUrl=${encodeURIComponent(imageUrl)}`;
};

export default API_URL;