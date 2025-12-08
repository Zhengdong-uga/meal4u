# Meal4U

Meal4U is a personalized meal-planning and recipe recommendation app. It helps users define their dietary goals and preferences (diet type, restrictions, dislikes, etc.), then generates AI-powered meal and recipe suggestions, tracks saved recipes, and integrates calendar-based planning.

---

## 👀 App Preview (for reviewers)

If you're reviewing this repo and just want to quickly understand the experience, here’s a simple preview flow you can plug in once you have media assets ready:

- **Onboarding (goals & diet preferences)**  
  `![Onboarding](docs/previews/onboarding.png)`

- **AI-powered recipe generation**  
  `![AI Recipe Flow](docs/previews/ai-recipe.gif)`

- **Saved meals & calendar planning**  
  `![Calendar & Saved Meals](docs/previews/calendar.png)`

> Will upload gifs that quickly show the app interface and interactions

---

## 🧱 Architecture & Infrastructure

**Frontend / Mobile App**
- Built with **React Native** and **Expo**.
- Uses **React Navigation** (bottom tabs, drawer) for navigation.
- Screens include onboarding questionnaire steps (diet type, dislikes, restrictions, goals), AI recipe generation, saved recipes, calendar view, and user profile.

**Authentication**
- **Firebase Authentication** for user accounts.
- Supports **Google** and **Apple** sign-in (via Expo auth + Firebase).

**Backend / Services**
- Node/JS backend modules under `backend/` (e.g. `backend/api.js`, `backend/prompting.js`) for:
  - Building prompts and calling **Google Gemini** via the new `@google/genai` SDK.
  - Serving recipe / meal suggestions based on user profile and preferences.

**Build & Deployment**
- Managed by **Expo** with **EAS** for building development and production clients.
- iOS and Android native projects are included under `ios/` and `android/` for EAS builds and device testing.

---

## 📋 Prerequisites

Ensure your system meets the following requirements before proceeding:

- [**Node.js**](https://github.com/nvm-sh/nvm) (Recommended: use `nvm` to manage versions)
- [**Expo CLI**](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [**EAS CLI**](https://expo.dev/eas) (`npm install -g eas-cli`)
- [**CocoaPods**](https://cocoapods.org/) **(for iOS)**
- A **Firebase project** with Authentication enabled (Google & Apple login)
- An **Apple Developer account** if you want Apple Sign-In on a real device

---

## ⚡ Project Setup

### 1. Clone & Install

```sh
mkdir mealingful && cd mealingful
git clone https://github.com/Zhengdong-uga/meal4u.git
cd meal4u
npm install
```

Most required packages (Expo, React Navigation, Firebase, Google Generative AI, etc.) are already listed in `package.json` and will be installed via `npm install`. Only install extra packages if you change dependencies.

---

## 🔥 Firebase & Auth Setup (High-Level)

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password**, **Google**, and **Apple** providers under **Authentication → Sign-in method**.
3. Download the config files and add them to the native projects:
   - Android: `android/app/google-services.json`
   - iOS: `ios/GoogleService-Info.plist`
4. Configure your Firebase web credentials (`apiKey`, `authDomain`, etc.) in the app's Firebase config file (see `firebase.js` under `src/backend/` or your current config location).
5. For Google and Apple sign-in, configure the correct client IDs and redirect URIs in the corresponding login code (e.g. `LoginPage.js`).

Refer to the Firebase and Expo docs for the latest platform-specific details.

---

## 📱 Running the App

For local development with Expo:

```sh
npx expo start
```

This will start the Metro bundler; you can then run the app in:
- iOS Simulator
- Android Emulator
- Expo client on a physical device

> Note: For **Google & Apple login**, you generally need a **custom dev client** instead of Expo Go.

---

## 🧪 Dev Client & Production Builds (Overview)

- Install dev client support:

  ```sh
  expo install expo-dev-client
  ```

- Build development client for iOS:

  ```sh
eas build -p ios --profile development
  ```

- Build production apps:

  ```sh
eas build -p ios --profile production
eas build -p android --profile production
  ```

See the official Expo/EAS docs for detailed configuration of bundle IDs, provisioning profiles, and app store submission.

