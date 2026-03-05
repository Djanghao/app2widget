import React from 'react';
import { Card, CardContent, Box, Typography, Stack, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import response from './response.json';

interface PollenLevel {
  level: number;
  severity: string;
}

interface HourlyPollenData {
  hour: string;
  tree: number;
  grass: number;
  weed: number;
}

interface PollenData {
  location: string;
  currentPollenLevel: {
    tree: PollenLevel;
    grass: PollenLevel;
    weed: PollenLevel;
  };
  hourlyPollenTrend: HourlyPollenData[];
}

export default function Widget() {
  const pollenData = response.data as PollenData;
  const { currentPollenLevel, hourlyPollenTrend } = pollenData;

  return (
    <Card sx={{ width: 'fit-content', minWidth: 350, maxWidth: 450, bgcolor: '#FFFFFF' }} elevation={2}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {pollenData.location}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {Object.entries(currentPollenLevel).map(([type, data]) => (
                <Chip
                  key={type}
                  label={`${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.severity}`}
                  sx={{ fontSize: '11px', px: 1, py: 0.5 }}
                  color={
                    data.severity === 'High'
                      ? 'error'
                      : data.severity === 'Moderate'
                      ? 'warning'
                      : 'success'
                  }
                />
              ))}
            </Stack>
          </Box>

          <BarChart
            height={140}
            series={[
              {
                data: hourlyPollenTrend.map(d => d.tree),
                color: '#FF5722',
                label: 'Tree',
              },
              {
                data: hourlyPollenTrend.map(d => d.grass),
                color: '#4CAF50',
                label: 'Grass',
              },
              {
                data: hourlyPollenTrend.map(d => d.weed),
                color: '#2196F3',
                label: 'Weed',
              },
            ]}
            xAxis={[
              {
                data: hourlyPollenTrend.map(d => d.hour),
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