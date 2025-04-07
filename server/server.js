
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory sketch store (in a production app, this would be a database)
const sketches = new Map();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a new sketch
app.post('/api/sketches', async (req, res) => {
    try {
        const { html, js, css, title, author } = req.body;

        if (!js) {
            return res.status(400).json({ error: 'Sketch JS code is required' });
        }

        // Generate a unique ID
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        // Store the sketch data
        const sketchData = {
            id,
            title: title || 'Untitled Sketch',
            author: author || 'Anonymous',
            html: html || '',
            js,
            css: css || '',
            created: new Date().toISOString()
        };

        sketches.set(id, sketchData);

        // In a real app, save to database here

        // Return the sketch ID and embed URL
        res.status(201).json({
            id,
            embedUrl: `/embed/${id}`,
            viewUrl: `/view/${id}`
        });
    } catch (error) {
        console.error('Error creating sketch:', error);
        res.status(500).json({ error: 'Failed to create sketch' });
    }
});

// Get a sketch by ID
app.get('/api/sketches/:id', (req, res) => {
    const { id } = req.params;
    const sketch = sketches.get(id);

    if (!sketch) {
        return res.status(404).json({ error: 'Sketch not found' });
    }

    res.json(sketch);
});

// Render a sketch for embedding
app.get('/embed/:id', (req, res) => {
    const { id } = req.params;
    const sketch = sketches.get(id);

    if (!sketch) {
        return res.status(404).send('Sketch not found');
    }

    // Determine if code should be shown
    const showCode = req.query.showCode === 'true';

    // Generate the HTML for the embedded sketch
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sketch.title} by ${sketch.author}</title>
           <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          canvas {
            display: block;
          }
          .code-container {
            margin: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            overflow: auto;
            max-height: 300px;
          }
          pre {
            margin: 0;
            white-space: pre-wrap;
          }
          ${sketch.css}
        </style>
      </head>
      <body>
        <main></main>
        <script>${sketch.js}</script>
        ${showCode ? `
          <div class="code-container">
            <pre><code>${sketch.js.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
        ` : ''}
      </body>
    </html>
  `;

    res.send(html);
});

// View a sketch in the editor
app.get('/view/:id', (req, res) => {
    const { id } = req.params;
    const sketch = sketches.get(id);

    if (!sketch) {
        return res.status(404).send('Sketch not found');
    }

    // Redirect to the editor with the sketch ID as a parameter
    res.redirect(`/?sketch=${id}`);
});

// Export embeddable code
app.get('/api/sketches/:id/embed', (req, res) => {
    const { id } = req.params;
    const sketch = sketches.get(id);

    if (!sketch) {
        return res.status(404).json({ error: 'Sketch not found' });
    }

    const { width = '100%', height = '400px', showCode = false, responsive = true } = req.query;

    let embedCode = `<div class="p5-sketch-container" style="width: ${width}; height: ${height};">
  <iframe 
    src="${req.protocol}://${req.get('host')}/embed/${id}${showCode === 'true' ? '?showCode=true' : ''}" 
    style="width: 100%; height: 100%; border: none;"
  ></iframe>`;

    if (showCode === 'true') {
        embedCode += `
  <details>
    <summary>View Code</summary>
    <pre><code>${sketch.js.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
  </details>`;
    }

    embedCode += '\n</div>';

    if (responsive === 'true') {
        embedCode += `
<style>
  .p5-sketch-container {
    position: relative;
    overflow: hidden;
  }
  @media (max-width: 600px) {
    .p5-sketch-container {
      height: 300px;
    }
  }
</style>`;
    }

    res.json({ embedCode });
});

// Start the server
server.listen(port, () => {
    console.log(`P5.js Sketch Embedder server running at http://localhost:${port}`);
});