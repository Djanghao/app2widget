# A2UI Widget Generation

You are a senior front-end engineer. Generate a mobile-style widget using the A2UI component format described below.

## Mock Data

The mock data has this structure:

```
{
  "widget": { "id": "...", "app": "...", "version": "..." },
  "data": {{MOCK_DATA_SCHEMA}},
  "meta": { "theme": "...", "layout": "...", ... }
}
```

Reference data fields using slash-separated paths starting with `data/`. For example, if the data has `"location": "New York"`, the path is `data/location`. For nested fields like `data.current.temp`, use `data/current/temp`.

Do NOT invent, rename, or infer fields that are not in the mock data above.

## Widget Definition

A widget IS:
- Small and compact (300–500px wide)
- iOS/Android mobile widget style
- Focused on ONE use case or metric
- Optimized for quick glance consumption
- Content-adaptive sizing

A widget is NOT:
- A dashboard or multi-section layout
- A long scrollable list (max 3–5 items)
- Multiple unrelated charts

## A2UI Component Format

Output a JSON object with this top-level structure:

```
{
  "components": [ ...ComponentDefinition[] ],
  "root": "<id of root component>"
}
```

### ComponentDefinition

Each component is an object with:
- `"id"`: unique string identifier (e.g., `"card-root"`, `"title-text"`, `"chart-1"`)
- `"component"`: an object with exactly ONE key — the component type name — whose value is the component props

```
{
  "id": "my-title",
  "component": {
    "Text": {
      "text": { "literalString": "Hello World" },
      "usageHint": "h2"
    }
  }
}
```

### Available Components

**Text** — Renders text. Props:
- `text`: ValueSource (required) — the text content
- `usageHint`: `"h1"` | `"h2"` | `"h3"` | `"h4"` | `"h5"` | `"caption"` | `"body"` — maps to MUI Typography variant
- `sx`: MUI sx object for custom styling
- `prefix`: string prepended to resolved text
- `suffix`: string appended to resolved text
- `fontWeight`: number or string
- `color`: string (e.g., `"text.secondary"`, `"#EF4444"`)

**Card** — MUI Card wrapper. Props:
- `child`: string (ID of single child component, required)
- `sx`: MUI sx object
- `elevation`: number (default 2)

**Row** — Horizontal stack (MUI Stack direction="row"). Props:
- `children`: ChildrenDefinition (required)
- `spacing`: number
- `sx`: MUI sx object
- `alignItems`: string (e.g., `"center"`)
- `justifyContent`: string (e.g., `"space-between"`)

**Column** — Vertical stack (MUI Stack direction="column"). Props:
- `children`: ChildrenDefinition (required)
- `spacing`: number
- `sx`: MUI sx object
- `alignItems`: string
- `justifyContent`: string

**Box** — Generic container. Props:
- `child`: string (single child ID) OR `children`: ChildrenDefinition
- `sx`: MUI sx object

**Paper** — MUI Paper. Props:
- `child`: string OR `children`: ChildrenDefinition
- `sx`: MUI sx object
- `elevation`: number

**Divider** — Horizontal or vertical line. Props:
- `axis`: `"horizontal"` | `"vertical"`
- `sx`: MUI sx object

**Icon** — MUI icon. Props:
- `name`: ValueSource (required) — icon name string
- `sx`: MUI sx object
- Available icons: `TrendingUp`, `TrendingDown`, `ArrowUpward`, `ArrowDownward`, `Info`, `CheckCircle`, `Warning`, `Error`, `Star`, `FitnessCenter`, `WbSunny`, `Cloud`, `Thermostat`, `AttachMoney`, `ShowChart`, `AccessTime`, `LocationOn`, `Person`, `Favorite`, `Speed`

**List** — Display list (vertical or horizontal stack). Props:
- `children`: ChildrenDefinition (required)
- `direction`: `"vertical"` | `"horizontal"`
- `spacing`: number
- `sx`: MUI sx object

**GridContainer** — MUI Grid container. Props:
- `children`: ChildrenDefinition (required)
- `spacing`: number
- `sx`: MUI sx object

**GridItem** — MUI Grid item. Props:
- `child`: string OR `children`: ChildrenDefinition
- `xs`: number (grid columns at xs breakpoint, out of 12)
- `sm`: number
- `md`: number
- `sx`: MUI sx object

**Chip** — MUI Chip. Props:
- `label`: ValueSource (required)
- `sx`: MUI sx object
- `size`: `"small"` | `"medium"`
- `variant`: `"filled"` | `"outlined"`
- `color`: `"default"` | `"primary"` | `"secondary"` | `"error"` | `"info"` | `"success"` | `"warning"`

