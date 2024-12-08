import { initializeApp, getApps } from 'firebase/app';
// import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    // Refer to Discord
};

let firebaseApp
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApps()[0];
}

export default firebaseApp;
// const auth = getAuth(app);