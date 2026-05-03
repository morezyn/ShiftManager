# ShiftManager 👋
**ShiftManager** is a high-performance, cross-platform attendance and scheduling solution for healthcare environments. Built with **React Native (Expo)** and **Firebase**, it bridges the gap between administrative management and frontline medical staff.

## 🚀 Core Features

### 🔐 Multi-Role Authentication
* **Admin Dashboard**: Centralized control for managing nurses, shift scheduling, and viewing hospital-wide reports.
* **Nurse Portal**: Personalized dashboard for medical staff to view upcoming shifts and track their duty status.

### 💳 Attendance Kiosk Mode
* A dedicated, high-visibility terminal interface designed for **RFID/Card tap simulation**.
* Real-time "Scanner Active" feedback with a specialized UI for fast-paced hospital entries.

### 📱 Full Cross-Platform Support
* **Web**: Optimized for desktop admin management.
* **Mobile**: Native performance for nurses on the go (iOS/Android) via Expo Go.

---

## 🛠️ Tech Stack
* **Frontend**: React Native, Expo Router (File-based routing)
* **Language**: TypeScript
* **Backend**: Firebase (Authentication & Firestore)
* **Styling**: Adaptive StyleSheet with high-contrast Kiosk Mode

---

## 📁 Project Structure
```text
ShiftManager/
├── app/
│   ├── admin/           # Administrative controls & reports
│   ├── nurses/          # Nurse-specific dashboards
│   ├── attendance.tsx   # RFID Kiosk Terminal
│   ├── signup.tsx       # Nurse registration with role assignment
│   └── index.tsx        # Unified role-based login gate
├── config/
│   └── firebase.ts      # Database & Auth configuration
└── utils/               # Shift and grade export helpers
```

---

## 🚦 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configure Firebase
Create a `config/firebase.ts` file and add your web configuration:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

### 3. Run the Project
```bash
# Start Expo
npx expo start

# Choose your platform:
# Press 'w' for Web
# Press 'a' for Android
# Press 'i' for iOS
```

---

## 🧪 Testing Credentials
* **Admin Email**: `admin@gmail.com`
* **Password**: `password`
* **Nurse Login**: Create a new account via the **Sign Up** link on the login page.

---

### Key Improvements Made:
1.  **Project Context**: It no longer looks like an Expo starter template; it looks like a specific "Healthcare IT" tool.
2.  **Clearer Hierarchy**: Used distinct sections for Features, Tech Stack, and Structure.
3.  **Setup Guide**: Added a placeholder for Firebase configuration so other developers know what's needed to make it run.
4.  **Credential Transparency**: Clearly marked how to test the Admin vs. Nurse roles.

**Pro-Tip:** Once you push this to GitHub, take a screenshot of your **Kiosk Mode** and **Dashboard** and put them in a `screenshots/` folder. Adding those images to the README makes a huge difference in "First Impressions"!