**LinearProgress** — Progress bar. Props:
- `value`: number (0–100)
- `variant`: `"determinate"` | `"indeterminate"`
- `sx`: MUI sx object

**CircularProgress** — Circular progress. Props:
- `value`: number (0–100)
- `size`: number (pixel diameter)
- `sx`: MUI sx object

**LineChart** — MUI X LineChart. Props:
- `height`: number (required)
- `series`: array of series objects — use `{ "path": "data/myArray" }` for data arrays
- `xAxis`: array of axis config objects
- `yAxis`: array of axis config objects
- `margin`: `{ "top": N, "bottom": N, "left": N, "right": N }`
- `leftAxis`: axis config or `null` (null hides it)
- `bottomAxis`: axis config or `null`
- `sx`: MUI sx object

**BarChart** — MUI X BarChart. Props:
- `height`: number (required)
- `series`: array of series objects
- `xAxis`: array of axis config objects
- `yAxis`: array of axis config objects
- `margin`: `{ "top": N, "bottom": N, "left": N, "right": N }`
- `sx`: MUI sx object

**PieChart** — MUI X PieChart. Props:
- `height`: number (required)
- `series`: array of series objects
- `margin`: margin object
- `sx`: MUI sx object

### ValueSource

Props that accept dynamic data use ValueSource objects:

- Literal string: `{ "literalString": "Hello" }`
- Literal number: `{ "literalNumber": 42 }`
- Data path: `{ "path": "data/location" }` — resolves from the data model

Examples:
- `"text": { "literalString": "Temperature" }` → shows "Temperature"
- `"text": { "path": "data/current/condition" }` → shows the condition value from mock data
- `"name": { "literalString": "TrendingUp" }` → shows the TrendingUp icon

For compound text (e.g., "72°"), use `prefix` and `suffix` on Text:
```
{
  "text": { "path": "data/current/temp" },
  "suffix": "°"
}
```

For text that combines a static label with a dynamic value (e.g., "Humidity: 65%"), put them in a Row with two Text components, or use prefix/suffix.

### ChildrenDefinition

Components with multiple children use:
```
{ "explicitList": ["child-id-1", "child-id-2", "child-id-3"] }
```

### Chart Data Binding

For chart series that need data from the mock data, use `{ "path": "data/myArray" }` wherever you need to reference an array. The renderer resolves path references in chart props automatically.

Example — sparkline:
```
"series": [{ "data": { "path": "data/tempTrend" }, "color": "#2196F3", "curve": "natural", "showMark": false }]
```

Example — bar chart with labels:
```
"series": [{ "data": { "path": "data/dailyValues" }, "color": "#8B5CF6" }],
"xAxis": [{ "data": { "path": "data/dailyLabels" }, "scaleType": "band" }]
```

## UI Style

{{UI_STYLE_PROMPT}}

## Layout Best Practices

- Card root should use: `"width": "fit-content"` with `"minWidth"` and `"maxWidth"` bounds
  - Short text widgets: minWidth 280, maxWidth 380
  - Medium content with tags: minWidth 320, maxWidth 450
  - Wide content with charts: minWidth 350, maxWidth 500
- No scrolling
- For few tags/chips (2–5): use Row
- For many items (6+): use GridContainer + GridItem
- Use Column with spacing for vertical stacking
- Keep the component count reasonable (15–30 components)

## Output Rules

- Output ONLY valid JSON, nothing else
- NO markdown fences, NO explanations, NO comments
- Start with `{` and end with `}`
- Every component ID must be unique
- The `root` field must reference an existing component ID
- All child references must point to existing component IDs

## Complete Examples

### Example 1: Weather Widget

