import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provides the current list of connectivity results.
///
/// Updates reactively as network state changes via [Connectivity.onConnectivityChanged].
final connectivityProvider =
    StreamProvider<List<ConnectivityResult>>((ref) async* {
  // Emit the initial state immediately.
  yield await Connectivity().checkConnectivity();
  // Then follow live updates.
  yield* Connectivity().onConnectivityChanged;
});

/// Returns `true` when the device has no network connection.
final isOfflineProvider = Provider<bool>((ref) {
  final result = ref.watch(connectivityProvider);
  return result.maybeWhen(
    data: (results) =>
        results.isEmpty ||
        results.every((r) => r == ConnectivityResult.none),
    orElse: () => false,
  );
});

/// Displays a persistent banner at the top of the screen when the device
/// is offline. Content loads from cache gracefully; this banner tells users
/// why live streams and backend-dependent media are unavailable.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offline = ref.watch(isOfflineProvider);
    if (!offline) return const SizedBox.shrink();

    return Semantics(
      label: 'Offline — no internet connection',
      child: Material(
        color: Theme.of(context).colorScheme.errorContainer,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Icon(
                  Icons.wifi_off_outlined,
                  size: 16,
                  color: Theme.of(context).colorScheme.onErrorContainer,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'No internet connection. Showing cached content.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.onErrorContainer,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
