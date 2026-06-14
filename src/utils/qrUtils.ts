import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { jsPDF } from 'jspdf';

export interface QRStyleOptions {
  foregroundType: 'solid' | 'gradient';
  foregroundColor: string;
  gradientType: 'linear' | 'radial';
  gradientColor2: string;
  backgroundColor: string;
  moduleType: 'square' | 'rounded' | 'dots' | 'classy';
  cornerType: 'square' | 'rounded' | 'circle' | 'extra-rounded';
  cornerOuterColor: string;
  cornerInnerColor: string;
  logoUrl?: string | null;
  logoSize: number; // percentage of QR size, e.g. 20
  logoPadding: boolean;
  padding: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  size: number;
  rotation: number; // in degrees: 0, 90, 180, 270
}

export const DEFAULT_STYLE: QRStyleOptions = {
  foregroundType: 'solid',
  foregroundColor: '#000000',
  gradientType: 'linear',
  gradientColor2: '#6D5DFC',
  backgroundColor: '#FFFFFF',
  moduleType: 'square',
  cornerType: 'square',
  cornerOuterColor: '#000000',
  cornerInnerColor: '#000000',
  logoUrl: null,
  logoSize: 20,
  logoPadding: true,
  padding: 40,
  errorCorrectionLevel: 'M',
  size: 512,
  rotation: 0,
};

export const PRESETS: Record<string, Partial<QRStyleOptions>> = {
  minimal: {
    foregroundType: 'solid',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    moduleType: 'square',
    cornerType: 'square',
    cornerOuterColor: '#000000',
    cornerInnerColor: '#000000',
  },
  neon: {
    foregroundType: 'gradient',
    foregroundColor: '#6D5DFC',
    gradientColor2: '#EC4899',
    gradientType: 'linear',
    backgroundColor: '#0A0A0A',
    moduleType: 'dots',
    cornerType: 'circle',
    cornerOuterColor: '#6D5DFC',
    cornerInnerColor: '#EC4899',
  },
  cyberpunk: {
    foregroundType: 'gradient',
    foregroundColor: '#F59E0B',
    gradientColor2: '#10B981',
    gradientType: 'linear',
    backgroundColor: '#0B0F19',
    moduleType: 'classy',
    cornerType: 'extra-rounded',
    cornerOuterColor: '#F59E0B',
    cornerInnerColor: '#10B981',
  },
  glass: {
    foregroundType: 'solid',
    foregroundColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    moduleType: 'rounded',
    cornerType: 'rounded',
    cornerOuterColor: '#8B5CF6',
    cornerInnerColor: '#6D5DFC',
  },
  corporate: {
    foregroundType: 'solid',
    foregroundColor: '#1E3A8A',
    backgroundColor: '#FFFFFF',
    moduleType: 'square',
    cornerType: 'rounded',
    cornerOuterColor: '#1E3A8A',
    cornerInnerColor: '#3B82F6',
  },
  darkpro: {
    foregroundType: 'gradient',
    foregroundColor: '#FFFFFF',
    gradientColor2: '#4B5563',
    gradientType: 'linear',
    backgroundColor: '#0F172A',
    moduleType: 'rounded',
    cornerType: 'extra-rounded',
    cornerOuterColor: '#FFFFFF',
    cornerInnerColor: '#38BDF8',
  },
  modernapp: {
    foregroundType: 'gradient',
    foregroundColor: '#4F46E5',
    gradientColor2: '#818CF8',
    gradientType: 'radial',
    backgroundColor: '#FAFAFA',
    moduleType: 'classy',
    cornerType: 'rounded',
    cornerOuterColor: '#4F46E5',
    cornerInnerColor: '#4F46E5',
  },
  luxurygold: {
    foregroundType: 'gradient',
    foregroundColor: '#D97706',
    gradientColor2: '#FCD34D',
    gradientType: 'linear',
    backgroundColor: '#111827',
    moduleType: 'rounded',
    cornerType: 'rounded',
    cornerOuterColor: '#D97706',
    cornerInnerColor: '#FCD34D',
  },
};

