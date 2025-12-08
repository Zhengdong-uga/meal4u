export default {
    expo: {
      name: "meal4u",
      slug: "meal4u",
      version: "1.0.0",
      sdkVersion: "52.0.0", // replace with your actual version
      extra: {
        firebaseApi: {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
        },
        geminikey: process.env.GEMINI_API_KEY
      }
    }
  }
  