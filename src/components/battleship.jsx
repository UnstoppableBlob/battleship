import React, { useState, useEffect } from 'react';

const BOARD_SIZE = 10;
const SHIPS = {
  Carrier: { size: 5, color: 'bg-purple-500' },
  Battleship: { size: 4, color: 'bg-blue-500' },
  Cruiser: { size: 3, color: 'bg-green-500' },
  Submarine: { size: 3, color: 'bg-yellow-500' },
  Destroyer: { size: 2, color: 'bg-red-500' }
};

const BattleshipGame = () => {
  const [gamePhase, setGamePhase] = useState('placement');
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipOrientation, setShipOrientation] = useState('horizontal');
  const [playerBoard, setPlayerBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
  const [opponentBoard, setOpponentBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
  const [opponentShips, setOpponentShips] = useState([]);
  const [placedShips, setPlacedShips] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [message, setMessage] = useState('Place your ships!');

  useEffect(() => {
    if (gamePhase === 'placement') {
      const newOpponentBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
      const ships = [];
      
      Object.entries(SHIPS).forEach(([shipName, ship]) => {
        let placed = false;
        while (!placed) {
          const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          const row = Math.floor(Math.random() * BOARD_SIZE);
          const col = Math.floor(Math.random() * BOARD_SIZE);
          
          if (canPlaceShip(newOpponentBoard, row, col, ship.size, orientation)) {
            placeShip(newOpponentBoard, row, col, ship.size, orientation, shipName);
            ships.push({
              name: shipName,
              positions: getShipPositions(row, col, ship.size, orientation),
              hits: 0
            });
            placed = true;
          }
        }
      });
      
      setOpponentBoard(newOpponentBoard);
      setOpponentShips(ships);
    }
  }, [gamePhase]);

  const getShipPositions = (row, col, size, orientation) => {
    const positions = [];
    for (let i = 0; i < size; i++) {
      if (orientation === 'horizontal') {
        positions.push([row, col + i]);
      } else {
        positions.push([row + i, col]);
      }
    }
    return positions;
  };

  const canPlaceShip = (board, row, col, size, orientation) => {
    if (orientation === 'horizontal') {
      if (col + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row][col + i] !== null) return false;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            const newRow = row + r;
            const newCol = col + i + c;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
              if (board[newRow][newCol] !== null) return false;
            }
          }
        }
      }
    } else {
      if (row + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[row + i][col] !== null) return false;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            const newRow = row + i + r;
            const newCol = col + c;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
              if (board[newRow][newCol] !== null) return false;
            }
          }
        }
      }
    }
    return true;
  };

  const placeShip = (board, row, col, size, orientation, shipName) => {
    const positions = [];
    for (let i = 0; i < size; i++) {
      if (orientation === 'horizontal') {
        board[row][col + i] = shipName;
        positions.push([row, col + i]);
      } else {
        board[row + i][col] = shipName;
        positions.push([row + i, col]);
      }
    }
    return positions;
  };

  const handleCellClick = (row, col, isOpponentBoard) => {
    if (gameOver || (!playerTurn && !isOpponentBoard)) return;

    if (gamePhase === 'placement' && !isOpponentBoard) {
      if (!selectedShip) return;

      const ship = SHIPS[selectedShip];
      if (canPlaceShip(playerBoard, row, col, ship.size, shipOrientation)) {
        const newBoard = playerBoard.map(row => [...row]);
        const positions = placeShip(newBoard, row, col, ship.size, shipOrientation, selectedShip);
        setPlayerBoard(newBoard);
        setPlacedShips([...placedShips, { name: selectedShip, positions, hits: 0 }]);
        setSelectedShip(null);

        if (placedShips.length === 4) {
          setGamePhase('battle');
          setMessage("Game started! Take your shot!");
        }
      }
    } else if (gamePhase === 'battle' && isOpponentBoard && playerTurn) {
      if (opponentBoard[row][col]?.includes('hit') || opponentBoard[row][col]?.includes('miss')) return;

      const newBoard = opponentBoard.map(row => [...row]);
      const hasShip = newBoard[row][col] !== null;
      
      if (hasShip) {
        const shipName = newBoard[row][col];
        newBoard[row][col] = 'hit-' + shipName;
        setMessage("Hit!");
        
        const updatedShips = opponentShips.map(ship => {
          if (ship.name === shipName) {
            const newHits = ship.hits + 1;
            if (newHits === SHIPS[shipName].size) {
              setMessage(`You sunk their ${shipName}!`);
            }
            return { ...ship, hits: newHits };
          }
          return ship;
        });
        setOpponentShips(updatedShips);
        
        if (updatedShips.every(ship => ship.hits === SHIPS[ship.name].size)) {
          setGameOver(true);
          setWinner('player');
          setMessage("Congratulations! You've won!");
        }
      } else {
        newBoard[row][col] = 'miss';
        setMessage("Miss! Computer's turn.");
      }
      
      setOpponentBoard(newBoard);
      setPlayerTurn(false);
      
      setTimeout(computerTurn, 1000);
    }
  };

  const computerTurn = () => {
    if (gameOver) return;

    const getAdjacentTargets = (row, col) => {
      const adjacent = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
      ];
      return adjacent.filter(([r, c]) => 
        r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
        !playerBoard[r][c]?.includes('hit') && 
        !playerBoard[r][c]?.includes('miss')
      );
    };

    const findUnfinishedHits = () => {
      const hits = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (playerBoard[r][c]?.includes('hit')) {
            const shipName = playerBoard[r][c].split('-')[1];
            const ship = placedShips.find(s => s.name === shipName);
            if (ship && ship.hits < SHIPS[shipName].size) {
              hits.push([r, c]);
            }
          }
        }
      }
      return hits;
    };

    let row, col;
    const unfinishedHits = findUnfinishedHits();

    if (unfinishedHits.length > 0) {
      const possibleTargets = unfinishedHits.flatMap(([r, c]) => getAdjacentTargets(r, c));
      
      if (possibleTargets.length > 0) {
        [row, col] = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
      } else {
        do {
          row = Math.floor(Math.random() * BOARD_SIZE);
          col = Math.floor(Math.random() * BOARD_SIZE);
        } while (playerBoard[row][col]?.includes('hit') || playerBoard[row][col]?.includes('miss'));
      }
    } else {
      do {
        row = Math.floor(Math.random() * BOARD_SIZE);
        col = Math.floor(Math.random() * BOARD_SIZE);
      } while (playerBoard[row][col]?.includes('hit') || playerBoard[row][col]?.includes('miss'));
    }

    const newBoard = playerBoard.map(row => [...row]);
    const hasShip = newBoard[row][col] !== null;

    if (hasShip) {
      const shipName = newBoard[row][col];
      newBoard[row][col] = 'hit-' + shipName;
      setMessage("Computer hit your ship!");

      const updatedShips = placedShips.map(ship => {
        if (ship.name === shipName) {
          const newHits = ship.hits + 1;
          if (newHits === SHIPS[shipName].size) {
            setMessage(`Computer sunk your ${shipName}!`);
          }
          return { ...ship, hits: newHits };
        }
        return ship;
      });
      setPlacedShips(updatedShips);

      if (updatedShips.every(ship => ship.hits === SHIPS[ship.name].size)) {
        setGameOver(true);
        setWinner('computer');
        setMessage("Game Over! Computer wins!");
      }
    } else {
      newBoard[row][col] = 'miss';
      setMessage("Computer missed! Your turn!");
    }

    setPlayerBoard(newBoard);
    setPlayerTurn(true);
  };

  const getCellContent = (cell, isOpponentBoard) => {
    if (cell?.includes('hit')) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
        </div>
      );
    }
    if (cell === 'miss') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
        </div>
      );
    }
    if (!isOpponentBoard && cell && !cell.includes('hit')) {
      return (
        <div className={`w-full h-full ${SHIPS[cell].color} rounded-sm`} />
      );
    }
    return null;
  };

  const resetGame = () => {
    setGamePhase('placement');
    setSelectedShip(null);
    setShipOrientation('horizontal');
    setPlayerBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
    setOpponentBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)));
    setOpponentShips([]);
    setPlacedShips([]);
    setGameOver(false);
    setWinner(null);
    setPlayerTurn(true);
    setMessage('Place your ships!');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">Battleship</h1>
      
      <div className="text-xl font-semibold mb-4 h-8">{message}</div>

      <div className="flex flex-col lg:flex-row gap-16 items-start">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Your Board</h2>
          <div className="bg-white p-4 rounded-lg shadow-lg">
            {playerBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 border border-gray-200 relative cursor-pointer
                      ${gamePhase === 'placement' && selectedShip && canPlaceShip(playerBoard, rowIndex, colIndex, SHIPS[selectedShip].size, shipOrientation) ? 'hover:bg-gray-200' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex, false)}
                  >
                    {getCellContent(cell, false)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Opponent's Board</h2>
          <div className="bg-white p-4 rounded-lg shadow-lg">
            {opponentBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 border border-gray-200 relative cursor-pointer
                      ${gamePhase === 'battle' && playerTurn && !cell?.includes('hit') && cell !== 'miss' ? 'hover:bg-gray-200' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex, true)}
                  >
                    {getCellContent(cell, true)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {gamePhase === 'placement' && (
            <>
              <h2 className="text-2xl font-semibold mb-2">Place Your Ships</h2>
              <div className="flex flex-col gap-2">
                {Object.entries(SHIPS).map(([shipName, ship]) => {
                  const isPlaced = placedShips.some(p => p.name === shipName);
                  return (
                    <button
                      key={shipName}
                      className={`px-4 py-2 rounded ${
                        isPlaced
                          ? 'bg-gray-300 cursor-not-allowed'
                          : selectedShip === shipName
                          ? ship.color.replace('bg-', 'bg-') + ' text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      onClick={() => !isPlaced && setSelectedShip(shipName)}
                      disabled={isPlaced}
                    >
                      {shipName} ({ship.size})
                    </button>
                  );
                })}
              </div>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShipOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
              >
                Rotate Ship ({shipOrientation})
              </button>
            </>
          )}
          
          {gameOver && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={resetGame}
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleshipGame;
