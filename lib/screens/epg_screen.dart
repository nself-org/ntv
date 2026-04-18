import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/channel.dart';
import '../services/api_service.dart';
import '../services/m3u_service.dart';
import '../services/settings_service.dart';

/// Aggregated EPG data: schedules keyed by channelId, channel list for display.
class EpgData {
  final List<Channel> channels;
  final Map<String, EpgSchedule> schedules;

  const EpgData({required this.channels, required this.schedules});
}

/// Fetches EPG schedules for all channels found in all saved M3U playlists.
final epgDataProvider = FutureProvider<EpgData>((ref) async {
  final settings = ref.read(settingsServiceProvider);
  final api = ref.read(apiServiceProvider);
  final m3u = ref.read(m3uServiceProvider);

  if (!api.isConfigured) return const EpgData(channels: [], schedules: {});

  // Gather all channels from all saved playlists.
  final allChannels = <Channel>[];
  for (final url in settings.m3uUrls) {
    try {
      final playlist = await m3u.fetchPlaylist(url);
      allChannels.addAll(playlist);
    } catch (_) {
      // Skip unreachable playlists; show what's available.
    }
  }

  if (allChannels.isEmpty) {
    return const EpgData(channels: [], schedules: {});
  }

  // Deduplicate channel IDs.
  final seen = <String>{};
  final uniqueChannels = allChannels.where((ch) => seen.add(ch.id)).toList();

  final channelIds = uniqueChannels.map((ch) => ch.id).toList();
  final schedules = await api.getEpgSchedule(channelIds);

  final scheduleMap = <String, EpgSchedule>{};
  for (final s in schedules) {
    scheduleMap[s.channelId] = s;
  }

  return EpgData(channels: uniqueChannels, schedules: scheduleMap);
});

class EpgScreen extends ConsumerStatefulWidget {
  const EpgScreen({super.key});

  @override
  ConsumerState<EpgScreen> createState() => _EpgScreenState();
}

class _EpgScreenState extends ConsumerState<EpgScreen> {
  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsServiceProvider);
    final epgAsync = ref.watch(epgDataProvider);

    if (!ref.read(apiServiceProvider).isConfigured) {
      return _buildUnconfigured(context);
    }

    if (settings.m3uUrls.isEmpty) {
      return _buildNoPlaylists(context);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Guide'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh guide',
            onPressed: () => ref.invalidate(epgDataProvider),
          ),
        ],
      ),
      body: epgAsync.when(
        data: (data) => data.channels.isEmpty
            ? _buildNoData(context)
            : _buildGrid(context, data),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load guide', style: Theme.of(context).textTheme.titleMedium),
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
                onPressed: () => ref.invalidate(epgDataProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUnconfigured(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Guide'), centerTitle: false),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.grid_view_outlined,
              size: 80,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text('Backend not configured', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'Connect to your nSelf backend to load EPG data.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
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

  Widget _buildNoPlaylists(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Guide'), centerTitle: false),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.playlist_add,
              size: 80,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text('No playlists added', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'Add an M3U playlist in Live TV to see the program guide.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: () => context.go('/iptv'),
              icon: const Icon(Icons.live_tv),
              label: const Text('Go to Live TV'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoData(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.grid_view_outlined,
            size: 80,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 24),
          Text('No guide data available', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'The EPG plugin on your backend returned no schedule data for today.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildGrid(BuildContext context, EpgData data) {
    return ListView.builder(
      itemCount: data.channels.length,
      itemBuilder: (ctx, i) {
        final ch = data.channels[i];
        final schedule = data.schedules[ch.id];
        return _buildChannelRow(context, ch, schedule);
      },
    );
  }

  Widget _buildChannelRow(BuildContext context, Channel ch, EpgSchedule? schedule) {
    final now = DateTime.now();
    final programs = schedule?.programs ?? [];
    final todayPrograms =
        programs.where((p) => p.start.day == now.day && p.start.month == now.month).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Channel header.
        Container(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          child: ListTile(
            dense: true,
            leading: ch.logoUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Image.network(
                      ch.logoUrl!,
                      width: 32,
                      height: 32,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(Icons.tv, size: 20),
                    ),
                  )
                : const Icon(Icons.tv, size: 20),
            title: Text(
              ch.name,
              style: Theme.of(context).textTheme.labelLarge,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: ch.group != null ? Text(ch.group!) : null,
          ),
        ),

        // Programs for today, or a no-data fallback message.
        if (todayPrograms.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Text(
              'No schedule data for today.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          )
        else
          ...todayPrograms.map((p) => _buildProgramTile(context, p, ch)),

        const Divider(height: 1),
      ],
    );
  }

  Widget _buildProgramTile(BuildContext context, EpgProgram program, Channel ch) {
    final isNow = program.isNow;
    final timeRange = '${_formatTime(program.start)} – ${_formatTime(program.end)}';

    return InkWell(
      onTap: () => _onProgramTap(context, program, ch),
      child: Container(
        color: isNow
            ? Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3)
            : null,
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Time column.
            SizedBox(
              width: 88,
              child: Text(
                timeRange,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: isNow
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                      fontWeight: isNow ? FontWeight.bold : FontWeight.normal,
                    ),
              ),
            ),
            const SizedBox(width: 8),
            // Program info column.
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (isNow) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'NOW',
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: Theme.of(context).colorScheme.onPrimary,
                                ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: Text(
                          program.title,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: isNow ? FontWeight.bold : FontWeight.normal,
                              ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (program.description != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      program.description!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (isNow)
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: Icon(
                  Icons.play_circle_outline,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _onProgramTap(BuildContext context, EpgProgram program, Channel ch) {
    if (program.isNow) {
      // Navigate to player with the channel's stream URL directly.
      context.push('/player?streamUrl=${Uri.encodeComponent(ch.streamUrl)}');
      return;
    }

    // Show program details for future programs.
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(program.title, style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              '${_formatTime(program.start)} – ${_formatTime(program.end)} on ${ch.name}',
              style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                    color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                  ),
            ),
            if (program.description != null) ...[
              const SizedBox(height: 12),
              Text(program.description!, style: Theme.of(ctx).textTheme.bodyMedium),
            ],
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