{
  "components": [
    { "id": "root", "component": { "Card": { "child": "content", "elevation": 2, "sx": { "width": "fit-content", "minWidth": 320, "maxWidth": 400, "bgcolor": "#F5F7FA" } } } },
    { "id": "content", "component": { "Column": { "children": { "explicitList": ["location-box", "chart", "stats-row"] }, "spacing": 2, "sx": { "p": 2.5 } } } },
    { "id": "location-box", "component": { "Column": { "children": { "explicitList": ["location-label", "temp-value", "condition-label"] }, "spacing": 0 } } },
    { "id": "location-label", "component": { "Text": { "text": { "path": "data/location" }, "usageHint": "body", "color": "text.secondary" } } },
    { "id": "temp-value", "component": { "Text": { "text": { "path": "data/current/temp" }, "usageHint": "h1", "suffix": "°", "fontWeight": 300, "sx": { "my": 0.5 } } } },
    { "id": "condition-label", "component": { "Text": { "text": { "path": "data/current/condition" }, "usageHint": "body", "color": "text.secondary" } } },
    { "id": "chart", "component": { "LineChart": { "height": 120, "series": [{ "data": { "path": "data/tempTrend" }, "color": "#2196F3", "curve": "natural", "showMark": false }], "leftAxis": null, "bottomAxis": null, "margin": { "top": 10, "bottom": 10, "left": 10, "right": 10 } } } },
    { "id": "stats-row", "component": { "Row": { "children": { "explicitList": ["humidity-box", "wind-box"] }, "spacing": 3 } } },
    { "id": "humidity-box", "component": { "Column": { "children": { "explicitList": ["humidity-label", "humidity-val"] }, "spacing": 0 } } },
    { "id": "humidity-label", "component": { "Text": { "text": { "literalString": "Humidity" }, "usageHint": "caption", "color": "text.secondary" } } },
    { "id": "humidity-val", "component": { "Text": { "text": { "path": "data/current/humidity" }, "usageHint": "body", "suffix": "%", "fontWeight": 500 } } },
    { "id": "wind-box", "component": { "Column": { "children": { "explicitList": ["wind-label", "wind-val"] }, "spacing": 0 } } },
    { "id": "wind-label", "component": { "Text": { "text": { "literalString": "Wind" }, "usageHint": "caption", "color": "text.secondary" } } },
    { "id": "wind-val", "component": { "Text": { "text": { "path": "data/current/windSpeed" }, "usageHint": "body", "suffix": " mph", "fontWeight": 500 } } }
  ],
  "root": "root"
}

### Example 2: Portfolio Widget (dark theme)

{
  "components": [
    { "id": "root", "component": { "Card": { "child": "content", "elevation": 3, "sx": { "width": "fit-content", "minWidth": 340, "maxWidth": 420, "bgcolor": "#1E293B" } } } },
    { "id": "content", "component": { "Column": { "children": { "explicitList": ["header", "divider", "stock-1", "stock-2", "stock-3"] }, "spacing": 1.5, "sx": { "p": 2.5 } } } },
    { "id": "header", "component": { "Column": { "children": { "explicitList": ["header-label", "header-value", "header-change-row"] }, "spacing": 0 } } },
    { "id": "header-label", "component": { "Text": { "text": { "literalString": "Portfolio Value" }, "usageHint": "body", "sx": { "color": "#94A3B8", "mb": 0.5 } } } },
    { "id": "header-value", "component": { "Text": { "text": { "path": "data/portfolio/totalValue" }, "usageHint": "h2", "prefix": "$", "fontWeight": 600, "sx": { "color": "#F8FAFC" } } } },
    { "id": "header-change-row", "component": { "Row": { "children": { "explicitList": ["change-icon", "change-text"] }, "spacing": 0.5, "alignItems": "center", "sx": { "mt": 0.5 } } } },
    { "id": "change-icon", "component": { "Icon": { "name": { "literalString": "TrendingUp" }, "sx": { "fontSize": 16, "color": "#10B981" } } } },
    { "id": "change-text", "component": { "Text": { "text": { "path": "data/portfolio/todayChangePercent" }, "usageHint": "body", "prefix": "+", "suffix": "%", "sx": { "color": "#10B981" } } } },
    { "id": "divider", "component": { "Divider": { "sx": { "borderColor": "#334155" } } } },
    { "id": "stock-1", "component": { "Row": { "children": { "explicitList": ["s1-info", "s1-price"] }, "justifyContent": "space-between", "alignItems": "center" } } },
    { "id": "s1-info", "component": { "Column": { "children": { "explicitList": ["s1-symbol", "s1-name"] }, "spacing": 0 } } },
    { "id": "s1-symbol", "component": { "Text": { "text": { "path": "data/topStocks/0/symbol" }, "usageHint": "body", "fontWeight": 600, "sx": { "color": "#F8FAFC" } } } },
    { "id": "s1-name", "component": { "Text": { "text": { "path": "data/topStocks/0/name" }, "usageHint": "caption", "sx": { "color": "#64748B" } } } },
    { "id": "s1-price", "component": { "Text": { "text": { "path": "data/topStocks/0/price" }, "usageHint": "body", "prefix": "$", "fontWeight": 500, "sx": { "color": "#F8FAFC" } } } },
    { "id": "stock-2", "component": { "Row": { "children": { "explicitList": ["s2-info", "s2-price"] }, "justifyContent": "space-between", "alignItems": "center" } } },
    { "id": "s2-info", "component": { "Column": { "children": { "explicitList": ["s2-symbol", "s2-name"] }, "spacing": 0 } } },
    { "id": "s2-symbol", "component": { "Text": { "text": { "path": "data/topStocks/1/symbol" }, "usageHint": "body", "fontWeight": 600, "sx": { "color": "#F8FAFC" } } } },
    { "id": "s2-name", "component": { "Text": { "text": { "path": "data/topStocks/1/name" }, "usageHint": "caption", "sx": { "color": "#64748B" } } } },
    { "id": "s2-price", "component": { "Text": { "text": { "path": "data/topStocks/1/price" }, "usageHint": "body", "prefix": "$", "fontWeight": 500, "sx": { "color": "#F8FAFC" } } } },
    { "id": "stock-3", "component": { "Row": { "children": { "explicitList": ["s3-info", "s3-price"] }, "justifyContent": "space-between", "alignItems": "center" } } },
    { "id": "s3-info", "component": { "Column": { "children": { "explicitList": ["s3-symbol", "s3-name"] }, "spacing": 0 } } },
    { "id": "s3-symbol", "component": { "Text": { "text": { "path": "data/topStocks/2/symbol" }, "usageHint": "body", "fontWeight": 600, "sx": { "color": "#F8FAFC" } } } },
    { "id": "s3-name", "component": { "Text": { "text": { "path": "data/topStocks/2/name" }, "usageHint": "caption", "sx": { "color": "#64748B" } } } },
    { "id": "s3-price", "component": { "Text": { "text": { "path": "data/topStocks/2/price" }, "usageHint": "body", "prefix": "$", "fontWeight": 500, "sx": { "color": "#F8FAFC" } } } }
  ],
  "root": "root"
}

