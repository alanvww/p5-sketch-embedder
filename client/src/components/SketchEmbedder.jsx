import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

// Default sketch
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

function SketchEmbedder({ initialSketch = DEFAULT_SKETCH, onImportClick }) {
	// State
	const [sketch, setSketch] = useState(initialSketch);
	const [iframeSrc, setIframeSrc] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [isCodeVisible, setIsCodeVisible] = useState(false);
	const [activeTab, setActiveTab] = useState('js');

	// Embed options
	const [embedOptions, setEmbedOptions] = useState({
		width: '100%',
		height: '400px',
		showCode: false,
		responsive: true,
		autoplay: true,
	});

	const [embedCode, setEmbedCode] = useState('');

	// Refs
	const topPanelRef = useRef(null);
	const bottomPanelRef = useRef(null);
	const resizerRef = useRef(null);

	// Generate iframe HTML content
	const generateIframeContent = () => {
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
	};

	// Update iframe content
	// Update iframe content
	const updateIframeContent = () => {
		console.log('Updating iframe with sketch:', sketch);
		setIsRunning(true);
		const content = generateIframeContent();
		const blob = new Blob([content], { type: 'text/html' });

		// Release the old blob URL if it exists
		if (iframeSrc) {
			URL.revokeObjectURL(iframeSrc);
		}

		const newSrc = URL.createObjectURL(blob);
		console.log('Created new iframe src:', newSrc);
		setIframeSrc(newSrc);
	};

	// Clear iframe
	const clearIframe = () => {
		setIsRunning(false);
		const blob = new Blob(
			['<html><body><h3>Sketch stopped</h3></body></html>'],
			{ type: 'text/html' }
		);
		setIframeSrc(URL.createObjectURL(blob));
	};

	// Initialize iframe on load
	useEffect(() => {
		updateIframeContent();
	}, []);

	// Handle sketch update
	const handleSketchUpdate = (field, value) => {
		setSketch((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Add this useEffect in SketchEmbedder.jsx
	useEffect(() => {
		// Update internal sketch state when initialSketch prop changes
		setSketch(initialSketch);

		// Update the preview
		const content = generateIframeContent();
		const blob = new Blob([content], { type: 'text/html' });
		setIframeSrc(URL.createObjectURL(blob));
		setIsRunning(true);
	}, [initialSketch]); // React to changes in initialSketch prop

	// Generate embed code
	useEffect(() => {
		const { width, height, showCode, responsive, autoplay } = embedOptions;

		let code = `<div class="p5-sketch-container" style="width: ${width}; height: ${height};">
  <iframe 
    src="YOUR_SKETCH_URL_HERE" 
    style="width: 100%; height: 100%; border: none;"
    ${autoplay ? '' : 'data-autoplay="false"'}
  ></iframe>`;

		if (showCode) {
			code += `
  <details>
    <summary>View Code</summary>
    <pre><code>${sketch.js
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')}</code></pre>
  </details>`;
		}

		code += '\n</div>';

		if (responsive) {
			code += `
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

		setEmbedCode(code);
	}, [embedOptions, sketch]);

	// Setup resize functionality
	useEffect(() => {
		const resizer = resizerRef.current;
		const topPanel = topPanelRef.current;
		const bottomPanel = bottomPanelRef.current;

		if (!resizer || !topPanel || !bottomPanel) return;

		let startY;
		let startTopHeight;

		function onMouseDown(e) {
			startY = e.clientY;
			startTopHeight = topPanel.getBoundingClientRect().height;

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		}

		function onMouseMove(e) {
			const dy = e.clientY - startY;
			const newTopHeight = startTopHeight + dy;
			const containerHeight =
				topPanel.parentNode.getBoundingClientRect().height;

			if (newTopHeight > 100 && newTopHeight < containerHeight - 100) {
				const topPercent = (newTopHeight / containerHeight) * 100;
				topPanel.style.height = `${topPercent}%`;
				bottomPanel.style.height = `${100 - topPercent}%`;
			}
		}

		function onMouseUp() {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		}

		resizer.addEventListener('mousedown', onMouseDown);

		return () => {
			resizer.removeEventListener('mousedown', onMouseDown);
		};
	}, []);

	// Copy embed code to clipboard
	const copyEmbedCode = () => {
		navigator.clipboard.writeText(embedCode);
		alert('Embed code copied to clipboard!');
	};

	// Common button style
	const buttonStyle = {
		padding: '2px 8px',
		background: '#f8f8f8',
		border: '1px solid #ccc',
		borderRadius: '3px',
		cursor: 'pointer',
		fontSize: '14px',
		margin: '0 2px',
	};

	return (
		<div
			className="sketch-embedder"
			style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
		>
			{/* Top panel with sketch preview */}
			<div ref={topPanelRef} style={{ height: '70%', overflow: 'hidden' }}>
				<div
					style={{
						padding: '8px',
						borderBottom: '1px solid #ddd',
						display: 'flex',
						justifyContent: 'space-between',
					}}
				>
					<h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
						p5.js Sketch Embedder
					</h1>
					<div style={{ display: 'flex', gap: '4px' }}>
						<button style={buttonStyle} onClick={updateIframeContent}>
							▶ Run
						</button>
						<button style={buttonStyle} onClick={clearIframe}>
							■ Stop
						</button>
						<button
							style={buttonStyle}
							onClick={() => setIsCodeVisible(!isCodeVisible)}
						>
							&lt;/&gt; {isCodeVisible ? 'Hide Code' : 'Show Code'}
						</button>
						{/* Add Import JSON button to the group */}
						<button style={buttonStyle} onClick={onImportClick}>
							Import JSON
						</button>
						<button
							style={buttonStyle}
							onClick={() => {
								console.log('Force update with current sketch:', sketch);
								updateIframeContent();
							}}
						>
							Force Update
						</button>
					</div>
				</div>
				<div style={{ height: 'calc(100% - 50px)' }}>
					<iframe
						src={iframeSrc}
						title="P5.js Sketch Preview"
						style={{ width: '100%', height: '100%', border: 'none' }}
					/>
				</div>
			</div>

			{/* Resizer */}
			<div
				ref={resizerRef}
				style={{
					height: '6px',
					background: '#f0f0f0',
					cursor: 'ns-resize',
					borderTop: '1px solid #ddd',
					borderBottom: '1px solid #ddd',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						width: '30px',
						height: '4px',
						background: '#ccc',
						borderRadius: '2px',
					}}
				></div>
			</div>

			{/* Bottom panel with code editor */}
			<div
				ref={bottomPanelRef}
				style={{
					height: '30%',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{isCodeVisible ? (
					<div
						style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
					>
						<div style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
							<div style={{ display: 'flex', gap: '8px' }}>
								<button
									style={{
										padding: '4px 12px',
										background: activeTab === 'js' ? '#3b82f6' : '#f8f8f8',
										color: activeTab === 'js' ? 'white' : 'black',
										border: '1px solid #ccc',
										borderRadius: '3px',
										cursor: 'pointer',
									}}
									onClick={() => setActiveTab('js')}
								>
									sketch.js
								</button>
								<button
									style={{
										padding: '4px 12px',
										background: activeTab === 'html' ? '#3b82f6' : '#f8f8f8',
										color: activeTab === 'html' ? 'white' : 'black',
										border: '1px solid #ccc',
										borderRadius: '3px',
										cursor: 'pointer',
									}}
									onClick={() => setActiveTab('html')}
								>
									index.html
								</button>
								<button
									style={{
										padding: '4px 12px',
										background: activeTab === 'css' ? '#3b82f6' : '#f8f8f8',
										color: activeTab === 'css' ? 'white' : 'black',
										border: '1px solid #ccc',
										borderRadius: '3px',
										cursor: 'pointer',
									}}
									onClick={() => setActiveTab('css')}
								>
									style.css
								</button>
							</div>
						</div>
						<div style={{ flex: 1, overflow: 'auto' }}>
							{activeTab === 'js' && (
								<CodeMirror
									value={sketch.js}
									height="100%"
									extensions={[javascript()]}
									onChange={(value) => handleSketchUpdate('js', value)}
								/>
							)}
							{activeTab === 'html' && (
								<CodeMirror
									value={sketch.html}
									height="100%"
									onChange={(value) => handleSketchUpdate('html', value)}
								/>
							)}
							{activeTab === 'css' && (
								<CodeMirror
									value={sketch.css}
									height="100%"
									onChange={(value) => handleSketchUpdate('css', value)}
								/>
							)}
						</div>
					</div>
				) : (
					<div style={{ padding: '16px' }}>
						<h2
							style={{
								margin: '0 0 16px 0',
								fontSize: '1.125rem',
								fontWeight: '500',
							}}
						>
							Embed Options
						</h2>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '16px',
								marginBottom: '16px',
							}}
						>
							<div>
								<label
									style={{
										display: 'block',
										marginBottom: '4px',
										fontSize: '0.875rem',
										fontWeight: '500',
									}}
								>
									Width:
								</label>
								<input
									type="text"
									value={embedOptions.width}
									onChange={(e) =>
										setEmbedOptions({ ...embedOptions, width: e.target.value })
									}
									style={{
										width: '100%',
										padding: '6px 8px',
										border: '1px solid #ddd',
										borderRadius: '4px',
									}}
								/>
							</div>

							<div>
								<label
									style={{
										display: 'block',
										marginBottom: '4px',
										fontSize: '0.875rem',
										fontWeight: '500',
									}}
								>
									Height:
								</label>
								<input
									type="text"
									value={embedOptions.height}
									onChange={(e) =>
										setEmbedOptions({ ...embedOptions, height: e.target.value })
									}
									style={{
										width: '100%',
										padding: '6px 8px',
										border: '1px solid #ddd',
										borderRadius: '4px',
									}}
								/>
							</div>
						</div>

						<div style={{ marginBottom: '16px' }}>
							<div style={{ marginBottom: '8px' }}>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										fontSize: '0.875rem',
									}}
								>
									<input
										type="checkbox"
										checked={embedOptions.showCode}
										onChange={(e) =>
											setEmbedOptions({
												...embedOptions,
												showCode: e.target.checked,
											})
										}
										style={{ marginRight: '8px' }}
									/>
									Show code snippet
								</label>
							</div>

							<div style={{ marginBottom: '8px' }}>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										fontSize: '0.875rem',
									}}
								>
									<input
										type="checkbox"
										checked={embedOptions.responsive}
										onChange={(e) =>
											setEmbedOptions({
												...embedOptions,
												responsive: e.target.checked,
											})
										}
										style={{ marginRight: '8px' }}
									/>
									Make responsive
								</label>
							</div>

							<div>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										fontSize: '0.875rem',
									}}
								>
									<input
										type="checkbox"
										checked={embedOptions.autoplay}
										onChange={(e) =>
											setEmbedOptions({
												...embedOptions,
												autoplay: e.target.checked,
											})
										}
										style={{ marginRight: '8px' }}
									/>
									Autoplay sketch
								</label>
							</div>
						</div>

						<div>
							<h3
								style={{
									marginBottom: '8px',
									fontSize: '0.875rem',
									fontWeight: '500',
								}}
							>
								Embed Code:
							</h3>
							<div style={{ position: 'relative' }}>
								<pre
									style={{
										maxHeight: '160px',
										overflow: 'auto',
										padding: '8px',
										background: '#f5f5f5',
										borderRadius: '4px',
										fontSize: '0.75rem',
									}}
								>
									<code>{embedCode}</code>
								</pre>
								<button
									style={{
										position: 'absolute',
										top: '8px',
										right: '8px',
										padding: '4px 8px',
										background: '#f8f8f8',
										border: '1px solid #ddd',
										borderRadius: '3px',
										cursor: 'pointer',
										fontSize: '0.75rem',
									}}
									onClick={copyEmbedCode}
								>
									Copy
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default SketchEmbedder;
