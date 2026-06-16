// tvOS entry point for nTV
// Flutter tvOS support is experimental — see platforms/appletv/SETUP.md
// This entry point configures tvOS-specific navigation and focus handling.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Lock to landscape for TV
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  runApp(const ProviderScope(child: NtvTvOSApp()));
}

class NtvTvOSApp extends StatelessWidget {
  const NtvTvOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'nTV',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0x000ea5e9), // sky-500
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        // TV focus traversal
        focusColor: const Color(0xFF0ea5e9),
      ),
      home: const TvOSHomeScreen(),
    );
  }
}

/// TvOSHomeScreen — D-pad navigable channel grid
/// Mirrors the content of lib/screens/home_screen.dart adapted for TV focus traversal.
class TvOSHomeScreen extends StatelessWidget {
  const TvOSHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712), // gray-950
      body: Center(
        // TODO(tvos): replace with GridView using FocusTraversalGroup once
        // backend wiring (stream-gateway, epg) is complete for tvOS.
        // See: platforms/appletv/SETUP.md § Known limitations
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/icons/app-icon.png', width: 120, height: 120),
            const SizedBox(height: 24),
            const Text(
              'nTV',
              style: TextStyle(
                color: Colors.white,
                fontSize: 48,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Configure your nSelf backend URL in Settings to get started.',
              style: TextStyle(color: Colors.white70, fontSize: 20),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
