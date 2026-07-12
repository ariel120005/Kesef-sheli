import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const DOT_COUNT = 45;

function generateDots() {
  return Array.from({ length: DOT_COUNT }, () => ({
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: 0.8 + Math.random() * 1.8,
    opacity: 0.12 + Math.random() * 0.28,
  }));
}

// A subtle scattered white-dot texture layered behind every screen's content, in both themes —
// purely decorative (never intercepts touches) and stable for the app session, since the dots
// are only generated once per mount rather than on every re-render.
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
            fill="#FFFFFF"
            fillOpacity={dot.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}
