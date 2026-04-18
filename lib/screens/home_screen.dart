import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/media.dart';
import '../services/api_service.dart';
import '../services/settings_service.dart';

/// Provider that fetches the media library from the backend.
final libraryProvider = FutureProvider.family<List<Media>, String?>((ref, genre) async {
  final api = ref.read(apiServiceProvider);
  if (!api.isConfigured) return [];
  return api.getLibrary(genre: genre);
});

/// Provider for continue watching items.
final continueWatchingProvider = FutureProvider<List<Media>>((ref) async {
  final api = ref.read(apiServiceProvider);
  if (!api.isConfigured) return [];
  return api.getContinueWatching();
});

/// Provider for available genres.
final genresProvider = FutureProvider<List<String>>((ref) async {
  final api = ref.read(apiServiceProvider);
  if (!api.isConfigured) return [];
  return api.getGenres();
});

/// Selected genre filter state.
final selectedGenreProvider = StateProvider<String?>((ref) => null);

/// Search query state.
final searchQueryProvider = StateProvider<String?>((ref) => null);

/// Filtered library based on search query.
final searchResultsProvider = FutureProvider<List<Media>>((ref) async {
  final query = ref.watch(searchQueryProvider);
  if (query == null || query.isEmpty) return [];
  final api = ref.read(apiServiceProvider);
  if (!api.isConfigured) return [];
  return api.getLibrary(query: query);
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsServiceProvider);

    if (!settings.isConfigured) {
      return _buildUnconfigured(context);
    }

    final selectedGenre = ref.watch(selectedGenreProvider);
    final library = ref.watch(libraryProvider(selectedGenre));
    final continueWatching = ref.watch(continueWatchingProvider);
    final genres = ref.watch(genresProvider);

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search media...',
                  border: InputBorder.none,
                ),
                onSubmitted: (value) {
                  ref.read(searchQueryProvider.notifier).state = value;
                },
              )
            : const Text('nTV'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                  ref.read(searchQueryProvider.notifier).state = null;
                }
              });
            },
          ),
        ],
      ),
      body: _isSearching ? _buildSearchResults() : _buildLibrary(library, continueWatching, genres),
    );
  }

  Widget _buildUnconfigured(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('nTV'), centerTitle: false),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.video_library, size: 80, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 24),
            Text('Your Media Library', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(
              'Connect to your nSelf backend to browse content.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: () => context.go('/settings'),
              icon: const Icon(Icons.settings),
              label: const Text('Configure Backend'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    final results = ref.watch(searchResultsProvider);
    return results.when(
      data: (items) => items.isEmpty
          ? const Center(child: Text('No results found.'))
          : _buildMediaGrid(items),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Search failed: $e')),
    );
  }

  Widget _buildLibrary(
    AsyncValue<List<Media>> library,
    AsyncValue<List<Media>> continueWatching,
    AsyncValue<List<String>> genres,
  ) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(libraryProvider(ref.read(selectedGenreProvider)));
        ref.invalidate(continueWatchingProvider);
      },
      child: CustomScrollView(
        slivers: [
          // Genre filter chips
          genres.when(
            data: (genreList) => genreList.isEmpty
                ? const SliverToBoxAdapter()
                : SliverToBoxAdapter(
                    child: SizedBox(
                      height: 48,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: const Text('All'),
                              selected: ref.watch(selectedGenreProvider) == null,
                              onSelected: (_) =>
                                  ref.read(selectedGenreProvider.notifier).state = null,
                            ),
                          ),
                          ...genreList.map((g) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: FilterChip(
                                  label: Text(g),
                                  selected: ref.watch(selectedGenreProvider) == g,
                                  onSelected: (_) =>
                                      ref.read(selectedGenreProvider.notifier).state = g,
                                ),
                              )),
                        ],
                      ),
                    ),
                  ),
            loading: () => const SliverToBoxAdapter(),
            error: (_, __) => const SliverToBoxAdapter(),
          ),

          // Continue watching row
          continueWatching.when(
            data: (items) => items.isEmpty
                ? const SliverToBoxAdapter()
                : SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text('Continue Watching',
                              style: Theme.of(context).textTheme.titleMedium),
                        ),
                        SizedBox(
                          height: 180,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: items.length,
                            itemBuilder: (ctx, i) => _buildPosterCard(items[i], width: 120),
                          ),
                        ),
                      ],
                    ),
                  ),
            loading: () => const SliverToBoxAdapter(),
            error: (_, __) => const SliverToBoxAdapter(),
          ),

          // Section header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text('Library', style: Theme.of(context).textTheme.titleMedium),
            ),
          ),

          // Media grid
          library.when(
            data: (items) => items.isEmpty
                ? const SliverFillRemaining(child: Center(child: Text('No media found.')))
                : SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 180,
                        childAspectRatio: 0.65,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) => _buildPosterCard(items[i]),
                        childCount: items.length,
                      ),
                    ),
                  ),
            loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator())),
            error: (e, _) => SliverFillRemaining(child: Center(child: Text('Error: $e'))),
          ),
        ],
      ),
    );
  }

  Widget _buildMediaGrid(List<Media> items) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 180,
        childAspectRatio: 0.65,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: items.length,
      itemBuilder: (ctx, i) => _buildPosterCard(items[i]),
    );
  }

  Widget _buildPosterCard(Media item, {double? width}) {
    return GestureDetector(
      onTap: () => context.push('/detail/${item.id}?type=${item.type.name}'),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: item.posterUrl != null
                    ? Image.network(
                        item.posterUrl!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (_, __, ___) => _posterPlaceholder(),
                      )
                    : _posterPlaceholder(),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _posterPlaceholder() {
    return Container(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: const Center(child: Icon(Icons.movie, size: 32)),
    );
  }
}
