import React from 'react';
import { Card, CardContent, Box, Typography, Stack } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import response from './response.json';

interface RetentionRate {
  day: string;
  percentage: number;
}

interface UserEngagementData {
  metrics: {
    DAU_MAU_ratio: number;
    averageSessionDuration: string;
    retentionRates: RetentionRate[];
  };
}

export default function Widget() {
  const data = response.data as UserEngagementData;
  const { DAU_MAU_ratio, averageSessionDuration, retentionRates } = data.metrics;

  return (
    <Card sx={{ width: 'fit-content', minWidth: 350, maxWidth: 450, bgcolor: '#0D47A1' }} elevation={2}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ color: '#FF5722', mb: 0.5 }}>
              DAU/MAU Ratio
            </Typography>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              {(DAU_MAU_ratio * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#B0BEC5' }}>
              Avg. Session Duration: {averageSessionDuration}
            </Typography>
          </Box>

          <LineChart
            height={120}
            series={[
              {
                data: retentionRates.map(r => r.percentage),
                color: '#FF5722',
                curve: 'natural',
                showMark: false,
              },
            ]}
            xAxis={[
              {
                data: retentionRates.map(r => r.day),
                scaleType: 'band',
                tickLabelStyle: {
                  fontSize: 10,
                  fill: '#B0BEC5',
                },
              }
            ]}
            yAxis={null}
            margin={{ top: 10, bottom: 30, left: 10, right: 10 }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}