import React from 'react';

function ImportModal({ show, onClose, onImport }) {
	const [error, setError] = React.useState(null);
	const [jsonInput, setJsonInput] = React.useState('');

	const handleJsonImport = () => {
		try {
			const parsedJson = JSON.parse(jsonInput);
			// validation: check if essential keys exist
			if (
				!parsedJson ||
				typeof parsedJson.js !== 'string' ||
				typeof parsedJson.css !== 'string' ||
				typeof parsedJson.html !== 'string'
			) {
				throw new Error(
					'JSON must contain js, css, and html string properties.'
				);
			}
			onImport(parsedJson); // Pass the parsed sketch data up
			setError(null);
			setJsonInput('');
		} catch (e) {
			setError(`Invalid JSON format or missing keys: ${e.message}`);
		}
	};

	const handleClose = () => {
		setError(null);
		setJsonInput('');
		onClose();
	};

	if (!show) {
		return null;
	}

	return (
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
			onClick={handleClose} // Close modal if clicking on the background overlay
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
				onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
			>
				<h2 style={{ marginTop: 0 }}>Import Sketch from JSON</h2>
				<p>Paste your JSON code below:</p>

				{error && (
					<div
						style={{
							padding: '10px',
							marginBottom: '10px',
							background: '#ffebee',
							color: '#c62828',
							borderRadius: '4px',
						}}
					>
						{error}
					</div>
				)}

				<textarea
					value={jsonInput}
					onChange={(e) => setJsonInput(e.target.value)}
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
						onClick={handleClose}
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

				<div
					style={{
						marginTop: '20px',
						borderTop: '1px solid #eee',
						paddingTop: '10px',
					}}
				>
					<h3 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>
						Example Format:
					</h3>
					<pre
						style={{
							background: '#f5f5f5',
							padding: '8px',
							borderRadius: '4px',
							fontSize: '12px',
							overflow: 'auto',
						}}
					>
						{`{
  "title": "My Sketch",
  "author": "Your Name",
  "js": "function setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(220);\n}",
  "css": "html, body { margin: 0; padding: 0; }\ncanvas { display: block; }",
  "html": "<!DOCTYPE html>\n<html>\n  <head>\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>\n  </head>\n  <body>\n    <main></main>\n  </body>\n</html>"
}`}
					</pre>
				</div>
			</div>
		</div>
	);
}

export default ImportModal;
