from PIL import Image
import numpy as np
import xml.etree.ElementTree as ET
from xml.dom import minidom

# 打开原始图像
img = Image.open('src/assets/icon.png')
print(f'原始图像尺寸: {img.size}')

# 转换为RGBA模式
img = img.convert('RGBA')

# 调整尺寸为适合favicon的大小（32x32或64x64）
favicon_size = 64
img = img.resize((favicon_size, favicon_size), Image.LANCZOS)
print(f'调整后尺寸: {img.size}')

# 转换为numpy数组
img_array = np.array(img)

# 获取图像尺寸
width, height = img.size

# 创建SVG根元素
svg_root = ET.Element('svg', {
    'width': str(width),
    'height': str(height),
    'xmlns': 'http://www.w3.org/2000/svg',
    'viewBox': f'0 0 {width} {height}',
    'version': '1.1'
})

# 创建一个g元素来包含所有像素
group = ET.SubElement(svg_root, 'g')

# 遍历每个像素
for y in range(height):
    for x in range(width):
        r, g, b, a = img_array[y, x]
        # 如果像素不是完全透明
        if a > 0:
            # 创建矩形元素表示该像素
            hex_color = f'#{r:02x}{g:02x}{b:02x}'
            opacity = a / 255.0
            ET.SubElement(group, 'rect', {
                'x': str(x),
                'y': str(y),
                'width': '1',
                'height': '1',
                'fill': hex_color,
                'opacity': str(opacity)
            })

# 转换为XML字符串
xml_str = ET.tostring(svg_root, encoding='unicode')

# 保存为SVG文件
with open('favicon.svg', 'w', encoding='utf-8') as f:
    f.write(xml_str)

print('SVG文件已生成: favicon.svg')
