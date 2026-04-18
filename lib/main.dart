import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'models/media.dart';
import 'screens/detail_screen.dart';
import 'screens/epg_screen.dart';
import 'screens/home_screen.dart';
import 'screens/iptv_screen.dart';
import 'screens/player_screen.dart';
import 'screens/settings_screen.dart';
import 'services/settings_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load persisted settings before the widget tree builds.
  final container = ProviderContainer();
  await container.read(settingsServiceProvider).init();
  runApp(UncontrolledProviderScope(container: container, child: const NtvApp()));
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/iptv',
          builder: (context, state) => const IptvScreen(),
        ),
        GoRoute(
          path: '/epg',
          builder: (context, state) => const EpgScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/detail/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        final typeStr = state.uri.queryParameters['type'] ?? 'movie';
        final type = typeStr == 'tvShow' ? MediaType.tvShow : MediaType.movie;
        return DetailScreen(mediaId: id, mediaType: type);
      },
    ),
    GoRoute(
      path: '/player',
      builder: (context, state) {
        final mediaId = state.uri.queryParameters['mediaId'];
        final streamUrl = state.uri.queryParameters['streamUrl'];
        return PlayerScreen(mediaId: mediaId, streamUrl: streamUrl);
      },
    ),
  ],
);

class NtvApp extends StatelessWidget {
  const NtvApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'nTV',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF6366F1),
        brightness: Brightness.dark,
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}

class AppShell extends StatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
          switch (index) {
            case 0:
              context.go('/');
            case 1:
              context.go('/iptv');
            case 2:
              context.go('/epg');
            case 3:
              context.go('/settings');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.video_library_outlined),
            selectedIcon: Icon(Icons.video_library),
            label: 'Library',
          ),
          NavigationDestination(
            icon: Icon(Icons.live_tv_outlined),
            selectedIcon: Icon(Icons.live_tv),
            label: 'Live TV',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view),
            label: 'Guide',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
