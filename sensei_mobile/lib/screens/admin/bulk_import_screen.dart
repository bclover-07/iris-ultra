import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../theme/admin_theme.dart';
import '../../theme/admin_glass_widgets.dart';
import '../../services/api_service.dart';

class BulkImportScreen extends ConsumerStatefulWidget {
  const BulkImportScreen({super.key});

  @override
  ConsumerState<BulkImportScreen> createState() => _BulkImportScreenState();
}

class _BulkImportScreenState extends ConsumerState<BulkImportScreen> {
  String? _selectedFilePath;
  String? _selectedFileName;
  int? _selectedFileSize;
  bool _uploading = false;
  bool _done = false;
  String _statusMessage = '';

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _selectedFilePath = result.files.single.path;
          _selectedFileName = result.files.single.name;
          _selectedFileSize = result.files.single.size;
          _done = false;
          _statusMessage = '';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error selecting file: $e', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).danger,
          ),
        );
      }
    }
  }

  Future<void> _handleUpload() async {
    if (_selectedFilePath == null) return;
    setState(() {
      _uploading = true;
      _statusMessage = 'Uploading and parsing CSV...';
    });

    try {
      final api = ApiService();
      final formData = FormData.fromMap({
        'csv': await MultipartFile.fromFile(
          _selectedFilePath!,
          filename: _selectedFileName,
        ),
      });

      final responseData = await api.authenticatedUpload(
        '/api/admin/bulk/import',
        formData,
      );

      if (mounted) {
        final count = responseData?['count'] ?? responseData?['importedCount'] ?? 0;
        setState(() {
          _uploading = false;
          _done = true;
          _selectedFilePath = null;
          _selectedFileName = null;
          _selectedFileSize = null;
          _statusMessage = count > 0 
              ? 'Successfully imported $count users.'
              : 'Import completed successfully.';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Import completed!', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _uploading = false;
          _statusMessage = 'Import failed. Please verify CSV structure and roles.';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to import file. Please check file format.', style: GoogleFonts.inter()),
            backgroundColor: AdminTheme.of(context).danger,
          ),
        );
      }
    }
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    final t = AdminTheme.of(context);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Back Button
          const Align(
            alignment: Alignment.centerLeft,
            child: AdminBackButton(),
          ),
          const SizedBox(height: 16),

          // Title
          AdminSectionTitle(
            title: 'Bulk Import',
            subtitle: 'Register multiple students/faculty via CSV',
            icon: Icons.upload_file_rounded,
            iconColor: t.admAccent,
          ),
          const SizedBox(height: 24),

          // CSV formatting guidelines card
          AdminGlassContainer(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CSV Format Requirements',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: t.admText,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your CSV file must include the following headers in the first row. Column order does not matter.',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: t.admTextSub,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['name', 'email', 'password', 'role', 'department'].map((col) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: t.admAccentLight,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: t.admAccent.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        col.toUpperCase(),
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: t.admAccent,
                          letterSpacing: 0.5,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // File selection zone
          GestureDetector(
            onTap: (_uploading || _done) ? null : _pickFile,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
              decoration: BoxDecoration(
                color: t.admSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: _done
                      ? t.success
                      : _selectedFilePath != null
                          ? t.admAccent
                          : t.admBorderSolid,
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: t.admShadow.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: _done
                  ? Column(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: t.success.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                            border: Border.all(color: t.success.withValues(alpha: 0.3)),
                          ),
                          child: Icon(Icons.check_circle_rounded, size: 40, color: t.success),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Import Completed!',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: t.admText,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _statusMessage,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            color: t.admTextSub,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 20),
                        TextButton.icon(
                          onPressed: () => setState(() => _done = false),
                          icon: Icon(Icons.refresh_rounded, color: t.admAccent, size: 18),
                          label: Text(
                            'Import another file',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              color: t.admAccent,
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: _selectedFilePath != null
                                ? t.admAccent.withValues(alpha: 0.15)
                                : t.admInputBg,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _selectedFilePath != null
                                  ? t.admAccent.withValues(alpha: 0.3)
                                  : t.admBorderSolid,
                            ),
                          ),
                          child: Icon(
                            _selectedFilePath != null
                                ? Icons.file_present_rounded
                                : Icons.upload_file_rounded,
                            size: 36,
                            color: _selectedFilePath != null ? t.admAccent : t.admTextMuted,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _selectedFileName ?? 'Tap to select CSV file',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: t.admText,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _selectedFileSize != null
                              ? _formatBytes(_selectedFileSize!)
                              : 'Format required: .csv only',
                          style: GoogleFonts.inter(color: t.admTextMuted, fontSize: 12),
                        ),
                        if (_selectedFilePath != null) ...[
                          const SizedBox(height: 24),
                          if (_uploading) ...[
                            CircularProgressIndicator(color: t.admAccent),
                            const SizedBox(height: 12),
                            Text(
                              _statusMessage,
                              style: GoogleFonts.inter(color: t.admTextSub, fontSize: 13),
                            ),
                          ] else ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () {
                                    setState(() {
                                      _selectedFilePath = null;
                                      _selectedFileName = null;
                                      _selectedFileSize = null;
                                    });
                                  },
                                  icon: Icon(Icons.close_rounded, size: 16, color: t.danger),
                                  label: Text('Clear', style: GoogleFonts.inter(color: t.danger)),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(color: t.danger.withValues(alpha: 0.5)),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                AdminButton(
                                  onTap: _handleUpload,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.cloud_upload_rounded, color: Colors.white, size: 18),
                                      const SizedBox(width: 8),
                                      Text('START IMPORT', style: GoogleFonts.spaceGrotesk()),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
