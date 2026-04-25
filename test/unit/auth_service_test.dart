import 'package:flutter_test/flutter_test.dart';
import 'package:nself_auth_sdk/nself_auth_sdk.dart';
import 'package:ntv/features/auth/auth_service.dart';

void main() {
  setUp(() => NSelfAuth.dispose());
  tearDown(() => NSelfAuth.dispose());

  group('AuthService (nself_auth_sdk-backed)', () {
    late InMemoryStorageBackend backend;
    late AuthService service;

    setUp(() {
      backend = InMemoryStorageBackend();
      service = AuthService(storageBackend: backend);
    });

    test('initial state is unknown', () {
      expect(service.state.status, AuthStatus.unknown);
    });

    test('init with no persisted token sets guest state', () async {
      await service.init(authBaseUrl: 'https://test.example.com/v1/auth');
      expect(service.state.status, AuthStatus.guest);
      expect(service.state.isGuest, isTrue);
    });

    test('init with persisted user restores authenticated state', () async {
      // Seed a user into the SDK store before calling init.
      final store = TokenStore.withBackend(backend);
      await store.saveUser(User(
        id: 'u1',
        email: 'test@example.com',
        displayName: 'Test User',
        tier: 'free',
        activePlugins: const [],
        accessTokenExpiry: DateTime.now().add(const Duration(hours: 1)),
      ));
      await store.saveAccessToken('tok_abc');

      await service.init(authBaseUrl: 'https://test.example.com/v1/auth');
      expect(service.state.status, AuthStatus.authenticated);
      expect(service.state.userEmail, 'test@example.com');
    });

    test('storeTokens transitions to authenticated', () async {
      await service.init(authBaseUrl: 'https://test.example.com/v1/auth');
      await service.storeTokens(
        accessToken: 'new_token',
        email: 'user@example.com',
      );
      expect(service.state.isAuthenticated, isTrue);
      expect(service.state.userEmail, 'user@example.com');
    });

    test('signOut clears state and sets guest', () async {
      await service.init(authBaseUrl: 'https://test.example.com/v1/auth');
      await service.storeTokens(accessToken: 'tok');
      await service.signOut();
      expect(service.state.isGuest, isTrue);
      expect(service.state.userEmail, isNull);
    });

    test('continueAsGuest sets guest state', () async {
      await service.init(authBaseUrl: 'https://test.example.com/v1/auth');
      service.continueAsGuest();
      expect(service.state.status, AuthStatus.guest);
    });
  });
}
