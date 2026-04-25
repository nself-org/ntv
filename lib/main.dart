import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'theme/brand_colors.dart';

import 'models/media.dart';
import 'screens/detail_screen.dart';
import 'screens/epg_screen.dart';
import 'screens/home_screen.dart';
import 'screens/iptv_screen.dart';
import 'screens/player_screen.dart';
import 'screens/settings_screen.dart';
import 'features/auth/auth_service.dart';
import 'services/settings_service.dart';
import 'widgets/offline_banner.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load persisted settings and restore auth session before the widget tree builds.
  final container = ProviderContainer();
  await container.read(settingsServiceProvider).init();
  // Initialise the auth SDK — restores tokens from Keychain / Keystore.
  // authBaseUrl defaults to nself.org; users self-hosting override this in settings.
  await container.read(authServiceProvider.notifier).init();
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
        colorSchemeSeed: NselfBrandColors.primary,
        brightness: Brightness.dark,
        useMaterial3: true,
      ),
      // P96 S232: l10n support — en + es, fr, de, ja, zh, ar stubs.
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'),
        Locale('es'),
        Locale('fr'),
        Locale('de'),
        Locale('ja'),
        Locale('zh'),
        Locale('ar'),
      ],
      routerConfig: _router,
    );
  }
}

class AppShell extends ConsumerStatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: widget.child),
        ],
      ),
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
            icon: Icon(Icons.video_library_outlined, semanticLabel: 'Library'),
            selectedIcon: Icon(Icons.video_library, semanticLabel: 'Library'),
            label: 'Library',
            tooltip: 'Browse your media library',
          ),
          NavigationDestination(
            icon: Icon(Icons.live_tv_outlined, semanticLabel: 'Live TV'),
            selectedIcon: Icon(Icons.live_tv, semanticLabel: 'Live TV'),
            label: 'Live TV',
            tooltip: 'Live TV channels',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined, semanticLabel: 'Program guide'),
            selectedIcon: Icon(Icons.grid_view, semanticLabel: 'Program guide'),
            label: 'Guide',
            tooltip: 'Electronic program guide',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined, semanticLabel: 'Settings'),
            selectedIcon: Icon(Icons.settings, semanticLabel: 'Settings'),
            label: 'Settings',
            tooltip: 'Open settings',
          ),
        ],
      ),
    );
  }
}
