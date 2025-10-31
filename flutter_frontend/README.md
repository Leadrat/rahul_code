# Tic Tac Toe Flutter Frontend

A Flutter mobile application for playing Tic Tac Toe with real-time multiplayer functionality using the .NET Core backend.

## Features

All features from the Next.js frontend have been implemented:

### ✅ Authentication
- **Login Screen** - Email/password authentication
- **Register Screen** - Create new user accounts
- **JWT Token Storage** - Secure token management with SharedPreferences
- **Auto-login** - Persists authentication across app restarts

### ✅ Game Functionality
- **3x3 Game Board** - Interactive Tic Tac Toe grid
- **Local Games** - Play against the computer (AI random moves)
- **Multiplayer Games** - Real-time games with other players
- **Move History** - Track all moves made during the game
- **Win Detection** - Highlights winning line
- **Game State Management** - Proper state handling with Provider

### ✅ Real-time Features (SignalR)
- **Live Invites** - Receive game invitations in real-time
- **Online Presence** - See which users are online
- **Real-time Moves** - Moves sync instantly between players
- **Game Start Notifications** - Get notified when a game begins
- **Automatic Reconnection** - Handles connection drops gracefully

### ✅ Invite System
- **Send Invites** - Invite other players by email
- **Receive Invites** - Accept or decline game invitations
- **Notification Badge** - Shows pending invite count
- **Online Status** - See if invited player is online

### ✅ Admin Panel
- **Player Management** - View all registered players
- **Game Statistics** - View player game counts
- **Game History** - Browse all saved games
- **Delete Games** - Remove games from the system
- **Access Control** - Only admins can access the panel

## Prerequisites

Before running the Flutter app, ensure you have:

1. **Flutter SDK** installed (3.0.0 or higher)
   - Download from: https://flutter.dev/docs/get-started/install
   - Verify installation: `flutter doctor`

2. **.NET Core Backend** running
   - The backend must be running on `http://localhost:5281`
   - See `../dotnet_core_backend/README.md` for backend setup

3. **Android/iOS Emulator or Physical Device**
   - Android Studio with an emulator configured, or
   - Xcode with iOS Simulator (macOS only), or
   - A physical device connected via USB

## Installation & Setup

### Step 1: Install Dependencies

Open a terminal in the `flutter_frontend` directory and run:

```powershell
flutter pub get
```

This will download all required packages including:
- `provider` - State management
- `http` - API calls
- `signalr_netcore` - Real-time SignalR connection
- `shared_preferences` - Local storage
- `jwt_decode` - JWT token parsing

### Step 2: Start the Backend

Before running the Flutter app, ensure the .NET Core backend is running:

```powershell
cd ..\dotnet_core_backend\GameBackend.API
dotnet run
```

The backend should be accessible at `http://localhost:5281`

### Step 3: Run the Flutter App

#### For Android Emulator:
1. Start your Android emulator from Android Studio
2. Run the app:
```powershell
flutter run
```

#### For iOS Simulator (macOS only):
1. Start iOS Simulator
2. Run the app:
```powershell
flutter run
```

#### For Physical Device:
1. Enable USB debugging on your device
2. Connect via USB
3. Run:
```powershell
flutter devices  # Verify device is detected
flutter run
```

#### For Chrome (Web - for testing only):
```powershell
flutter run -d chrome
```

**Note:** For Android emulators, the localhost backend URL (`http://localhost:5281`) will automatically work. For physical devices, you'll need to update the API URLs in the code to use your computer's IP address.

### Step 4: Update API URL for Physical Devices (if needed)

If testing on a physical device, update the backend URL:

**File:** `lib/services/api_service.dart`
```dart
static const String baseUrl = 'http://YOUR_COMPUTER_IP:5281/api';
```

**File:** `lib/services/signalr_service.dart`
```dart
static final String hubUrl = 'http://YOUR_COMPUTER_IP:5281/gameHub';
```

Replace `YOUR_COMPUTER_IP` with your computer's local IP address (e.g., `192.168.1.100`).

## Usage Guide

### 1. Register/Login
- Launch the app
- If you don't have an account, tap "Create account"
- Enter your email and password (minimum 4 characters)
- After registering, return to login screen and sign in

### 2. Play Local Game
- On the game screen, tap "New Local Game"
- Tap any empty square to make your move
- The AI will automatically respond
- The game detects wins and draws automatically

### 3. Invite a Player
- Tap "Invite Player" button
- Enter the email of a registered user
- The invitation is sent via SignalR in real-time

### 4. Accept Invites
- When you receive an invite, a notification badge appears (🔔)
- Tap the notification icon to see pending invites
- Tap "Accept" to start the game or "Decline" to reject
- Accepted games start immediately with real-time sync

### 5. Play Multiplayer Game
- After accepting an invite, the game board loads
- Players take turns making moves
- Moves sync in real-time via SignalR
- The game detects the winner automatically

### 6. Admin Panel (Admin Users Only)
- Tap your profile icon (top-right)
- Select "Admin Panel"
- View all players and their statistics
- Click on a player to see their saved games
- Delete games using the delete icon

