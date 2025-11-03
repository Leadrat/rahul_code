# Quick Start Guide - Flutter Frontend

This guide will help you quickly set up and run the Flutter mobile app for the Tic Tac Toe game.

## Prerequisites Checklist

- [ ] Flutter SDK installed (version 3.0.0+)
- [ ] Android Studio or VS Code with Flutter extension
- [ ] Android Emulator or iOS Simulator set up
- [ ] .NET Core backend running on http://localhost:5281

## Quick Setup Steps

### 1. Verify Flutter Installation

Open PowerShell and run:
```powershell
flutter doctor
```

You should see checkmarks for:
- Flutter SDK
- Connected devices (or emulator)
- Android toolchain (if using Android)

### 2. Navigate to Flutter Project

```powershell
cd c:\Users\dhrub\Documents\leadrat\bootcamp\rahul_code\flutter_frontend
```

### 3. Install Dependencies

```powershell
flutter pub get
```

Wait for all packages to download. This may take a few minutes on first run.

### 4. Start the Backend

Open a new PowerShell window and start the .NET backend:

```powershell
cd c:\Users\dhrub\Documents\leadrat\bootcamp\rahul_code\dotnet_core_backend\GameBackend.API
dotnet run
```

Verify the backend is running at: http://localhost:5281

### 5. Start an Emulator

#### Option A: Android Emulator
```powershell
# List available emulators
flutter emulators

# Launch an emulator (replace <emulator_id> with actual ID from list)
flutter emulators --launch <emulator_id>
```

Or start it from Android Studio: Tools → AVD Manager → Play button

#### Option B: iOS Simulator (macOS only)
```powershell
open -a Simulator
```

### 6. Run the Flutter App

```powershell
# Run on connected device/emulator
flutter run

# Or specify a device
flutter devices  # List available devices
flutter run -d <device_id>
```

The app will build and launch automatically!

## First-Time Usage

### 1. Create an Account
- Tap "Create account"
- Enter email: `test@example.com`
- Enter password: `test1234` (min 4 chars)
- Tap "Create account"

### 2. Login
- Enter the same credentials
- Tap "Sign in"

### 3. Play Local Game
- You'll see the game board
- Tap "New Local Game"
- Click any square to play against the AI

### 4. Test Multiplayer (Optional)
**On First Device:**
- Tap "Invite Player"
- Enter another user's email
- Tap "Send"

**On Second Device/Emulator:**
- Login with the invited user
- Tap the notification bell icon 🔔
- Tap "Accept" on the invite
- Play the game - moves sync in real-time!

## Common Issues & Solutions

### Issue: "flutter: command not found"
**Solution:** Flutter SDK not in PATH. Add Flutter to your system PATH:
1. Find Flutter installation directory
2. Add `<flutter_dir>\bin` to system PATH
3. Restart PowerShell

### Issue: "No devices found"
**Solution:** No emulator running
- Start Android emulator from Android Studio
- Or use `flutter emulators --launch <id>`
- Run `flutter devices` to verify

### Issue: "Failed to connect to backend"
**Solution:** Backend not running
- Ensure backend is running on http://localhost:5281
- Check firewall isn't blocking the port
- Run `dotnet run` in backend directory

### Issue: Package errors after `flutter pub get`
**Solution:** 
```powershell
flutter clean
flutter pub get
```

### Issue: App crashes on startup
**Solution:** Check backend is running and accessible
- Verify http://localhost:5281/api works in browser
- Check backend console for errors

## Running on Physical Device

### Android Physical Device:
1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect phone via USB
4. Allow USB debugging when prompted
5. Update API URLs to use your computer's IP:

**In `lib/services/api_service.dart`:**
```dart
static const String baseUrl = 'http://YOUR_IP:5281/api';
```

**In `lib/services/signalr_service.dart`:**
```dart
static final String hubUrl = 'http://YOUR_IP:5281/gameHub';
```

Find your IP: Run `ipconfig` and look for IPv4 Address (e.g., 192.168.1.100)

6. Run: `flutter run`

## Directory Structure

```
flutter_frontend/
├── lib/
│   ├── main.dart              # Entry point
│   ├── models/                # Data models
│   ├── providers/             # State management
│   ├── screens/               # UI screens
│   ├── services/              # API & SignalR
│   └── widgets/               # Reusable widgets
├── pubspec.yaml               # Dependencies
└── README.md                  # Full documentation
```

## Testing Checklist

- [ ] App launches successfully
- [ ] Registration works
- [ ] Login works
- [ ] Local game works (vs AI)
- [ ] Can send invites
- [ ] Can receive and accept invites
- [ ] Multiplayer game syncs moves
- [ ] Win detection works
- [ ] Admin panel accessible (if admin user)

## Development Commands

```powershell
# Hot reload (during development, press 'r' in terminal)
# Hot restart (press 'R')
# Quit app (press 'q')

# Build release APK
flutter build apk --release

# Run with specific device
flutter run -d chrome          # Web browser
flutter run -d android         # Android device
flutter run -d emulator-5554   # Specific Android emulator

# Check for issues
flutter doctor -v

# Clean build files
flutter clean
```

## Performance Tips

- **First build is slow** - Subsequent builds are much faster
- **Hot reload** - Use `r` key for instant changes during development
- **Release mode** - Run with `--release` flag for better performance

## Next Steps

1. ✅ Run the app successfully
2. ✅ Create a user account
3. ✅ Play a local game
4. ✅ Invite another user (test multiplayer)
5. ✅ Explore the admin panel (if admin)
6. 📖 Read full `README.md` in `flutter_frontend/` for detailed features

## Support & Documentation

- **Full Documentation:** `flutter_frontend/README.md`
- **Backend Setup:** `dotnet_core_backend/README.md`
- **Flutter Docs:** https://flutter.dev/docs
- **Troubleshooting:** Check console logs in terminal

---

**Ready to play!** 🎮

The Flutter app has feature parity with the Next.js frontend, including:
- ✅ Authentication (login/register)
- ✅ Local & multiplayer games
- ✅ Real-time invites & notifications
- ✅ SignalR for live updates
- ✅ Admin panel
- ✅ Move history
- ✅ Online presence

Enjoy your Tic Tac Toe game! 🎯
