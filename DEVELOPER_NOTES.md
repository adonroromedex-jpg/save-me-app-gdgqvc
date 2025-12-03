
# Save Me - Developer Notes

## Architecture Overview

### Authentication Flow
- **Onboarding**: First-time users see a 3-screen carousel explaining app features
- **Registration**: Email + password stored in AsyncStorage (production should use Firebase Auth)
- **Login**: Validates credentials against stored user data
- **Persistent Login**: Uses AsyncStorage to maintain authentication state
- **Biometric Auth**: Face ID/Touch ID for enhanced security on home screen

### Navigation Structure
```
app/
├── (auth)/                    # Authentication screens
│   ├── onboarding.tsx        # 3-screen carousel
│   ├── login.tsx             # Login screen
│   ├── register.tsx          # Registration screen
│   └── forgot-password.tsx   # Password reset
├── (tabs)/                    # Main app tabs
│   ├── (home)/               # Home & secure features
│   │   ├── index.tsx         # Dashboard
│   │   ├── secure-drive.tsx  # Encrypted storage
│   │   └── private-camera.tsx # Private camera
│   ├── (gallery)/            # Protected content gallery
│   │   ├── index.tsx         # Gallery grid view
│   │   └── protection-report.tsx # Metadata reports
│   ├── (settings)/           # App settings
│   │   ├── index.tsx         # Settings home
│   │   ├── language.tsx      # Language selection
│   │   ├── theme.tsx         # Theme selection
│   │   ├── export-data.tsx   # Data export
│   │   └── help.tsx          # Help & support
│   └── profile.tsx           # User profile
└── _layout.tsx               # Root layout with auth routing
```

### Core Features Implemented

#### 1. Onboarding & Splash
- ✅ Animated splash screen with app logo
- ✅ 3-screen onboarding carousel
- ✅ Skip and Next navigation
- ✅ "Get Started" button leading to authentication

#### 2. Authentication System
- ✅ Email + password registration
- ✅ Login screen with password visibility toggle
- ✅ Password reset flow
- ✅ Persistent login using AsyncStorage
- ✅ Logout functionality
- ⚠️ Email verification (simulated, needs backend)

#### 3. Navigation System
- ✅ Bottom tab navigation (Android)
- ✅ Native tabs (iOS)
- ✅ Screens: Home, Gallery, Settings, Profile
- ✅ Smooth animations between screens

#### 4. Core Feature - Protected Gallery
- ✅ Upload photos/videos from device
- ✅ Take photos with private camera
- ✅ Extract metadata (size, dimensions, date)
- ✅ Generate protection reports
- ✅ Gallery-style dashboard with grid layout
- ✅ View individual protection reports

#### 5. Content Sharing
- ✅ Share protection report as text
- ⚠️ Share as PDF (coming soon)
- ⚠️ Share as image (coming soon)
- ⚠️ Share link (requires cloud backend)

#### 6. Settings & Options
- ✅ Language selection (English, Creole, French, Spanish)
- ✅ Theme selection (Light, Dark, Auto)
- ✅ Notifications toggle
- ✅ Biometric authentication toggle
- ✅ Auto-delete toggle
- ✅ Screenshot protection toggle
- ✅ Export all data
- ✅ Delete account

#### 7. UI/UX
- ✅ Modern card design with rounded corners
- ✅ Shadow elevation on cards
- ✅ Smooth animations (Reanimated)
- ✅ Gradient backgrounds
- ✅ Icon-based navigation
- ✅ Consistent color scheme

#### 8. Google Play Requirements
- ✅ Proper permission declarations
- ✅ Blocked advertising ID permissions
- ✅ Camera permission with description
- ✅ Photo library permission with description
- ✅ Biometric permission with description
- ✅ Android 13+ media permissions

### Data Storage

#### AsyncStorage Keys
- `onboarded`: Boolean - Has user completed onboarding
- `is_authenticated`: Boolean - Is user logged in
- `user_data`: JSON - User account data (email, password, name)
- `user_email`: String - Current user email
- `user_name`: String - Current user name
- `protected_items`: JSON Array - Protected media items
- `app_settings`: JSON - App preferences
- `app_language`: String - Selected language code
- `app_theme`: String - Selected theme (light/dark/auto)

