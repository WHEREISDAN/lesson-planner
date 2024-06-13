// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // Import storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSPZaU2afjDjMNYNjY1oJ1W8EHzi46GiU",
  authDomain: "lessonplanner-96740.firebaseapp.com",
  projectId: "lessonplanner-96740",
  storageBucket: "lessonplanner-96740.appspot.com",
  messagingSenderId: "827252763326",
  appId: "1:827252763326:web:4d9aff08c403758a718cef",
  measurementId: "G-T9N0YKCMZT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app); // Initialize storage

export { app, analytics, storage }; // Export storage