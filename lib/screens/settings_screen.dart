import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/settings_service.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late TextEditingController _urlController;
  late TextEditingController _apiKeyController;

  @override
  void initState() {
    super.initState();
    final settings = ref.read(settingsServiceProvider);
    _urlController = TextEditingController(text: settings.backendUrl);
    _apiKeyController = TextEditingController(text: settings.apiKey);
  }

  @override
  void dispose() {
    _urlController.dispose();
    _apiKeyController.dispose();
    super.dispose();
  }

  void _save() {
    final settings = ref.read(settingsServiceProvider);
    settings.setBackendUrl(_urlController.text.trim());
    settings.setApiKey(_apiKeyController.text.trim());

    final api = ref.read(apiServiceProvider);
    api.configure(
      baseUrl: _urlController.text.trim(),
      apiKey: _apiKeyController.text.trim(),
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Settings saved.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsServiceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Connection section
          Text('Connection', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _urlController,
            decoration: const InputDecoration(
              labelText: 'Backend URL',
              hintText: 'https://your-server.example.com',
              prefixIcon: Icon(Icons.dns),
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _apiKeyController,
            decoration: const InputDecoration(
              labelText: 'API Key / Token',
              hintText: 'Optional — leave blank for public libraries',
              prefixIcon: Icon(Icons.key),
              border: OutlineInputBorder(),
            ),
            obscureText: true,
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _save,
            icon: const Icon(Icons.save),
            label: const Text('Save Connection'),
          ),

          const SizedBox(height: 32),

          // Playback section
          Text('Playback', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          SwitchListTile(
            title: const Text('Autoplay next episode'),
            value: settings.autoplay,
            onChanged: (v) => settings.setAutoplay(v),
          ),
          ListTile(
            title: const Text('Preferred quality'),
            subtitle: Text(settings.preferredQuality),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showQualityPicker(context, settings),
          ),

          const Divider(height: 32),

          // About
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('About'),
            subtitle: const Text('nTV v1.0.9'),
          ),
        ],
      ),
    );
  }

  void _showQualityPicker(BuildContext context, SettingsService settings) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Preferred Quality'),
        children: ['auto', '1080p', '720p', '480p'].map((q) {
          return SimpleDialogOption(
            onPressed: () {
              settings.setPreferredQuality(q);
              Navigator.pop(ctx);
            },
            child: Text(q, style: TextStyle(
              fontWeight: settings.preferredQuality == q ? FontWeight.bold : FontWeight.normal,
            )),
          );
        }).toList(),
      ),
    );
  }
}
