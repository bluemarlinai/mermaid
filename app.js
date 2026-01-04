document.addEventListener('DOMContentLoaded', () => {
    // 初始化 Mermaid
    mermaid.initialize({
        startOnLoad: false, // 关闭自动加载，手动控制渲染
        theme: 'default',
        securityLevel: 'loose'
    });

    // 获取DOM元素
    const mermaidCode = document.getElementById('mermaid-code');
    const previewContainer = document.getElementById('preview-container');
    const mermaidPreview = document.getElementById('mermaid-preview');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const diagramType = document.getElementById('diagram-type');
    const iconGrid = document.getElementById('icon-grid');
    const toggleIcons = document.getElementById('toggle-icons');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // 缩放和平移状态
    let zoomLevel = 100;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    const MAX_ZOOM = 500;
    const MIN_ZOOM = 10;
    const ZOOM_STEP = 10;

    // 图表类型对应的模板代码
    const diagramTemplates = {
        'flowchart': `graph TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作1]
    B -->|否| D[执行操作2]
    C --> E[结束]
    D --> E`,
        'sequenceDiagram': `sequenceDiagram
    participant 客户端
    participant 服务器
    客户端->>服务器: 请求数据
    服务器-->>客户端: 返回响应`,
        'classDiagram': `classDiagram
    类名1 <|-- 类名2
    类名1 : 属性1
    类名1 : 方法1()
    类名2 : 属性2
    类名2 : 方法2()`,
        'stateDiagram': `stateDiagram-v2
    [*] --> 状态1
    状态1 --> 状态2
    状态2 --> [*]`,
        'entityRelationshipDiagram': `erDiagram
    实体1 {
        id int
        name string
    }
    实体2 {
        id int
        value string
    }
    实体1 ||--o{ 实体2 : 关系}`,
        'gantt': `gantt
    dateFormat YYYY-MM-DD
    title 项目计划
    section 阶段1
    任务1 :a1, 2024-01-01, 30d
    任务2 :after a1 , 20d
    section 阶段2
    任务3 :2024-02-15 , 12d`,
        'pie': `pie
    title 饼图示例
    "分类1" : 30
    "分类2" : 20
    "分类3" : 50`,
        'requirementDiagram': `requirementDiagram
    requirement 需求1 {
        description: 功能需求描述
        source: 客户
        verification: 测试用例
    }`
    };

    // 渲染Mermaid图表
    async function renderMermaid() {
        const code = mermaidCode.value;
        
        try {
            // 使用Mermaid 10版本的Promise API进行渲染
            const result = await mermaid.render('mermaid-chart', code);
            mermaidPreview.innerHTML = result.svg;
        } catch (error) {
            console.error('渲染错误:', error);
            mermaidPreview.innerHTML = `<div style="color: red; padding: 2rem;">渲染错误: ${error.message}</div>`;
        }
    }

    // 复制代码到剪贴板
    async function copyCode() {
        try {
            await navigator.clipboard.writeText(mermaidCode.value);
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 已复制';
            setTimeout(() => {
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 复制代码';
            }, 2000);
        } catch (error) {
            console.error('复制失败:', error);
            alert('复制失败，请手动复制');
        }
    }

    // 下载图表为图片
    function downloadChart() {
        const svgElement = mermaidPreview.querySelector('svg');
        if (!svgElement) {
            alert('没有可下载的图表');
            return;
        }

        try {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const pngData = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = 'mermaid-chart.png';
                downloadLink.href = pngData;
                downloadLink.click();
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请重试');
        }
    }

    // 清空编辑器
    function clearEditor() {
        if (confirm('确定要清空当前代码吗？')) {
            mermaidCode.value = '';
            renderMermaid();
        }
    }

    // 切换图标库显示
    function toggleIconLibrary() {
        const iconLibrary = document.querySelector('.icon-library');
        const isCollapsed = iconLibrary.style.maxHeight === '0px' || iconLibrary.style.maxHeight === '';
        
        if (isCollapsed) {
            iconLibrary.style.maxHeight = iconLibrary.scrollHeight + 'px';
        } else {
            iconLibrary.style.maxHeight = '0px';
        }
    }

    // 插入图标代码到编辑器
    function insertIconCode(iconCode) {
        const cursorPosition = mermaidCode.selectionStart;
        const textBeforeCursor = mermaidCode.value.substring(0, cursorPosition);
        const textAfterCursor = mermaidCode.value.substring(cursorPosition);
        
        mermaidCode.value = textBeforeCursor + iconCode + textAfterCursor;
        mermaidCode.focus();
        mermaidCode.setSelectionRange(cursorPosition + iconCode.length, cursorPosition + iconCode.length);
        renderMermaid();
    }

    // 切换图表类型时加载模板
    function changeDiagramType() {
        const selectedType = diagramType.value;
        mermaidCode.value = diagramTemplates[selectedType];
        renderMermaid();
    }

    // 事件监听
    mermaidCode.addEventListener('input', renderMermaid);
    copyBtn.addEventListener('click', copyCode);
    downloadBtn.addEventListener('click', downloadChart);
    clearBtn.addEventListener('click', clearEditor);
    diagramType.addEventListener('change', changeDiagramType);
    toggleIcons.addEventListener('click', toggleIconLibrary);

    // 图标点击事件
    iconGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('icon-item')) {
            const iconCode = e.target.dataset.code;
            insertIconCode(iconCode);
        }
    });

    // 初始化渲染
    renderMermaid();
});