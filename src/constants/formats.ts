import { OutputFormat } from '@/types/image';

export const SUPPORTED_IMAGE_FORMATS: OutputFormat[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic'
] as const;