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
    return AspectRatio(
      aspectRatio: 1,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.3),
          borderRadius: BorderRadius.circular(16),
        ),
        child: GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
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
                      ? Colors.amber.withOpacity(0.3)
                      : Colors.grey.shade800,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isWinning ? Colors.amber : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: value != null
                      ? Text(
                          value,
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: value == 'X' ? Colors.blue : Colors.red,
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
