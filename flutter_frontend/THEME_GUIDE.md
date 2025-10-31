# Theme Support - Dark & Light Mode

## Overview
The Flutter app now supports **Dark Mode** and **Light Mode** with seamless switching between themes. The theme preference is persisted across app restarts.

## Features Added

### 1. **Theme Provider** 
- `lib/providers/theme_provider.dart`
- Manages theme state using Provider pattern
- Persists theme preference in SharedPreferences
- Provides dark and light theme definitions

### 2. **Theme Toggle Button** 🌓
- Located in the game screen header
- Icon changes based on current theme:
  - 🌞 **Light Mode icon** when in dark mode (tap to switch to light)
  - 🌙 **Dark Mode icon** when in light mode (tap to switch to dark)
- Smooth transition between themes

### 3. **Adaptive UI**
- All screens now respect the current theme
- Colors adapt automatically:
  - Background colors
  - Text colors
  - Card colors
  - Button colors
  - Input field colors
  - AppBar colors

## Theme Specifications

### Dark Theme (Default)
- **Background**: Dark gray (#121212)
- **Surface**: Lighter gray (#1E1E1E)
- **Primary**: Blue
- **Text**: White/Gray
- **Cards**: Dark with subtle elevation
- **Modern dark UI optimized for OLED screens**

### Light Theme
- **Background**: Light gray (#F5F5F5)
- **Surface**: White
- **Primary**: Blue
- **Text**: Black/Gray
- **Cards**: White with soft shadows
- **Clean, bright interface**

## How to Use

### Toggle Theme
1. **In-App Toggle**: Tap the 🌓 icon in the top-right corner of the game screen
2. Theme switches instantly
3. Preference is saved automatically

### Persistence
- Your theme choice is saved in SharedPreferences
- When you restart the app, your last selected theme loads automatically
- Default theme is **Dark Mode**

## Technical Implementation

### Integration Points

**1. Main App (`lib/main.dart`)**
```dart
ChangeNotifierProvider(create: (_) => ThemeProvider()),
```

**2. MaterialApp Theme**
```dart
Consumer2<AuthProvider, ThemeProvider>(
  builder: (context, authProvider, themeProvider, _) {
    return MaterialApp(
      theme: themeProvider.currentTheme,
      ...
    );
  },
)
```

**3. Theme Toggle Button**
```dart
Consumer<ThemeProvider>(
  builder: (context, themeProvider, _) => IconButton(
    icon: Icon(
      themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode,
    ),
    onPressed: () => themeProvider.toggleTheme(),
  ),
)
```

### Adaptive Components

All screens use theme colors:
```dart
// Instead of hardcoded colors:
backgroundColor: Colors.grey.shade900  ❌

// Use theme colors:
backgroundColor: Theme.of(context).scaffoldBackgroundColor  ✅
```

## Customization

### Modify Theme Colors

Edit `lib/providers/theme_provider.dart`:

**Dark Theme:**
```dart
static final darkTheme = ThemeData(
  scaffoldBackgroundColor: const Color(0xFF121212),  // Change this
  primaryColor: Colors.blue,                          // Change this
  ...
);
```

**Light Theme:**
```dart
static final lightTheme = ThemeData(
  scaffoldBackgroundColor: const Color(0xFFF5F5F5),  // Change this
  primaryColor: Colors.blue,                          // Change this
  ...
);
```

### Add More Theme Properties

You can extend themes with:
- Custom fonts
- Different elevation levels
- Custom component themes
- Animation durations
- Border radiuses

## Screens Using Theme

✅ **Login Screen** - Adaptive colors  
✅ **Register Screen** - Adaptive colors  
✅ **Game Screen** - Adaptive colors  
✅ **Saved Games Screen** - Adaptive colors  
✅ **Admin Screen** - Adaptive colors  
✅ **Game Replay Screen** - Adaptive colors  

## Benefits

### User Experience
- **Reduced eye strain** in dark environments (dark mode)
- **Better visibility** in bright environments (light mode)
- **Personal preference** support
- **Modern UI** standards

### Technical Benefits
- **Consistent styling** across the app
- **Easy maintenance** - change colors in one place
- **Scalable** - add new screens easily
- **Professional** - follows Material Design guidelines

## Future Enhancements

Possible additions:
- 🎨 **Custom themes** (e.g., AMOLED black, high contrast)
- ⏰ **Auto theme** - Switch based on time of day
- 📱 **System theme** - Follow device theme setting
- 🎭 **Theme presets** - Multiple color schemes

## Testing

### Test Dark Mode:
1. Launch app
2. Verify dark gray background
3. Check white text is readable
4. Tap theme toggle
5. Verify smooth transition to light mode

### Test Light Mode:
1. Switch to light mode
2. Verify light gray/white background
3. Check dark text is readable
4. Close and reopen app
5. Verify light mode persists

### Test Persistence:
1. Switch theme
2. Close app completely
3. Reopen app
4. Verify theme is preserved

## Notes

- Theme toggle is **globally accessible** from the game screen
- Theme applies to **all screens and dialogs**
- Preference is stored in **SharedPreferences** (local device storage)
- No backend integration required - purely client-side

---

**Enjoy your customizable UI! 🎨**
