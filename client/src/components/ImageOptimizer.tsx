import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from './LazyLoad';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Optimized image component with automatic format conversion and lazy loading
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  format = 'webp',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmZmIi8+CiAgPHRleHQgeD0iMCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuekuuS+i+WbvueJhzwvdGV4dD4KPC9zdmc+',
  fallback,
  onLoad,
  onError,
  lazy = true,
  priority = false,
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate optimized URL
  const generateOptimizedUrl = (originalSrc: string): string => {
    if (!originalSrc) return placeholder;
    
    // If it's already an optimized URL or data URL, return as-is
    if (originalSrc.includes('?format=') || originalSrc.startsWith('data:')) {
      return originalSrc;
    }

    // Add optimization parameters
    const url = new URL(originalSrc, window.location.origin);
    url.searchParams.set('format', format);
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('width', width?.toString() || '');
    url.searchParams.set('height', height?.toString() || '');
    
    return url.toString();
  };

  // Check if WebP is supported
  const isWebpSupported = (): boolean => {
    try {
      return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  };

  // Auto-optimize format based on browser support
  useEffect(() => {
    if (isWebpSupported() && format === 'webp') {
      setIsOptimized(true);
    }
  }, [format]);

  // Handle image loading
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Load image immediately if priority
  useEffect(() => {
    if (priority && !imageSrc) {
      const optimizedUrl = generateOptimizedUrl(src);
      setImageSrc(optimizedUrl);
    }
  }, [src, priority, imageSrc]);

  // Fallback to JPEG if WebP fails
  useEffect(() => {
    if (hasError && format === 'webp') {
      const jpegUrl = generateOptimizedUrl(src).replace('format=webp', 'format=jpeg');
      setImageSrc(jpegUrl);
      setHasError(false);
    }
  }, [hasError, format, src]);

  const optimizedSrc = imageSrc || generateOptimizedUrl(src);

  if (hasError && fallback) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={style}>
        <img
          src={fallback}
          alt={alt}
          className={cn("max-w-full h-auto", className)}
          style={style}
          {...props}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-gray-100 rounded-lg", className)} 
        style={{ 
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : '200px',
          ...style 
        }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading image...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div 
        className={cn("flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg", className)} 
        style={{ 
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : '200px',
          ...style 
        }}
      >
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">Failed to load image</p>
      </div>
    );
  }

  if (lazy) {
    return (
      <LazyImage
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        placeholder={placeholder}
        fallback={fallback}
        onLoad={handleLoad}
        onError={handleError}
        className={cn("transition-opacity duration-300", className)}
        style={{ opacity: isLoading ? 0.5 : 1, ...style }}
        {...props}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      className={cn("transition-opacity duration-300", className)}
      style={{ opacity: isLoading ? 0.5 : 1, ...style }}
      {...props}
    />
  );
}

interface ResponsiveImageProps extends OptimizedImageProps {
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  sizes?: string;
}

/**
 * Responsive image component with automatic srcset generation
 */
export function ResponsiveImage({
  breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  ...props
}: ResponsiveImageProps) {
  const [srcSet, setSrcSet] = useState<string>('');

  useEffect(() => {
    if (!props.src) return;

    const generateSrcSet = () => {
      const sources: string[] = [];
      
      Object.entries(breakpoints).forEach(([breakpoint, width]) => {
        if (width) {
          const optimizedUrl = new URL(props.src!, window.location.origin);
          optimizedUrl.searchParams.set('format', 'webp');
          optimizedUrl.searchParams.set('quality', '85');
          optimizedUrl.searchParams.set('width', width.toString());
          
          sources.push(`${optimizedUrl.toString()} ${width}w`);
        }
      });

      return sources.join(', ');
    };

    setSrcSet(generateSrcSet());
  }, [props.src, breakpoints]);

  return (
    <OptimizedImage
      {...props}
      srcSet={srcSet}
      sizes={sizes}
      loading={props.priority ? 'eager' : 'lazy'}
    />
  );
}

interface AvatarImageProps extends OptimizedImageProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

/**
 * Avatar component with optimized image loading
 */
export function AvatarImage({
  size = 'md',
  shape = 'circle',
  status,
  className,
  ...props
}: AvatarImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  return (
    <div className="relative inline-block">
      <OptimizedImage
        {...props}
        className={cn(
          sizeClasses[size],
          shapeClasses[shape],
          'object-cover border-2 border-gray-200',
          className
        )}
      />
      
      {status && (
        <div 
          className={cn(
            'absolute bottom-0 right-0 border-2 border-white',
            statusColors[status],
            shape === 'circle' ? 'rounded-full' : 'rounded-sm',
            size === 'sm' ? 'w-2 h-2' : 
            size === 'md' ? 'w-2.5 h-2.5' : 
            size === 'lg' ? 'w-3 h-3' : 'w-3.5 h-3.5'
          )}
        />
      )}
    </div>
  );
}

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
    thumbnail?: string;
  }>;
  className?: string;
  onImageClick?: (index: number) => void;
}

/**
 * Image gallery component with lazy loading and lightbox functionality
 */
export function ImageGallery({ 
  images, 
  className, 
  onImageClick 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
    onImageClick?.(index);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  if (images.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 bg-gray-50 rounded-lg", className)}>
        <ImageIcon className="w-12 h-12 text-gray-400" />
        <p className="ml-3 text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
        {images.map((image, index) => (
          <div 
            key={index}
            className="relative group cursor-pointer overflow-hidden rounded-lg"
            onClick={() => handleImageClick(index)}
          >
            <OptimizedImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm font-medium">{image.caption || 'View'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={handleCloseLightbox}
        >
          <div className="relative max-w-4xl max-h-full">
            <OptimizedImage
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseLightbox();
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {images[selectedImage].caption && (
              <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                <p className="bg-black bg-opacity-50 rounded px-3 py-1 inline-block">
                  {images[selectedImage].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default OptimizedImage;