import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/channel.dart';
import '../../services/api_service.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/// Paginated live channel list — page 1 on load, load-more appends.
final liveChannelsProvider =
    AsyncNotifierProvider<LiveChannelsNotifier, LiveChannelListResult>(() {
  return LiveChannelsNotifier();
});

class LiveChannelsNotifier extends AsyncNotifier<LiveChannelListResult> {
  @override
  Future<LiveChannelListResult> build() {
    return ref.read(apiServiceProvider).getLiveChannels();
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || !current.hasMore) return;
    final next = await ref
        .read(apiServiceProvider)
        .getLiveChannels(page: current.page + 1, pageSize: current.pageSize);
    state = AsyncData(
      LiveChannelListResult(
        channels: [...current.channels, ...next.channels],
        total: next.total,
        page: next.page,
        pageSize: next.pageSize,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// LiveChannelGuide widget (T14)
// ---------------------------------------------------------------------------

/// TV-remote–friendly live channel guide.
///
/// - Lists channels with logo, name, genre, and current/next program from EPG.
/// - Keyboard/D-pad navigable (focus traversal via [FocusTraversalGroup]).
/// - Tapping a channel navigates to the player with the HLS URL.
class LiveChannelGuide extends ConsumerStatefulWidget {
  const LiveChannelGuide({super.key});

  @override
  ConsumerState<LiveChannelGuide> createState() => _LiveChannelGuideState();
}

class _LiveChannelGuideState extends ConsumerState<LiveChannelGuide> {
  int _focusedIndex = 0;
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final channelsAsync = ref.watch(liveChannelsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Channels'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh channels',
            onPressed: () => ref.invalidate(liveChannelsProvider),
          ),
        ],
      ),
      body: channelsAsync.when(
        data: (result) => result.channels.isEmpty
            ? _buildEmpty(context)
            : _buildChannelList(context, result),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _buildError(context, e),
      ),
    );
  }

  Widget _buildChannelList(BuildContext context, LiveChannelListResult result) {
    return FocusTraversalGroup(
      policy: OrderedTraversalPolicy(),
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              _scrollController.position.extentAfter < 200 &&
              result.hasMore) {
            ref.read(liveChannelsProvider.notifier).loadMore();
          }
          return false;
        },
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                itemCount: result.channels.length + (result.hasMore ? 1 : 0),
                itemBuilder: (ctx, index) {
                  if (index >= result.channels.length) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  final channel = result.channels[index];
                  return _ChannelTile(
                    channel: channel,
                    isFocused: index == _focusedIndex,
                    onFocus: () => setState(() => _focusedIndex = index),
                    onActivate: () => _openChannel(context, channel),
                    traversalOrder: index,
                  );
                },
              ),
            ),
            if (result.total > 0)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  '${result.channels.length} of ${result.total} channels',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _openChannel(BuildContext context, LiveChannelInfo channel) {
    context.push(
      '/player?streamUrl=${Uri.encodeComponent(channel.hlsUrl)}'
      '&title=${Uri.encodeComponent(channel.name)}',
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
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 24),
          Text(
            'No live channels',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Add channels via your nSelf backend (streaming plugin).',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48),
          const SizedBox(height: 16),
          Text(
            'Failed to load channels',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => ref.invalidate(liveChannelsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Individual channel tile
// ---------------------------------------------------------------------------

class _ChannelTile extends StatefulWidget {
  final LiveChannelInfo channel;
  final bool isFocused;
  final VoidCallback onFocus;
  final VoidCallback onActivate;
  final int traversalOrder;

  const _ChannelTile({
    required this.channel,
    required this.isFocused,
    required this.onFocus,
    required this.onActivate,
    required this.traversalOrder,
  });

  @override
  State<_ChannelTile> createState() => _ChannelTileState();
}

class _ChannelTileState extends State<_ChannelTile> {
  late final FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      if (_focusNode.hasFocus) widget.onFocus();
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ch = widget.channel;
    final colorScheme = Theme.of(context).colorScheme;

    return FocusableActionDetector(
      focusNode: _focusNode,
      autofocus: widget.traversalOrder == 0,
      actions: {
        ActivateIntent: CallbackAction<ActivateIntent>(
          onInvoke: (_) {
            widget.onActivate();
            return null;
          },
        ),
      },
      child: Semantics(
        label:
            '${ch.name}${ch.currentProgram != null ? ", now: ${ch.currentProgram}" : ""}',
        button: true,
        child: InkWell(
          onTap: widget.onActivate,
          focusNode: _focusNode,
          focusColor: colorScheme.primaryContainer.withValues(alpha: 0.3),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            decoration: BoxDecoration(
              border: widget.isFocused
                  ? Border(
                      left: BorderSide(color: colorScheme.primary, width: 4),
                    )
                  : null,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                // Channel logo or fallback icon.
                SizedBox(
                  width: 48,
                  height: 48,
                  child: ch.logoUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.network(
                            ch.logoUrl!,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) =>
                                const Icon(Icons.live_tv, size: 32),
                          ),
                        )
                      : const Icon(Icons.live_tv, size: 32),
                ),
                const SizedBox(width: 16),
                // Channel info column.
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (ch.number != null) ...[
                            Text(
                              ch.number!,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          Expanded(
                            child: Text(
                              ch.name,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyLarge
                                  ?.copyWith(
                                    fontWeight: widget.isFocused
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      if (ch.currentProgram != null) ...[
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 5,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: colorScheme.primary,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Text(
                                'NOW',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(color: colorScheme.onPrimary),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                ch.currentProgram!,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: colorScheme.onSurfaceVariant,
                                    ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (ch.nextProgram != null) ...[
                        const SizedBox(height: 1),
                        Text(
                          'Next: ${ch.nextProgram}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(
                                color: colorScheme.onSurfaceVariant.withValues(
                                  alpha: 0.7,
                                ),
                              ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                // Play indicator.
                Icon(
                  Icons.play_circle_outline,
                  color: widget.isFocused
                      ? colorScheme.primary
                      : colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
