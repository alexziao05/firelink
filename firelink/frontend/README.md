# FireLink Frontend

React + TypeScript frontend for the FireLink wildfire evacuation intelligence platform.

## Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```bash
REACT_APP_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`

## Features

- **Interactive Map**: Leaflet-based map showing:
  - Evacuation shelters (blue markers)
  - Active incident reports (colored by type)
  - Risk heatmap overlay
  - Evacuation routes (green lines)
  - Selected location marker

- **Incident Reporting**: Submit real-time reports of:
  - Fire sightings
  - Blocked roads
  - Heavy smoke
  - Assistance needed
  - Power outages

- **Evacuation Routing**: Get safest route to:
  - Nearest shelter
  - Specific shelter of choice
  - View route explanation and risk assessment

- **Risk Visualization**: See evacuation risk levels:
  - Low risk (green)
  - Medium risk (orange)
  - High risk (red)

## Building for Production

```bash
npm run build
```

Creates an optimized build in the `build/` directory.

## Project Structure

```
frontend/
  public/
    index.html           # HTML entry point
  src/
    components/
      MapView.tsx        # Interactive map
      ReportForm.tsx     # Report submission form
      RoutePanel.tsx     # Route request/display
      RiskLegend.tsx     # Map legend
    api/
      client.ts          # Backend API client
    types/
      index.ts           # TypeScript type definitions
    App.tsx              # Main application component
    index.tsx            # React entry point
    index.css            # Global styles
  package.json           # Dependencies
  tsconfig.json          # TypeScript configuration
```

## Component Overview

### MapView

- Displays Leaflet map centered on evacuation area
- Shows all data layers (shelters, reports, risk grid, routes)
- Handles map click events for location selection

### ReportForm

- Dropdown for incident type selection
- Optional note field for details
- Shows selected location coordinates
- Submits to backend

### RoutePanel

- Dropdown to select destination shelter
- Computes safest route with risk assessment
- Displays route explanation and destination info

### RiskLegend

- Visual guide for risk levels
- Incident type icons
- Shelter marker legend

## Development Tips

- Map tiles come from OpenStreetMap (OSM) and load dynamically
- Risk grid is computed server-side; frontend displays as overlay circles
- Routes update in real-time as you click locations
- Reports auto-refresh every 30 seconds

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Modern browsers with ES2020 support required.

## Future Enhancements

- Real-time WebSocket updates for incidents
- Advanced filtering and search
- Historical report tracking
- Push notifications
- Offline mode with service workers