// Check if a cell coordinate falls within any of the three Finder Patterns
export function isFinderPattern(row: number, col: number, size: number): boolean {
  // Top-Left Finder
  if (row >= 0 && row < 7 && col >= 0 && col < 7) return true;
  // Top-Right Finder
  if (row >= 0 && row < 7 && col >= size - 7 && col < size) return true;
  // Bottom-Left Finder
  if (row >= size - 7 && row < size && col >= 0 && col < 7) return true;
  return false;
}

// Check if a cell coordinate falls within the logo area in the center
export function isLogoArea(row: number, col: number, size: number, logoSizePercent: number): boolean {
  if (logoSizePercent <= 0) return false;
  
  // Calculate size of logo in modules (approximate)
  const logoModules = Math.ceil(size * (logoSizePercent / 100));
  const centerStart = Math.floor((size - logoModules) / 2);
  const centerEnd = centerStart + logoModules;

  return row >= centerStart && row < centerEnd && col >= centerStart && col < centerEnd;
}

// Helper to draw rounded rectangle on Canvas 2D
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Core drawing function to render customized QR code to a canvas
export async function drawCustomQR(
  canvas: HTMLCanvasElement,
  text: string,
  options: QRStyleOptions
): Promise<void> {
  const {
    foregroundType,
    foregroundColor,
    gradientType,
    gradientColor2,
    backgroundColor,
    moduleType,
    cornerType,
    cornerOuterColor,
    cornerInnerColor,
    logoUrl,
    logoSize,
    logoPadding,
    padding,
    errorCorrectionLevel,
    size,
    rotation,
  } = options;

  // Generate QR Matrix
  const qr = QRCode.create(text || 'QR Studio', { errorCorrectionLevel });
  const { modules } = qr;
  const qrSize = modules.size;

  // Setup canvas sizes
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Apply Rotation if needed
  ctx.save();
  if (rotation !== 0) {
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);
  }

  // Draw QR Content
  const drawAreaSize = size - 2 * padding;
  const moduleSize = drawAreaSize / qrSize;

  // Setup foreground gradient if needed
  let fillStyle: string | CanvasGradient = foregroundColor;
  if (foregroundType === 'gradient') {
    if (gradientType === 'linear') {
      const grad = ctx.createLinearGradient(padding, padding, size - padding, size - padding);
      grad.addColorStop(0, foregroundColor);
      grad.addColorStop(1, gradientColor2);
      fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(
        size / 2,
        size / 2,
        moduleSize,
        size / 2,
        size / 2,
        size / 2
      );
      grad.addColorStop(0, foregroundColor);
      grad.addColorStop(1, gradientColor2);
      fillStyle = grad;
    }
  }

  // 1. Draw Data & Timing Modules (Skipping Finders and Logo area)
  ctx.fillStyle = fillStyle;
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (isFinderPattern(r, c, qrSize)) continue;
      if (logoUrl && isLogoArea(r, c, qrSize, logoSize)) continue;

      if (modules.get(r, c)) {
        const x = padding + c * moduleSize;
        const y = padding + r * moduleSize;

        ctx.beginPath();
        if (moduleType === 'dots') {
          // Dots style: circles
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          const radius = (moduleSize / 2) * 0.85;
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
        } else if (moduleType === 'rounded') {
          // Rounded square style
          const rSize = moduleSize * 0.9;
          const offset = (moduleSize - rSize) / 2;
          drawRoundedRect(ctx, x + offset, y + offset, rSize, rSize, rSize * 0.3);
          ctx.fill();
        } else if (moduleType === 'classy') {
          // Classy style: Liquid leafy appearance
          // Check neighbors to apply dynamic rounding
          const top = r > 0 ? modules.get(r - 1, c) : 0;
          const bottom = r < qrSize - 1 ? modules.get(r + 1, c) : 0;
          const left = c > 0 ? modules.get(r, c - 1) : 0;
          const right = c < qrSize - 1 ? modules.get(r, c + 1) : 0;
          
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          
          ctx.moveTo(cx, y);
          // Top-right corner
          if (!top && !right) {
            ctx.quadraticCurveTo(x + moduleSize, y, x + moduleSize, cy);
          } else {
            ctx.lineTo(x + moduleSize, y);
            ctx.lineTo(x + moduleSize, cy);
          }
          // Bottom-right corner
          if (!bottom && !right) {
            ctx.quadraticCurveTo(x + moduleSize, y + moduleSize, cx, y + moduleSize);
          } else {
            ctx.lineTo(x + moduleSize, y + moduleSize);
            ctx.lineTo(cx, y + moduleSize);
          }
          // Bottom-left corner
          if (!bottom && !left) {
            ctx.quadraticCurveTo(x, y + moduleSize, x, cy);
          } else {
            ctx.lineTo(x, y + moduleSize);
            ctx.lineTo(x, cy);
          }
          // Top-left corner
          if (!top && !left) {
            ctx.quadraticCurveTo(x, y, cx, y);
          } else {
            ctx.lineTo(x, y);
            ctx.lineTo(cx, y);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Standard Square style
          ctx.fillRect(x, y, moduleSize + 0.1, moduleSize + 0.1);
        }
      }
    }
  }

  // 2. Draw Finder Patterns with custom shapes and colors
  const drawFinder = (startX: number, startY: number) => {
    // Outer border (7x7 modules)
    ctx.fillStyle = cornerOuterColor || fillStyle;
    ctx.beginPath();
    const outerSize = 7 * moduleSize;
    if (cornerType === 'rounded') {
      drawRoundedRect(ctx, startX, startY, outerSize, outerSize, moduleSize * 1.5);
    } else if (cornerType === 'circle') {
      ctx.arc(startX + outerSize / 2, startY + outerSize / 2, outerSize / 2, 0, 2 * Math.PI);
    } else if (cornerType === 'extra-rounded') {
      drawRoundedRect(ctx, startX, startY, outerSize, outerSize, moduleSize * 2.5);
    } else {
      ctx.rect(startX, startY, outerSize, outerSize);
    }
    ctx.fill();
    
    // Create hollow by cutting out 5x5 center (offset by 1 module)
    // We do this by filling back with background color
    ctx.fillStyle = backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor;
    const innerHollowSize = 5 * moduleSize;
    const hollowX = startX + moduleSize;
    const hollowY = startY + moduleSize;
    ctx.beginPath();
    if (cornerType === 'rounded') {
      drawRoundedRect(ctx, hollowX, hollowY, innerHollowSize, innerHollowSize, moduleSize * 0.8);
    } else if (cornerType === 'circle') {
      ctx.arc(hollowX + innerHollowSize / 2, hollowY + innerHollowSize / 2, innerHollowSize / 2, 0, 2 * Math.PI);
    } else if (cornerType === 'extra-rounded') {
      drawRoundedRect(ctx, hollowX, hollowY, innerHollowSize, innerHollowSize, moduleSize * 1.5);
    } else {
      ctx.rect(hollowX, hollowY, innerHollowSize, innerHollowSize);
    }
    ctx.fill();

    // Center dot (3x3 modules, offset by 2 modules)
    ctx.fillStyle = cornerInnerColor || fillStyle;
    const centerSize = 3 * moduleSize;
    const centerX = startX + 2 * moduleSize;
    const centerY = startY + 2 * moduleSize;
    ctx.beginPath();
    if (cornerType === 'rounded' || cornerType === 'extra-rounded') {
      drawRoundedRect(ctx, centerX, centerY, centerSize, centerSize, moduleSize * 0.6);
    } else if (cornerType === 'circle') {
      ctx.arc(centerX + centerSize / 2, centerY + centerSize / 2, centerSize / 2, 0, 2 * Math.PI);
    } else {
      ctx.rect(centerX, centerY, centerSize, centerSize);
    }
    ctx.fill();
  };

  // Draw 3 Finders
  // Top-Left
  drawFinder(padding, padding);
  // Top-Right
  drawFinder(padding + (qrSize - 7) * moduleSize, padding);
  // Bottom-Left
  drawFinder(padding, padding + (qrSize - 7) * moduleSize);

  // Restore rotation context
  ctx.restore();

  // 3. Draw Center Logo
  if (logoUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoPx = size * (logoSize / 100);
        const logoX = (size - logoPx) / 2;
        const logoY = (size - logoPx) / 2;

        ctx.save();
        // If the logo has a padding border, draw a solid rounded background card
        if (logoPadding) {
          ctx.fillStyle = backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor;
          ctx.shadowColor = 'rgba(0,0,0,0.1)';
          ctx.shadowBlur = 10;
          drawRoundedRect(ctx, logoX - 4, logoY - 4, logoPx + 8, logoPx + 8, logoPx * 0.2);
          ctx.fill();
        }

        // Draw image in a clipped rounded boundary for elegance
        ctx.beginPath();
        drawRoundedRect(ctx, logoX, logoY, logoPx, logoPx, logoPx * 0.15);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoPx, logoPx);
        ctx.restore();
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load logo image for QR rendering.');
        resolve(); // resolve anyway to avoid hanging
      };
      img.src = logoUrl;
    });
  }
}

