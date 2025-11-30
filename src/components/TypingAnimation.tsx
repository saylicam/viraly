import React, { useState, useEffect, useRef } from 'react';
import { Text, TextProps, StyleSheet, Animated } from 'react-native';

interface TypingAnimationProps extends TextProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export default function TypingAnimation({
  text,
  speed = 50,
  delay = 0,
  onComplete,
  style,
  ...props
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const cursorAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        timeout = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    };

    const initialTimeout = setTimeout(() => {
      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(initialTimeout);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [text, speed, delay, onComplete]);

  // Animation du curseur
  useEffect(() => {
    if (!isComplete) {
      const cursorAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      cursorAnimation.start();
      return () => cursorAnimation.stop();
    }
  }, [isComplete]);

  const cursorOpacity = cursorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  return (
    <Text style={[styles.text, style]} {...props}>
      {displayedText}
      {!isComplete && (
        <Animated.Text style={{ opacity: cursorOpacity }}>
          ▋
        </Animated.Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {},
});
