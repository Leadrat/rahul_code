import 'package:flutter/material.dart';

class GameBoard extends StatelessWidget {
  final List<String?> squares;
  final List<int>? winningLine;
  final Function(int) onSquareClick;
  final bool isLocked;

  const GameBoard({
    super.key,
    required this.squares,
    this.winningLine,
    required this.onSquareClick,
    required this.isLocked,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return AspectRatio(
      aspectRatio: 1,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: 9,
          itemBuilder: (context, index) {
            final isWinning = winningLine?.contains(index) ?? false;
            final value = squares[index];
            final isEmpty = value == null;
            
            return GestureDetector(
              onTap: isEmpty && !isLocked ? () => onSquareClick(index) : null,
              child: Container(
                decoration: BoxDecoration(
                  color: isWinning 
                    ? Colors.green.withOpacity(isDark ? 0.3 : 0.2)
                    : isDark 
                      ? Colors.grey.shade800 
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isWinning 
                      ? Colors.green 
                      : isDark 
                        ? Colors.grey.shade700 
                        : Colors.grey.shade300,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Center(
                  child: value != null
                    ? Text(
                        value,
                        style: TextStyle(
                          fontSize: 56,
                          fontWeight: FontWeight.bold,
                          color: value == 'X' 
                            ? Colors.blue.shade600 
                            : Colors.red.shade600,
                          shadows: [
                            Shadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      )
                    : null,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
