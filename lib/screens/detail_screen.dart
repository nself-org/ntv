import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/media.dart';
import '../services/api_service.dart';

/// Provider to fetch media details by ID and type.
final mediaDetailProvider =
    FutureProvider.family<Media, ({String id, MediaType type})>((ref, params) async {
  final api = ref.read(apiServiceProvider);
  return api.getMediaDetails(params.id, type: params.type);
});

/// Provider to fetch episodes for a TV show season.
final episodesProvider =
    FutureProvider.family<List<Episode>, ({String showId, int season})>((ref, params) async {
  final api = ref.read(apiServiceProvider);
  return api.getEpisodes(params.showId, params.season);
});

class DetailScreen extends ConsumerStatefulWidget {
  final String mediaId;
  final MediaType mediaType;

  const DetailScreen({
    super.key,
    required this.mediaId,
    required this.mediaType,
  });

  @override
  ConsumerState<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends ConsumerState<DetailScreen> {
  int _selectedSeason = 1;

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(
      mediaDetailProvider((id: widget.mediaId, type: widget.mediaType)),
    );

    return Scaffold(
      body: detail.when(
        data: (media) => _buildContent(context, media),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load: $e')),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Media media) {
    return CustomScrollView(
      slivers: [
        // Backdrop header
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            title: Text(media.title, style: const TextStyle(fontSize: 16)),
            background: media.backdropUrl != null
                ? Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(media.backdropUrl!, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _backdropPlaceholder()),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black87],
                          ),
                        ),
                      ),
                    ],
                  )
                : _backdropPlaceholder(),
          ),
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Metadata row
                Row(
                  children: [
                    if (media.releaseDate != null)
                      Text(media.releaseDate!.substring(0, 4),
                          style: Theme.of(context).textTheme.bodyMedium),
                    if (media.runtime != null) ...[
                      const SizedBox(width: 16),
                      Text('${media.runtime} min',
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                    if (media.rating != null) ...[
                      const SizedBox(width: 16),
                      Icon(Icons.star, size: 16, color: Colors.amber.shade600),
                      const SizedBox(width: 4),
                      Text(media.rating!.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ],
                ),

                const SizedBox(height: 12),

                // Genres
                if (media.genres.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: media.genres
                        .map((g) => Chip(
                              label: Text(g, style: const TextStyle(fontSize: 12)),
                              visualDensity: VisualDensity.compact,
                            ))
                        .toList(),
                  ),

                const SizedBox(height: 16),

                // Play button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => context.push('/player?mediaId=${media.id}'),
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Play'),
                  ),
                ),

                const SizedBox(height: 16),

                // Description
                if (media.overview != null) ...[
                  Text('Overview', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(media.overview!, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ],
            ),
          ),
        ),

        // Episode list for TV shows
        if (media.type == MediaType.tvShow && media.seasonCount != null) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text('Episodes', style: Theme.of(context).textTheme.titleMedium),
                  const Spacer(),
                  DropdownButton<int>(
                    value: _selectedSeason,
                    items: List.generate(
                      media.seasonCount!,
                      (i) => DropdownMenuItem(value: i + 1, child: Text('Season ${i + 1}')),
                    ),
                    onChanged: (v) => setState(() => _selectedSeason = v ?? 1),
                  ),
                ],
              ),
            ),
          ),
          _buildEpisodeList(media.id),
        ],
      ],
    );
  }

  Widget _buildEpisodeList(String showId) {
    final episodes = ref.watch(
      episodesProvider((showId: showId, season: _selectedSeason)),
    );

    return episodes.when(
      data: (eps) => SliverList(
        delegate: SliverChildBuilderDelegate(
          (ctx, i) {
            final ep = eps[i];
            return ListTile(
              leading: SizedBox(
                width: 80,
                height: 45,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: ep.stillUrl != null
                      ? Image.network(ep.stillUrl!, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _episodePlaceholder())
                      : _episodePlaceholder(),
                ),
              ),
              title: Text('${ep.episodeNumber}. ${ep.title}'),
              subtitle: ep.runtime != null ? Text('${ep.runtime} min') : null,
              onTap: () => context.push('/player?mediaId=${ep.id}'),
            );
          },
          childCount: eps.length,
        ),
      ),
      loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
      error: (e, _) => SliverToBoxAdapter(child: Center(child: Text('Error: $e'))),
    );
  }

  Widget _backdropPlaceholder() {
    return Container(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: const Center(child: Icon(Icons.movie, size: 64, color: Colors.white24)),
    );
  }

  Widget _episodePlaceholder() {
    return Container(
      color: Colors.grey.shade800,
      child: const Center(child: Icon(Icons.play_circle_outline, size: 20)),
    );
  }
}
