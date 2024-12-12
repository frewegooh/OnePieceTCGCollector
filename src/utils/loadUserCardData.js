// src/utils/loadUserCardData.js
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';

export const loadUserCardData = async (userId) => {
    try {
        const docRef = doc(firestore, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data(); // Return the user data
        } else {
            console.log('No user card data found!');
            return { cards: [] }; // Default empty cards if no document exists
        }
    } catch (error) {
        console.error('Error loading user card data:', error);
        throw error; // Let the calling code handle the error
    }
};