// Generate high-quality SVG path representation of the QR code
export function generateSVG(text: string, options: QRStyleOptions): string {
  const {
    foregroundType,
    foregroundColor,
    gradientType,
    gradientColor2,
    backgroundColor,
    moduleType,
    cornerType,
    cornerOuterColor,
    cornerInnerColor,
    logoUrl,
    logoSize,
    padding,
    errorCorrectionLevel,
    size,
  } = options;

  const qr = QRCode.create(text || 'QR Studio', { errorCorrectionLevel });
  const { modules } = qr;
  const qrSize = modules.size;

  const drawAreaSize = size - 2 * padding;
  const moduleSize = drawAreaSize / qrSize;

  let defs = '';
  let fillAttr = foregroundColor;

  if (foregroundType === 'gradient') {
    fillAttr = 'url(#qr-gradient)';
    if (gradientType === 'linear') {
      defs += `
      <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${foregroundColor}" />
        <stop offset="100%" stop-color="${gradientColor2}" />
      </linearGradient>`;
    } else {
      defs += `
      <radialGradient id="qr-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="${foregroundColor}" />
        <stop offset="100%" stop-color="${gradientColor2}" />
      </radialGradient>`;
    }
  }

  let svgContent = '';

  // 1. Draw Data Modules
  let dataPaths = '';
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (isFinderPattern(r, c, qrSize)) continue;
      if (logoUrl && isLogoArea(r, c, qrSize, logoSize)) continue;

      if (modules.get(r, c)) {
        const x = padding + c * moduleSize;
        const y = padding + r * moduleSize;

        if (moduleType === 'dots') {
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          const radius = (moduleSize / 2) * 0.85;
          dataPaths += `M ${cx} ${cy} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0 `;
        } else if (moduleType === 'rounded') {
          const rSize = moduleSize * 0.9;
          const offset = (moduleSize - rSize) / 2;
          const rx = x + offset;
          const ry = y + offset;
          const rd = rSize * 0.3;
          dataPaths += `M ${rx + rd} ${ry} h ${rSize - 2 * rd} a ${rd},${rd} 0 0 1 ${rd},${rd} v ${rSize - 2 * rd} a ${rd},${rd} 0 0 1 -${rd},${rd} h -${rSize - 2 * rd} a ${rd},${rd} 0 0 1 -${rd},-${rd} v -${rSize - 2 * rd} a ${rd},${rd} 0 0 1 ${rd},-${rd} Z `;
        } else {
          dataPaths += `M ${x} ${y} h ${moduleSize} v ${moduleSize} h -${moduleSize} Z `;
        }
      }
    }
  }

  svgContent += `<path d="${dataPaths}" fill="${fillAttr}" />`;

  // Helper to draw SVG Finder shape
  const drawSvgFinder = (startX: number, startY: number) => {
    const outerSize = 7 * moduleSize;
    const innerHollowSize = 5 * moduleSize;
    const centerSize = 3 * moduleSize;
    const outerCol = cornerOuterColor || foregroundColor;
    const innerCol = cornerInnerColor || foregroundColor;

    let path = '';
    const hollowX = startX + moduleSize;
    const hollowY = startY + moduleSize;
    const centerX = startX + 2 * moduleSize;
    const centerY = startY + 2 * moduleSize;

    // Drawing outer
    if (cornerType === 'rounded') {
      const rd = moduleSize * 1.5;
      path += `<path d="M ${startX + rd} ${startY} h ${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 ${rd},${rd} v ${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 -${rd},${rd} h -${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 -${rd},-${rd} v -${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 ${rd},-${rd} Z `;
      // Cutout hollow (anti-clockwise path)
      const hrd = moduleSize * 0.8;
      path += `M ${hollowX + hrd} ${hollowY + innerHollowSize} a ${hrd},${hrd} 0 0 0 ${hrd},-${hrd} v -${innerHollowSize - 2 * hrd} a ${hrd},${hrd} 0 0 0 -${hrd},-${hrd} h -${innerHollowSize - 2 * hrd} a ${hrd},${hrd} 0 0 0 -${hrd},${hrd} v ${innerHollowSize - 2 * hrd} a ${hrd},${hrd} 0 0 0 ${hrd},${hrd} Z" fill="${outerCol}" fill-rule="evenodd" />`;
    } else if (cornerType === 'circle') {
      const r = outerSize / 2;
      const hr = innerHollowSize / 2;
      path += `<path d="M ${startX + r} ${startY} a ${r},${r} 0 1,1 0 ${outerSize} a ${r},${r} 0 1,1 0 -${outerSize} Z `;
      path += `M ${hollowX + hr} ${hollowY + innerHollowSize} a ${hr},${hr} 0 1,0 0 -${innerHollowSize} a ${hr},${hr} 0 1,0 0 ${innerHollowSize} Z" fill="${outerCol}" fill-rule="evenodd" />`;
    } else if (cornerType === 'extra-rounded') {
      const rd = moduleSize * 2.5;
      path += `<path d="M ${startX + rd} ${startY} h ${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 ${rd},${rd} v ${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 -${rd},${rd} h -${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 -${rd},-${rd} v -${outerSize - 2 * rd} a ${rd},${rd} 0 0 1 ${rd},-${rd} Z `;
      const hrd = moduleSize * 1.5;
      path += `M ${hollowX + hrd} ${hollowY + innerHollowSize} a ${hrd},${hrd} 0 0 0 ${hrd},-${hrd} v -${innerHollowSize - 2 * hrd} a ${hrd},${hrd} 0 0 0 -${hrd},-${hrd} h -${innerHollowSize - 2 * hrd} a ${hrd},${hrd} 0 0 0 -${hrd},${hrd} v ${innerHollowSize - 2 * hrd} a ${hrd},${hrd} 0 0 0 ${hrd},${hrd} Z" fill="${outerCol}" fill-rule="evenodd" />`;
    } else {
      path += `<path d="M ${startX} ${startY} h ${outerSize} v ${outerSize} h -${outerSize} Z `;
      path += `M ${hollowX} ${hollowY + innerHollowSize} v -${innerHollowSize} h -${innerHollowSize} v ${innerHollowSize} Z" fill="${outerCol}" fill-rule="evenodd" />`;
    }

    // Inner Dot
    if (cornerType === 'rounded' || cornerType === 'extra-rounded') {
      const crd = moduleSize * 0.6;
      path += `<rect x="${centerX}" y="${centerY}" width="${centerSize}" height="${centerSize}" rx="${crd}" ry="${crd}" fill="${innerCol}" />`;
    } else if (cornerType === 'circle') {
      const cr = centerSize / 2;
      path += `<circle cx="${centerX + cr}" cy="${centerY + cr}" r="${cr}" fill="${innerCol}" />`;
    } else {
      path += `<rect x="${centerX}" y="${centerY}" width="${centerSize}" height="${centerSize}" fill="${innerCol}" />`;
    }

    return path;
  };

  // Append Finders
  svgContent += drawSvgFinder(padding, padding);
  svgContent += drawSvgFinder(padding + (qrSize - 7) * moduleSize, padding);
  svgContent += drawSvgFinder(padding, padding + (qrSize - 7) * moduleSize);

  // 4. Logo embedded in SVG
  if (logoUrl) {
    const logoPx = size * (logoSize / 100);
    const logoX = (size - logoPx) / 2;
    const logoY = (size - logoPx) / 2;
    const lrd = logoPx * 0.15;

    // Draw white buffer background first if padded
    svgContent += `<rect x="${logoX - 4}" y="${logoY - 4}" width="${logoPx + 8}" height="${logoPx + 8}" rx="${lrd + 4}" ry="${lrd + 4}" fill="${backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor}" />`;
    
    // Embedded image with round clip
    svgContent += `
    <clipPath id="logo-clip">
      <rect x="${logoX}" y="${logoY}" width="${logoPx}" height="${logoPx}" rx="${lrd}" ry="${lrd}" />
    </clipPath>
    <image href="${logoUrl}" x="${logoX}" y="${logoY}" width="${logoPx}" height="${logoPx}" clip-path="url(#logo-clip)" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs>${defs}</defs>
    <rect width="${size}" height="${size}" fill="${backgroundColor === 'transparent' ? 'none' : backgroundColor}" />
    ${svgContent}
  </svg>`;
}

