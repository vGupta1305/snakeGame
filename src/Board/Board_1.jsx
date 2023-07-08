import React, { useEffect, useState } from 'react';
import {
    randomIntFromInterval,
    reverseLinkedList,
    useInterval,
} from '../lib/utils.js';

import './Board.css';

/**
 * TODO: add a more elegant UX for before a game starts and after a game ends.
 * A game probably shouldn't start until the user presses an arrow key, and
 * once a game is over, the board state should likely freeze until the user
 * intentionally restarts the game.
 */

class LinkedListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class LinkedList {
    constructor(value) {
        const node = new LinkedListNode(value);
        this.head = node;
        this.tail = node;
    }
}

const Direction = {
    UP: 'UP',
    RIGHT: 'RIGHT',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
};

const BOARD_SIZE = 15;
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.3;

const getStartingSnakeLLValue = board => {
    const rowSize = board.length;
    const colSize = board[0].length;
    const startingRow = Math.round(rowSize / 3);
    const startingCol = Math.round(colSize / 3);
    const startingCell = board[startingRow][startingCol];
    return {
        row: startingRow,
        col: startingCol,
        cell: startingCell,
    };
};


const Board_1 = () => {
    const [score, setScore] = useState(0)
    const [board, setBoard] = useState(createBoard(BOARD_SIZE))
    const [snake, setSnake] = useState(new LinkedList(
        getStartingSnakeLLValue(board)
    ))
    const [foodCell, setFoodCell] = useState(snake.head.value.cell + 5)
    const [snakeCells, setSnakeCells] = useState(new Set([snake.head.value.cell]))
    const [direction, setDirection] = useState(Direction.RIGHT)
    const [foodShouldReverseDirection, setFoodShouldReverseDirection] = useState(false)

    useEffect(() => {
        window.addEventListener('keydown', e => {
            handleKeyDown(e)
        })
    }, [])

    useInterval(() => {
        moveSnake()
    }, 150)

    const handleKeyDown = e => {
        const newDirection = getDirectionFromKey(e.key)
        const isValidDirection = newDirection !== '';
        if (isValidDirection) setDirection(newDirection)
    }

    const moveSnake = () => {
        const currentHeadCoords = {
            row: snake.head.value.row,
            col: snake.head.value.col,
        }

        const nextHeadCoords = getCoordsInDirection(currentHeadCoords, direction)
        if (isOutOfBounds(nextHeadCoords, board)) {
            handleGameOver()
            return;
        }

        const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col]
        if (snakeCells.has(nextHeadCell)) {
            handleGameOver()
            return
        }

        const newHead = new LinkedListNode({
            row: nextHeadCoords.row,
            col: nextHeadCoords.col,
            cell: nextHeadCell
        })

        const currentHead = snake.head;
        snake.head = newHead
        currentHead.next = newHead

        const newSnakeCells = new Set(snakeCells)
        newSnakeCells.delete(snake.tail.value.cell)
        newSnakeCells.add(nextHeadCell)

        snake.tail = snake.tail.next
        if (snake.tail === null) snake.tail = snake.head

        const foodConsumed = nextHeadCell === foodCell
        if (foodConsumed) {
            growSnake(newSnakeCells)
            if(foodShouldReverseDirection)reverseSnake()
            handleFoodConsumption(newSnakeCells)
        }

        setSnakeCells(newSnakeCells)
    }

    const growSnake= newSnakeCells=>{
        const growthNodeCoords = getGrowthNodeCoords(snake.tail, direction)
        if(isOutOfBounds(growthNodeCoords,board)){
            return
        }

        const newTailCell = board[growthNodeCoords.row][growthNodeCoords.col]
        const newTail = new LinkedListNode ({
            row: growthNodeCoords.row,
            col: growthNodeCoords.col,
            cell: newTailCell
        })

        const currentTail = snake.tail;
        snake.tail = newTail;
        snake.tail.next = currentTail

        newSnakeCells.add(newTailCell)

    }

    const reverseSnake= ()=>{
        const tailNextNodeDirection = getNextNodeDirection(snake.tail, direction)
        const newDirection = getOppositeDirection(tailNextNodeDirection)
        setDirection(newDirection)

        reverseLinkedList(snake.tail)
        const snakeHead = snake.head
        snake.head = snake.tail
        snake.tail= snakeHead
    }

    const handleFoodConsumption = newSnakeCells=>{
        const maxPossibleCellValue = BOARD_SIZE * BOARD_SIZE
        let nextFoodCell

        while(true){
            nextFoodCell = randomIntFromInterval(1, maxPossibleCellValue)
            if(newSnakeCells.has(nextFoodCell)|| foodCell=== nextFoodCell){
                continue
            }
            break
        }

        const nextFoodShouldReverseDirection = 
            Math.random()< PROBABILITY_OF_DIRECTION_REVERSAL_FOOD

        setFoodCell(nextFoodCell)
        setFoodShouldReverseDirection(nextFoodShouldReverseDirection)
        setScore(score+1)
    }

    const handleGameOver = () => {
        let a = 1
        setDirection(null)

        window.addEventListener('keydown', e => {
            const newDirection = getDirectionFromKey(e.key)
            const isValidDirection = newDirection !== '';
            if (isValidDirection && a === 1) {
                setScore(0)
                let startingSnakeLLValue = getStartingSnakeLLValue(board)
                setSnake(new LinkedList(startingSnakeLLValue))
                setFoodCell(startingSnakeLLValue.cell + 5);
                setSnakeCells(new Set([startingSnakeLLValue.cell]));
                setDirection(Direction.RIGHT);
                a = 0;
            }
        })
    }

    return (
        <>
            <div className="container">
                <h1>Score:{score}</h1>
                <div className="board">
                    {board.map((row, rowIdx) => (
                        <div key={rowIdx} className="row">
                            {row.map((cellValue, cellIdx) => {
                                const className = getCellClassName(
                                    cellValue,
                                    foodCell,
                                    foodShouldReverseDirection,
                                    snakeCells,
                                    snake
                                )
                                return <div key={cellIdx} className={className}>
                                    {/* {cellValue} */}
                                </div>
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}


const createBoard = BOARD_SIZE => {
    let counter = 1
    const board = []
    for (let row = 0; row < BOARD_SIZE; row++) {
        const currentRow = []
        for (let col = 0; col < BOARD_SIZE; col++) {
            currentRow.push(counter++)
        }
        board.push(currentRow)
    }
    return board
}

const getCoordsInDirection = (coords, direction) => {
    if (direction === Direction.UP) {
        return {
            row: coords.row - 1,
            col: coords.col,
        };
    }
    if (direction === Direction.RIGHT) {
        return {
            row: coords.row,
            col: coords.col + 1,
        };
    }
    if (direction === Direction.DOWN) {
        return {
            row: coords.row + 1,
            col: coords.col,
        };
    }
    if (direction === Direction.LEFT) {
        return {
            row: coords.row,
            col: coords.col - 1,
        };
    }
};

const isOutOfBounds = (coords, board) => {
    const { row, col } = coords;
    if (row < 0 || col < 0) return true;
    if (row >= board.length || col >= board[0].length) return true;
    return false;
}

const getDirectionFromKey = key => {
    if (key === 'ArrowUp') return Direction.UP;
    if (key === 'ArrowRight') return Direction.RIGHT;
    if (key === 'ArrowDown') return Direction.DOWN;
    if (key === 'ArrowLeft') return Direction.LEFT;
    return '';
}

const getNextNodeDirection = (node, currentDirection) => {
    if (node.next === null) return currentDirection;
    const { row: currentRow, col: currentCol } = node.value;
    const { row: nextRow, col: nextCol } = node.next.value;
    if (nextRow === currentRow && nextCol === currentCol + 1) {
        return Direction.RIGHT;
    }
    if (nextRow === currentRow && nextCol === currentCol - 1) {
        return Direction.LEFT;
    }
    if (nextCol === currentCol && nextRow === currentRow + 1) {
        return Direction.DOWN;
    }
    if (nextCol === currentCol && nextRow === currentRow - 1) {
        return Direction.UP;
    }
    return '';
};

const getGrowthNodeCoords = (snakeTail, currentDirection) => {
    const tailNextNodeDirection = getNextNodeDirection(
        snakeTail,
        currentDirection,
    );
    const growthDirection = getOppositeDirection(tailNextNodeDirection);
    const currentTailCoords = {
        row: snakeTail.value.row,
        col: snakeTail.value.col,
    };
    const growthNodeCoords = getCoordsInDirection(
        currentTailCoords,
        growthDirection,
    );
    return growthNodeCoords;
};


const getOppositeDirection = direction => {
    if (direction === Direction.UP) return Direction.DOWN;
    if (direction === Direction.RIGHT) return Direction.LEFT;
    if (direction === Direction.DOWN) return Direction.UP;
    if (direction === Direction.LEFT) return Direction.RIGHT;
};


const getCellClassName = (
    cellValue,
    foodCell,
    foodShouldReverseDirection,
    snakeCells,
    snake
) => {
    let className = 'cell';
    if (cellValue === foodCell) {
        if (foodShouldReverseDirection) {
            className = 'cell cell-purple'
        }
        else {
            className = 'cell cell-red'
        }
    }
    if (snakeCells.has(cellValue)) className = 'cell cell-green'

    if(snake.head.value.cell===cellValue) className = ' cell cell-black'

    return className
}

export default Board_1