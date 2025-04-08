'use client';

import { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

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
	const [isLoading, setIsLoading] = useState(false);

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
	const iframeRef = useRef(null);

	// Generate iframe HTML content - Accepts sketch data as argument
	const generateIframeContent = (currentSketch) => {
		return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>
    <style>${currentSketch.css}</style>
  </head>
  <body>
    <main></main>
    <script>
      ${currentSketch.js}
    </script>
  </body>
</html>`;
	};

	// Update iframe content - Accepts optional sketch data
	const updateIframeContent = (newSketch = sketch) => {
		setIsLoading(true);
		setIsRunning(true);

		const loadingBlob = new Blob(
			[
				`
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; background-color: #f9f9f9;">
          <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; margin: 0 auto 15px; animation: spin 1s linear infinite;"></div>
            <div>Loading sketch...</div>
          </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </body>
      </html>
    `,
			],
			{ type: 'text/html' }
		);

		// Show loading indicator first
		if (iframeSrc) {
			URL.revokeObjectURL(iframeSrc);
		}
		setIframeSrc(URL.createObjectURL(loadingBlob));

		// Then generate the actual content using the provided or current sketch
		setTimeout(() => {
			const content = generateIframeContent(newSketch); // Use newSketch
			const blob = new Blob([content], { type: 'text/html' });

			// Release the old blob URL if it exists (check needed after clearing)
			if (iframeSrc) {
				URL.revokeObjectURL(iframeSrc);
			}

			const newSrc = URL.createObjectURL(blob);
			setIframeSrc(newSrc);
			setIsLoading(false);
		}, 500); // Short delay to show loading state
	};

	// Clear iframe
	const clearIframe = () => {
		setIsRunning(false);
		if (iframeSrc) {
			URL.revokeObjectURL(iframeSrc);
		}
		const blob = new Blob(
			[
				`
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; background-color: #f9f9f9; color: #666;">
          <div style="text-align: center; padding: 20px; border: 1px dashed #ccc; border-radius: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="margin: 0 auto 10px; display: block;">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="15"></line>
              <line x1="15" y1="9" x2="9" y2="15"></line>
            </svg>
            <div>Sketch stopped</div>
            <div style="font-size: 12px; margin-top: 8px;">Click Run to start the sketch</div>
          </div>
        </body>
      </html>
    `,
			],
			{ type: 'text/html' }
		);
		setIframeSrc(URL.createObjectURL(blob));
	};

	// Toggle running state
	const toggleRunning = () => {
		if (isRunning) {
			clearIframe();
		} else {
			updateIframeContent();
		}
	};

	// Initialize iframe on load
	useEffect(() => {
		updateIframeContent(sketch); // Pass initial sketch explicitly

		// Cleanup function to revoke any blob URLs when component unmounts
		return () => {
			if (iframeSrc) {
				URL.revokeObjectURL(iframeSrc);
			}
		};
	}, []);

	// Handle sketch update
	const handleSketchUpdate = (field, value) => {
		setSketch((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Update when initialSketch prop changes
	useEffect(() => {
		setSketch(initialSketch);
		updateIframeContent(initialSketch); // Pass the new initialSketch
	}, [initialSketch]);

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
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};
	}, []);

	// Copy embed code to clipboard
	const copyEmbedCode = () => {
		navigator.clipboard.writeText(embedCode);
		alert('Embed code copied to clipboard!');
	};

	// Button styles based on state
	const getButtonStyle = (isActive = false, isDanger = false) => {
		return {
			padding: '4px 10px',
			background: isActive ? (isDanger ? '#ef4444' : '#3b82f6') : '#f8f8f8',
			color: isActive ? 'white' : 'black',
			border: '1px solid #ccc',
			borderRadius: '3px',
			cursor: 'pointer',
			fontSize: '14px',
			margin: '0 2px',
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
			transition: 'all 0.2s ease',
		};
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
						alignItems: 'center',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
							p5.js Sketch Embedder
						</h1>

						{/* Status indicator */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								marginLeft: '12px',
								padding: '2px 8px',
								borderRadius: '12px',
								fontSize: '12px',
								backgroundColor: isRunning
									? isLoading
										? '#fef3c7'
										: '#dcfce7'
									: '#f3f4f6',
								color: isRunning
									? isLoading
										? '#92400e'
										: '#166534'
									: '#6b7280',
								border: `1px solid ${
									isRunning ? (isLoading ? '#fcd34d' : '#86efac') : '#e5e7eb'
								}`,
							}}
						>
							{isLoading ? (
								<>
									<div
										style={{
											width: '8px',
											height: '8px',
											borderRadius: '50%',
											border: '2px solid #fbbf24',
											borderTopColor: 'transparent',
											marginRight: '6px',
											animation: 'spin 1s linear infinite',
										}}
									></div>
									Loading...
								</>
							) : isRunning ? (
								<>
									<div
										style={{
											width: '8px',
											height: '8px',
											borderRadius: '50%',
											backgroundColor: '#22c55e',
											marginRight: '6px',
										}}
									></div>
									Running
								</>
							) : (
								<>
									<div
										style={{
											width: '8px',
											height: '8px',
											borderRadius: '50%',
											backgroundColor: '#9ca3af',
											marginRight: '6px',
										}}
									></div>
									Stopped
								</>
							)}
						</div>

						<style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
					</div>

					<div style={{ display: 'flex', gap: '4px' }}>
						<button
							style={getButtonStyle(isRunning, isRunning)}
							onClick={toggleRunning}
							disabled={isLoading}
						>
							{isRunning ? (
								<>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect x="6" y="4" width="4" height="16"></rect>
										<rect x="14" y="4" width="4" height="16"></rect>
									</svg>
									Stop
								</>
							) : (
								<>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polygon points="5 3 19 12 5 21 5 3"></polygon>
									</svg>
									Run
								</>
							)}
						</button>

						<button
							style={getButtonStyle(isCodeVisible)}
							onClick={() => setIsCodeVisible(!isCodeVisible)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="16 18 22 12 16 6"></polyline>
								<polyline points="8 6 2 12 8 18"></polyline>
							</svg>
							{isCodeVisible ? 'Hide Code' : 'Show Code'}
						</button>

						<button
							style={getButtonStyle(false)}
							onClick={onImportClick}
							disabled={isLoading}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="17 8 12 3 7 8"></polyline>
								<line x1="12" y1="3" x2="12" y2="15"></line>
							</svg>
							Import JSON
						</button>
					</div>
				</div>

				<div
					style={{
						height: 'calc(100% - 50px)',
						position: 'relative',
					}}
				>
					<iframe
						ref={iframeRef}
						src={iframeSrc}
						title="P5.js Sketch Preview"
						style={{
							width: '100%',
							height: '100%',
							border: 'none',
							backgroundColor: '#f9f9f9',
						}}
					/>

					{/* Overlay for when sketch is stopped */}
					{!isRunning && !isLoading && (
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: 'rgba(0,0,0,0.03)',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								pointerEvents: 'none',
							}}
						>
							<button
								onClick={toggleRunning}
								style={{
									backgroundColor: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '50%',
									width: '60px',
									height: '60px',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									cursor: 'pointer',
									boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
									pointerEvents: 'auto',
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polygon points="5 3 19 12 5 21 5 3"></polygon>
								</svg>
							</button>
						</div>
					)}
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
						<div
							style={{
								padding: '8px',
								borderBottom: '1px solid #ddd',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
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

							{/* Run button in code panel */}
							{sketch !== initialSketch && ( // Check against internal sketch state now
								<button
									style={{
										padding: '4px 12px',
										background: '#22c55e',
										color: 'white',
										border: 'none',
										borderRadius: '3px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
									}}
									onClick={() => updateIframeContent()} // Use current sketch state
									disabled={isLoading}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polygon points="5 3 19 12 5 21 5 3"></polygon>
									</svg>
									Apply Changes
								</button>
							)}
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
									extensions={[html()]}
									onChange={(value) => handleSketchUpdate('html', value)}
								/>
							)}
							{activeTab === 'css' && (
								<CodeMirror
									value={sketch.css}
									height="100%"
									extensions={[css()]}
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
