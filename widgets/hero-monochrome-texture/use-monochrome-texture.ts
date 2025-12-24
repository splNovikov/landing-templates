'use client';

import { useEffect, useRef } from 'react';
import { colors } from '@/shared/lib/colors';

export function useMonochromeTexture(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const animationRef = useRef<number | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const noiseSeedRef = useRef(Math.random() * 1000);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateNoise();
    };

    const generateNoise = () => {
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Generate initial noise texture
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);

        // Perlin-like noise using multiple octaves for subtle texture
        let noiseValue = 0;
        noiseValue += Math.sin((x + noiseSeedRef.current) * 0.01) * 0.3;
        noiseValue += Math.sin((y + noiseSeedRef.current) * 0.015) * 0.3;
        noiseValue += Math.sin((x + y + noiseSeedRef.current) * 0.005) * 0.4;

        // Convert to grayscale with very low opacity
        const gray = 128 + noiseValue * 5;
        const alpha = 0.08;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        data[i + 3] = alpha * 255;
      }

      imageDataRef.current = imageData;
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      // Very subtle animation - slowly shift the noise
      noiseSeedRef.current += 0.1;

      ctx.fillStyle = colors.bgBody();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (imageDataRef.current) {
        // Update noise with subtle movement
        const width = canvas.width;
        const height = canvas.height;
        const data = imageDataRef.current.data;

        for (let i = 0; i < data.length; i += 4) {
          const x = (i / 4) % width;
          const y = Math.floor(i / 4 / width);

          // Perlin-like noise using multiple octaves for subtle texture
          let noiseValue = 0;
          noiseValue += Math.sin((x + noiseSeedRef.current) * 0.01) * 0.3;
          noiseValue += Math.sin((y + noiseSeedRef.current) * 0.015) * 0.3;
          noiseValue += Math.sin((x + y + noiseSeedRef.current) * 0.005) * 0.4;

          // Convert to grayscale with very low opacity
          const gray = 128 + noiseValue * 5;
          const alpha = 0.08;

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
          data[i + 3] = alpha * 255;
        }

        ctx.putImageData(imageDataRef.current, 0, 0);
      }

      // Draw subtle gradient overlay for depth
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.8
      );

      const bgColor = colors.bgBody();
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, 'transparent');
      gradient.addColorStop(1, bgColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasRef, containerRef]);
}
