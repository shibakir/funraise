const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let storage;

try {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

const uploadImage = async (file, path) => {
  try {
    console.log('Starting image upload to Firebase...');
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer ? 'Buffer exists' : 'No buffer'
    });

    if (!file.buffer) {
      throw new Error('File buffer is missing');
    }

    const storageRef = ref(storage, path);
    console.log('Storage reference created:', path);

    console.log('Uploading bytes...');
    const snapshot = await uploadBytes(storageRef, file.buffer);
    console.log('Upload completed:', {
      metadata: snapshot.metadata,
      ref: snapshot.ref
    });

    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Detailed Firebase upload error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    // find out error codes
    if (error.code === 'storage/unauthorized') {
      throw new Error('Firebase Storage: User is not authorized to perform the desired action');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('Firebase Storage: Maximum retry time for operation exceeded');
    } else if (error.code === 'storage/invalid-checksum') {
      throw new Error('Firebase Storage: File on the client does not match the checksum of the file received by the server');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Firebase Storage: User canceled the upload');
    } else if (error.code === 'storage/invalid-argument') {
      throw new Error('Firebase Storage: Invalid argument provided');
    } else if (error.code === 'storage/no-default-bucket') {
      throw new Error('Firebase Storage: No bucket has been set in your config');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Firebase Storage: Quota on your Firebase Storage bucket has been exceeded');
    }

    throw error;
  }
};

module.exports = { uploadImage }; 