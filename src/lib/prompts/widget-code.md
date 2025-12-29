# Widget Code Generation Prompt

You are a senior front-end engineer generating mobile-style React Widget components.

## Data Source

The file \`response.json\` contains the following data:

{
  "data": {{MOCK_DATA_SCHEMA}}
}

You MUST:
- Import data from \`./response.json\`
- Strictly follow the data structure above
- NOT invent, rename, or infer fields

## Widget Definition

✅ A widget IS:
- Small and compact (adapts to content, typically 300-500px wide)
- iOS/Android mobile widget style
- Focused on ONE use case or metric
- Optimized for quick glance consumption
- **Content-adaptive sizing**: Use `width: 'fit-content'` with appropriate min/max bounds

❌ A widget is NOT:
- A dashboard
- A multi-section layout
- A long list (max 3-5 items)
- Multiple charts

## Technical Constraints

**Language & Framework:**
- TypeScript (TSX)
- React function component
- Component name MUST be \`Widget\`
- Single file output

**Allowed Libraries:**
- React
- @mui/material
- @mui/icons-material
- @mui/x-charts

**Allowed MUI Components:**
- Layout: Box, Stack, Grid
- Container: Card, CardContent, Paper, Divider
- Typography: Typography, Chip
- Status: CircularProgress, Skeleton
- Interaction: IconButton, Tooltip
- Icons: TrendingUp, TrendingDown, ArrowUpward, ArrowDownward, Info
- Charts: LineChart, BarChart, PieChart, ResponsiveChartContainer, LinePlot, BarPlot, ChartsXAxis, ChartsYAxis, ChartsClipPath

**Chart Best Practices:**
- PREFER using ResponsiveChartContainer with composition API for better control over layout and preventing label clipping
- For simple charts with hidden axes (sparklines), LineChart/BarChart/PieChart are acceptable
- When using ResponsiveChartContainer:
  * Wrap it in a Box with explicit height: `<Box sx={{ width: '100%', height: 200 }}>`
  * Use ChartsClipPath to prevent overflow: `<ChartsClipPath id={clipPathId} />`
  * Wrap plots in clipPath group: `<g clipPath={\`url(#\${clipPathId})\`}>`
  * Generate unique clipPathId with useId() hook
- For standalone chart components (LineChart/BarChart):
  * Provide adequate margin for axis labels: { top: 10, bottom: 30, left: 40, right: 10 }
  * Minimum bottom margin of 30px and left margin of 40px when showing axes
- Ensure tickLabelStyle has appropriate fontSize (10-12) and fill color
- For charts showing trends with values, ALWAYS show axis labels

**Layout Best Practices:**
- Widgets are for display only - NO scrolling allowed
- **Widget sizing**: Use content-adaptive width with min/max bounds
  * Card should use: `width: 'fit-content', minWidth: [estimated], maxWidth: [estimated]`
  * Estimate minWidth/maxWidth based on content:
    - Short text content: minWidth: 280, maxWidth: 380
    - Medium content with tags/chips: minWidth: 320, maxWidth: 450
    - Wide content (long labels, charts): minWidth: 350, maxWidth: 500
    - Dense data tables: minWidth: 400, maxWidth: 600
  * This ensures content fits perfectly without clipping or overflow
- For lists of tags/chips/items, choose layout based on data characteristics:
  * **Few items (2-5 short texts)**: Use Stack direction="row" WITHOUT flexWrap
    - Example: `<Stack direction="row" spacing={0.5}>{items.map(...)}</Stack>`
    - DO NOT add flexWrap="wrap" - items should stay in one line
    - Adjust fontSize/padding if needed to fit (fontSize: 10-12px)
  * **Many items (6+)**: Use Grid for multi-row layout (2x2, 2x3, 3x3, etc.)
    - Example: `<Grid container spacing={1}><Grid item xs={6}>{item}</Grid></Grid>`
    - This creates intentional 2-column or 3-column grid layout
- The choice should be made at code generation time based on the actual data
- All content MUST fit within widget boundaries without scrolling or unexpected wrapping

**Forbidden:**
- Tailwind CSS
- Recharts/ECharts/D3
- CSS files or <style> tags
- External libraries or CDN
- Dynamic imports
- Non-whitelisted components

## UI Style

{{UI_STYLE_PROMPT}}

Implement using MUI:
- Spacing & layout (sx={{ p: 2, mb: 1 }})
- Typography hierarchy (variant="h6", variant="body2")
- Colors (color="primary", sx={{ color: '#1976D2' }})
- Elevation (elevation={2})

## Output Rules

- Output ONLY valid TSX code
- NO explanations or comments
- NO markdown fence wrapping
- MUST start with import statements
- MUST be directly runnable in Sandpack

## Complete Code Examples

### Example 1: Weather Widget (with line chart)

import React from 'react';
import { Card, CardContent, Box, Typography, Stack } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import data from './response.json';

interface HourlyForecast {
  hour: string;
  temp: number;
}

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  hourlyForecast: HourlyForecast[];
  tempTrend: number[];
}

