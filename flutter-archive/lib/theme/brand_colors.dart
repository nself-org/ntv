/// nSelf shared brand color tokens.
///
/// All nSelf apps use sky-500 (#0ea5e9) as the primary brand color,
/// consistent with the nSelf Design System (UD #7 default — P96 2026-04-24).
///
/// Usage:
/// ```dart
/// colorSchemeSeed: NselfBrandColors.primary,
/// ```
library;

import 'package:flutter/material.dart';

/// Shared brand color constants for all nSelf apps.
///
/// Primary: sky-500 (#0EA5E9) — nSelf brand blue.
/// Background: gray-950 (#030712) — canonical dark background.
class NselfBrandColors {
  NselfBrandColors._();

  /// Primary brand color — sky-500. Use for interactive accents,
  /// FAB, primary buttons, focus rings, and selection highlights.
  static const Color primary = Color(0xFF0EA5E9);

  /// Lighter primary — sky-400. Hover / focus states.
  static const Color primaryHover = Color(0xFF38BDF8);

  /// Primary container — sky-900. Subdued primary background.
  static const Color primaryContainer = Color(0xFF0C4A6E);

  /// Dark background — gray-950.
  static const Color background = Color(0xFF030712);

  /// Elevated surface — gray-900.
  static const Color surface = Color(0xFF111827);

  /// Higher elevation surface — gray-800.
  static const Color surfaceHigh = Color(0xFF1F2937);

  /// Divider color — gray-700.
  static const Color divider = Color(0xFF374151);
}
