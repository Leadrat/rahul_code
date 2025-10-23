import React from 'react';
import styles from './Square.module.css';
import type { SquareValue } from './types';

type SquareProps = {
    value: SquareValue;
    onClick: () => void;
    disabled?: boolean;
    highlight?: boolean;
};

export default function Square({ value, onClick, disabled, highlight }: SquareProps) {
    const getSquareClass = () => {
        const baseClass = styles.square;
        const highlightClass = highlight ? styles.highlight : '';
        const valueClass = value === 'X' ? styles.x : value === 'O' ? styles.o : '';
        return [baseClass, highlightClass, valueClass].filter(Boolean).join(' ');
    };

    return (
        <button
            type="button"
            className={getSquareClass()}
            onClick={onClick}
            disabled={disabled}
            aria-label={value ?? 'empty'}
        >
            {value}
        </button>
    );
}



