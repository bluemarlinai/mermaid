from PIL import Image
import numpy as np

# 打开图像
img = Image.open('src/assets/icon.png')

# 显示基本信息
print('图像尺寸:', img.size)
print('图像模式:', img.mode)
print('图像格式:', img.format)

# 转换为numpy数组进行分析
img_array = np.array(img)

# 显示颜色通道信息
print('图像形状:', img_array.shape)

# 计算非透明像素的边界
if img.mode == 'RGBA':
    # 获取Alpha通道
    alpha_channel = img_array[:, :, 3]
    # 找到非透明像素的边界
    non_transparent = np.where(alpha_channel > 0)
    if non_transparent[0].size > 0:
        min_y, max_y = non_transparent[0].min(), non_transparent[0].max()
        min_x, max_x = non_transparent[1].min(), non_transparent[1].max()
        print('非透明区域边界:')
        print(f'  左: {min_x}, 右: {max_x}')
        print(f'  上: {min_y}, 下: {max_y}')
        print(f'  宽度: {max_x - min_x + 1}, 高度: {max_y - min_y + 1}')
    else:
        print('没有非透明像素')
else:
    print('非RGBA模式，无法分析透明度')

# 显示角落像素颜色
print('\n角落像素颜色:')
corners = [(0, 0), (0, img.width-1), (img.height-1, 0), (img.height-1, img.width-1)]
for y, x in corners:
    if img.mode == 'RGBA':
        r, g, b, a = img.getpixel((x, y))
        print(f'  坐标({x},{y}): R={r}, G={g}, B={b}, A={a}')
    else:
        pixel = img.getpixel((x, y))
        print(f'  坐标({x},{y}): {pixel}')
