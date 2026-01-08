import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import mermaid from 'mermaid';
import { Analytics } from '@vercel/analytics/react';
import './App.css';
import icon from './assets/icon.png';

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
  'flowchart': `graph TD
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

// Define chart style type
interface ChartStyleConfig {
  name: string;
  theme: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | 'null';
  themeVariables: {
    primaryColor: string;
    primaryTextColor: string;
    primaryBorderColor: string;
    lineColor: string;
    textColor: string;
    secondaryColor: string;
    tertiaryColor?: string;
    secondaryBorderColor?: string;
    tertiaryBorderColor?: string;
    // Class diagram specific variables
    classHeaderBackgroundColor?: string;
    classHeaderBorderColor?: string;
    classHeaderTextColor?: string;
    classBackgroundColor?: string;
    classBorderColor?: string;
    classTextColor?: string;
  };
  cssFilter?: string;
}

// Define chart styles type
interface ChartStyles {
  default: ChartStyleConfig;
  handDrawn: ChartStyleConfig;
  dark: ChartStyleConfig;
  outline: ChartStyleConfig;
}

const App: React.FC = () => {
  const [diagramType, setDiagramType] = useState<string>('sequenceDiagram');
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [chartStyle, setChartStyle] = useState<'default' | 'handDrawn' | 'dark' | 'outline'>('default');
  // Notification state
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');
  const [notificationVisible, setNotificationVisible] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define available chart styles
  const chartStyles: ChartStyles = {
    default: {
      name: 'Default',
      theme: 'base',
      themeVariables: {
        primaryColor: '#3b82f6', // 更清晰的蓝色
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#2563eb',
        lineColor: '#4b5563', // 柔和的深灰色线条
        textColor: '#374151', // 柔和的深灰色文字
        secondaryColor: '#ec4899',
        tertiaryColor: '#f9fafb',
        // Class diagram specific colors
        classHeaderBackgroundColor: '#f7e9b9', // 浅黄色标题栏
        classHeaderBorderColor: '#c4a767', // 棕色边框
        classHeaderTextColor: '#374151', // 深灰色文字
        classBackgroundColor: '#ffffff', // 白色内容区
        classBorderColor: '#c4a767', // 棕色边框
        classTextColor: '#374151' // 深灰色文字
      }
    },
    handDrawn: {
      name: 'Hand Drawn',
      theme: 'base',
      themeVariables: {
        primaryColor: '#3b82f6', // 更清晰的蓝色
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#2563eb',
        lineColor: '#4b5563', // 柔和的深灰色线条
        textColor: '#374151', // 柔和的深灰色文字
        secondaryColor: '#ec4899',
        tertiaryColor: '#f9fafb',
        // Class diagram specific colors
        classHeaderBackgroundColor: '#f7e9b9', // 浅黄色标题栏
        classHeaderBorderColor: '#c4a767', // 棕色边框
        classHeaderTextColor: '#374151', // 深灰色文字
        classBackgroundColor: '#ffffff', // 白色内容区
        classBorderColor: '#c4a767', // 棕色边框
        classTextColor: '#374151' // 深灰色文字
      },
      cssFilter: 'url(#handDrawnFilter)'
    },
    dark: {
      name: 'Dark',
      theme: 'dark',
      themeVariables: {
        primaryColor: '#8b5cf6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#7c3aed',
        lineColor: '#e5e7eb',
        textColor: '#e5e7eb',
        secondaryColor: '#ec4899',
        tertiaryColor: '#374151',
        // Class diagram specific colors
        classHeaderBackgroundColor: '#7c3aed', // 紫色标题栏
        classHeaderBorderColor: '#5b21b6', // 深紫色边框
        classHeaderTextColor: '#ffffff', // 白色文字
        classBackgroundColor: '#1f2937', // 深色内容区
        classBorderColor: '#5b21b6', // 深紫色边框
        classTextColor: '#e5e7eb' // 浅色文字
      }
    },
    outline: {
      name: 'Outline',
      theme: 'base',
      themeVariables: {
        primaryColor: 'transparent',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#6366f1',
        lineColor: '#1f2937',
        textColor: '#1f2937',
        secondaryColor: 'transparent',
        secondaryBorderColor: '#ec4899',
        tertiaryColor: 'transparent',
        tertiaryBorderColor: '#9ca3af',
        // Class diagram specific colors
        classHeaderBackgroundColor: 'transparent', // 透明标题栏
        classHeaderBorderColor: '#6366f1', // 蓝色边框
        classHeaderTextColor: '#1f2937', // 深灰色文字
        classBackgroundColor: 'transparent', // 透明内容区
        classBorderColor: '#6366f1', // 蓝色边框
        classTextColor: '#1f2937' // 深灰色文字
      }
    }
  };

  const MAX_ZOOM = 500;
  const MIN_ZOOM = 10;
  const ZOOM_STEP = 10;

  // Monaco Editor state
  const [code, setCode] = useState<string>(diagramTemplates.sequenceDiagram);

  // Monaco Editor options
  const editorOptions: any = {
    language: 'mermaid', // Use our custom mermaid language
    theme: 'vs-light', // Keep vs-light theme for readability
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, Monaco, Menlo, Ubuntu Mono, monospace',
    lineNumbers: 'on', // Enable line numbers
    minimap: { enabled: true, scale: 1, showSlider: 'always' },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    wrappingIndent: 'indent',
    tabSize: 2,
    backgroundColor: '#fafafa', // Match our updated editor background color
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'all'
  };

  // Handle editor content changes
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      console.log('handleEditorChange: value changed, calling setCode');
      setCode(value);
      // renderMermaid will be called automatically by useEffect when code changes
    }
  };

  // Initialize Mermaid with basic configuration
  useEffect(() => {
    // Initialize Mermaid with basic configuration
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose'
    });

    // Render default chart on load
    const renderDefaultChart = async () => {
      try {
        const result = await mermaid.render('mermaid-chart-default', diagramTemplates.sequenceDiagram);
        
        // Apply CSS filter if defined for the style
        const currentStyle = chartStyles[chartStyle];
        if (currentStyle.cssFilter) {
          setMermaidSvg(result.svg.replace('<svg', `<svg style="filter: ${currentStyle.cssFilter}"`));
        } else {
          setMermaidSvg(result.svg);
        }
      } catch (error: any) {
        console.error('Default chart render error:', error);
        setMermaidSvg(`<div style="color: red; padding: 2rem;">Render error: ${error.message}</div>`);
      }
    };

    renderDefaultChart();
  }, []);

  // Render chart whenever code changes
  useEffect(() => {
    console.log('useEffect: code changed, calling renderMermaid');
    renderMermaid(code);
  }, [code]);

  // Render chart whenever style changes
  useEffect(() => {
    console.log('useEffect: style changed, calling renderMermaid');
    renderMermaid(code);
  }, [chartStyle, code]);

  // Render Mermaid chart when editor content changes
  const renderMermaid = async (code: string) => {
    console.log('renderMermaid: Start rendering with code:', code.substring(0, 50) + '...');
    try {
      if (!code.trim()) {
        console.log('renderMermaid: Empty code, showing placeholder');
        setMermaidSvg('<div style="color: #666; padding: 2rem;">Enter Mermaid code to see the preview</div>');
        return;
      }

      // Get current style configuration
      const currentStyle = chartStyles[chartStyle];
      
      // Update Mermaid theme configuration before rendering
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: currentStyle.theme,
        themeVariables: currentStyle.themeVariables
      });
      
      // Render Mermaid chart - use unique ID to avoid conflicts
      const uniqueId = 'mermaid-chart-' + Date.now();
      console.log('renderMermaid: Calling mermaid.render with ID:', uniqueId);
      const result = await mermaid.render(uniqueId, code);
      console.log('renderMermaid: Render completed, result:', result.svg.substring(0, 100) + '...');
      
      // Apply CSS filter if defined for the style
      if (currentStyle.cssFilter) {
        setMermaidSvg(result.svg.replace('<svg', `<svg style="filter: ${currentStyle.cssFilter}"`));
      } else {
        setMermaidSvg(result.svg);
      }
      console.log('renderMermaid: setMermaidSvg called');
    } catch (error: any) {
      console.error('Mermaid rendering error:', error);
      setMermaidSvg(`<div style="color: red; padding: 2rem;">Render error: ${error.message}</div>`);
    }
  };

  // Handle diagram type change
  const handleDiagramTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    console.log('handleDiagramTypeChange: Changing to', newType);
    setDiagramType(newType);
    
    // Get the template for the selected diagram type
    const template = diagramTemplates[newType as keyof typeof diagramTemplates];
    if (template) {
      // Set the new content directly for Monaco editor
      console.log('handleDiagramTypeChange: Setting code to template');
      setCode(template);
      // renderMermaid will be called automatically by useEffect when code changes
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
    e.preventDefault(); // 阻止默认文本选择行为
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
    const svgElement = document.querySelector('#mermaid-preview svg');
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

  // Download PNG
  const downloadPng = () => {
    const svgElement = document.querySelector('#mermaid-preview svg');
    if (!svgElement) {
      alert('No chart to download');
      return;
    }

    try {
      // Get the SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }
      
      // Create an image object
      const img = new Image();
      
      // Set up the image loading
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
        
        // Convert canvas to PNG
        const pngData = canvas.toDataURL('image/png');
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.download = 'mermaid-chart.png';
        downloadLink.href = pngData;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.onerror = () => {
        throw new Error('Failed to load SVG as image');
      };
      
      // Set the image source to the SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error('PNG download failed:', error);
      alert('PNG download failed, please try again');
    }
  };

  // Copy image to clipboard
  const copyImage = () => {
    const svgElement = document.querySelector('#mermaid-preview svg');
    if (!svgElement) {
      showNotification('No chart to copy', 'error');
      return;
    }

    try {
      // Get the SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }
      
      // Create an image object
      const img = new Image();
      
      // Set up the image loading
      img.onload = async () => {
        try {
          // Calculate scale factor based on current zoom level
          const scaleFactor = zoomLevel / 100;
          
          // Use scroll dimensions to get the full SVG content size
          const svgWidth = svgElement.scrollWidth || img.width;
          const svgHeight = svgElement.scrollHeight || img.height;
          
          // Set canvas size to match scaled image
          canvas.width = svgWidth * scaleFactor;
          canvas.height = svgHeight * scaleFactor;
          
          // Reset all transformations
          context.setTransform(1, 0, 0, 1, 0, 0);
          
          // Draw the image scaled to the canvas size
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to PNG and copy to clipboard
          canvas.toBlob(async (blob) => {
            if (!blob) {
              throw new Error('Failed to create blob from canvas');
            }
            
            // Copy to clipboard
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            
            // Show success message
            showNotification('Chart copied to clipboard!', 'success');
          }, 'image/png');
        } catch (error) {
          console.error('Failed to copy image:', error);
          showNotification('Failed to copy image, please try again', 'error');
        }
      };
      
      img.onerror = () => {
        throw new Error('Failed to load SVG as image');
      };
      
      // Set the image source to the SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error('Copy image failed:', error);
      showNotification('Copy image failed, please try again', 'error');
    }
  };

  // Clear editor
  const clearEditor = () => {
    setCode('');
    renderMermaid('');
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setNotificationVisible(true);
  };

  // Auto hide notification after 3 seconds
  useEffect(() => {
    if (notificationVisible) {
      const timer = setTimeout(() => {
        setNotificationVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notificationVisible]);

  return (
    <div className="app-container">
      {/* SVG filter for hand-drawn style */}
      <svg style={{ display: 'none' }}>
        <filter id="handDrawnFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" seed="1"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>
      <Analytics />
      
      {/* Notification Component */}
      {notificationVisible && (
        <div 
          className={`notification notification-${notificationType}`}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '1000',
            opacity: notificationVisible ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            backgroundColor: notificationType === 'success' ? '#10b981' : 
                           notificationType === 'error' ? '#ef4444' : '#3b82f6'
          }}
        >
          {notificationMessage}
        </div>
      )}
      
      <header className="app-header">
        <div className="header-content">
          <img src={icon} alt="Logo" className="header-logo" />
          <h1 className="artistic-font">Mermaid Online Editor</h1>
        </div>
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
            <label htmlFor="chart-style">Style:</label>
            <select id="chart-style" value={chartStyle} onChange={(e) => setChartStyle(e.target.value as 'default' | 'handDrawn' | 'dark' | 'outline')} className="style-select">
              {Object.entries(chartStyles).map(([key, style]) => (
                <option key={key} value={key}>{style.name}</option>
              ))}
            </select>
            <button id="zoom-out" className="toolbar-btn" title="Zoom Out" onClick={zoomOut}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                <path d="M4 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
            <button id="zoom-in" className="toolbar-btn" title="Zoom In" onClick={zoomIn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                <path d="M7 3.5a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 7 3.5z"/>
              </svg>
            </button>
            <button id="download-svg-btn" className="toolbar-btn download-btn" title="Download SVG" onClick={downloadSvg}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="16" height="16" fill="#1f2937">
                <path d="M220.16 865.166222V158.947556h338.147556v184.32c0 16.952889 13.767111 30.72 30.72 30.72h184.433777v148.48h61.44V312.433778h-0.796444c0.682667-9.102222-2.616889-18.090667-8.988445-24.576L643.413333 106.496c-6.712889-6.599111-16.042667-9.784889-25.372444-8.874667H220.16c-34.019556 0-61.553778 27.534222-61.553778 61.44v706.218667c0 33.905778 27.534222 61.44 61.553778 61.44h367.729778v-61.44H220.16z m399.587556-691.541333l139.036444 138.808889H619.747556v-138.808889z"></path>
                <path d="M802.702222 903.850667L923.648 782.791111 882.915556 743.196444l-91.363556 91.477334V575.032889h-58.026667v259.640889l-91.363555-91.477334-40.846222 40.846223 121.059555 121.059555 40.732445 40.732445 39.594666-41.984zM408.007111 482.417778c-5.461333-3.185778-16.839111-7.395556-32.768-12.288-14.904889-4.778667-19.228444-6.712889-20.366222-7.281778-4.551111-2.389333-6.712889-5.461333-6.712889-9.443556 0-4.664889 1.820444-7.736889 5.802667-9.671111 3.527111-1.934222 8.760889-2.844444 16.042666-2.844444 8.305778 0 14.449778 1.479111 18.204445 4.323555 3.868444 2.844444 6.599111 7.736889 8.078222 14.336l0.568889 2.616889H423.253333l-0.341333-3.754666c-1.251556-14.336-6.712889-25.144889-16.042667-32.085334-8.533333-6.371556-20.593778-9.557333-35.84-9.557333-14.108444 0-25.372444 3.072-34.474666 9.443556-10.126222 6.712889-15.246222 16.270222-15.246223 28.330666 0 12.060444 5.233778 21.390222 15.815112 27.648 3.868444 2.161778 12.970667 5.575111 28.785777 10.581334 17.976889 5.461333 22.414222 7.395556 23.324445 7.850666 6.485333 3.185778 9.557333 7.281778 9.557333 12.401778 0 2.389333-0.682667 5.916444-6.144 9.216-4.664889 2.616889-11.377778 3.982222-19.569778 3.982222-9.102222 0-15.928889-1.592889-20.252444-4.664889-4.437333-3.299556-7.395556-9.216-8.647111-17.635555l-0.455111-2.958222h-26.396445l0.227556 3.640888c0.910222 16.497778 7.054222 28.899556 18.204444 36.750223 8.988444 6.257778 21.504 9.329778 37.205334 9.329777 16.156444 0 29.013333-3.413333 38.343111-10.126222 9.443556-6.940444 14.222222-16.725333 14.222222-28.785778 0.113778-12.515556-5.802667-22.414222-17.521778-29.354666zM515.185778 419.043556l-31.288889 93.184-31.402667-93.184h-29.127111l45.966222 129.137777H498.346667l45.966222-129.137777zM603.704889 500.167111h32.426667V519.964444c-3.413333 1.820444-6.940444 3.299556-10.695112 4.323556-4.778667 1.251556-10.012444 1.934222-15.587555 1.934222-13.767111 0-24.007111-3.754667-30.264889-11.150222-5.916444-7.054222-8.988444-17.521778-8.988444-31.061333 0-14.336 3.299556-24.917333 10.126222-32.540445 5.916444-7.054222 13.994667-10.467556 24.689778-10.467555 8.647111 0 15.587556 1.706667 20.48 5.233777 4.892444 3.527111 8.192 8.760889 9.671111 15.587556l0.568889 2.730667h26.965333l-0.682667-3.982223c-2.389333-14.336-8.305778-25.372444-17.749333-32.768-9.671111-7.509333-22.528-11.150222-39.253333-11.150222-19.228444 0-34.588444 6.712889-45.738667 20.024889-10.581333 12.288-15.928889 28.330667-15.928889 47.445333 0 19.000889 5.347556 34.816 15.928889 46.762667 11.377778 13.084444 27.534222 19.683556 48.014222 19.683556 11.264 0 21.276444-1.365333 30.72-4.323556 8.988444-2.958222 16.611556-6.940444 23.324445-12.174222l1.251555-1.024v-56.775111h-59.278222v23.893333z"></path>
              </svg>
            </button>
            <button id="download-png-btn" className="toolbar-btn download-btn" title="Download PNG" onClick={downloadPng}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="16" height="16" fill="#1f2937">
                <path d="M220.16 865.166222V158.947556h338.147556v184.32c0 16.952889 13.767111 30.72 30.72 30.72h184.433777v148.48h61.44V312.433778h-0.796444c0.682667-9.102222-2.616889-18.090667-8.988445-24.576L643.413333 106.496c-6.712889-6.599111-16.042667-9.784889-25.372444-8.874667H220.16c-34.019556 0-61.553778 27.534222-61.553778 61.44v706.218667c0 33.905778 27.534222 61.44 61.553778 61.44h367.729778v-61.44H220.16z m399.587556-691.541333l139.036444 138.808889H619.747556v-138.808889z"></path>
                <path d="M802.702222 903.850667L923.648 782.791111 882.915556 743.196444l-91.363556 91.477334V575.032889h-58.026667v259.640889l-91.363555-91.477334-40.846222 40.846223 121.059555 121.059555 40.732445 40.732445 39.594666-41.984zM408.007111 482.417778c-5.461333-3.185778-16.839111-7.395556-32.768-12.288-14.904889-4.778667-19.228444-6.712889-20.366222-7.281778-4.551111-2.389333-6.712889-5.461333-6.712889-9.443556 0-4.664889 1.820444-7.736889 5.802667-9.671111 3.527111-1.934222 8.760889-2.844444 16.042666-2.844444 8.305778 0 14.449778 1.479111 18.204445 4.323555 3.868444 2.844444 6.599111 7.736889 8.078222 14.336l0.568889 2.616889H423.253333l-0.341333-3.754666c-1.251556-14.336-6.712889-25.144889-16.042667-32.085334-8.533333-6.371556-20.593778-9.557333-35.84-9.557333-14.108444 0-25.372444 3.072-34.474666 9.443556-10.126222 6.712889-15.246222 16.270222-15.246223 28.330666 0 12.060444 5.233778 21.390222 15.815112 27.648 3.868444 2.161778 12.970667 5.575111 28.785777 10.581334 17.976889 5.461333 22.414222 7.395556 23.324445 7.850666 6.485333 3.185778 9.557333 7.281778 9.557333 12.401778 0 2.389333-0.682667 5.916444-6.144 9.216-4.664889 2.616889-11.377778 3.982222-19.569778 3.982222-9.102222 0-15.928889-1.592889-20.252444-4.664889-4.437333-3.299556-7.395556-9.216-8.647111-17.635555l-0.455111-2.958222h-26.396445l0.227556 3.640888c0.910222 16.497778 7.054222 28.899556 18.204444 36.750223 8.988444 6.257778 21.504 9.329778 37.205334 9.329777 16.156444 0 29.013333-3.413333 38.343111-10.126222 9.443556-6.940444 14.222222-16.725333 14.222222-28.785778 0.113778-12.515556-5.802667-22.414222-17.521778-29.354666zM515.185778 419.043556l-31.288889 93.184-31.402667-93.184h-29.127111l45.966222 129.137777H498.346667l45.966222-129.137777zM603.704889 500.167111h32.426667V519.964444c-3.413333 1.820444-6.940444 3.299556-10.695112 4.323556-4.778667 1.251556-10.012444 1.934222-15.587555 1.934222-13.767111 0-24.007111-3.754667-30.264889-11.150222-5.916444-7.054222-8.988444-17.521778-8.988444-31.061333 0-14.336 3.299556-24.917333 10.126222-32.540445 5.916444-7.054222 13.994667-10.467556 24.689778-10.467555 8.647111 0 15.587556 1.706667 20.48 5.233777 4.892444 3.527111 8.192 8.760889 9.671111 15.587556l0.568889 2.730667h26.965333l-0.682667-3.982223c-2.389333-14.336-8.305778-25.372444-17.749333-32.768-9.671111-7.509333-22.528-11.150222-39.253333-11.150222-19.228444 0-34.588444 6.712889-45.738667 20.024889-10.581333 12.288-15.928889 28.330667-15.928889 47.445333 0 19.000889 5.347556 34.816 15.928889 46.762667 11.377778 13.084444 27.534222 19.683556 48.014222 19.683556 11.264 0 21.276444-1.365333 30.72-4.323556 8.988444-2.958222 16.611556-6.940444 23.324445-12.174222l1.251555-1.024v-56.775111h-59.278222v23.893333z"></path>
              </svg>
            </button>
            <button id="copy-image-btn" className="toolbar-btn" title="Copy Image" onClick={copyImage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm2.5 1.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-8z"/>
                <path d="M6 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-8zm0 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-8zm0 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-8z"/>
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
            onWheel={handleWheel}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div
              className="mermaid-content"
              dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              style={{
                transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel / 100})`,
                transformOrigin: '0 0'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
