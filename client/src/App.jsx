import React, { useState, useEffect } from 'react';
import SketchEmbedder from './components/SketchEmbedder';
import { sketchService } from './api/sketchService';

// Default sketch data
const DEFAULT_SKETCH = {
	html: `<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>
    <meta charset="utf-8" />
  </head>
  <body>
    <main></main>
    <script src="sketch.js"></script>
  </body>
</html>`,
	js: `function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}`,
	css: `html, body {
  margin: 0;
  padding: 0;
}
canvas {
  display: block;
}`,
};

function App() {
	const [sketch, setSketch] = useState(DEFAULT_SKETCH);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showImportModal, setShowImportModal] = useState(false);
	const [jsonInput, setJsonInput] = useState('');

	useEffect(() => {
		// Check for URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const demoParam = urlParams.get('demo');
		const sketchId = urlParams.get('sketch');

		if (sketchId) {
			loadSketch(sketchId);
		} else if (demoParam) {
			// Load demo sketch if specified
			loadDemoSketch(demoParam);
		} else {
			// Try to load from local storage
			const savedSketch = localStorage.getItem('currentSketch');
			if (savedSketch) {
				try {
					setSketch(JSON.parse(savedSketch));
				} catch (err) {
					console.error('Failed to parse saved sketch:', err);
				}
			}
		}
	}, []);

	// Save sketch to local storage when it changes
	useEffect(() => {
		localStorage.setItem('currentSketch', JSON.stringify(sketch));
	}, [sketch]);

	const loadSketch = async (id) => {
		setLoading(true);
		try {
			const fetchedSketch = await sketchService.getSketchById(id);
			setSketch(fetchedSketch);
			setError(null);
		} catch (err) {
			console.error('Failed to load sketch:', err);
			setError(
				'Failed to load the requested sketch. It may not exist or there was a server error.'
			);
		} finally {
			setLoading(false);
		}
	};

	const loadDemoSketch = async (demoName) => {
		setLoading(true);
		try {
			const demoSketch = await sketchService.loadDemoSketch(demoName);
			setSketch(demoSketch);
			setError(null);
		} catch (err) {
			console.error('Error loading demo sketch:', err);
			setError(`Failed to load demo sketch: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	// JSON import function
	const handleJsonImport = () => {
		try {
			console.log('Attempting to parse JSON:', jsonInput);

			const data = JSON.parse(jsonInput);
			console.log('Parsed data:', data);

			if (!data.js) {
				console.error('Missing js property in JSON');
				setError('JSON must include a "js" property.');
				return;
			}

			// Create the updated sketch
			const updatedSketch = {
				html: data.html || DEFAULT_SKETCH.html,
				js: data.js,
				css: data.css || DEFAULT_SKETCH.css,
			};

			console.log('Updating sketch with:', updatedSketch);
			setSketch(updatedSketch);

			// Close modal and reset input
			setError(null);
			setShowImportModal(false);
			setJsonInput('');

			console.log('Import complete');
		} catch (err) {
			console.error('Error parsing JSON:', err);
			setError(`Invalid JSON: ${err.message}`);
		}
	};

	if (loading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<h2>Loading sketch...</h2>
					<div
						style={{
							width: '50px',
							height: '10px',
							background: '#f0f0f0',
							borderRadius: '5px',
							margin: '20px auto',
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								height: '100%',
								width: '50%',
								background: '#3b82f6',
								animation: 'loading 1s infinite linear',
							}}
						></div>
					</div>
					<style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<div
					style={{
						maxWidth: '500px',
						padding: '20px',
						background: 'white',
						borderRadius: '8px',
						boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
					}}
				>
					<h2 style={{ color: '#ef4444', marginTop: 0 }}>Error</h2>
					<p>{error}</p>
					<button
						className="btn btn-primary"
						onClick={() => {
							setSketch(DEFAULT_SKETCH);
							setError(null);
						}}
					>
						Load Default Sketch
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<SketchEmbedder
				initialSketch={sketch}
				onImportClick={() => setShowImportModal(true)}
			/>

			{/* Import modal */}
			{showImportModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 2000,
					}}
				>
					<div
						style={{
							background: 'white',
							padding: '20px',
							borderRadius: '8px',
							width: '90%',
							maxWidth: '600px',
							maxHeight: '80vh',
							overflow: 'auto',
						}}
					>
						<h2 style={{ marginTop: 0 }}>Import Sketch from JSON</h2>
						<p>Paste your JSON code below:</p>

						<textarea
							value={jsonInput}
							onChange={(e) => {
								console.log(
									'Textarea input changed:',
									e.target.value.substring(0, 50) + '...'
								);
								setJsonInput(e.target.value);
							}}
							style={{
								width: '100%',
								height: '200px',
								padding: '8px',
								borderRadius: '4px',
								border: '1px solid #ddd',
								marginBottom: '16px',
								fontFamily: 'monospace',
							}}
							placeholder='{"js": "function setup() {...", "css": "body {...", "html": "<!DOCTYPE html>..."}'
						/>

						<div
							style={{
								display: 'flex',
								justifyContent: 'flex-end',
								gap: '8px',
							}}
						>
							<button
								style={{
									padding: '8px 16px',
									background: '#f3f4f6',
									border: '1px solid #ddd',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
								onClick={() => setShowImportModal(false)}
							>
								Cancel
							</button>

							<button
								style={{
									padding: '8px 16px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
								onClick={handleJsonImport}
							>
								Import
							</button>
						</div>
						<button
							style={{
								marginTop: '10px',
								padding: '8px 16px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								width: '100%',
							}}
							onClick={() => {
								// Use the example sketch JSON directly
								const exampleSketch = {
									title: 'Colorful Particles',
									author: 'Test User',
									js: 'let particles = [];\n\nfunction setup() {\n  createCanvas(windowWidth, windowHeight);\n  colorMode(HSB, 100);\n  for (let i = 0; i < 50; i++) {\n    particles.push(new Particle());\n  }\n}\n\nfunction draw() {\n  background(10, 10, 20);\n  \n  for (let particle of particles) {\n    particle.update();\n    particle.display();\n  }\n}\n\nclass Particle {\n  constructor() {\n    this.x = random(width);\n    this.y = random(height);\n    this.size = random(5, 20);\n    this.xSpeed = random(-2, 2);\n    this.ySpeed = random(-2, 2);\n    this.color = random(100);\n  }\n  \n  update() {\n    this.x += this.xSpeed;\n    this.y += this.ySpeed;\n    \n    // Bounce off walls\n    if (this.x < 0 || this.x > width) {\n      this.xSpeed *= -1;\n    }\n    \n    if (this.y < 0 || this.y > height) {\n      this.ySpeed *= -1;\n    }\n    \n    // Slowly change color\n    this.color = (this.color + 0.3) % 100;\n  }\n  \n  display() {\n    noStroke();\n    fill(this.color, 80, 90, 0.7);\n    ellipse(this.x, this.y, this.size);\n  }\n}',
									css: 'html, body {\n  margin: 0;\n  padding: 0;\n  overflow: hidden;\n}\n\ncanvas {\n  display: block;\n}',
									html: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Colorful Particles</title>\n  </head>\n  <body>\n    <main>\n    </main>\n  </body>\n</html>',
								};

								console.log('Using test sketch');
								setSketch(exampleSketch);
								setShowImportModal(false);
							}}
						>
							Test with Example Sketch (Debug)
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
