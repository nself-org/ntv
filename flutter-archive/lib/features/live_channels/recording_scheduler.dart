import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/channel.dart';
import '../../services/api_service.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/// All DVR jobs (scheduled + completed + failed).
final dvrJobsProvider = AsyncNotifierProvider<DvrJobsNotifier, List<DvrJob>>(
  () {
    return DvrJobsNotifier();
  },
);

class DvrJobsNotifier extends AsyncNotifier<List<DvrJob>> {
  @override
  Future<List<DvrJob>> build() {
    return ref.read(apiServiceProvider).getDvrJobs();
  }

  Future<void> schedule({
    required String channelId,
    String? programTitle,
    required DateTime start,
    required DateTime end,
  }) async {
    final job = await ref.read(apiServiceProvider).createDvrJob(
          channelId: channelId,
          programTitle: programTitle,
          scheduledStart: start,
          scheduledEnd: end,
        );
    final current = state.valueOrNull ?? [];
    state = AsyncData([job, ...current]);
  }

  Future<void> cancel(String jobId) async {
    await ref.read(apiServiceProvider).cancelDvrJob(jobId);
    final current = state.valueOrNull ?? [];
    state = AsyncData(current.where((j) => j.id != jobId).toList());
  }
}

// ---------------------------------------------------------------------------
// RecordingScheduler widget (T15)
// ---------------------------------------------------------------------------

/// DVR recording scheduler — shows scheduled + completed recordings,
/// and lets the user schedule a new recording for a live channel.
class RecordingScheduler extends ConsumerStatefulWidget {
  const RecordingScheduler({super.key});

  @override
  ConsumerState<RecordingScheduler> createState() => _RecordingSchedulerState();
}