// Download Canvas helper (JPEG, PNG, WebP)
export function downloadCanvas(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' | 'webp', filename: string) {
  const mimeMap = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  const dataUrl = canvas.toDataURL(mimeMap[format], format === 'jpeg' ? 0.92 : 1.0);
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  link.click();
}

// Get Canvas as Blob helper (JPEG, PNG, WebP)
export function getCanvasBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' | 'webp'): Promise<Blob | null> {
  return new Promise((resolve) => {
    const mimeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeMap[format],
      format === 'jpeg' ? 0.92 : 1.0
    );
  });
}

// PDF Exporter using jsPDF (saves as high-quality print PDF)
export function exportToPDF(canvas: HTMLCanvasElement, filename: string) {
  const pdfBlob = getPdfBlob(canvas);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.download = `${filename}.pdf`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// Get PDF as Blob helper
export function getPdfBlob(canvas: HTMLCanvasElement): Blob {
  const imgData = canvas.toDataURL('image/png');
  
  // Create PDF in portrait, unit 'mm', format 'a4' (210 x 297 mm)
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Calculate centering coordinates on A4 page
  const pageW = 210;
  const pageH = 297;
  const qrPrintW = 120; // 12cm width print
  const qrPrintH = 120;
  
  const x = (pageW - qrPrintW) / 2;
  const y = (pageH - qrPrintH) / 3; // slightly top-oriented

  // Title text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text('QR Studio Printout', pageW / 2, y - 20, { align: 'center' });

  // Draw QR Image
  pdf.addImage(imgData, 'PNG', x, y, qrPrintW, qrPrintH);

  // Add scan instructions below
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Scan this QR code with a smartphone camera or decoder.', pageW / 2, y + qrPrintH + 15, { align: 'center' });
  pdf.text('Generated by QR Studio.', pageW / 2, y + qrPrintH + 20, { align: 'center' });

  return pdf.output('blob');
}


// Decode QR code from canvas/image using jsQR
export function decodeQRFromImage(imageElement: HTMLImageElement): {
  success: boolean;
  data?: string;
  error?: string;
  stats?: {
    version: number;
    errorCorrection: string;
    modules: number;
    dataSize: number;
  };
} {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, error: 'Could not fetch 2D Canvas context for decoding.' };
    }

    ctx.drawImage(imageElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // Calculate estimated QR parameters
      // Minimum QR modules is 21 (Version 1) up to 177 (Version 40).
      // We can make an approximation of the version from the dimensions.
      // Let's assume version can be calculated from size. Since we don't have the exact matrix size,
      // we guess by checking raw data length or standard heuristics.
      const rawLength = code.data.length;
      
      // Quick version estimator
      let estVersion = 1;
      if (rawLength > 200) estVersion = 8;
      else if (rawLength > 120) estVersion = 5;
      else if (rawLength > 50) estVersion = 3;
      else if (rawLength > 25) estVersion = 2;

      return {
        success: true,
        data: code.data,
        stats: {
          version: estVersion,
          errorCorrection: 'Level M (Approx.)', // jsQR does not directly output EC, so we approximate
          modules: (21 + (estVersion - 1) * 4) * (21 + (estVersion - 1) * 4),
          dataSize: rawLength,
        },
      };
    } else {
      return { success: false, error: 'No QR code pattern detected in the image.' };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Categorize and parse QR Raw Data types
export interface ParsedQRInfo {
  type: 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'location' | 'vcard' | 'event' | 'crypto' | 'text';
  title: string;
  details: Record<string, string>;
}

export function parseQRData(raw: string): ParsedQRInfo {
  const clean = raw.trim();

  // 1. WiFi Config
  if (clean.toUpperCase().startsWith('WIFI:')) {
    const ssidMatch = clean.match(/S:([^;]+)/i);
    const passMatch = clean.match(/P:([^;]+)/i);
    const typeMatch = clean.match(/T:([^;]+)/i);
    const hiddenMatch = clean.match(/H:([^;]+)/i);

    return {
      type: 'wifi',
      title: 'WiFi Connection Configuration',
      details: {
        SSID: ssidMatch ? ssidMatch[1] : 'Hidden',
        Password: passMatch ? passMatch[1] : '(None)',
        Encryption: typeMatch ? typeMatch[1] : 'WEP/WPA',
        Hidden: hiddenMatch && hiddenMatch[1] === 'true' ? 'Yes' : 'No',
      },
    };
  }

  // 2. Email Mailto
  if (clean.toLowerCase().startsWith('mailto:')) {
    try {
      const url = new URL(clean);
      const email = url.pathname;
      const subject = url.searchParams.get('subject') || '';
      const body = url.searchParams.get('body') || '';
      return {
        type: 'email',
        title: 'Email Draft',
        details: {
          Recipient: email,
          Subject: subject,
          Body: body,
        },
      };
    } catch {
      // Manual parse fallback
      const emailPart = clean.substring(7).split('?')[0];
      const subMatch = clean.match(/subject=([^&]+)/i);
      const bodyMatch = clean.match(/body=([^&]+)/i);
      return {
        type: 'email',
        title: 'Email Draft',
        details: {
          Recipient: emailPart,
          Subject: subMatch ? decodeURIComponent(subMatch[1]) : '',
          Body: bodyMatch ? decodeURIComponent(bodyMatch[1]) : '',
        },
      };
    }
  }

  // 3. vCard Contacts
  if (clean.toUpperCase().startsWith('BEGIN:VCARD')) {
    const nameMatch = clean.match(/FN:([^\n\r]+)/i);
    const orgMatch = clean.match(/ORG:([^\n\r]+)/i);
    const telMatch = clean.match(/TEL[^\:]*\:([^\n\r]+)/i);
    const emailMatch = clean.match(/EMAIL[^\:]*\:([^\n\r]+)/i);
    const urlMatch = clean.match(/URL[^\:]*\:([^\n\r]+)/i);

    return {
      type: 'vcard',
      title: 'vCard Contact Card',
      details: {
        Name: nameMatch ? nameMatch[1].trim() : 'Unknown Contact',
        Company: orgMatch ? orgMatch[1].trim() : '(Not Specified)',
        Phone: telMatch ? telMatch[1].trim() : '(None)',
        Email: emailMatch ? emailMatch[1].trim() : '(None)',
        Website: urlMatch ? urlMatch[1].trim() : '(None)',
      },
    };
  }

  // 4. Calendar Event
  if (clean.toUpperCase().includes('BEGIN:VEVENT')) {
    const summaryMatch = clean.match(/SUMMARY:([^\n\r]+)/i);
    const descMatch = clean.match(/DESCRIPTION:([^\n\r]+)/i);
    const locMatch = clean.match(/LOCATION:([^\n\r]+)/i);
    const startMatch = clean.match(/DTSTART:([^\n\r]+)/i);
    const endMatch = clean.match(/DTEND:([^\n\r]+)/i);

    return {
      type: 'event',
      title: 'Calendar Event Reminder',
      details: {
        Title: summaryMatch ? summaryMatch[1] : 'Scheduled Event',
        Description: descMatch ? descMatch[1] : '(No Description)',
        Location: locMatch ? locMatch[1] : '(No Location Specified)',
        Start: startMatch ? startMatch[1] : '',
        End: endMatch ? endMatch[1] : '',
      },
    };
  }

  // 5. Geo Location
  if (clean.toLowerCase().startsWith('geo:')) {
    const coords = clean.substring(4).split('?')[0].split(',');
    return {
      type: 'location',
      title: 'Geographic Location Coord',
      details: {
        Latitude: coords[0] || '0.00',
        Longitude: coords[1] || '0.00',
      },
    };
  }

  // 6. SMS Formats
  if (clean.toLowerCase().startsWith('smsto:')) {
    const parts = clean.substring(6).split(':');
    const phone = parts[0] || '';
    const msg = parts.slice(1).join(':') || '';
    return {
      type: 'sms',
      title: 'SMS Message',
      details: {
        Number: phone,
        Message: msg,
      },
    };
  }

  // 7. Phone
  if (clean.toLowerCase().startsWith('tel:')) {
    return {
      type: 'phone',
      title: 'Telephone Number',
      details: {
        Phone: clean.substring(4),
      },
    };
  }

  // 8. Crypto Addresses
  if (
    clean.toLowerCase().startsWith('ethereum:') ||
    clean.toLowerCase().startsWith('bitcoin:') ||
    clean.toLowerCase().startsWith('solana:') ||
    /^(0x[a-fA-F0-9]{40})$/.test(clean) || // EVM
    /^([13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(clean) // BTC legacy
  ) {
    let type = 'Ethereum';
    let addr = clean;
    if (clean.toLowerCase().startsWith('ethereum:')) {
      addr = clean.substring(9).split('?')[0];
    } else if (clean.toLowerCase().startsWith('bitcoin:')) {
      type = 'Bitcoin';
      addr = clean.substring(8).split('?')[0];
    } else if (clean.toLowerCase().startsWith('solana:')) {
      type = 'Solana';
      addr = clean.substring(7).split('?')[0];
    }
    return {
      type: 'crypto',
      title: `${type} Address`,
      details: {
        Chain: type,
        Address: addr,
      },
    };
  }

  // 9. URL link
  if (/^(http|https):\/\/[^ "]+$/.test(clean)) {
    return {
      type: 'url',
      title: 'Web Link URL',
      details: {
        URL: clean,
      },
    };
  }

  // 10. Default Plain Text
  return {
    type: 'text',
    title: 'Text Snippet',
    details: {
      Text: raw,
    },
  };
}
