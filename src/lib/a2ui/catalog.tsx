'use client'

import React, { memo, useMemo } from 'react'
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box as MuiBox,
  Stack as MuiStack,
  Paper as MuiPaper,
  Divider as MuiDivider,
  Grid as MuiGrid,
  Typography as MuiTypography,
  Chip as MuiChip,
  LinearProgress as MuiLinearProgress,
  CircularProgress as MuiCircularProgress,
} from '@mui/material'
import {
  LineChart as MuiLineChart,
  BarChart as MuiBarChart,
  PieChart as MuiPieChart,
} from '@mui/x-charts'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import ArrowDownward from '@mui/icons-material/ArrowDownward'
import Info from '@mui/icons-material/Info'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Warning from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import Star from '@mui/icons-material/Star'
import FitnessCenter from '@mui/icons-material/FitnessCenter'
import WbSunny from '@mui/icons-material/WbSunny'
import Cloud from '@mui/icons-material/Cloud'
import Thermostat from '@mui/icons-material/Thermostat'
import AttachMoney from '@mui/icons-material/AttachMoney'
import ShowChart from '@mui/icons-material/ShowChart'
import AccessTime from '@mui/icons-material/AccessTime'
import LocationOn from '@mui/icons-material/LocationOn'
import Person from '@mui/icons-material/Person'
import Favorite from '@mui/icons-material/Favorite'
import Speed from '@mui/icons-material/Speed'
import {
  standardCatalog,
  ComponentRenderer,
  useDataBinding,
  useDataModelContext,
  type Catalog,
} from '@a2ui-sdk/react/0.8'

// A2UIComponentProps is not re-exported from the SDK public API
type A2UIComponentProps<T = unknown> = T & {
  surfaceId: string
  componentId: string
  weight?: number
}
import { getValueByPath } from '@a2ui-sdk/utils/0.8'
import type {
  TextComponentProps,
  CardComponentProps,
  RowComponentProps,
  ColumnComponentProps,
  DividerComponentProps,
  ListComponentProps,
  IconComponentProps,
} from '@a2ui-sdk/types/0.8/standard-catalog'
import type { ChildrenDefinition, ValueSource } from '@a2ui-sdk/types/0.8'

// ===================== Helpers =====================

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
  Info,
  CheckCircle,
  Warning,
  Error: ErrorIcon,
  Star,
  FitnessCenter,
  WbSunny,
  Cloud,
  Thermostat,
  AttachMoney,
  ShowChart,
  AccessTime,
  LocationOn,
  Person,
  Favorite,
  Speed,
}

function renderExplicitChildren(surfaceId: string, children?: ChildrenDefinition) {
  if (!children?.explicitList) return null
  return children.explicitList.map((childId) => (
    <ComponentRenderer key={childId} surfaceId={surfaceId} componentId={childId} />
  ))
}

// ===================== Standard Overrides =====================

// --- Text → MUI Typography ---
const USAGE_HINT_MAP: Record<string, string> = {
  h1: 'h3',
  h2: 'h4',
  h3: 'h5',
  h4: 'h6',
  h5: 'subtitle1',
  caption: 'caption',
  body: 'body1',
}

const MUIText = memo(function MUIText({
  surfaceId,
  text,
  usageHint = 'body',
  sx,
  prefix,
  suffix,
  fontWeight,
  color,
}: A2UIComponentProps<TextComponentProps & { sx?: any; prefix?: string; suffix?: string; fontWeight?: any; color?: string }>) {
  const resolved = useDataBinding<string>(surfaceId, text, '')
  const variant = USAGE_HINT_MAP[usageHint ?? 'body'] ?? 'body1'
  const display = `${prefix ?? ''}${resolved}${suffix ?? ''}`

  return (
    <MuiTypography variant={variant as any} sx={sx} fontWeight={fontWeight} color={color}>
      {display}
    </MuiTypography>
  )
})

// --- Card → MUI Card ---
const MUICard = memo(function MUICard({
  surfaceId,
  child,
  sx,
  elevation,
}: A2UIComponentProps<CardComponentProps & { sx?: any; elevation?: number }>) {
  return (
    <MuiCard sx={sx} elevation={elevation ?? 2}>
      {child && (
        <MuiCardContent>
          <ComponentRenderer surfaceId={surfaceId} componentId={child} />
        </MuiCardContent>
      )}
    </MuiCard>
  )
})

// --- Row → MUI Stack horizontal ---
const MUIRow = memo(function MUIRow({
  surfaceId,
  children,
  spacing,
  sx,
  alignItems,
  justifyContent,
}: A2UIComponentProps<RowComponentProps & { spacing?: number; sx?: any; alignItems?: string; justifyContent?: string }>) {
  return (
    <MuiStack
      direction="row"
      spacing={spacing ?? 1}
      sx={sx}
      alignItems={alignItems}
      justifyContent={justifyContent}
    >
      {renderExplicitChildren(surfaceId, children)}
    </MuiStack>
  )
})

