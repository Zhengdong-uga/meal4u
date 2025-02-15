---


Ensure your system meets the following requirements before proceeding:

- [**Node.js**](https://github.com/nvm-sh/nvm) (Recommended: use `nvm` to manage versions)
- [**Expo CLI**](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [**EAS CLI**](https://expo.dev/eas) (`npm install -g eas-cli`)
- [**CocoaPods**](https://cocoapods.org/)** (For iOS)** (`sudo gem install cocoapods`)
- **A Firebase Project** with Authentication enabled (Google & Apple login)
- **A Registered Apple Developer Account** (For Apple Sign-in)

---

## ⚡ **Project Setup**

Follow these steps to set up the project:

### **1️⃣ Clone the Repository**

```sh
mkdir mealingful && cd mealingful
git clone https://github.com/Zhengdong-uga/meal4u.git
cd meal4u
npm install
```

### **2️⃣ Install Required Packages**

Run the following commands:

```sh
# Expo version
npm install expo@~51.0.37

# Firebase SDK
npm install firebase

# Google Generative AI
npm install @google/generative-ai

# Navigation & UI
npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/bottom-tabs
npm install @react-navigation/drawer
npm install react-native-gesture-handler
npm install react-native-vector-icons
npm install react-native-responsive-screen
npm i react-native-heroicons react-native-svg

# Date Handling
npm install dayjs

# Calendar Component
npm install react-native-calendars
```

---

## 🚀 **Expo Dev Client Setup (Required for Google & Apple Login)**

Expo Go **does not support Apple & Google login**, so you need `expo-dev-client`:

```sh
expo install expo-dev-client
```

To build a local development version:

```sh
eas build -p ios --profile development
```

Then install the `.ipa` on your iPhone.

---

## 🔥 **Firebase Setup**

### **1️⃣ Create a Firebase Project**

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (`Meal4U`)
3. Go to **Authentication** → `Sign-in method`
4. Enable **Google** and **Apple** authentication

### **2️⃣ Download Firebase Configuration Files**

1. **For Android**: Download `google-services.json` and place it in:
   ```
   android/app/google-services.json
   ```
2. **For iOS**: Download `GoogleService-Info.plist` and place it in:
   ```
   ios/GoogleService-Info.plist
   ```

### **3️⃣ Firebase Initialization**

Create a `firebase.js` file inside `src/backend/`:

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

---

## ✅ **Google & Apple Login Setup**

### **1️⃣ Google Sign-In Configuration**

#### **🔹 Enable Google Authentication in Firebase**

1. Go to **Firebase Console** → `Authentication`
2. Enable `Google Sign-In`
3. Copy your **Web Client ID**

#### **🔹 Install Google Auth Session**

```sh
expo install expo-auth-session
```

#### **🔹 Update Your Google Login Code**

Modify `LoginPage.js`:

```js
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

const [request, response, promptAsync] = Google.useAuthRequest({
  iosClientId: "YOUR_IOS_CLIENT_ID",
  webClientId: "YOUR_WEB_CLIENT_ID",
  redirectUri: "https://YOUR_PROJECT.firebaseapp.com/__/auth/handler",
  useProxy: false,
});
```

---

### **2️⃣ Apple Sign-In Configuration**

#### **🔹 Enable Apple Sign-In in Firebase**

1. Go to **Firebase Console** → `Authentication`
2. Enable `Apple Sign-In`
3. Copy your **Team ID & Key ID** from **Apple Developer Portal**

#### **🔹 Install Apple Authentication**

```sh
expo install expo-apple-authentication
```

#### **🔹 Update Your Apple Login Code**

Modify `LoginPage.js`:

```js
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from "firebase/auth";
```

---

## 🚀 **Run the App**

```sh
npx expo start
```

**For Apple Login & Google Login to work, use:**

```sh
eas build -p ios --profile development
```

---

## 📆 **Building & Deploying**

```sh
eas build -p ios --profile production
eas build -p android --profile production
```

---

## 🎉 **Congratulations!**

You are now ready to develop and test **Meal4U** with full **Google & Apple login support**! 🚀

