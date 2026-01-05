import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import mermaid from 'mermaid';
import './App.css';

// Define Mermaid syntax highlighting using Monarch
monaco.languages.register({
  id: 'mermaid'
});

// Basic Mermaid syntax highlighting rules
monaco.languages.setMonarchTokensProvider('mermaid', {
  tokenizer: {
    root: [
      // Diagram types
      [/\b(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|gantt|pie|erDiagram)\b/, 'keyword'],
      
      // Keywords and directives
      [/\b(title|dateFormat|section|participant|as|->>|-->>|->|-->|note|activate|deactivate|loop|alt|else|opt|par|and|end|class|abstract|interface|extends|implements|namespace|package|enum|direction|graph|TB|BT|LR|RL)\b/, 'keyword'],
      
      // Operators and arrows
      [/->>|-->>|->|-->/, 'operator'],
      [/[=<>|]/, 'operator'],
      
      // Comments
      [/\/\//, 'comment', '@comment'],
      
      // Strings
      [/'[^']*'/, 'string'],
      [/"[^"]*"/, 'string'],
      
      // Numbers
      [/\b\d+\b/, 'number'],
      
      // Identifiers
      [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier']
    ],
    comment: [
      [/[^\/]/, 'comment'],
      [/\/\//, 'comment', '@push'],
      [/\/\//, 'comment', '@pop'],
      [/^\s*\*/, 'comment'],
      [/\*\//, 'comment', '@pop']
    ]
  }
});

// Language configuration
monaco.languages.setLanguageConfiguration('mermaid', {
  comments: {
    lineComment: '//'
  },
  brackets: [
    ['[', ']'],
    ['(', ')'],
    ['{', '}']
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '{', close: '}' },
    { open: "'", close: "'" },
    { open: '"', close: '"' }
  ]
});

// Template code for diagram types
const diagramTemplates = {
  'flowchart': `flowchart TD
    A[Start] --> B{Condition}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
  'sequenceDiagram': `sequenceDiagram
    participant A as Client
    participant B as Server
    A->>B: Request
    B-->>A: Response`,
  'classDiagram': `classDiagram
    class Animal {
        +String name
        +void eat()
    }
    class Dog {
        +void bark()
    }
    Animal <|-- Dog`,
  'stateDiagram': `stateDiagram-v2
    [*] --> Active
    Active --> Inactive: Deactivate
    Inactive --> Active: Activate
    Inactive --> [*]: Terminate`,
  'gantt': `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1: a1, 2023-01-01, 30d
    section Phase 2
    Task 2: a2, after a1, 20d`,
  'pie': `pie
    title Favorite Foods
    "Pizza": 30
    "Burger": 25
    "Sushi": 45`
};

const App: React.FC = () => {
  const [diagramType, setDiagramType] = useState<string>('sequenceDiagram');
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_ZOOM = 500;
  const MIN_ZOOM = 10;
  const ZOOM_STEP = 10;

  // Monaco Editor state
  const [code, setCode] = useState<string>(diagramTemplates.sequenceDiagram);

  // Monaco Editor options
  const editorOptions: any = {
    language: 'mermaid', // Use our custom mermaid language
    theme: 'vs-light',
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
    lineNumbers: 'on', // Enable line numbers
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    wrappingIndent: 'indent',
    tabSize: 2
  };

  // Handle editor content changes
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      renderMermaid(value);
    }
  };

  // Initialize Mermaid and render chart
  useEffect(() => {
    // Initialize Mermaid with basic configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });

    // Render default chart on load
    const renderDefaultChart = async () => {
      try {
        // Simplified render call - Mermaid doesn't expect config as third parameter
        const result = await mermaid.render('mermaid-chart', diagramTemplates.sequenceDiagram);
        setMermaidSvg(result.svg);
      } catch (error: any) {
        console.error('Default chart render error:', error);
        setMermaidSvg(`<div style="color: red; padding: 2rem;">Render error: ${error.message}</div>`);
      }
    };

    renderDefaultChart();
  }, []);

  // Render Mermaid chart when editor content changes
  const renderMermaid = async (code: string) => {
    try {
      if (!code.trim()) {
        setMermaidSvg('<div style="color: #666; padding: 2rem;">Enter Mermaid code to see the preview</div>');
        return;
      }

      // Render Mermaid chart - remove the third parameter that's causing issues
      const result = await mermaid.render('mermaid-chart', code);
      setMermaidSvg(result.svg);
    } catch (error: any) {
      console.error('Mermaid rendering error:', error);
      setMermaidSvg(`<div style="color: red; padding: 2rem;">Render error: ${error.message}</div>`);
    }
  };

  // Handle diagram type change
  const handleDiagramTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setDiagramType(newType);
    
    // Get the template for the selected diagram type
    const template = diagramTemplates[newType as keyof typeof diagramTemplates];
    if (template) {
      // Set the new content directly for Monaco editor
      setCode(template);
      // Render immediately
      renderMermaid(template);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  };

  // Drag functions
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX - translateX);
    setStartY(e.clientY - translateY);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslateX(e.clientX - startX);
    setTranslateY(e.clientY - startY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));

    if (newZoomLevel !== zoomLevel && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseXInContainer = e.clientX - containerRect.left;
      const mouseYInContainer = e.clientY - containerRect.top;

      const oldScale = zoomLevel / 100;
      const newScale = newZoomLevel / 100;

      const mouseXOnContent = (mouseXInContainer - translateX) / oldScale;
      const mouseYOnContent = (mouseYInContainer - translateY) / oldScale;

      setTranslateX(mouseXInContainer - (mouseXOnContent * newScale));
      setTranslateY(mouseYInContainer - (mouseYOnContent * newScale));
      setZoomLevel(newZoomLevel);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Fullscreen failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Copy code to clipboard
  const copyCode = async () => {
    try {
      if (!code) throw new Error('No code to copy');

      await navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Copy failed, please copy manually');
    }
  };

  // Download SVG
  const downloadSvg = () => {
    const svgElement = document.querySelector('#mermaid-chart svg');
    if (!svgElement) {
      alert('No chart to download');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.download = 'mermaid-chart.svg';
      downloadLink.href = url;
      downloadLink.style.display = 'none';

      document.body.appendChild(downloadLink);
      downloadLink.click();

      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('SVG download failed:', error);
      alert('SVG download failed, please try again');
    }
  };

  // Clear editor
  const clearEditor = () => {
    setCode('');
    renderMermaid('');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Mermaid Online Editor</h1>
      </header>

      <div className="app-main">
        <div className="editor-container">
          <div className="editor-header">
            <label htmlFor="diagram-type">Diagram Type:</label>
            <select id="diagram-type" value={diagramType} onChange={handleDiagramTypeChange}>
              <option value="flowchart">Flowchart</option>
              <option value="sequenceDiagram">Sequence Diagram</option>
              <option value="classDiagram">Class Diagram</option>
              <option value="stateDiagram">State Diagram</option>
              <option value="gantt">Gantt Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
            <div className="editor-toolbar">
              <button id="copy-btn" className="toolbar-btn" title="Copy Code" onClick={copyCode}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
              </button>
              <button id="clear-btn" className="toolbar-btn" title="Clear" onClick={clearEditor}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="editor-content">
            <Editor
              height="100%"
              language="mermaid"
              value={code}
              options={editorOptions}
              onChange={handleEditorChange}
              className="code-editor"
            />
          </div>
        </div>

        <div className="preview-container" ref={containerRef}>
          <div className="preview-toolbar">
            <button id="zoom-out" className="toolbar-btn" title="Zoom Out" onClick={zoomOut}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7 10.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1z"/>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm10 1a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V1z"/>
              </svg>
            </button>
            <button id="zoom-in" className="toolbar-btn" title="Zoom In" onClick={zoomIn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.5 14a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1v1a.5.5 0 0 0 .5.5h1zM3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm10 1a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V1z"/>
              </svg>
            </button>
            <button id="download-svg-btn" className="toolbar-btn" title="Download SVG" onClick={downloadSvg}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
            <button id="download-png-btn" className="toolbar-btn" title="Download PNG" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M6.5 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                <path d="M3.051 3.15a2.5 2.5 0 0 1 3.89-1.005l-.002.003A2.5 2.5 0 0 1 8.005 5H8a2.5 2.5 0 0 1 2.5-2.5v.003a2.5 2.5 0 0 1 1.77 4.208 2.5 2.5 0 0 1-.586.856 2.5 2.5 0 0 1-3.764 0 2.5 2.5 0 0 1-.586-.856A2.5 2.5 0 0 1 5.5 5.003V5a2.5 2.5 0 0 1-2.449-2.85z"/>
                <path d="M12 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                <path d="M9.5 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                <path d="M6.5 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                <path d="M12 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                <path d="M9.5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                <path d="M6.5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              </svg>
            </button>
            <button id="fullscreen-btn" className="toolbar-btn" title="Fullscreen" onClick={toggleFullscreen}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
              </svg>
            </button>
          </div>
          <div
            id="mermaid-preview"
            ref={previewRef}
            className="mermaid"
            dangerouslySetInnerHTML={{ __html: mermaidSvg }}
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel / 100})`,
              transformOrigin: '0 0'
            }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onWheel={handleWheel}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