// --- Column → MUI Stack vertical ---
const MUIColumn = memo(function MUIColumn({
  surfaceId,
  children,
  spacing,
  sx,
  alignItems,
  justifyContent,
}: A2UIComponentProps<ColumnComponentProps & { spacing?: number; sx?: any; alignItems?: string; justifyContent?: string }>) {
  return (
    <MuiStack
      direction="column"
      spacing={spacing ?? 1}
      sx={sx}
      alignItems={alignItems}
      justifyContent={justifyContent}
    >
      {renderExplicitChildren(surfaceId, children)}
    </MuiStack>
  )
})

// --- Divider → MUI Divider ---
const MUIDivider = memo(function MUIDivider({
  axis,
  sx,
}: A2UIComponentProps<DividerComponentProps & { sx?: any }>) {
  return (
    <MuiDivider
      orientation={axis === 'vertical' ? 'vertical' : 'horizontal'}
      sx={sx}
    />
  )
})

// --- Icon → MUI Icons ---
const MUIIcon = memo(function MUIIcon({
  surfaceId,
  name,
  sx,
}: A2UIComponentProps<IconComponentProps & { sx?: any }>) {
  const iconName = useDataBinding<string>(surfaceId, name, '')
  const IconComp = ICON_MAP[iconName]
  if (!IconComp) return null
  return <IconComp sx={sx} />
})

// --- List → MUI Stack for display lists ---
const MUIList = memo(function MUIList({
  surfaceId,
  children,
  direction = 'vertical',
  spacing,
  sx,
}: A2UIComponentProps<ListComponentProps & { spacing?: number; sx?: any }>) {
  return (
    <MuiStack
      direction={direction === 'horizontal' ? 'row' : 'column'}
      spacing={spacing ?? 1}
      sx={sx}
    >
      {renderExplicitChildren(surfaceId, children)}
    </MuiStack>
  )
})

// ===================== Custom Components =====================

// --- Box ---
interface BoxProps {
  child?: string
  children?: ChildrenDefinition
  sx?: any
}

const MUIBox = memo(function MUIBox({
  surfaceId,
  child,
  children,
  sx,
}: A2UIComponentProps<BoxProps>) {
  return (
    <MuiBox sx={sx}>
      {child && <ComponentRenderer surfaceId={surfaceId} componentId={child} />}
      {renderExplicitChildren(surfaceId, children)}
    </MuiBox>
  )
})

// --- Paper ---
interface PaperProps {
  child?: string
  children?: ChildrenDefinition
  sx?: any
  elevation?: number
}

const MUIPaper = memo(function MUIPaper({
  surfaceId,
  child,
  children,
  sx,
  elevation,
}: A2UIComponentProps<PaperProps>) {
  return (
    <MuiPaper sx={sx} elevation={elevation ?? 1}>
      {child && <ComponentRenderer surfaceId={surfaceId} componentId={child} />}
      {renderExplicitChildren(surfaceId, children)}
    </MuiPaper>
  )
})

// --- Grid container ---
interface GridContainerProps {
  children?: ChildrenDefinition
  spacing?: number
  sx?: any
}

const MUIGridContainer = memo(function MUIGridContainer({
  surfaceId,
  children,
  spacing,
  sx,
}: A2UIComponentProps<GridContainerProps>) {
  return (
    <MuiGrid container spacing={spacing ?? 1} sx={sx}>
      {renderExplicitChildren(surfaceId, children)}
    </MuiGrid>
  )
})

// --- Grid item ---
interface GridItemProps {
  child?: string
  children?: ChildrenDefinition
  xs?: number
  sm?: number
  md?: number
  sx?: any
}

const MUIGridItem = memo(function MUIGridItem({
  surfaceId,
  child,
  children,
  xs,
  sm,
  md,
  sx,
}: A2UIComponentProps<GridItemProps>) {
  return (
    <MuiGrid item xs={xs} sm={sm} md={md} sx={sx}>
      {child && <ComponentRenderer surfaceId={surfaceId} componentId={child} />}
      {renderExplicitChildren(surfaceId, children)}
    </MuiGrid>
  )
})

// --- Chip ---
interface ChipProps {
  label?: ValueSource
  sx?: any
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
}

const MUIChip = memo(function MUIChip({
  surfaceId,
  label,
  sx,
  size,
  variant,
  color,
}: A2UIComponentProps<ChipProps>) {
  const labelText = useDataBinding<string>(surfaceId, label, '')
  return <MuiChip label={labelText} sx={sx} size={size} variant={variant} color={color} />
})

// --- LinearProgress ---
interface LinearProgressProps {
  value?: number
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query'
  sx?: any
}

const MUILinearProgress = memo(function MUILinearProgress({
  value,
  variant,
  sx,
}: A2UIComponentProps<LinearProgressProps>) {
  return <MuiLinearProgress value={value} variant={variant ?? 'determinate'} sx={sx} />
})

// --- CircularProgress ---
interface CircularProgressProps {
  value?: number
  size?: number
  sx?: any
}

