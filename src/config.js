const API_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000'
    : 'https://card-tracker-962993019749.us-central1.run.app';

const STATIC_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://card-tracker-c0d1f.web.app';


    export const getImageUrl = (imageUrl) => {
        const imageName = imageUrl.split('/').pop().replace('_200w.jpg', '_400w.jpg');
        return `${STATIC_URL}/images/${imageName}`;
    };

export default API_URL;