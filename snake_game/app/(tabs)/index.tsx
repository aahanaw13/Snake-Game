import React,{useState,useEffect,useCallback,useRef} from 'react';
import {
View, Text, StyleSheet, Dimensions, TouchableOpacity, PanResponder, Platform,
GestureResponderEvent, PanResponderGestureState, ViewStyle, StyleProp
} from 'react-native';

//types
interface Position{x:number; y:number;}
interface Direction{
  x:-1|0|1;
  y:-1|0|1;
}
interface DirectionsMap{
  UP: Direction;
  DOWN: Direction;
  LEFT: Direction;
  RIGHT: Direction;
}
interface GameState{
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score:number;
  highScore:number;
  gameOver:boolean;
  isPaused:boolean;
  isStarted:boolean;
}
interface ControlButtonProps{
  direction: keyof DirectionsMap;

  label: string;
  style?: ViewStyle;
}
//gameconfiguration
const GRID_SIZE:number=20;
const CELL_SIZE:number=Math.floor(Math.min(Dimensions.get("window").width,
Dimensions.get("window").height-200)/GRID_SIZE);
const GAME_SPEED:number=150;
//direction
const DIRECTIONS: DirectionsMap={
  UP:{x:0, y:-1},
  DOWN:{x:0, y:1},
  LEFT:{x:-1, y:0},
  RIGHT:{x:1, y:0}
};
//generate random food position
const getRandomFood= (snake: Position[]): Position=>{
  let food: Position;
  do{
    food={
      x:Math.floor(Math.random()*GRID_SIZE),
      y:Math.floor(Math.random()*GRID_SIZE),
    };
  } while(snake.some((segment)=>segment.x ===food.x &&segment.y===food.y));

  return food;
}
//initialgamestate
const getInitialState=():GameState=>{
  const initialSnake: Position[]=[
    {x:Math.floor(GRID_SIZE/2), y:Math.floor(GRID_SIZE)}, 
     {x:Math.floor(GRID_SIZE/2)-1, y:Math.floor(GRID_SIZE)}, 
      {x:Math.floor(GRID_SIZE/2)-2, y:Math.floor(GRID_SIZE)}, 
  ];
  return{
    snake:initialSnake,
    food:getRandomFood(initialSnake),
    direction:DIRECTIONS.RIGHT,
    nextDirection:DIRECTIONS.RIGHT,
    score:0,
    highScore:0,
    gameOver:false,
    isPaused:false, isStarted:false,
  };
}
const SnakeGame: React.FC=()=>{
  const[GameState, setGameState]=useState<GameState>(getInitialState);
  const gameLoopRef=useRef<NodeJS.Timeout|null>(null);
  const lastSwipeRef=useRef<Position>({x:0, y:0});
  //Move snake 
  const moveSnake=useCallback(():void=>{
    setGameState((prevState:GameState):GameState=>{
      if(prevState.gameOver || prevState.isPaused || !prevState.isStarted){
        return prevState;
      }
      const {snake, food, nextDirection, score, highScore}=prevState;
      const head: Position= snake[0];
      const newHead: Position={
        x:head.x+nextDirection.x, 
        y:head.y+nextDirection.y,
      };
      //check wall collisions
      if(
        newHead.x<0 ||
        newHead.x>=GRID_SIZE ||
        newHead.y<0 ||
        newHead.y>=GRID_SIZE 
      ){
        return {...prevState, gameOver: true, highScore: Math.max(score, highScore)};
      }
      //check self collision 
      if (snake.some(
        (segment)=>segment.x === newHead.x && segment.y === newHead.y
      )){
        return {...prevState, gameOver: true, highScore: Math.max(score,highScore)};
      }
      const newSnake: Position[]=[newHead, ...snake];
      let newFood: Position=food;
      let newScore: number=score;
      //check food collision
      if (newHead.x ===food.x &&newHead.y ===food.y){
        newScore =10;
        newFood=getRandomFood(newSnake);
      } else{newSnake.pop()}

      return {
          ...prevState,
          snake: newSnake,
          food: newFood,
          direction: nextDirection,
          score: newScore
        }
    })
  },[]);
  // Change direction
  const changeDirection = useCallback((newDirection: Direction): void => {
    setGameState((prevState: GameState): GameState => {
      const { direction } = prevState;

      // Prevent 180-degree turns
      if (
        (direction === DIRECTIONS.UP && newDirection === DIRECTIONS.DOWN) ||
        (direction === DIRECTIONS.DOWN && newDirection === DIRECTIONS.UP) ||
        (direction === DIRECTIONS.LEFT && newDirection === DIRECTIONS.RIGHT) ||
        (direction === DIRECTIONS.RIGHT && newDirection === DIRECTIONS.LEFT)
      ) {
        return prevState;
      }

      return { ...prevState, nextDirection: newDirection };
    });
  }, []);

  // Start game
  const startGame = useCallback((): void => {
    setGameState((prev: GameState): GameState => ({
      ...getInitialState(),
      highScore: prev.highScore,
      isStarted: true,
    }));
  }, []);

  // Toggle pause
  const togglePause = useCallback((): void => {
    setGameState((prev: GameState): GameState => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (): boolean => true,
      onMoveShouldSetPanResponder: (): boolean => true,
      onPanResponderGrant: (evt: GestureResponderEvent): void => {
        lastSwipeRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        };
      },
      onPanResponderRelease: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ): void => {
        const { dx, dy } = gestureState;
        const absDx: number = Math.abs(dx);
        const absDy: number = Math.abs(dy);
        const minSwipeDistance: number = 30;

        if (Math.max(absDx, absDy) < minSwipeDistance) {
          return;
        }

        if (absDx > absDy) {
          // Horizontal swipe
          if (dx > 0) {
            changeDirection(DIRECTIONS.RIGHT);
          } else {
            changeDirection(DIRECTIONS.LEFT);
          }
        } else {
          // Vertical swipe
          if (dy > 0) {
            changeDirection(DIRECTIONS.DOWN);
          } else {
            changeDirection(DIRECTIONS.UP);
          }
        }
      },
    })
  ).current;

  // Keyboard controls (for web/desktop)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (event: KeyboardEvent): void => {
        switch (event.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            event.preventDefault();
            changeDirection(DIRECTIONS.UP);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            event.preventDefault();
            changeDirection(DIRECTIONS.DOWN);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            event.preventDefault();
            changeDirection(DIRECTIONS.LEFT);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            event.preventDefault();
            changeDirection(DIRECTIONS.RIGHT);
            break;
          case ' ':
            event.preventDefault();
            togglePause();
            break;
          case 'Enter':
            event.preventDefault();
            if (gameState.gameOver || !gameState.isStarted) {
              startGame();
            }
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [changeDirection, togglePause, startGame, gameState.gameOver, gameState.isStarted]);

  // Game loop
  useEffect(() => {
    if (gameState.isStarted && !gameState.gameOver && !gameState.isPaused) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isStarted, gameState.gameOver, gameState.isPaused, moveSnake]);

  // Render game board
  const renderBoard = (): React.ReactNode[] => {
    const { snake, food } = gameState;
    const cells: React.ReactNode[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead: boolean = snake[0].x === x && snake[0].y === y;
        const isSnakeBody: boolean = snake.slice(1).some((seg) => seg.x === x && seg.y === y);
        const isFood: boolean = food.x === x && food.y === y;

        const cellStyle: ViewStyle[] = [styles.cell];
        if (isSnakeHead) {
          cellStyle.push(styles.snakeHead);
        } else if (isSnakeBody) {
          cellStyle.push(styles.snakeBody);
        } else if (isFood) {
          cellStyle.push(styles.food);
        }

        cells.push(<View key={`${x}-${y}`} style={cellStyle} />);
      }
    }

    return cells;
  };

  // Render control button
  const ControlButton: React.FC<ControlButtonProps> = ({ direction, label, style }) => (
    <TouchableOpacity
      style={[styles.controlButton, style]}
      onPress={() => changeDirection(DIRECTIONS[direction])}
      activeOpacity={0.7}
    >
      <Text style={styles.controlButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🐍 Snake Game</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>Score: {gameState.score}</Text>
          <Text style={styles.highScore}>High Score: {gameState.highScore}</Text>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardWrapper} {...panResponder.panHandlers}>
        <View style={styles.board}>{renderBoard()}</View>

        {/* Overlay for game states */}
        {(!gameState.isStarted || gameState.gameOver || gameState.isPaused) && (
          <View style={styles.overlay}>
            {gameState.gameOver ? (
              <View style={styles.overlayContent}>
                <Text style={styles.overlayTitle}>Game Over!</Text>
                <Text style={styles.overlayScore}>Score: {gameState.score}</Text>
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                  <Text style={styles.startButtonText}>Play Again</Text>
                </TouchableOpacity>
              </View>
            ) : gameState.isPaused ? (
              <View style={styles.overlayContent}>
                <Text style={styles.overlayTitle}>Paused</Text>
                <TouchableOpacity style={styles.startButton} onPress={togglePause}>
                  <Text style={styles.startButtonText}>Resume</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.overlayContent}>
                <Text style={styles.overlayTitle}>🐍 Snake</Text>
                <Text style={styles.instructions}>
                  {Platform.OS === 'web'
                    ? 'Use Arrow Keys or WASD to move\nPress Space to pause'
                    : 'Swipe to move\nUse buttons below for precise control'}
                </Text>
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                  <Text style={styles.startButtonText}>Start Game</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* D-Pad Controls for mobile */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <ControlButton direction="UP" label="▲" />
        </View>
        <View style={styles.controlRow}>
          <ControlButton direction="LEFT" label="◀" />
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={gameState.isStarted && !gameState.gameOver ? togglePause : startGame}
          >
            <Text style={styles.controlButtonText}>
              {!gameState.isStarted || gameState.gameOver ? '▶' : gameState.isPaused ? '▶' : '⏸'}
            </Text>
          </TouchableOpacity>
          <ControlButton direction="RIGHT" label="▶" />
        </View>
        <View style={styles.controlRow}>
          <ControlButton direction="DOWN" label="▼" />
        </View>
      </View>

      {/* Instructions */}
      <Text style={styles.footerText}>
        {Platform.OS === 'web'
          ? '⌨️ Keyboard: Arrow Keys / WASD | Space: Pause'
          : '👆 Swipe on board or use D-Pad'}
      </Text>
    </View>
  );
}

// Styles with type safety
interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  scoreContainer: ViewStyle;
  score: TextStyle;
  highScore: TextStyle;
  boardWrapper: ViewStyle;
  board: ViewStyle;
  cell: ViewStyle;
  snakeHead: ViewStyle;
  snakeBody: ViewStyle;
  food: ViewStyle;
  overlay: ViewStyle;
  overlayContent: ViewStyle;
  overlayTitle: TextStyle;
  overlayScore: TextStyle;
  instructions: TextStyle;
  startButton: ViewStyle;
  startButtonText: TextStyle;
  controls: ViewStyle;
  controlRow: ViewStyle;
  controlButton: ViewStyle;
  pauseButton: ViewStyle;
  controlButtonText: TextStyle;
  footerText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 10,
    textShadowColor: '#00ff88',
    textShadowRadius: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  score: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  highScore: {
    fontSize: 18,
    color: '#ffd700',
    fontWeight: '600',
  },
  boardWrapper: {
    position: 'relative',
    borderWidth: 3,
    borderColor: '#00ff88',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  board: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    backgroundColor: '#0f0f23',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#1a1a3e',
  },
  snakeHead: {
    backgroundColor: '#00ff88',
    borderRadius: 4,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  snakeBody: {
    backgroundColor: '#00cc6a',
    borderRadius: 3,
  },
  food: {
    backgroundColor: '#ff4757',
    borderRadius: CELL_SIZE / 2,
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    padding: 20,
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 15,
  },
  overlayScore: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#aaaaaa',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  controls: {
    marginTop: 20,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 2,
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  pauseButton: {
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
  },
  controlButtonText: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 15,
    fontSize: 12,
    color: '#666666',
  },
});

export default SnakeGame;