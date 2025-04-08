'use client';

import React from 'react';
import './App.css';
import SketchEmbedder from './components/SketchEmbedder';
import ImportModal from './components/ImportModal';

function App() {
	const [sketch, setSketch] = React.useState({
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
	});
	const [showImportModal, setShowImportModal] = React.useState(false);

	const handleImportClick = () => {
		setShowImportModal(true);
	};

	const handleSketchImport = (importedSketch) => {
		setSketch(importedSketch);
		setShowImportModal(false);
	};

	const handleCloseModal = () => {
		setShowImportModal(false);
	};

	return (
		<div className="App">
			<SketchEmbedder
				initialSketch={sketch}
				onImportClick={handleImportClick}
			/>
			<ImportModal
				show={showImportModal}
				onClose={handleCloseModal}
				onImport={handleSketchImport}
			/>
		</div>
	);
}

export default App;
