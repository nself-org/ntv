import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../flavors.dart';

/// Wraps EPG and sync screens with a bundle gate.
///
/// When [isBundleActive] is false (free flavor), shows an upgrade CTA instead
/// of the real content.
class BundleGateWidget extends StatelessWidget {
  /// The widget to show when the bundle is active.
  final Widget child;

  /// Feature name for the CTA label (e.g. "EPG", "Cross-device sync").
  final String featureName;

  const BundleGateWidget({
    super.key,
    required this.child,
    required this.featureName,
  });

  @override
  Widget build(BuildContext context) {
    if (isBundleActive) return child;
    return _BundleUpgradeCta(featureName: featureName);
  }
}

class _BundleUpgradeCta extends StatelessWidget {
  final String featureName;

  const _BundleUpgradeCta({required this.featureName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Semantics(
            label: 'Unlock $featureName with the nTV Bundle',
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, size: 72),
                const SizedBox(height: 24),
                Text(
                  'Unlock $featureName',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  '$featureName requires the nTV Bundle (\$0.99/mo). '
                  'Subscribe on nself.org to unlock EPG, cross-device sync, '
                  'recording, and more.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                FilledButton.icon(
                  onPressed: () => launchUrl(
                    Uri.parse('https://nself.org/bundles/ntv'),
                    mode: LaunchMode.externalApplication,
                  ),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Get nTV Bundle — \$0.99/mo'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
