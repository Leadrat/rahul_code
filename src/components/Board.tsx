import React from 'react';
import Square from './Square';
import styles from './Board.module.css';
import type { SquareValue } from './types';

type BoardProps = {
    squares: SquareValue[];
    onSquareClick: (index: number) => void;
    isLocked: boolean;
    highlightLine?: number[] | null;
};

export default function Board({ squares, onSquareClick, isLocked, highlightLine }: BoardProps) {
    return (
        <div className={styles.board}>
            {squares.map((value, idx) => (
                <Square
                    key={idx}
                    value={value}
                    onClick={() => onSquareClick(idx)}
                    disabled={isLocked || value !== null}
                    highlight={highlightLine?.includes(idx)}
                />
            ))}
        </div>
    );
}



