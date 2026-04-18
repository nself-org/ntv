import 'package:flutter_test/flutter_test.dart';

import 'package:ntv/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const NtvApp());
    expect(find.byType(NtvApp), findsOneWidget);
  });
}
