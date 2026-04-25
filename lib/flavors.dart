/// App flavor — determines whether nTV bundle features are available.
///
/// Build with:
///   flutter build apk --dart-define=FLAVOR=free
///   flutter build apk --dart-define=FLAVOR=pro
enum Flavor { free, pro }

/// The active flavor for this build, injected at compile time via
/// `--dart-define=FLAVOR=<free|pro>`.
const _rawFlavor = String.fromEnvironment('FLAVOR', defaultValue: 'free');

/// The current [Flavor] for this build.
const Flavor appFlavor = _rawFlavor == 'pro' ? Flavor.pro : Flavor.free;

/// Returns true when the nTV bundle is active (pro flavor).
bool get isBundleActive => appFlavor == Flavor.pro;
