export type Player = 'X' | 'O';

export type SquareValue = Player | null;

export type GameStatus =
    | { type: 'next'; player: Player }
    | { type: 'winner'; player: Player; line: number[] }
    | { type: 'draw' };

export const winningLines: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

export function calculateWinner(squares: SquareValue[]): { player: Player; line: number[] } | null {
    for (const line of winningLines) {
        const [a, b, c] = line;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { player: squares[a] as Player, line };
        }
    }
    return null;
}



