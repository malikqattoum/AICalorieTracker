import React, { useState, useEffect, useRef } from 'react';

// Image optimization configuration
export const imageConfig = {
  // Supported formats
  formats: ['webp', 'avif', 'jpeg', 'png'],
  
  // Default quality settings
  quality: {
    webp: 80,
    avif: 75,
    jpeg: 85,
    png: 90,
  },
  
  // Size breakpoints
  breakpoints: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Placeholder options
  placeholder: {
    blur: 8,
    size: 20,
  },
};

// Image optimization hook
export function useImageOptimization(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: keyof typeof imageConfig.quality;
    placeholder?: boolean;
  } = {}
) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!src) return;
    
    const { width, height, quality = 80, format = 'webp', placeholder = false } = options;
    
    // Build optimization URL
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('format', format);
    
    // Add placeholder if requested
    if (placeholder) {
      params.append('placeholder', 'true');
    }
    
    const optimizedUrl = `${src}?${params.toString()}`;
    setOptimizedSrc(optimizedUrl);
    setIsLoading(false);
    setError(null);
    
  }, [src, options]);
  
  return { optimizedSrc, isLoading, error };
}

// Image optimization utilities
export const imageUtils = {
  // Get optimal format based on browser support
  getOptimalFormat(): keyof typeof imageConfig.quality {
    if (typeof window !== 'undefined') {
      if (window.createImageBitmap && 'image/webp' in document.createElement('canvas')) {
        return 'webp';
      }
    }
    return 'jpeg';
  },
  
  // Calculate optimal image size
  getOptimalSize(
    containerWidth: number,
    containerHeight: number,
    imageWidth: number,
    imageHeight: number,
    upscale = false
  ): { width: number; height: number } {
    const aspectRatio = imageWidth / imageHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let width, height;
    
    if (aspectRatio > containerAspectRatio) {
      // Image is wider than container
      width = upscale ? Math.max(containerWidth, imageWidth) : Math.min(containerWidth, imageWidth);
      height = width / aspectRatio;
    } else {
      // Image is taller than container
      height = upscale ? Math.max(containerHeight, imageHeight) : Math.min(containerHeight, imageHeight);
      width = height * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  },
  
  // Generate image CDN URL
  generateCdnUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: keyof typeof imageConfig.quality;
      crop?: 'fill' | 'fit' | 'crop' | 'thumb';
      gravity?: 'auto' | 'faces' | 'north' | 'south' | 'east' | 'west';
    }
  ): string {
    const params = new URLSearchParams();
    
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('format', options.format);
    if (options.crop) params.append('crop', options.crop);
    if (options.gravity) params.append('gravity', options.gravity);
    
    return `${src}?${params.toString()}`;
  },
  
  // Generate responsive image sources
  generateResponsiveSources(
    src: string,
    alt: string,
    className?: string,
    sizes?: string
  ): string {
    const sources = [];
    
    for (const [breakpoint, width] of Object.entries(imageConfig.breakpoints)) {
      sources.push(`
        <source
          srcset="${src}?w=${width}&q=${imageConfig.quality.webp}&format=webp"
          media="(min-width: ${width}px)"
          type="image/webp"
        />
        <source
          srcset="${src}?w=${width}&q=${imageConfig.quality.jpeg}&format=jpeg"
          media="(min-width: ${width}px)"
          type="image/jpeg"
        />
      `);
    }
    
    return `
      <picture>
        ${sources.join('')}
        <img
          src="${src}?w=${imageConfig.breakpoints.md}&q=${imageConfig.quality.webp}&format=webp"
          alt="${alt}"
          class="${className || ''}"
          loading="lazy"
          ${sizes || ''}
        />
      </picture>
    `;
  },
};

// Lazy loading image component
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  placeholder = true,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { optimizedSrc } = useImageOptimization(src, {
    width,
    height,
    placeholder,
  });
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = (error: Error) => {
    setHasError(true);
    onError?.(error);
  };
  
  return React.createElement('div', {
    className: `relative overflow-hidden ${className}`,
    children: [
      placeholder && !isLoaded && React.createElement('div', {
        className: 'absolute inset-0 bg-gray-200 animate-pulse',
      }),
      hasError && React.createElement('div', {
        className: 'flex items-center justify-center bg-gray-100 text-gray-500',
        children: React.createElement('span', {
          children: 'Failed to load image',
        }),
      }),
      React.createElement('img', {
        ref: imgRef,
        src: optimizedSrc,
        alt: alt,
        className: `transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`,
        loading: 'lazy' as const,
        onLoad: handleLoad,
        onError: (e) => handleError(new Error(e.type)),
        width: width,
        height: height,
      }),
    ],
  });
}

// Progressive image loading component
interface ProgressiveImageProps extends LazyImageProps {
  lowQualitySrc?: string;
  blur?: number;
}

export function ProgressiveImage({
  src,
  alt,
  className,
  width,
  height,
  lowQualitySrc,
  blur = 8,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [isLowQualityLoaded, setIsLowQualityLoaded] = useState(false);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleLowQualityLoad = () => {
    setIsLowQualityLoaded(true);
  };
  
  const handleHighQualityLoad = () => {
    setIsHighQualityLoaded(true);
    onLoad?.();
  };
  
  const handleError = (error: Error) => {
    setHasError(true);
    onError?.(error);
  };
  
  return React.createElement('div', {
    className: `relative overflow-hidden ${className}`,
    children: [
      React.createElement('img', {
        src: lowQualitySrc || src,
        alt: alt,
        className: `transition-all duration-300 ${
          isHighQualityLoaded ? 'opacity-0 blur-sm' : 'opacity-100'
        }`,
        loading: 'lazy' as const,
        onLoad: handleLowQualityLoad,
        onError: (e) => handleError(new Error(e.type)),
        width: width,
        height: height,
        style: {
          filter: `blur(${blur}px)`,
        },
      }),
      React.createElement('img', {
        src: src,
        alt: alt,
        className: `transition-all duration-300 absolute inset-0 w-full h-full object-cover ${
          isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
        }`,
        loading: 'lazy' as const,
        onLoad: handleHighQualityLoad,
        onError: (e) => handleError(new Error(e.type)),
        width: width,
        height: height,
      }),
      hasError && React.createElement('div', {
        className: 'flex items-center justify-center bg-gray-100 text-gray-500 absolute inset-0',
        children: React.createElement('span', {
          children: 'Failed to load image',
        }),
      }),
    ],
  });
}

// Image placeholder component
export function ImagePlaceholder({
  width = 400,
  height = 300,
  className = '',
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return React.createElement('div', {
    className: `bg-gray-200 animate-pulse ${className}`,
    style: {
      width: `${width}px`,
      height: `${height}px`,
    },
  });
}

export default {
  imageConfig,
  useImageOptimization,
  imageUtils,
  LazyImage,
  ProgressiveImage,
  ImagePlaceholder,
};