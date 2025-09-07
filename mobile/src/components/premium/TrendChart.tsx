import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('screen');

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showAnimation?: boolean;
  trendColor?: string;
  backgroundColor?: string;
  onPointPress?: (point: TrendDataPoint, index: number) => void;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  showStats?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  subtitle,
  height = 250,
  showGrid = true,
  showLabels = true,
  showAnimation = true,
  trendColor,
  backgroundColor,
  onPointPress,
  timeRange = '30d',
  showStats = true,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedPoint, setSelectedPoint] = useState<TrendDataPoint | null>(null);
  const [animationValue] = useState(new Animated.Value(0));

  const chartColor = trendColor || colors.primary;
  const chartBackground = backgroundColor || colors.card;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value).filter(v => v != null && !isNaN(v));
    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (data.length >= 2) {
      const first = data[0].value;
      const last = data[data.length - 1].value;
      if (first !== 0) {
        const change = ((last - first) / first) * 100;
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
      } else {
        trend = last > 0 ? 'up' : last < 0 ? 'down' : 'stable';
      }
    }

    // Calculate change percentage
    const changePercent = data.length >= 2 && data[0].value !== 0
      ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100
      : 0;

    return { min, max, avg, trend, changePercent };
  }, [data]);

  // Animation effect
  useEffect(() => {
    if (showAnimation && data.length > 0) {
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [data, showAnimation, animationValue]);

  // Get Y-axis scale
  const getYScale = () => {
    if (!data || data.length === 0) return { min: 0, max: 100, range: 100 };

    const values = data.map(d => d.value).filter(v => v != null && !isNaN(v));
    if (values.length === 0) return { min: 0, max: 100, range: 100 };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1; // 10% padding
    const range = max - min + (padding * 2);

    return {
      min: Math.max(0, min - padding),
      max: max + padding,
      range: range === 0 ? 1 : range // Prevent division by zero
    };
  };

  const yScale = getYScale();

  // Convert data point to screen coordinates
  const getPointPosition = (point: TrendDataPoint, index: number) => {
    const denominator = data.length - 1;
    const x = denominator === 0 ? 0 : (index / denominator) * (screenWidth - 80); // Account for padding
    const value = point.value ?? 0;
    const y = height - 60 - ((value - yScale.min) / (yScale.range || 1)) * (height - 80);
    return { x, y };
  };

  // Render grid lines
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    for (let i = 0; i <= 5; i++) {
      const y = 20 + (i * (height - 80) / 5);
      gridLines.push(
        <View
          key={`grid-${i}`}
          style={[styles.gridLine, { top: y, backgroundColor: colors.lightGray }]}
        />
      );
    }

    return <View style={styles.gridContainer}>{gridLines}</View>;
  };

  // Render trend line
  const renderTrendLine = () => {
    if (!data || data.length < 2) return null;

    const pathData = data.map((point, index) => {
      if (point == null || point.value == null) return '';
      const pos = getPointPosition(point, index);
      return `${index === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
    }).join(' ');

    return (
      <Animated.View
        style={[
          styles.trendLineContainer,
          {
            opacity: animationValue,
            transform: [{
              scaleY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              })
            }]
          }
        ]}
      >
        <svg width={screenWidth - 40} height={height - 40} style={styles.trendLineSvg}>
          <defs>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path
            d={`${pathData} L ${(data.length - 1) / (data.length - 1) * (screenWidth - 80)} ${height - 60} L 0 ${height - 60} Z`}
            fill="url(#trendGradient)"
          />
          {/* Line */}
          <path
            d={pathData}
            stroke={chartColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Animated.View>
    );
  };

  // Render data points
  const renderDataPoints = () => {
    if (!data) return null;

    return data.map((point, index) => {
      if (point == null || point.value == null) return null;
      const pos = getPointPosition(point, index);
      const isSelected = selectedPoint === point;

      return (
        <TouchableOpacity
          key={`point-${index}`}
          style={[
            styles.dataPoint,
            {
              left: pos.x - 6,
              top: pos.y - 6,
              backgroundColor: isSelected ? '#FF6B6B' : chartColor,
              borderColor: colors.background,
            }
          ]}
          onPress={() => {
            setSelectedPoint(point);
            onPointPress?.(point, index);
          }}
        >
          <View
            style={[
              styles.dataPointInner,
              { backgroundColor: isSelected ? '#FF6B6B' : chartColor }
            ]}
          />
        </TouchableOpacity>
      );
    });
  };

  // Render labels
  const renderLabels = () => {
    if (!showLabels || !data || data.length === 0) return null;

    return (
      <View style={styles.labelsContainer}>
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const value = yScale.min + (yScale.range * i / 5);
          const y = 20 + (i * (height - 80) / 5);
          return (
            <Text
              key={`y-label-${i}`}
              style={[
                styles.axisLabel,
                {
                  left: 0,
                  top: y - 8,
                  color: colors.gray,
                  fontSize: 10
                }
              ]}
            >
              {value.toFixed(0)}
            </Text>
          );
        })}

        {/* X-axis labels */}
        {data.map((point, index) => {
          if (point == null || point.date == null) return null;
          if (index % Math.ceil(data.length / 5) !== 0 && index !== data.length - 1) return null;
          const pos = getPointPosition(point, index);
          return (
            <Text
              key={`x-label-${index}`}
              style={[
                styles.axisLabel,
                {
                  left: pos.x - 20,
                  top: height - 30,
                  color: colors.gray,
                  fontSize: 10
                }
              ]}
            >
              {point.label || new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          );
        })}
      </View>
    );
  };

  // Render statistics
  const renderStats = () => {
    if (!showStats || !stats) return null;

    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'up': return 'trending-up-outline';
        case 'down': return 'trending-down-outline';
        default: return 'trending-stable-outline';
      }
    };

    const getTrendColor = (trend: string) => {
      switch (trend) {
        case 'up': return '#10B981';
        case 'down': return '#EF4444';
        default: return colors.gray;
      }
    };

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.gray }]}>Average</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.avg.toFixed(1)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.gray }]}>Range</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.min.toFixed(0)} - {stats.max.toFixed(0)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.gray }]}>Trend</Text>
          <View style={styles.trendContainer}>
            <Ionicons
              name={getTrendIcon(stats.trend) as any}
              size={16}
              color={getTrendColor(stats.trend)}
            />
            <Text style={[styles.trendText, { color: getTrendColor(stats.trend) }]}>
              {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render tooltip for selected point
  const renderTooltip = () => {
    if (!selectedPoint) return null;

    return (
      <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.tooltipTitle, { color: colors.text }]}>
          {selectedPoint.label || new Date(selectedPoint.date).toLocaleDateString()}
        </Text>
        <Text style={[styles.tooltipValue, { color: chartColor }]}>
          {selectedPoint.value.toFixed(1)}
        </Text>
        <TouchableOpacity
          style={styles.tooltipClose}
          onPress={() => setSelectedPoint(null)}
        >
          <Ionicons name="close-outline" size={16} color={colors.gray} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: chartBackground }]}>
      {/* Header */}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.gray }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Chart Container */}
      <View style={[styles.chartContainer, { height }]}>
        {renderGrid()}
        {renderTrendLine()}
        {renderDataPoints()}
        {renderLabels()}
        {renderTooltip()}
      </View>

      {/* Statistics */}
      {renderStats()}

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['7d', '30d', '90d', '1y'].map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && [styles.timeRangeButtonActive, { backgroundColor: chartColor }]
            ]}
            onPress={() => {
              // This would typically trigger a callback to parent component
              console.log('Time range changed to:', range);
            }}
          >
            <Text style={[
              styles.timeRangeButtonText,
              timeRange === range && { color: 'white' }
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  chartContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 40,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  trendLineContainer: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 0,
    bottom: 40,
  },
  trendLineSvg: {
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  tooltip: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
  },
  tooltipTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  tooltipClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
});

export default TrendChart;