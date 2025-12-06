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