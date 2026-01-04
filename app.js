document.addEventListener('DOMContentLoaded', () => {
    // Initialize Mermaid
    mermaid.initialize({
        startOnLoad: false, // Disable auto-loading, manually control rendering
        theme: 'default',
        securityLevel: 'loose'
    });

    // Get DOM elements
    const previewContainer = document.getElementById('preview-container');
    const mermaidPreview = document.getElementById('mermaid-preview');
    const copyBtn = document.getElementById('copy-btn');
    const downloadSvgBtn = document.getElementById('download-svg-btn');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const clearBtn = document.getElementById('clear-btn');
    const diagramType = document.getElementById('diagram-type');
    
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

    // Initialize Tiptap Editor
    // Handle Tiptap Core and extensions loading - use correct global variable names
    const Editor = window.Tiptap?.Editor || window.TiptapCore?.Editor;
    const Document = window['@tiptap/extension-document']?.Document || window.TiptapExtensionDocument?.Document;
    const Paragraph = window['@tiptap/extension-paragraph']?.Paragraph || window.TiptapExtensionParagraph?.Paragraph;
    const Text = window['@tiptap/extension-text']?.Text || window.TiptapExtensionText?.Text;
    const Code = window['@tiptap/extension-code']?.Code || window.TiptapExtensionCode?.Code;
    const CodeBlock = window['@tiptap/extension-code-block']?.CodeBlock || window.TiptapExtensionCodeBlock?.CodeBlock;
    const CodeBlockLowlight = window['@tiptap/extension-code-block-lowlight']?.CodeBlockLowlight || window.TiptapExtensionCodeBlockLowlight?.CodeBlockLowlight;
    
    // Check if all required components are loaded
    if (!Editor || !Document || !Paragraph || !Text || !Code || !CodeBlockLowlight) {
        console.error('Tiptap components failed to load');
        console.log('Available globals:', Object.keys(window).filter(key => 
            key.startsWith('Tiptap') || key.startsWith('@tiptap')));
        console.log('Tiptap:', window.Tiptap);
        console.log('TiptapCore:', window.TiptapCore);
    }
    
    // Create Mermaid language for syntax highlighting
    const mermaidLanguage = {
        name: 'mermaid',
        aliases: ['flowchart', 'sequence', 'class', 'state', 'gantt', 'pie'],
        keywords: {
            keyword: [
                'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 
                'gantt', 'pie', 'participant', 'actor', 'title', 'section', 'note',
                'loop', 'alt', 'else', 'opt', 'par', 'and', 'or', 'break', 'critical',
                'note', 'state', 'class', 'interface', 'abstract', 'static', 'final',
                'direction', 'TB', 'TD', 'BT', 'RL', 'LR', 'rank', 'left', 'right',
                'up', 'down', 'over', 'inside'
            ],
            literal: [
                'true', 'false', 'null' 
            ]
        },
        contains: [
            {
                className: 'string',
                begin: '[',
                end: ']'
            },
            {
                className: 'string',
                begin: '(',
                end: ')' 
            },
            {
                className: 'string',
                begin: '{',
                end: '}'
            },
            {
                className: 'comment',
                begin: '%%',
                end: '$'
            },
            {
                className: 'number',
                begin: '\\b\\d+\\b'
            }
        ]
    };
    
    // Register Mermaid language with lowlight
    if (lowlight.register) {
        lowlight.register(mermaidLanguage);
    }
    
    // Create editor instance
    let mermaidCode;
    
    try {
        if (!Editor || !Document || !Paragraph || !Text || !CodeBlockLowlight) {
            throw new Error('Missing required Tiptap components');
        }
        
        mermaidCode = Editor.create({
            element: document.getElementById('mermaid-code'),
            extensions: [
                Document,
                Paragraph,
                Text,
                Code,
                CodeBlockLowlight.configure({
                    lowlight,
                    defaultLanguage: 'mermaid'
                })
            ],
            content: diagramTemplates['sequenceDiagram']
        });
        
        console.log('Tiptap editor created successfully');
        
        // Add event listener for content changes
        mermaidCode.on('update', renderMermaid);
        
        // Initial render
        renderMermaid();
    } catch (error) {
        console.error('Failed to create Tiptap editor:', error);
        console.log('Available Tiptap components:', {
            Editor: !!Editor,
            Document: !!Document,
            Paragraph: !!Paragraph,
            Text: !!Text,
            Code: !!Code,
            CodeBlockLowlight: !!CodeBlockLowlight
        });
        
        // Fallback to simple textarea if Tiptap fails
        const fallbackTextarea = document.createElement('textarea');
        fallbackTextarea.id = 'fallback-editor';
        fallbackTextarea.className = 'code-editor fallback-editor';
        fallbackTextarea.value = diagramTemplates['sequenceDiagram'];
        fallbackTextarea.style.width = '100%';
        fallbackTextarea.style.height = '100%';
        fallbackTextarea.style.padding = '10px';
        fallbackTextarea.style.boxSizing = 'border-box';
        
        const editorContainer = document.getElementById('mermaid-code');
        editorContainer.innerHTML = '';
        editorContainer.appendChild(fallbackTextarea);
        
        // Update render function to work with textarea
        fallbackTextarea.addEventListener('input', () => {
            renderMermaidWithFallback(fallbackTextarea.value);
        });
        
        // Initial render with fallback
        renderMermaidWithFallback(fallbackTextarea.value);
        
        // Update global render function reference
        window.renderMermaid = () => {
            renderMermaidWithFallback(fallbackTextarea.value);
        };
    }
    
    // Fallback render function for textarea
    async function renderMermaidWithFallback(code) {
        try {
            const result = await mermaid.render('mermaid-chart', code);
            mermaidPreview.innerHTML = result.svg;
            updateTransform();
        } catch (error) {
            console.error('Render error:', error);
            mermaidPreview.innerHTML = `<div style="color: red; padding: 2rem;">Render error: ${error.message}</div>`;
        }
    }


    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // Zoom and pan state
    let zoomLevel = 100;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    const MAX_ZOOM = 500;
    const MIN_ZOOM = 10;
    const ZOOM_STEP = 10;


    // Render Mermaid chart
    async function renderMermaid() {
        // Get text content from editor - use different API methods depending on availability
        let code;
        
        try {
            // First check if mermaidCode editor instance exists
            if (!mermaidCode || typeof mermaidCode !== 'object') {
                // Check if fallback textarea is available
                const fallbackEditor = document.getElementById('fallback-editor');
                if (fallbackEditor) {
                    code = fallbackEditor.value;
                } else {
                    throw new Error('No editor instance or fallback textarea available');
                }
            } else {
                // Try different API methods to get text content
                if (typeof mermaidCode.getText === 'function') {
                    code = mermaidCode.getText();
                } else if (typeof mermaidCode.content === 'string') {
                    code = mermaidCode.content;
                } else if (typeof mermaidCode.state?.doc?.textContent === 'string') {
                    code = mermaidCode.state.doc.textContent;
                } else {
                    throw new Error('Could not get text content from Tiptap editor');
                }
            }
            
            // Debug: Log the code being rendered
            console.log('Rendering code:', code);
            console.log('Code type:', typeof code);
            console.log('Code length:', code ? code.length : 'undefined');
            
            // Ensure code is a string and not empty
            if (typeof code !== 'string') {
                code = String(code || '');
            }
            
            // Trim whitespace and check if code is not empty
            code = code.trim();
            if (!code) {
                mermaidPreview.innerHTML = `<div style="color: #666; padding: 2rem;">Enter Mermaid code to see the preview</div>`;
                return;
            }
            
            // Use Mermaid 10 Promise API for rendering
            const result = await mermaid.render('mermaid-chart', code);
            
            // Check if render result is valid
            if (!result || !result.svg) {
                throw new Error('Invalid render result from Mermaid');
            }
            
            mermaidPreview.innerHTML = result.svg;
            // Apply current zoom and pan transforms
            updateTransform();
        } catch (error) {
            console.error('Render error:', error);
            console.error('Error stack:', error.stack);
            mermaidPreview.innerHTML = `<div style="color: red; padding: 2rem;">Render error: ${error.message}</div>`;
        }
    }

    // Update transform
    function updateTransform() {
        const scale = zoomLevel / 100;
        mermaidPreview.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // Zoom in
    function zoomIn() {
        if (zoomLevel < MAX_ZOOM) {
            zoomLevel += ZOOM_STEP;
            updateTransform();
        }
    }

    // Zoom out
    function zoomOut() {
        if (zoomLevel > MIN_ZOOM) {
            zoomLevel -= ZOOM_STEP;
            updateTransform();
        }
    }

    // Handle drag start
    function handleDragStart(e) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    }

    // Handle drag move
    function handleDragMove(e) {
        if (isDragging) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        }
    }

    // Handle drag end
    function handleDragEnd() {
        isDragging = false;
    }

    // Handle wheel zoom
    function handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
        
        if (newZoomLevel !== zoomLevel) {
            // Get preview container bounding rectangle
            const containerRect = previewContainer.getBoundingClientRect();
            
            // Calculate mouse coordinates within preview container
            const mouseXInContainer = e.clientX - containerRect.left;
            const mouseYInContainer = e.clientY - containerRect.top;
            
            // Calculate current and new zoom scales
            const oldScale = zoomLevel / 100;
            const newScale = newZoomLevel / 100;
            
            // Calculate mouse coordinates relative to chart content (considering current translate and scale)
            const mouseXOnContent = (mouseXInContainer - translateX) / oldScale;
            const mouseYOnContent = (mouseYInContainer - translateY) / oldScale;
            
            // Calculate new translate to keep mouse-pointed content in same position
            translateX = mouseXInContainer - (mouseXOnContent * newScale);
            translateY = mouseYInContainer - (mouseYOnContent * newScale);
            
            zoomLevel = newZoomLevel;
            updateTransform();
        }
    }

    // Toggle fullscreen
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            previewContainer.requestFullscreen().catch(err => {
                console.error(`Fullscreen failed: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Listen for fullscreen changes
    function handleFullscreenChange() {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3v3H2V2h4zm-2 9h3v3H3zm9-3V9h3v4zm0-10v3h-3V2z"/><path d="M11 13h-1v-1h1v1zm-1-1V8h-1v4zm-4 1h1v1H6v-1zm1-1V3h1v8zm7-10v1h-1V3zm-1 10h1v1h-1zm-11 0v-1h1v1zm1-1H3V3h1zm10-2h1V6h-1zm-10 2H2v1h1zm0-3h1V2H2zm12 0h-1v1h1z"/></svg>';
            fullscreenBtn.title = 'Exit Fullscreen';
        } else {
            fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/></svg>';
            fullscreenBtn.title = 'Fullscreen';
        }
    }

    // Copy code to clipboard
    async function copyCode() {
        try {
            let code;
            
            // Check if using Tiptap editor or fallback textarea
            if (mermaidCode && typeof mermaidCode.getText === 'function') {
                code = mermaidCode.getText();
            } else {
                const fallbackEditor = document.getElementById('fallback-editor');
                if (fallbackEditor) {
                    code = fallbackEditor.value;
                } else {
                    throw new Error('No editor found');
                }
            }
            
            await navigator.clipboard.writeText(code);
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
            copyBtn.title = 'Copied';
            setTimeout(() => {
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
                copyBtn.title = 'Copy Code';
            }, 2000);
        } catch (error) {
            console.error('Copy failed:', error);
            alert('Copy failed, please copy manually');
        }
    }

    // Download chart as SVG
    function downloadSvg() {
        const svgElement = mermaidPreview.querySelector('svg');
        if (!svgElement) {
            alert('No chart to download');
            return;
        }

        try {
            // Download as SVG (vector format)
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.download = 'mermaid-chart.svg';
            downloadLink.href = url;
            downloadLink.style.display = 'none';
            
            // Append to document to ensure click works
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // Clean up
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('SVG download failed:', error);
            alert('SVG下载失败，请重试。错误信息: ' + error.message);
        }
    }

    // Download chart as high-quality PNG
    function downloadPng() {
        const svgElement = mermaidPreview.querySelector('svg');
        if (!svgElement) {
            alert('No chart to download');
            return;
        }

        try {
            // Download as high-quality PNG
            const originalWidth = svgElement.getAttribute('width') || svgElement.clientWidth;
            const originalHeight = svgElement.getAttribute('height') || svgElement.clientHeight;
            
            // Create a copy of the SVG
            const svgCopy = svgElement.cloneNode(true);
            svgCopy.setAttribute('width', originalWidth);
            svgCopy.setAttribute('height', originalHeight);
            svgCopy.setAttribute('style', 'transform: none;');
            
            const svgData = new XMLSerializer().serializeToString(svgCopy);
            
            // Properly encode SVG data for image loading
            const encodedSvg = encodeURIComponent(svgData)
                .replace(/\+/g, '%20')
                .replace(/%20/g, ' ')
                .replace(/%3D/g, '=')
                .replace(/%3A/g, ':')
                .replace(/%2F/g, '/')
                .replace(/%22/g, '\"');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const dpr = window.devicePixelRatio || 2;
            const qualityScale = 2; // Additional quality multiplier
            
            const img = new Image();
            img.onload = () => {
                try {
                    // Use high resolution for PNG
                    const targetWidth = img.width * qualityScale * dpr;
                    const targetHeight = img.height * qualityScale * dpr;
                    
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    // Set canvas background to white
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                    
                    // Draw image with high quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    
                    const pngData = canvas.toDataURL('image/png', 1.0); // 1.0 = maximum quality
                    const downloadLink = document.createElement('a');
                    downloadLink.download = 'mermaid-chart.png';
                    downloadLink.href = pngData;
                    downloadLink.style.display = 'none';
                    
                    // Append to document to ensure click works
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    
                    // Clean up
                    document.body.removeChild(downloadLink);
                } catch (pngError) {
                    console.error('PNG generation failed:', pngError);
                    alert('PNG generation failed. Please try SVG format instead.');
                }
            };
            
            img.onerror = () => {
                console.error('SVG image loading failed');
                alert('SVG to PNG conversion failed. Please try SVG format instead.');
            };
            
            // Use data URL with proper encoding
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
        } catch (error) {
            console.error('PNG download failed:', error);
            alert('PNG下载失败，请重试。错误信息: ' + error.message);
        }
    }

    // Clear editor
    function clearEditor() {
        if (confirm('Are you sure you want to clear the current code?')) {
            // Check if using Tiptap editor or fallback textarea
            if (mermaidCode && mermaidCode.commands && typeof mermaidCode.commands.setContent === 'function') {
                mermaidCode.commands.setContent('');
                renderMermaid();
            } else {
                const fallbackEditor = document.getElementById('fallback-editor');
                if (fallbackEditor) {
                    fallbackEditor.value = '';
                    renderMermaidWithFallback('');
                }
            }
        }
    }





    // Load template when changing diagram type
    function changeDiagramType() {
        const selectedType = diagramType.value;
        const templateContent = diagramTemplates[selectedType] || '';
        
        // Check if using Tiptap editor or fallback textarea
        if (mermaidCode && mermaidCode.commands && typeof mermaidCode.commands.setContent === 'function') {
            mermaidCode.commands.setContent(templateContent);
            renderMermaid();
        } else {
            const fallbackEditor = document.getElementById('fallback-editor');
            if (fallbackEditor) {
                fallbackEditor.value = templateContent;
                renderMermaidWithFallback(templateContent);
            }
        }
    }

    // Event listeners
    copyBtn.addEventListener('click', copyCode);
    downloadSvgBtn.addEventListener('click', downloadSvg);
    downloadPngBtn.addEventListener('click', downloadPng);
    clearBtn.addEventListener('click', clearEditor);
    diagramType.addEventListener('change', changeDiagramType);

    
    // Zoom events
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    
    // Drag events
    previewContainer.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd);
    
    // Wheel zoom event
    previewContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    // Fullscreen events
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    


    // Initial render
    renderMermaid();
});