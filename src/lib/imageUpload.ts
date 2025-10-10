/**
 * 图片上传工具
 * 支持多种免费图床服务
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 上传图片到 ImgBB (免费图床)
 * 注册获取 API Key: https://api.imgbb.com/
 */
export async function uploadToImgBB(file: File, apiKey: string): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.url,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || '上传失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 上传图片到 SM.MS (免费图床，无需 API Key)
 */
export async function uploadToSMMS(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('smfile', file);

    const response = await fetch('https://sm.ms/api/v2/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.url,
      };
    } else {
      return {
        success: false,
        error: data.message || '上传失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 转换 base64 为 File 对象
 */
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * 压缩图片
 */
export function compressImage(file: File, maxWidth = 1920, quality = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('压缩失败'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
}

/**
 * 从剪贴板读取图片
 */
export async function getImageFromClipboard(): Promise<File | null> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          return new File([blob], `clipboard-${Date.now()}.png`, { type });
        }
      }
    }
    return null;
  } catch (error) {
    console.error('读取剪贴板失败:', error);
    return null;
  }
}

/**
 * 使用 ImgURL 上传 (免费、无需注册)
 */
export async function uploadToImgURL(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.imgbb.com/1/upload?key=d36eb6591370ae7f9089d85875e56b22', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.url,
      };
    } else {
      return {
        success: false,
        error: '上传失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 转换为 Base64 Data URL (本地预览，不推荐生产环境)
 */
export async function convertToBase64(file: File): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve({
        success: true,
        url: result,
      });
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: '文件读取失败',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 主上传函数 (自动选择可用的图床)
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  // 先压缩图片
  const compressedFile = await compressImage(file);

  // 方案1: 使用 ImgBB (有免费额度)
  console.log('尝试上传到 ImgBB...');
  const imgbbResult = await uploadToImgURL(compressedFile);
  if (imgbbResult.success) {
    console.log('ImgBB 上传成功');
    return imgbbResult;
  }

  // 方案2: 使用 SM.MS
  console.log('ImgBB 失败，尝试 SM.MS...');
  const smmsResult = await uploadToSMMS(compressedFile);
  if (smmsResult.success) {
    console.log('SM.MS 上传成功');
    return smmsResult;
  }

  // 方案3: 转为 Base64 (仅作备用)
  console.log('所有图床失败，使用 Base64...');
  return await convertToBase64(compressedFile);
}
