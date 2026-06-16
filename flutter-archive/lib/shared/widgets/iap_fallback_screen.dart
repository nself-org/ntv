import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// The reason an IAP could not complete. Drives which message is shown.
enum IapFallbackReason {
  /// Bundle is not available for purchase in the user's region.
  regionUnavailable,

  /// A parental control or device restriction prevents the purchase.
  purchaseRestricted,

  /// The subscription was initiated but is still pending server verification
  /// (e.g. App Store / Play Store review delay).
  subscriptionPending,
}

/// Full-screen fallback shown when an in-app purchase cannot proceed.
///
/// Covers three distinct error states:
/// - [IapFallbackReason.regionUnavailable] — bundle not sold in this region.
/// - [IapFallbackReason.purchaseRestricted] — device parental controls block it.
/// - [IapFallbackReason.subscriptionPending] — purchase is awaiting verification.
class IapFallbackScreen extends StatelessWidget {
  final IapFallbackReason reason;

  const IapFallbackScreen({super.key, required this.reason});

  @override
  Widget build(BuildContext context) {
    final content = _content(reason);
    return Scaffold(
      backgroundColor: const Color(0xFF030712), // gray-950
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('nTV Bundle'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(content.icon, size: 56, color: content.iconColor),
              const SizedBox(height: 24),
              Text(
                content.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                content.body,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFF9CA3AF), // gray-400
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              if (content.primaryAction != null) ...[
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: content.primaryAction!.onTap,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5), // indigo-600
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      content.primaryAction!.label,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              TextButton(
                onPressed: () => Navigator.of(context).maybePop(),
                child: const Text(
                  'Back',
                  style: TextStyle(color: Color(0xFF6B7280)), // gray-500
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  _IapFallbackContent _content(IapFallbackReason reason) {
    switch (reason) {
      case IapFallbackReason.regionUnavailable:
        return _IapFallbackContent(
          icon: Icons.public_off_outlined,
          iconColor: const Color(0xFFF59E0B), // amber-500
          title: 'Bundle unavailable in your region',
          body: 'The nTV Bundle is not available for purchase in your region. '
              'You can still use nTV with a free M3U playlist. '
              'If you think this is a mistake, contact support.',
          primaryAction: _IapAction(
            label: 'Contact support',
            onTap: () => launchUrl(
              Uri.parse('https://chat.nself.org'),
              mode: LaunchMode.externalApplication,
            ),
          ),
        );

      case IapFallbackReason.purchaseRestricted:
        return _IapFallbackContent(
          icon: Icons.family_restroom_outlined,
          iconColor: const Color(0xFF60A5FA), // blue-400
          title: 'Purchase restricted',
          body:
              'Your device has parental controls or content restrictions that '
              'prevent in-app purchases. Ask the account owner to allow purchases, '
              'or manage restrictions in your device Settings.',
          primaryAction: _IapAction(
            label: 'Open device Settings',
            onTap: () => launchUrl(
              Uri.parse('app-settings:'),
              mode: LaunchMode.externalApplication,
            ),
          ),
        );

      case IapFallbackReason.subscriptionPending:
        return const _IapFallbackContent(
          icon: Icons.hourglass_top_outlined,
          iconColor: Color(0xFF34D399), // emerald-400
          title: 'Subscription pending verification',
          body:
              'Your purchase was submitted and is pending verification by the '
              'app store. This usually completes within a few minutes. '
              'Restart the app to check — your bundle will activate automatically '
              'once the payment clears.',
          primaryAction: null,
        );
    }
  }
}

class _IapFallbackContent {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String body;
  final _IapAction? primaryAction;

  const _IapFallbackContent({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.body,
    required this.primaryAction,
  });
}

class _IapAction {
  final String label;
  final VoidCallback onTap;

  const _IapAction({required this.label, required this.onTap});
}
