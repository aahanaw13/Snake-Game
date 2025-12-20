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