#### Protected Item Structure
```typescript
interface ProtectedItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  uploadDate: string;
  metadata: {
    size: number;
    width?: number;
    height?: number;
    duration?: number;
  };
  userIdentity: string;
}
```

### Security Features

#### Implemented
- Biometric authentication (Face ID/Touch ID)
- Screenshot protection toggle
- Auto-delete after 24h toggle
- Encrypted storage (AsyncStorage)
- Password-protected login

#### To Implement (Production)
- AES-256 encryption for files
- Secure file storage (not just AsyncStorage)
- Backend authentication (Firebase/Supabase)
- Real-time access logging
- Facial recognition for content access
- Panic delete functionality
- Ghost mode (hide app)

### Permissions

#### iOS (Info.plist)
- NSCameraUsageDescription
- NSPhotoLibraryUsageDescription
- NSPhotoLibraryAddUsageDescription
- NSFaceIDUsageDescription

#### Android (AndroidManifest.xml)
- android.permission.CAMERA
- android.permission.READ_MEDIA_IMAGES
- android.permission.READ_MEDIA_VIDEO
- android.permission.USE_BIOMETRIC
- android.permission.USE_FINGERPRINT

#### Blocked Permissions
- android.permission.ACCESS_ADSERVICES_AD_ID
- android.permission.ACCESS_ADSERVICES_ATTRIBUTION
- android.permission.ACCESS_ADSERVICES_TOPICS

### Color Scheme
```typescript
colors = {
  background: '#f9f9f9',
  text: '#212121',
  textSecondary: '#757575',
  primary: '#3f51b5',      // Indigo
  secondary: '#e91e63',    // Pink
  accent: '#00bcd4',       // Cyan
  card: '#ffffff',
  highlight: '#ff4081',    // Pink accent
  success: '#4caf50',      // Green
  warning: '#ff9800',      // Orange
  danger: '#f44336',       // Red
  border: '#e0e0e0',
}
```

### Known Limitations

1. **Authentication**: Currently uses AsyncStorage (not secure for production)
   - **Solution**: Implement Firebase Auth or Supabase Auth

2. **File Encryption**: Files are not actually encrypted
   - **Solution**: Implement AES-256 encryption using expo-crypto

3. **Cloud Storage**: No cloud backup or sync
   - **Solution**: Integrate Firebase Storage or Supabase Storage

4. **Email Verification**: Simulated, not functional
   - **Solution**: Implement with Firebase Auth email verification

5. **PDF Export**: Not implemented
   - **Solution**: Use react-native-pdf or similar library

6. **Screenshot Protection**: Toggle exists but not enforced
   - **Solution**: Use react-native-screenshot-prevent

### Next Steps for Production

1. **Backend Integration**
   - Set up Firebase or Supabase project
   - Implement proper authentication
   - Add cloud storage for encrypted files
   - Implement real-time access logging

2. **Security Enhancements**
   - Implement AES-256 file encryption
   - Add secure file storage
   - Implement facial recognition
   - Add panic delete functionality
   - Implement ghost mode

3. **Feature Completion**
   - PDF export for protection reports
   - Image export for protection reports
   - Cloud sharing with secure links
   - Two-factor authentication
   - Email verification

4. **Testing**
   - Unit tests for authentication
   - Integration tests for file operations
   - E2E tests for critical flows
   - Security audit

5. **App Store Preparation**
   - Update app icons
   - Create screenshots
   - Write app description
   - Privacy policy
   - Terms of service

### Build Commands

```bash
# Development
npm run dev          # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS

# Production Build
npm run build:apk    # Build APK for testing
npm run build:production  # Build for Play Store
```

### Environment Variables
None currently required. For production, add:
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- etc.

### Dependencies
All dependencies are already installed. Key packages:
- expo-router: File-based routing
- expo-local-authentication: Biometric auth
- expo-image-picker: Media selection
- expo-camera: Camera access
- expo-file-system: File operations
- @react-native-async-storage/async-storage: Local storage
- react-native-reanimated: Animations
- expo-linear-gradient: Gradient backgrounds

### Support
For questions or issues, contact the development team.
