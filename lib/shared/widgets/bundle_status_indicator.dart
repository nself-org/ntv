import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../flavors.dart';

/// Shows bundle status in Settings: either "nTV Bundle Active" or
/// a "Get nTV Bundle" call-to-action chip.
class BundleStatusIndicator extends StatelessWidget {
  const BundleStatusIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    if (isBundleActive) {
      return Semantics(
        label: 'nTV Bundle active',
        child: const Chip(
          avatar: Icon(Icons.check_circle, size: 18),
          label: Text('nTV Bundle Active'),
        ),
      );
    }
    return Semantics(
      label: 'Get nTV Bundle for 99 cents per month',
      child: ActionChip(
        avatar: const Icon(Icons.lock_outline, size: 18),
        label: const Text('Get nTV Bundle — \$0.99/mo'),
        onPressed: () => launchUrl(
          Uri.parse('https://nself.org/bundles/ntv'),
          mode: LaunchMode.externalApplication,
        ),
      ),
    );
  }
}
