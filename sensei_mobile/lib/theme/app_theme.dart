import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData lightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.creamBg,
      colorScheme: ColorScheme.light(
        primary: AppColors.popViolet,
        secondary: AppColors.popYellow,
        surface: Colors.white,
        error: AppColors.popCoral,
        onPrimary: Colors.white,
        onSecondary: AppColors.brutalBlack,
        onSurface: AppColors.brutalBlack,
      ),
      textTheme: _buildTextTheme(),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.creamBg,
        foregroundColor: AppColors.brutalBlack,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: GoogleFonts.fredoka(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: AppColors.brutalBlack,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.popYellow,
          foregroundColor: AppColors.brutalBlack,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppColors.brutalBlack, width: 3),
          ),
          textStyle: GoogleFonts.fredoka(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            letterSpacing: 1.5,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.creamCard,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.brutalBlack.withValues(alpha: 0.2), width: 2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.popViolet, width: 2.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        labelStyle: GoogleFonts.fredoka(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
          color: Colors.black54,
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.black38,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.popCoral,
        unselectedItemColor: Color(0xFF999999),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.popYellow,
        foregroundColor: AppColors.brutalBlack,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.brutalBlack,
        thickness: 2,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.creamCard,
        labelStyle: GoogleFonts.fredoka(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.brutalBlack,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: const BorderSide(color: AppColors.brutalBlack, width: 2),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.creamCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.brutalBlack, width: 3),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.brutalBlack,
        contentTextStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  static ThemeData darkTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.darkBg,
      colorScheme: ColorScheme.dark(
        primary: AppColors.popViolet,
        secondary: AppColors.popYellow,
        surface: AppColors.darkCard,
        error: AppColors.popCoral,
        onPrimary: Colors.white,
        onSecondary: AppColors.brutalBlack,
        onSurface: Colors.white,
      ),
      textTheme: _buildDarkTextTheme(),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkCard,
        foregroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: GoogleFonts.fredoka(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Colors.white, width: 3),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.popYellow,
          foregroundColor: AppColors.brutalBlack,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Colors.white, width: 3),
          ),
          textStyle: GoogleFonts.fredoka(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            letterSpacing: 1.5,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkBg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.white, width: 3),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.popYellow.withValues(alpha: 0.15), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.popYellow, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkCard,
        selectedItemColor: AppColors.popYellow,
        unselectedItemColor: Colors.white.withValues(alpha: 0.5),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  static TextTheme _buildTextTheme() {
    const color = AppColors.brutalBlack;
    return TextTheme(
      displayLarge: GoogleFonts.fredoka(fontSize: 48, fontWeight: FontWeight.bold, color: color),
      displayMedium: GoogleFonts.fredoka(fontSize: 36, fontWeight: FontWeight.bold, color: color),
      displaySmall: GoogleFonts.fredoka(fontSize: 28, fontWeight: FontWeight.bold, color: color),
      headlineLarge: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: color),
      headlineMedium: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: color),
      headlineSmall: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: color),
      titleLarge: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.w600, color: color),
      titleMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: color),
      titleSmall: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color),
      bodyLarge: GoogleFonts.inter(fontSize: 16, color: color),
      bodyMedium: GoogleFonts.inter(fontSize: 14, color: color),
      bodySmall: GoogleFonts.inter(fontSize: 12, color: color),
      labelLarge: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: color),
      labelMedium: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: color),
      labelSmall: GoogleFonts.fredoka(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: color),
    );
  }

  static TextTheme _buildDarkTextTheme() {
    const color = Colors.white;
    return TextTheme(
      displayLarge: GoogleFonts.fredoka(fontSize: 48, fontWeight: FontWeight.bold, color: color),
      displayMedium: GoogleFonts.fredoka(fontSize: 36, fontWeight: FontWeight.bold, color: color),
      displaySmall: GoogleFonts.fredoka(fontSize: 28, fontWeight: FontWeight.bold, color: color),
      headlineLarge: GoogleFonts.fredoka(fontSize: 24, fontWeight: FontWeight.bold, color: color),
      headlineMedium: GoogleFonts.fredoka(fontSize: 20, fontWeight: FontWeight.bold, color: color),
      headlineSmall: GoogleFonts.fredoka(fontSize: 18, fontWeight: FontWeight.bold, color: color),
      titleLarge: GoogleFonts.fredoka(fontSize: 16, fontWeight: FontWeight.w600, color: color),
      titleMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: color),
      titleSmall: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color),
      bodyLarge: GoogleFonts.inter(fontSize: 16, color: color),
      bodyMedium: GoogleFonts.inter(fontSize: 14, color: color),
      bodySmall: GoogleFonts.inter(fontSize: 12, color: color),
      labelLarge: GoogleFonts.fredoka(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: color),
      labelMedium: GoogleFonts.fredoka(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: color),
      labelSmall: GoogleFonts.fredoka(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: color),
    );
  }
}
