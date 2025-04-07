// src/api/sketchService.js

// Simple API service for sketch operations
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Generate iframe HTML content from sketch data
function generateIframeContent(sketch) {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>
    <style>${sketch.css}</style>
  </head>
  <body>
    <main></main>
    <script>
      ${sketch.js}
    </script>
  </body>
</html>`;
}

// Create a URL for previewing a sketch locally
function createPreviewUrl(sketch) {
    const blob = new Blob([generateIframeContent(sketch)], { type: 'text/html' });
    return URL.createObjectURL(blob);
}

// Save a sketch to the server
async function saveSketch(sketch) {
    try {
        const response = await fetch(`${API_URL}/sketches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sketch),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving sketch:', error);
        throw error;
    }
}

// Get a sketch by ID
async function getSketchById(id) {
    try {
        const response = await fetch(`${API_URL}/sketches/${id}`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching sketch:', error);
        throw error;
    }
}

// Load a demo sketch from the public folder
async function loadDemoSketch(name) {
    try {
        const response = await fetch(`/examples/${name}.json`);

        if (!response.ok) {
            throw new Error(`Could not load demo sketch: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error loading demo sketch:', error);
        throw error;
    }
}

export const sketchService = {
    createPreviewUrl,
    saveSketch,
    getSketchById,
    loadDemoSketch
};