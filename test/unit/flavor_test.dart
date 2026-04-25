import 'package:flutter_test/flutter_test.dart';
import 'package:ntv/flavors.dart';

void main() {
  group('Flavor', () {
    test('appFlavor defaults to free when no dart-define is set', () {
      // In test runs without --dart-define=FLAVOR=pro, defaults to free.
      expect(appFlavor, Flavor.free);
    });

    test('isBundleActive is false for free flavor', () {
      expect(isBundleActive, isFalse);
    });
  });
}
