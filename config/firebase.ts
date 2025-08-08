// config/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }
};

// Validate before using
validateEnvVars();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

class FirebaseService {
  private static instance: FirebaseService;
  private _app: any;
  private _auth: any;
  private _db: any;
  private _storage: any;
  private initialized = false;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private initialize() {
    if (this.initialized) return;

    try {
      // Check if app is already initialized
      if (getApps().length === 0) {
        console.log('Initializing Firebase app...');
        this._app = initializeApp(firebaseConfig);
        
        this._auth = initializeAuth(this._app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } else {
        console.log('Using existing Firebase app...');
        this._app = getApp();
        try {
          this._auth = getAuth(this._app);
        } catch (error) {
          this._auth = initializeAuth(this._app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
        }
      }

      this._db = getFirestore(this._app);
      this._storage = getStorage(this._app);

      if (this._auth) {
        this._auth.languageCode = 'en';
      }

      this.initialized = true;
      console.log('Firebase initialization completed successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  get auth() {
    this.initialize();
    return this._auth;
  }

  get db() {
    this.initialize();
    return this._db;
  }

  get storage() {
    this.initialize();
    return this._storage;
  }

  get app() {
    this.initialize();
    return this._app;
  }

  // Method to check if Firebase is properly initialized
  isInitialized(): boolean {
    return this.initialized && this._auth && this._db && this._storage;
  }
}

const firebaseService = FirebaseService.getInstance();

// Export the service instance and individual services
export const auth = firebaseService.auth;
export const db = firebaseService.db;
export const storage = firebaseService.storage;
export const app = firebaseService.app;

// Function exports
export const getFirebaseAuth = () => firebaseService.auth;
export const getFirebaseDb = () => firebaseService.db;
export const getFirebaseStorage = () => firebaseService.storage;
export const getFirebaseApp = () => firebaseService.app;

// Default export
export default firebaseService;