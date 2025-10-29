// Mock API server for testing the Bould widget
// Run with: node mock-api.js
// Then open test-widget.html in a browser

const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Status preflight endpoint
app.get(['/apps/bould-widget', '/apps/bould'], (req, res) => {
    if (req.query.intent !== 'status') {
        return res.json({ ok: true });
    }
    const isGarmentProcessed = Math.random() > 0.3; // 70% chance processed
    return res.json({
        ok: true,
        productId: req.query.product_id || null,
        isProcessed: isGarmentProcessed,
        conversionStatus: isGarmentProcessed ? 'completed' : 'not_found',
        debug: { requestId: Math.random().toString(36).slice(2,10) }
    });
});

// Mock API endpoint that simulates the BouldSize recommender
app.post(['/apps/bould-widget', '/apps/bould'], upload.single('user_image'), (req, res) => {
    console.log('Received request:', req.body);
    
    const { height } = req.body;
    const heightNum = parseFloat(height);
    
    // Simulate garment processing check
    const isGarmentProcessed = Math.random() > 0.3; // 70% chance of being processed
    
    if (!isGarmentProcessed) {
        return res.status(409).json({ 
            error: "This garment has not been converted yet. Please run conversion in the Bould app first." 
        });
    }
    
    // Mock response with proper formatting
    const tryOnImageUrl = "https://placehold.co/600x800/png?text=Try-on+Result";
    const recommendedSize = heightNum < 165 ? "S" : heightNum < 180 ? "M" : "L";
    const confidence = (Math.random() * 0.3 + 0.7).toFixed(2); // 70-100% confidence
    const tailorFeedback = "This size should fit well based on your measurements. The fit is optimized for your body proportions.";
    
    res.json({ 
        tryOnImageUrl, 
        recommended_size: recommendedSize,
        confidence: parseFloat(confidence),
        tailor_feedback: tailorFeedback,
        debug: {
            measurement_vis_url: "https://placehold.co/600x800/png?text=Measurement+Visualization"
        }
    });
});

// Serve static files
app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Mock API server running at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/test-widget.html to test the widget`);
});
