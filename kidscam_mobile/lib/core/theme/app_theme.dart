import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: AppColors.azul,
        secondary: AppColors.violeta,
        background: AppColors.backgroundLight,
        surface: AppColors.paperLight,
      ),
      scaffoldBackgroundColor: AppColors.backgroundLight,
      fontFamily: 'Inter', // Si agregamos la fuente luego
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.paperLight,
        selectedItemColor: AppColors.azul,
        unselectedItemColor: Colors.grey,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.dark(
        primary: AppColors.naranja,
        secondary: AppColors.violeta,
        background: AppColors.backgroundDark,
        surface: AppColors.paperDark,
      ),
      scaffoldBackgroundColor: AppColors.backgroundDark,
      fontFamily: 'Inter',
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.paperDark,
        selectedItemColor: AppColors.naranja,
        unselectedItemColor: Colors.grey,
      ),
    );
  }
}
