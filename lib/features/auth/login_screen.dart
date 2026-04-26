import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_service.dart';

/// Login screen shown when the user taps "Sign In".
///
/// Account sync requires the nTV backend bundle (nSelf plugin tier).
/// The free flavor of nTV does not include an auth backend, so this screen
/// informs the user clearly and offers guest mode (local M3U only) as the
/// primary path.
///
/// When an nSelf backend with the nTV bundle is configured in settings,
/// [AuthService.signIn] will be wired to the real `/auth/v1/token` endpoint.
/// Until then, the sign-in fields are disabled with an explanatory banner.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  void _continueAsGuest() {
    ref.read(authServiceProvider.notifier).continueAsGuest();
    context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo / wordmark
                Semantics(
                  label: 'nTV logo',
                  child: const Text(
                    'nTV',
                    style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Free IPTV player — local M3U playlists, no account needed.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // "Account sync coming soon" info banner
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: colorScheme.outline.withOpacity(0.4)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline, color: colorScheme.primary, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Account sync requires the nTV backend bundle. '
                          'Self-host your own nSelf backend and configure it '
                          'in Settings to enable sign-in.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Disabled email field — visual hint only
                TextFormField(
                  enabled: false,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.email_outlined),
                    helperText: 'Requires nTV backend bundle',
                  ),
                ),
                const SizedBox(height: 16),

                // Disabled password field — visual hint only
                TextFormField(
                  enabled: false,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // Disabled sign-in button
                const FilledButton(
                  onPressed: null,
                  child: Text('Sign In — Backend Required'),
                ),
                const SizedBox(height: 8),

                // Disabled Google SSO button
                OutlinedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.g_mobiledata),
                  label: const Text('Continue with Google — Backend Required'),
                ),
                const SizedBox(height: 28),

                const Divider(),
                const SizedBox(height: 16),

                // Guest mode — primary CTA for free flavor
                FilledButton.tonal(
                  onPressed: _continueAsGuest,
                  child: const Text('Continue without an account (local M3U only)'),
                ),
                const SizedBox(height: 8),
                Text(
                  'All IPTV playback features work without an account.',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
