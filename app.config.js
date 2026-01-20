import appJson from './app.json';

export default ({ config }) => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...(appJson.expo.extra ?? {}),
    ...(config?.extra ?? {}),
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
});
  