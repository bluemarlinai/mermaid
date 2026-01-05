from PIL import Image
import numpy as np

# 打开原始图像
img = Image.open('src/assets/icon.png')
print(f'原始图像尺寸: {img.size}')

# 转换为RGBA模式（添加透明度通道）
img = img.convert('RGBA')

# 转换为numpy数组
img_array = np.array(img)

# 定义白色阈值
# 如果RGB值都接近255（白色），则将Alpha通道设置为0（透明）
threshold = 240
white_mask = (img_array[:, :, 0] > threshold) & (img_array[:, :, 1] > threshold) & (img_array[:, :, 2] > threshold)

# 将白色区域设置为透明
img_array[white_mask, 3] = 0

# 转换回PIL图像
img_with_transparency = Image.fromarray(img_array)

# 找到非透明像素的边界
alpha_channel = img_array[:, :, 3]
non_transparent = np.where(alpha_channel > 0)

if non_transparent[0].size > 0:
    # 计算裁剪边界
    min_y, max_y = non_transparent[0].min(), non_transparent[0].max()
    min_x, max_x = non_transparent[1].min(), non_transparent[1].max()
    
    # 添加一些边距（可选）
    margin = 10
    min_y = max(0, min_y - margin)
    max_y = min(img.height - 1, max_y + margin)
    min_x = max(0, min_x - margin)
    max_x = min(img.width - 1, max_x + margin)
    
    # 裁剪图像
    cropped_img = img_with_transparency.crop((min_x, min_y, max_x + 1, max_y + 1))
    
    print(f'裁剪后图像尺寸: {cropped_img.size}')
    
    # 备份原始图像
    img_with_transparency.save('src/assets/icon_original.png')
    
    # 保存处理后的图像
    cropped_img.save('src/assets/icon_processed.png')
    print('图像处理完成！')
    print('  - 原始图像备份为: src/assets/icon_original.png')
    print('  - 处理后的图像保存为: src/assets/icon_processed.png')
else:
    print('错误：没有找到非透明像素！')
