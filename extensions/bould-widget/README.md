# Bould Size Widget

This widget allows customers to get size recommendations for garments by uploading a T-pose photo and entering their height.

## Features

- **Garment Processing Validation**: Shows clear error message if garment hasn't been processed
- **Size Formatting**: Displays confidence values with exactly 2 decimal places
- **Error Handling**: Comprehensive error handling for different scenarios
- **Responsive Design**: Works on desktop and mobile devices

## Testing the Widget

### Prerequisites

1. Node.js installed on your system
2. npm or yarn package manager

### Setup

1. Navigate to the widget directory:
   ```bash
   cd Bould/extensions/bould-widget
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the mock API server:
   ```bash
   npm run test
   ```

4. Open your browser and go to: `http://localhost:3000/test-widget.html`
   - The test page points to `http://localhost:3000/apps/bould-widget` and includes a sample `data-product-id`.

### Test Scenarios

1. **Normal Flow**: Upload an image and enter height to get size recommendation
2. **Unprocessed Garment**: The widget will show an error message if the garment hasn't been processed (30% chance in mock)
3. **Size Formatting**: Confidence values are displayed with exactly 2 decimal places
4. **Error Handling**: Clear error messages for different failure scenarios

## Widget Configuration

The widget can be configured with the following settings:

- `button_label`: Text for the widget button (default: "Find my perfect size")
- `api_base`: API base URL. Use `use_app_proxy` to hit your app proxy route (`/apps/bould-widget`) in production. In the test page we set a full URL `http://localhost:3000/apps/bould-widget`.

## API Integration

The widget expects the API to return a JSON response with the following structure:

```json
{
  "tryOnImageUrl": "https://example.com/try-on-image.jpg",
  "recommended_size": "M",
  "confidence": 0.85,
  "tailor_feedback": "This size should fit well...",
  "debug": {
    "measurement_vis_url": "https://example.com/measurement-vis.jpg"
  }
}
```

## Error Handling

The widget handles the following error scenarios:

- **409 Conflict**: Garment not processed - shows message to convert garment first
- **502 Bad Gateway**: Garment processing failed - shows message to ensure proper conversion
- **Other errors**: Generic error message with retry option

## File Structure

```
bould-widget/
├── assets/
│   ├── widget.js          # Widget JavaScript logic
│   └── widget.css         # Widget styling
├── blocks/
│   └── find-perfect-size.liquid  # Shopify Liquid template
├── locales/
│   └── en.default.json    # Localization strings
├── test-widget.html       # Test page for development
├── mock-api.js           # Mock API server for testing
├── package.json          # Dependencies and scripts
└── README.md            # This file
```