### Example 3: Fitness Widget (with progress bar and bar chart)

{
  "components": [
    { "id": "root", "component": { "Card": { "child": "content", "elevation": 2, "sx": { "width": "fit-content", "minWidth": 330, "maxWidth": 420, "bgcolor": "#FFFFFF" } } } },
    { "id": "content", "component": { "Column": { "children": { "explicitList": ["header", "progress-section", "bar-chart"] }, "spacing": 2.5, "sx": { "p": 3 } } } },
    { "id": "header", "component": { "Column": { "children": { "explicitList": ["title", "steps-value", "goal-label"] }, "spacing": 0 } } },
    { "id": "title", "component": { "Text": { "text": { "literalString": "Weekly Steps" }, "usageHint": "h4", "fontWeight": 600, "sx": { "mb": 1, "color": "#8B5CF6" } } } },
    { "id": "steps-value", "component": { "Text": { "text": { "path": "data/weeklyGoal/current" }, "usageHint": "h2", "fontWeight": 700, "sx": { "color": "#1F2937" } } } },
    { "id": "goal-label", "component": { "Text": { "text": { "path": "data/weeklyGoal/target" }, "usageHint": "body", "prefix": "of ", "suffix": " goal", "color": "text.secondary", "sx": { "mt": 0.5 } } } },
    { "id": "progress-section", "component": { "Column": { "children": { "explicitList": ["progress-header", "progress-bar"] }, "spacing": 0 } } },
    { "id": "progress-header", "component": { "Row": { "children": { "explicitList": ["progress-label", "progress-pct"] }, "justifyContent": "space-between", "sx": { "mb": 0.5 } } } },
    { "id": "progress-label", "component": { "Text": { "text": { "literalString": "Progress" }, "usageHint": "caption", "color": "text.secondary" } } },
    { "id": "progress-pct", "component": { "Text": { "text": { "path": "data/weeklyGoal/percentage" }, "usageHint": "caption", "suffix": "%", "fontWeight": 600, "sx": { "color": "#8B5CF6" } } } },
    { "id": "progress-bar", "component": { "LinearProgress": { "variant": "determinate", "value": 73, "sx": { "height": 8, "borderRadius": 4, "bgcolor": "#F3E8FF", "& .MuiLinearProgress-bar": { "bgcolor": "#8B5CF6", "borderRadius": 4 } } } } },
    { "id": "bar-chart", "component": { "BarChart": { "height": 140, "series": [{ "data": { "path": "data/dailyStepsValues" }, "color": "#8B5CF6" }], "xAxis": [{ "data": { "path": "data/dailyStepsLabels" }, "scaleType": "band", "tickLabelStyle": { "fontSize": 11, "fill": "#6B7280" } }], "margin": { "top": 10, "bottom": 30, "left": 40, "right": 10 } } } }
  ],
  "root": "root"
}

## Your Task

Based on the mock data and UI style above, generate a widget in the A2UI component format. Use data path bindings (ValueSource with `path`) to reference mock data values. For array data items, you can access individual items by index (e.g., `data/items/0/name`, `data/items/1/name`).