## Project Structure

```
flutter_frontend/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── models/
│   │   └── game_models.dart      # Data models (Move, Invite, etc.)
│   ├── providers/
│   │   ├── auth_provider.dart    # Authentication state management
│   │   └── game_provider.dart    # Game state management
│   ├── screens/
│   │   ├── login_screen.dart     # Login UI
│   │   ├── register_screen.dart  # Registration UI
│   │   ├── game_screen.dart      # Main game UI
│   │   └── admin_screen.dart     # Admin panel UI
│   ├── services/
│   │   ├── api_service.dart      # HTTP API calls
│   │   ├── signalr_service.dart  # SignalR real-time connection
│   │   └── storage_service.dart  # Local storage (JWT tokens)
│   └── widgets/
│       ├── game_board.dart       # 3x3 game board widget
│       └── notifications_panel.dart  # Invite notifications widget
├── pubspec.yaml                  # Dependencies
└── README.md                     # This file
```

## Architecture

### State Management
The app uses the **Provider** pattern for state management:
- `AuthProvider` - Manages authentication state and user info
- `GameProvider` - Manages game state, moves, and multiplayer sessions

### API Communication
- **HTTP** - RESTful API calls for CRUD operations
- **SignalR** - Real-time bidirectional communication for:
  - Game invitations
  - Online presence
  - Move synchronization
  - Game start events

### Data Flow
1. User actions trigger provider methods
2. Providers call API services
3. API responses update provider state
4. UI rebuilds automatically via `Consumer` widgets
5. SignalR events update state in real-time

## Troubleshooting

### Backend Connection Issues
**Problem:** "Failed to connect to SignalR"
**Solution:**
- Ensure the backend is running on `http://localhost:5281`
- Check that no firewall is blocking the connection
- For physical devices, update URLs to use your computer's IP

### Token Errors
**Problem:** "Unauthorized" errors
**Solution:**
- The JWT token may have expired
- Logout and login again
- Check that the backend is using compatible JWT settings

### SignalR Not Working
**Problem:** Real-time features not syncing
**Solution:**
- Check backend console for SignalR connection logs
- Verify both users are logged in and connected
- Check network connectivity
- Restart the app to reconnect SignalR

### Build Errors
**Problem:** "Target of URI doesn't exist" errors
**Solution:**
- Run `flutter pub get` to install dependencies
- Run `flutter clean` and then `flutter pub get`
- Restart your IDE

### Android Emulator Issues
**Problem:** App won't install or run
**Solution:**
- Update Android SDK via Android Studio
- Create a new emulator with API level 30+
- Enable "Wipe Data" on emulator and restart

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Games
- `GET /api/games` - Get user's games
- `GET /api/games/{id}` - Get specific game
- `POST /api/games` - Create new game
- `DELETE /api/games/{id}` - Delete game

### Invites
- `GET /api/invites` - Get user's invites
- `POST /api/invites` - Create invite
- `POST /api/invites/{id}/respond` - Accept/decline invite

### Admin
- `GET /api/admin/players` - Get all players
- `GET /api/admin/games` - Get all games
- `GET /api/admin/players/{id}/games` - Get player's games
- `DELETE /api/admin/games/{id}` - Delete game

### SignalR Hub Events
- `invite:received` - New invite notification
- `presence:changed` - User online/offline
- `online:users` - List of online users
- `game:started` - Game started notification
- `move:applied` - Move synchronized

## Development

### Running in Debug Mode
```powershell
flutter run --debug
```

### Running in Release Mode
```powershell
flutter run --release
```

### Hot Reload
During development, press `r` in the terminal to hot reload changes without restarting the app.

### Building APK (Android)
```powershell
flutter build apk --release
```
The APK will be in `build/app/outputs/flutter-apk/app-release.apk`

### Building iOS App (macOS only)
```powershell
flutter build ios --release
```

## Testing Different Scenarios

### Test Multiplayer Functionality
1. Run the app on two different devices/emulators
2. Register two different users
3. Login with both users
4. From one device, invite the other user's email
5. Accept the invite on the second device
6. Play the game and watch moves sync in real-time

### Test Admin Panel
1. Create an admin user in the database manually or via backend
2. Login with the admin account
3. Access Admin Panel from the profile menu
4. View players and games

## Performance Tips

- SignalR connection is established once on app start
- Game state is managed efficiently with Provider
- Only necessary widgets rebuild on state changes
- Images and assets are optimized for mobile

## Known Limitations

- No offline mode (requires backend connection)
- SignalR reconnection may take a few seconds
- Admin status must be set via database
- No game replay feature (planned for future)

## Future Enhancements

- [ ] Game replay with animations
- [ ] Push notifications for invites
- [ ] Chat during games
- [ ] Leaderboard and rankings
- [ ] AI difficulty levels
- [ ] Custom themes
- [ ] Game statistics and charts

## Support

For issues or questions:
1. Check the backend logs for API errors
2. Check Flutter debug console for client errors
3. Verify SignalR connection status in logs
4. Ensure all dependencies are installed

## License

This project is part of the Tic Tac Toe game system with .NET Core backend.
