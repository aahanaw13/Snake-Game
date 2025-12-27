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
    })
  })
}