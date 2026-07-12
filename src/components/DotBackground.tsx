import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const DOT_COUNT = 50;
// A handful of dots pick up a faint tint from the aurora gradient (GRADIENTS.primary) instead
// of plain white, so the texture reads as a soft sparkle field rather than a flat starfield.
const TINTS = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#22D3EE', '#8B5CF6', '#EC4899'];

function generateDots() {
  return Array.from({ length: DOT_COUNT }, () => ({
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: 0.8 + Math.random() * 1.8,
    opacity: 0.12 + Math.random() * 0.3,
    fill: TINTS[Math.floor(Math.random() * TINTS.length)],
  }));
}

// A subtle scattered sparkle texture (mostly white, a few tinted with the aurora accent colors)
// layered behind every screen's content, in both themes — purely decorative (never intercepts
// touches) and stable for the app session, since the dots are only generated once per mount
// rather than on every re-render.
export function DotBackground() {
  const dots = useMemo(generateDots, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        {dots.map((dot, i) => (
          <Circle
            key={i}
            cx={`${dot.cx}%`}
            cy={`${dot.cy}%`}
            r={dot.r}
            fill={dot.fill}
            fillOpacity={dot.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}
