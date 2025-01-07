// types/components/input.ts
import { InputHTMLAttributes, ReactNode } from 'react'

export interface EmailInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  className?: string;
}