export default function Widget() {
  const weatherData = data.data as WeatherData;

  return (
    <Card sx={{ width: 'fit-content', minWidth: 320, maxWidth: 400, bgcolor: '#F5F7FA' }} elevation={2}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {weatherData.location}
            </Typography>
            <Typography variant="h3" fontWeight={300} sx={{ my: 0.5 }}>
              {weatherData.current.temp}°
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {weatherData.current.condition}
            </Typography>
          </Box>

          <LineChart
            height={120}
            series={[
              {
                data: weatherData.tempTrend,
                color: '#2196F3',
                curve: 'natural',
                showMark: false,
              },
            ]}
            xAxis={[{ data: [0, 1, 2, 3, 4, 5, 6], hide: true }]}
            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
            }}
          />

          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Humidity
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {weatherData.current.humidity}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Wind
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {weatherData.current.windSpeed} mph
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

### Example 2: Stocks Widget (with sparkline)

import React from 'react';
import { Card, CardContent, Box, Typography, Stack } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { LineChart } from '@mui/x-charts';
import data from './response.json';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

interface StocksData {
  portfolio: {
    totalValue: number;
    todayChange: number;
    todayChangePercent: number;
  };
  topStocks: Stock[];
}

export default function Widget() {
  const stocksData = data.data as StocksData;
  const { portfolio, topStocks } = stocksData;
  const isPositive = portfolio.todayChange >= 0;

  return (
    <Card sx={{ width: 'fit-content', minWidth: 340, maxWidth: 420, bgcolor: '#1E293B' }} elevation={3}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 0.5 }}>
              Portfolio Value
            </Typography>
            <Typography variant="h4" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
              ${portfolio.totalValue.toLocaleString()}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
              {isPositive ? <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} /> : <TrendingDown sx={{ fontSize: 16, color: '#EF4444' }} />}
              <Typography variant="body2" sx={{ color: isPositive ? '#10B981' : '#EF4444' }}>
                ${Math.abs(portfolio.todayChange).toFixed(2)} ({portfolio.todayChangePercent.toFixed(2)}%)
              </Typography>
            </Stack>
          </Box>

          <Stack spacing={1.5}>
            {topStocks.map((stock) => {
              const positive = stock.change >= 0;
              return (
                <Box key={stock.symbol}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                        {stock.symbol}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {stock.name}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 500 }}>
                        ${stock.price}
                      </Typography>
                      <Typography variant="caption" sx={{ color: positive ? '#10B981' : '#EF4444' }}>
                        {positive ? '+' : ''}{stock.change} ({stock.changePercent}%)
                      </Typography>
                    </Box>
                  </Stack>
                  <LineChart
                    height={40}
                    series={[
                      {
                        data: stock.sparkline,
                        color: positive ? '#10B981' : '#EF4444',
                        curve: 'natural',
                        showMark: false,
                      },
                    ]}
                    xAxis={[{ data: stock.sparkline.map((_, i) => i), hide: true }]}
                    margin={{ top: 5, bottom: 5, left: 0, right: 0 }}
                    sx={{
                      '& .MuiLineElement-root': {
                        strokeWidth: 1.5,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

### Example 3: Fitness Widget (with bar chart)

import React from 'react';
import { Card, CardContent, Box, Typography, Stack, LinearProgress } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import data from './response.json';

interface DailySteps {
  day: string;
  steps: number;
}

interface FitnessData {
  weeklyGoal: {
    target: number;
    current: number;
    percentage: number;
  };
  dailySteps: DailySteps[];
}

export default function Widget() {
  const fitnessData = data.data as FitnessData;
  const { weeklyGoal, dailySteps } = fitnessData;

  return (
    <Card sx={{ width: 'fit-content', minWidth: 330, maxWidth: 420, bgcolor: '#FFFFFF' }} elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: '#8B5CF6' }}>
              Weekly Steps
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#1F2937' }}>
              {weeklyGoal.current.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              of {weeklyGoal.target.toLocaleString()} goal
            </Typography>
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: '#8B5CF6' }}>
                {weeklyGoal.percentage}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={weeklyGoal.percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#F3E8FF',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#8B5CF6',
                  borderRadius: 4,
                }
              }}
            />
          </Box>

          <BarChart
            height={140}
            series={[
              {
                data: dailySteps.map(d => d.steps),
                color: '#8B5CF6',
              },
            ]}
            xAxis={[
              {
                data: dailySteps.map(d => d.day),
                scaleType: 'band',
                tickLabelStyle: {
                  fontSize: 11,
                  fill: '#6B7280',
                },
              }
            ]}
            margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
            sx={{
              '& .MuiBarElement-root': {
                rx: 4,
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

### Example 4: Sales Chart Widget (using ResponsiveChartContainer for better label handling)

import React, { useId } from 'react';
import { Card, CardContent, Box, Typography, Stack } from '@mui/material';
import { ResponsiveChartContainer, LinePlot, BarPlot, ChartsXAxis, ChartsYAxis, ChartsClipPath } from '@mui/x-charts';
import data from './response.json';

interface MonthlySales {
  month: string;
  revenue: number;
  target: number;
}

interface SalesData {
  totalRevenue: number;
  growth: number;
  monthlySales: MonthlySales[];
}

export default function Widget() {
  const salesData = data.data as SalesData;
  const clipPathId = useId();

  return (
    <Card sx={{ width: 'fit-content', minWidth: 350, maxWidth: 500, bgcolor: '#FFFFFF' }} elevation={2}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#10B981' }}>
              ${salesData.totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#10B981' }}>
              +{salesData.growth}% vs last month
            </Typography>
          </Box>

          <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveChartContainer
              series={[
                {
                  type: 'bar',
                  data: salesData.monthlySales.map(m => m.revenue),
                  color: '#E0E7FF',
                  label: 'Revenue',
                },
                {
                  type: 'line',
                  data: salesData.monthlySales.map(m => m.target),
                  color: '#6366F1',
                  label: 'Target',
                  curve: 'linear',
                },
              ]}
              xAxis={[
                {
                  scaleType: 'band',
                  data: salesData.monthlySales.map(m => m.month),
                  id: 'months',
                },
              ]}
              yAxis={[{ id: 'revenue' }]}
            >
              <g clipPath={`url(#${clipPathId})`}>
                <BarPlot />
                <LinePlot />
              </g>
              <ChartsXAxis
                axisId="months"
                tickLabelStyle={{ fontSize: 10, fill: '#6B7280' }}
              />
              <ChartsYAxis
                axisId="revenue"
                tickLabelStyle={{ fontSize: 10, fill: '#6B7280' }}
              />
              <ChartsClipPath id={clipPathId} />
            </ResponsiveChartContainer>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

### Example 5: Tag/Chip Layout Examples

#### 5a. Few Items - Single Row (CORRECT)
```tsx
// For 3-5 short text items - NO flexWrap
<Stack direction="row" spacing={0.5}>
  {['BURGUNDY', 'OREGON', 'NEW ZEALAND'].map((region, index) => (
    <Chip
      key={index}
      label={region}
      sx={{ fontSize: '11px', px: 1, py: 0.5 }}
    />
  ))}
</Stack>
```

#### 5b. Many Items - Grid Layout (CORRECT)
```tsx
// For 6+ items - Use Grid for 2x3 or 3x3 layout
<Grid container spacing={1}>
  {manyCategories.map((category, index) => (
    <Grid item xs={6} key={index}>
      <Chip
        label={category}
        sx={{ width: '100%', fontSize: '10px' }}
      />
    </Grid>
  ))}
</Grid>
```

#### 5c. INCORRECT - Don't Do This
```tsx
// ❌ WRONG: Using flexWrap for few items causes unwanted wrapping
<Stack direction="row" spacing={0.5} flexWrap="wrap">
  {['BURGUNDY', 'OREGON', 'NEW ZEALAND'].map(...)}
</Stack>
```

## Your Task

Based on the mock data from \`response.json\` and the selected UI style, generate a Widget component that meets all requirements above.