const MUICircularProgress = memo(function MUICircularProgress({
  value,
  size,
  sx,
}: A2UIComponentProps<CircularProgressProps>) {
  return <MuiCircularProgress value={value} size={size} variant="determinate" sx={sx} />
})

// ===================== Path Resolution for Charts =====================

/**
 * Recursively resolve { path: "..." } references in a value tree
 * using the A2UI data model. Used for chart series/axis data.
 */
function resolvePathRefs(value: any, dataModel: any): any {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => resolvePathRefs(v, dataModel))
  if ('path' in value && typeof value.path === 'string' && Object.keys(value).length === 1) {
    return getValueByPath(dataModel, value.path)
  }
  const result: any = {}
  for (const [k, v] of Object.entries(value)) {
    result[k] = resolvePathRefs(v, dataModel)
  }
  return result
}

// ===================== Chart Components =====================

interface LineChartProps {
  height?: number
  series?: any[]
  xAxis?: any[]
  yAxis?: any[]
  margin?: any
  sx?: any
  leftAxis?: any
  bottomAxis?: any
}

const MUILineChart = memo(function MUILineChart({
  surfaceId,
  height,
  series,
  xAxis,
  yAxis,
  margin,
  sx,
  leftAxis,
  bottomAxis,
}: A2UIComponentProps<LineChartProps>) {
  const { getDataModel } = useDataModelContext()
  const dataModel = getDataModel(surfaceId)
  const resolvedSeries = useMemo(() => resolvePathRefs(series, dataModel), [series, dataModel])
  const resolvedXAxis = useMemo(() => resolvePathRefs(xAxis, dataModel), [xAxis, dataModel])
  const resolvedYAxis = useMemo(() => resolvePathRefs(yAxis, dataModel), [yAxis, dataModel])

  // Auto-generate xAxis if missing and series data exists
  const effectiveXAxis = resolvedXAxis ?? (resolvedSeries?.[0]?.data
    ? [{ data: Array.from({ length: resolvedSeries[0].data.length }, (_, i) => i), hide: true }]
    : undefined)

  return (
    <MuiLineChart
      height={height ?? 120}
      series={resolvedSeries ?? []}
      xAxis={effectiveXAxis}
      yAxis={resolvedYAxis}
      margin={margin ?? { top: 10, bottom: 10, left: 10, right: 10 }}
      sx={sx}
      leftAxis={leftAxis}
      bottomAxis={bottomAxis}
    />
  )
})

interface BarChartProps {
  height?: number
  series?: any[]
  xAxis?: any[]
  yAxis?: any[]
  margin?: any
  sx?: any
}

const MUIBarChart = memo(function MUIBarChart({
  surfaceId,
  height,
  series,
  xAxis,
  yAxis,
  margin,
  sx,
}: A2UIComponentProps<BarChartProps>) {
  const { getDataModel } = useDataModelContext()
  const dataModel = getDataModel(surfaceId)
  const resolvedSeries = useMemo(() => resolvePathRefs(series, dataModel), [series, dataModel])
  const resolvedXAxis = useMemo(() => resolvePathRefs(xAxis, dataModel), [xAxis, dataModel])
  const resolvedYAxis = useMemo(() => resolvePathRefs(yAxis, dataModel), [yAxis, dataModel])

  return (
    <MuiBarChart
      height={height ?? 140}
      series={resolvedSeries ?? []}
      xAxis={resolvedXAxis}
      yAxis={resolvedYAxis}
      margin={margin ?? { top: 10, bottom: 30, left: 40, right: 10 }}
      sx={sx}
    />
  )
})

interface PieChartProps {
  height?: number
  series?: any[]
  margin?: any
  sx?: any
}

const MUIPieChart = memo(function MUIPieChart({
  surfaceId,
  height,
  series,
  margin,
  sx,
}: A2UIComponentProps<PieChartProps>) {
  const { getDataModel } = useDataModelContext()
  const dataModel = getDataModel(surfaceId)
  const resolvedSeries = useMemo(() => resolvePathRefs(series, dataModel), [series, dataModel])

  return (
    <MuiPieChart
      height={height ?? 200}
      series={resolvedSeries ?? []}
      margin={margin}
      sx={sx}
    />
  )
})

// ===================== Build Catalog =====================

export const muiCatalog: Catalog = {
  ...standardCatalog,
  components: {
    ...standardCatalog.components,
    // Override standard components with MUI versions
    Text: MUIText as any,
    Card: MUICard as any,
    Row: MUIRow as any,
    Column: MUIColumn as any,
    Divider: MUIDivider as any,
    Icon: MUIIcon as any,
    List: MUIList as any,
    // Custom MUI components
    Box: MUIBox as any,
    Paper: MUIPaper as any,
    GridContainer: MUIGridContainer as any,
    GridItem: MUIGridItem as any,
    Chip: MUIChip as any,
    LinearProgress: MUILinearProgress as any,
    CircularProgress: MUICircularProgress as any,
    // Charts
    LineChart: MUILineChart as any,
    BarChart: MUIBarChart as any,
    PieChart: MUIPieChart as any,
  },
}
