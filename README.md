# ShiftManager 👋

**ShiftManager** is a healthcare-focused attendance and scheduling system built with **React Native + Expo** and **Firebase**. It combines role-based access for administrators and nurses with a dedicated attendance kiosk interface, making shift management simple, fast, and reliable.

## 📌 Description

ShiftManager supports hospital and care facility operations by enabling:

- secure admin control for staffing, payroll, and performance reporting
- nurse-facing scheduling, patient registration, and duty tracking
- a kiosk-style attendance terminal for fast check-in/out workflows

The app is designed for both **web** and **mobile**, so administrators can manage from desktop and nurses can access schedules from mobile devices.

## 🚀 Features

### 🔐 Multi-Role Access

- **Admin dashboard** for managing staff, schedules, payroll, and performance
- **Nurse portal** for viewing shifts, patient status, and personal profile details
- Role-based routing and access control to separate administrative and clinical interfaces

### 💳 Attendance Kiosk Mode

- Simulated RFID/card terminal experience for quick check-in and check-out
- High-visibility UI optimized for shared kiosk devices
- Real-time scanner status and attendance event feedback

### 🏥 Nurse Workflow Support

- Nurse registration with role assignment
- Patient registration and patient status tracking
- Personalized nurse dashboard for quick shift visibility

### 📊 Reporting & Management

- Shift reports and attendance history for administrative review
- Nurse performance tracking and payroll support pages
- Hospital-wide insights from a centralized admin view

### 📱 Cross-Platform Support

- **Web support** for admin and kiosk workflows
- **Mobile-ready** interfaces for nurses on iOS and Android via Expo
- Single codebase using React Native and Expo Router

## 🛠️ Tech Stack

- Frontend: **React Native** with **Expo Router**
- Language: **TypeScript**
- Backend: **Firebase Authentication** and **Firestore**
- Styling: responsive React Native styles with high-contrast kiosk mode

## 📁 Project Structure

```text
ShiftManager/
├── app/
│   ├── admin/           # Admin dashboards and reports
│   ├── nurses/          # Nurse dashboards and patient management
│   ├── attendance.tsx   # Attendance kiosk interface
│   ├── signup.tsx       # User signup and role selection
│   └── index.tsx        # Login / role landing page
├── config/
│   └── firebase.ts      # Firebase initialization and config
├── assets/              # Images and static assets
└── types/               # Shared TypeScript definitions
```

## ⚙️ Benefits

- Reduces manual attendance paperwork and improves shift accuracy
- Enables fast nurse check-in with a kiosk-style terminal
- Helps managers track staffing, payroll, and nurse performance in one place
- Supports both desktop administration and mobile nurse workflows
- Built on scalable Firebase services for rapid deployment

## 🧩 Installation

1. Clone the repository

```bash
git clone https://github.com/your-org/ShiftManager.git
cd ShiftManager
```

2. Install dependencies

```bash
npm install
```

3. Configure Firebase
   Create `config/firebase.ts` with your Firebase web app settings:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export default firebaseConfig;
```

4. Start the app

```bash
npx expo start
```

5. Open on the target platform

- Press `w` for web
- Press `a` for Android
- Press `i` for iOS

## 🧪 Demo Credentials

- **Admin Email**: `admin@gmail.com`
- **Password**: `password`
- **Nurse**: Use the Sign Up page to create a nurse account

## 📌 Notes

- Make sure Firebase Authentication and Firestore are enabled in your Firebase project.
- Update the Firebase rules and collections as needed for production use.
- Add screenshots or app previews to this README for a stronger presentation.
