'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './icon'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'rec'
type BtnSize = 'xs' | 'sm' | 'lg' | undefined

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  size?: BtnSize
  icon?: IconName
  iconR?: IconName
  children?: ReactNode
  loading?: boolean
}

export function Btn({
  variant = 'secondary',
  size,
  icon,
  iconR,
  children,
  className = '',
  loading,
  disabled,
  ...rest
}: BtnProps) {
  const iconSize = size === 'xs' ? 14 : size === 'sm' ? 15 : 16
  const cls = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <Icon name="loader" size={iconSize} className="spin" aria-hidden />
      ) : (
        icon && <Icon name={icon} size={iconSize} aria-hidden />
      )}
      {children}
      {iconR && <Icon name={iconR} size={size === 'sm' ? 15 : 16} aria-hidden />}
    </button>
  )
}