class _RecordingSchedulerState extends ConsumerState<RecordingScheduler>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recordings'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Schedule recording',
            onPressed: () => _showScheduleDialog(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () => ref.invalidate(dvrJobsProvider),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Scheduled'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: ref.watch(dvrJobsProvider).when(
            data: (jobs) => TabBarView(
              controller: _tabController,
              children: [
                _buildJobList(
                  context,
                  jobs.where((j) => j.isScheduled || j.isRecording).toList(),
                  emptyMessage: 'No scheduled recordings.',
                  showCancel: true,
                ),
                _buildJobList(
                  context,
                  jobs.where((j) => j.isCompleted || j.isFailed).toList(),
                  emptyMessage: 'No completed recordings yet.',
                  showCancel: false,
                ),
              ],
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => _buildError(context, e),
          ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showScheduleDialog(context),
        icon: const Icon(Icons.fiber_manual_record),
        label: const Text('Record'),
        tooltip: 'Schedule a new recording',
      ),
    );
  }

  Widget _buildJobList(
    BuildContext context,
    List<DvrJob> jobs, {
    required String emptyMessage,
    required bool showCancel,
  }) {
    if (jobs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.videocam_off_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(emptyMessage, style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: jobs.length,
      itemBuilder: (ctx, i) => _DvrJobTile(
        job: jobs[i],
        showCancel: showCancel,
        onCancel: showCancel
            ? () async {
                final confirmed = await _confirmCancel(context, jobs[i]);
                if (confirmed && mounted) {
                  ref.read(dvrJobsProvider.notifier).cancel(jobs[i].id);
                }
              }
            : null,
      ),
    );
  }

  Future<bool> _confirmCancel(BuildContext context, DvrJob job) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel recording?'),
        content: Text(
          'Cancel the recording of "${job.programTitle ?? "channel"}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Cancel recording'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _showScheduleDialog(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _ScheduleRecordingSheet(
        onSchedule: ({
          required channelId,
          programTitle,
          required start,
          required end,
        }) async {
          await ref.read(dvrJobsProvider.notifier).schedule(
                channelId: channelId,
                programTitle: programTitle,
                start: start,
                end: end,
              );
        },
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
            'Failed to load recordings',
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
            onPressed: () => ref.invalidate(dvrJobsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// DVR job tile
// ---------------------------------------------------------------------------

class _DvrJobTile extends StatelessWidget {
  final DvrJob job;
  final bool showCancel;
  final VoidCallback? onCancel;

  const _DvrJobTile({
    required this.job,
    required this.showCancel,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final statusColor = _statusColor(colorScheme);
    final statusLabel = _statusLabel();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  job.isRecording ? Icons.fiber_manual_record : Icons.schedule,
                  color: statusColor,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    job.programTitle ?? 'Untitled recording',
                    style: Theme.of(context).textTheme.titleSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusLabel,
                    style: Theme.of(
                      context,
                    ).textTheme.labelSmall?.copyWith(color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${_formatDateTime(job.scheduledStart)} – ${_formatTime(job.scheduledEnd)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
            Text(
              'Duration: ${_formatDuration(job.duration)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
            if (job.storageUrl != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.check_circle_outline, size: 14),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Recording saved',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: colorScheme.primary,
                          ),
                    ),
                  ),
                ],
              ),
            ],
            if (showCancel && onCancel != null) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: onCancel,
                  icon: const Icon(Icons.cancel_outlined, size: 16),
                  label: const Text('Cancel'),
                  style: TextButton.styleFrom(
                    foregroundColor: colorScheme.error,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _statusColor(ColorScheme cs) {
    if (job.isRecording) return cs.error;
    if (job.isCompleted) return cs.primary;
    if (job.isFailed) return cs.error;
    return cs.onSurfaceVariant;
  }

  String _statusLabel() {
    if (job.isRecording) return 'Recording';
    if (job.isCompleted) return 'Completed';
    if (job.isFailed) return 'Failed';
    return 'Scheduled';
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day}/${dt.month} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    if (h > 0) return '${h}h ${m}m';
    return '${m}m';
  }
}

// ---------------------------------------------------------------------------
// Schedule recording bottom sheet
// ---------------------------------------------------------------------------

typedef ScheduleCallback = Future<void> Function({
  required String channelId,
  String? programTitle,
  required DateTime start,
  required DateTime end,
});

class _ScheduleRecordingSheet extends ConsumerStatefulWidget {
  final ScheduleCallback onSchedule;

  const _ScheduleRecordingSheet({required this.onSchedule});

  @override
  ConsumerState<_ScheduleRecordingSheet> createState() =>
      _ScheduleRecordingSheetState();
}

class _ScheduleRecordingSheetState
    extends ConsumerState<_ScheduleRecordingSheet> {
  final _channelIdController = TextEditingController();
  final _titleController = TextEditingController();
  DateTime _start = DateTime.now().add(const Duration(minutes: 5));
  DateTime _end = DateTime.now().add(const Duration(hours: 1, minutes: 5));
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _channelIdController.dispose();
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Schedule Recording',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _channelIdController,
            decoration: const InputDecoration(
              labelText: 'Channel ID',
              hintText: 'UUID of the live channel',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Program title (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          _DateTimePicker(
            label: 'Start time',
            value: _start,
            onChanged: (dt) => setState(() => _start = dt),
          ),
          const SizedBox(height: 12),
          _DateTimePicker(
            label: 'End time',
            value: _end,
            onChanged: (dt) => setState(() => _end = dt),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Schedule Recording'),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    final channelId = _channelIdController.text.trim();
    if (channelId.isEmpty) {
      setState(() => _error = 'Channel ID is required.');
      return;
    }
    if (!_end.isAfter(_start)) {
      setState(() => _error = 'End time must be after start time.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.onSchedule(
        channelId: channelId,
        programTitle: _titleController.text.trim().isEmpty
            ? null
            : _titleController.text.trim(),
        start: _start,
        end: _end,
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = e.toString();
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Simple date/time picker widget
// ---------------------------------------------------------------------------

class _DateTimePicker extends StatelessWidget {
  final String label;
  final DateTime value;
  final ValueChanged<DateTime> onChanged;

  const _DateTimePicker({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final formatted = '${value.day}/${value.month}/${value.year}  '
        '${value.hour.toString().padLeft(2, '0')}:'
        '${value.minute.toString().padLeft(2, '0')}';

    return InkWell(
      onTap: () => _pick(context),
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          suffixIcon: const Icon(Icons.calendar_today_outlined),
        ),
        child: Text(formatted),
      ),
    );
  }

  Future<void> _pick(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: value,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(value),
    );
    if (time == null) return;
    onChanged(
      DateTime(date.year, date.month, date.day, time.hour, time.minute),
    );
  }
}
