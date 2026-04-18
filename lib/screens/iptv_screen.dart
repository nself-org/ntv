import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/channel.dart';
import '../services/m3u_service.dart';
import '../services/settings_service.dart';

/// Selected playlist URL state.
final _selectedPlaylistProvider = StateProvider<String?>((ref) => null);

/// Search query for filtering channels.
final _channelSearchProvider = StateProvider<String>((ref) => '');

/// Selected group filter for channels.
final _selectedGroupProvider = StateProvider<String?>((ref) => null);

class IptvScreen extends ConsumerStatefulWidget {
  const IptvScreen({super.key});

  @override
  ConsumerState<IptvScreen> createState() => _IptvScreenState();
}

class _IptvScreenState extends ConsumerState<IptvScreen> {
  final _urlController = TextEditingController();
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _urlController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _addPlaylist() {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;
    ref.read(settingsServiceProvider).addM3uUrl(url);
    _urlController.clear();
    Navigator.of(context).pop();
  }

  void _showAddDialog() {
    _urlController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add M3U Playlist'),
        content: TextField(
          controller: _urlController,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Playlist URL',
            hintText: 'http://provider.example.com/playlist.m3u',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.url,
          onSubmitted: (_) => _addPlaylist(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: _addPlaylist,
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _removePlaylist(String url) {
    ref.read(settingsServiceProvider).removeM3uUrl(url);
    final selected = ref.read(_selectedPlaylistProvider);
    if (selected == url) {
      ref.read(_selectedPlaylistProvider.notifier).state = null;
      ref.read(_selectedGroupProvider.notifier).state = null;
      ref.read(_channelSearchProvider.notifier).state = '';
      _searchController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsServiceProvider);
    final m3uUrls = settings.m3uUrls;
    final selectedUrl = ref.watch(_selectedPlaylistProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live TV'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add playlist',
            onPressed: _showAddDialog,
          ),
        ],
      ),
      body: m3uUrls.isEmpty
          ? _buildEmpty(context)
          : selectedUrl == null
              ? _buildPlaylistList(context, m3uUrls)
              : _buildChannelView(context, selectedUrl),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.live_tv_outlined,
            size: 80,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 24),
          Text('No playlists yet', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Add an M3U playlist URL to browse live channels.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          FilledButton.icon(
            onPressed: _showAddDialog,
            icon: const Icon(Icons.add),
            label: const Text('Add Playlist'),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaylistList(BuildContext context, List<String> urls) {
    return ListView.builder(
      itemCount: urls.length,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemBuilder: (ctx, i) {
        final url = urls[i];
        return ListTile(
          leading: const Icon(Icons.playlist_play),
          title: Text(
            url,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.chevron_right),
              IconButton(
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Remove playlist',
                onPressed: () => _removePlaylist(url),
              ),
            ],
          ),
          onTap: () {
            ref.read(_selectedPlaylistProvider.notifier).state = url;
            ref.read(_selectedGroupProvider.notifier).state = null;
            ref.read(_channelSearchProvider.notifier).state = '';
            _searchController.clear();
          },
        );
      },
    );
  }

  Widget _buildChannelView(BuildContext context, String url) {
    final playlistAsync = ref.watch(playlistProvider(url));

    return playlistAsync.when(
      data: (channels) => _buildChannelList(context, channels, url),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48),
            const SizedBox(height: 16),
            Text('Failed to load playlist', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              e.toString(),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => ref.invalidate(playlistProvider(url)),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChannelList(BuildContext context, List<Channel> channels, String playlistUrl) {
    final searchQuery = ref.watch(_channelSearchProvider);
    final selectedGroup = ref.watch(_selectedGroupProvider);

    final groups = <String>{};
    for (final ch in channels) {
      if (ch.group != null) groups.add(ch.group!);
    }
    final sortedGroups = groups.toList()..sort();

    List<Channel> filtered = channels;
    if (selectedGroup != null) {
      filtered = filtered.where((ch) => ch.group == selectedGroup).toList();
    }
    if (searchQuery.isNotEmpty) {
      final q = searchQuery.toLowerCase();
      filtered = filtered.where((ch) => ch.name.toLowerCase().contains(q)).toList();
    }

    return Column(
      children: [
        // Back to playlists + search bar row.
        Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                tooltip: 'Back to playlists',
                onPressed: () {
                  ref.read(_selectedPlaylistProvider.notifier).state = null;
                  ref.read(_selectedGroupProvider.notifier).state = null;
                  ref.read(_channelSearchProvider.notifier).state = '';
                  _searchController.clear();
                },
              ),
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Search channels...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 8),
                  ),
                  onChanged: (value) {
                    ref.read(_channelSearchProvider.notifier).state = value;
                  },
                ),
              ),
            ],
          ),
        ),

        // Group filter chips.
        if (sortedGroups.isNotEmpty)
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: const Text('All'),
                    selected: selectedGroup == null,
                    onSelected: (_) =>
                        ref.read(_selectedGroupProvider.notifier).state = null,
                  ),
                ),
                ...sortedGroups.map((g) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(g),
                        selected: selectedGroup == g,
                        onSelected: (_) =>
                            ref.read(_selectedGroupProvider.notifier).state = g,
                      ),
                    )),
              ],
            ),
          ),

        // Channel count header.
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            children: [
              Text(
                '${filtered.length} channel${filtered.length == 1 ? '' : 's'}',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),

        // Channel list.
        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('No channels match your filter.'))
              : ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final ch = filtered[i];
                    return ListTile(
                      leading: ch.logoUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: Image.network(
                                ch.logoUrl!,
                                width: 40,
                                height: 40,
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => const Icon(Icons.tv),
                              ),
                            )
                          : const Icon(Icons.tv),
                      title: Text(ch.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: ch.group != null ? Text(ch.group!) : null,
                      onTap: () => context.push('/player?streamUrl=${Uri.encodeComponent(ch.streamUrl)}'),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
