# Contributing

Contributions to nTV are welcome. This page covers the conventions, tooling, and PR process.

---

## Before You Start

- Read the [Architecture](architecture) page to understand the Riverpod + go_router + Dio + chewie stack.
- Run `dart format lib` and `flutter analyze` on your changes before opening a PR. Both must pass cleanly.
- Check the [open issues](https://github.com/nself-org/ntv/issues) before starting work on a feature — it avoids duplicated effort.

---

## Code Style

nTV follows standard Dart conventions enforced by `dart format` and the lints in `analysis_options.yaml`.

Key points:

- **Riverpod providers** are declared at the top of the file that uses them, above the widget class.
- **FutureProvider.family** for parameterized async data. **StateProvider** for simple synchronous state. **ChangeNotifierProvider** only for `SettingsService` (existing pattern, do not add new ones).
- **No `BuildContext` across async gaps.** Use `mounted` checks before calling `setState` or `ScaffoldMessenger` after any `await`.
- **File per screen.** Each screen in `lib/screens/` is one file. Shared widgets extracted to `lib/widgets/` (create this directory if adding the first shared widget).
- **No direct `SharedPreferences` calls outside `SettingsService`.** All persistence goes through the service.
- **No direct `Dio` calls outside `ApiService`.** All HTTP goes through the service.

---

## Riverpod Patterns

```dart
// Async data with a parameter — use FutureProvider.family
final someDataProvider = FutureProvider.family<List<Foo>, String>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  return api.getFoo(id);
});

// Simple state — use StateProvider
final filterProvider = StateProvider<String?>((ref) => null);

// In a widget, invalidate to refresh
ref.invalidate(someDataProvider(id));
```

Avoid `ref.watch` inside `initState` or async gaps. Use `ref.read` in callbacks and `ref.watch` only in `build`.

---

## Adding a New Screen

1. Create `lib/screens/my_screen.dart`.
2. Add the route in `lib/main.dart` inside the `GoRouter` routes list.
3. For routes inside the shell (bottom nav), add inside the `ShellRoute`. For full-screen routes (like player), add at the top level.
4. Add navigation from the relevant screen using `context.go('/path')` or `context.push('/path')`.

---

## Adding a New API Endpoint

1. Add a method to `lib/services/api_service.dart`.
2. Add the corresponding model class or field to `lib/models/media.dart` (or a new model file in `lib/models/`).
3. Create a `FutureProvider` in the screen that uses it.

---

## Testing

```bash
flutter test
```

Unit tests live in `test/`. Widget tests use `flutter_test`. The test suite uses `mocktail` for mocking (add it to `dev_dependencies` when writing your first mock).

When adding a feature, include at minimum:
- A unit test for any new `ApiService` method (mock `Dio`).
- A unit test for any new model `fromJson` factory.

---

## Pull Request Process

1. Fork the repo and create a branch from `main`.
2. Make your changes.
3. Run `dart format lib test` and `flutter analyze`. Both must be clean.
4. Run `flutter test`. All tests must pass.
5. Open a PR with a clear title and description covering:
   - What changed and why
   - How to test it (platform, backend plugin requirements if any)
   - Screenshots for UI changes
6. A maintainer will review and merge or request changes.

---

## Reporting Issues

Use [GitHub Issues](https://github.com/nself-org/ntv/issues). Include:

- Platform and Flutter version (`flutter --version`)
- Steps to reproduce
- Expected vs. actual behavior
- Logs from `flutter run --verbose` if relevant
