import type { ReactNode } from 'react'
import { Icon, type IconName } from './icon'

type BannerKind = 'info' | 'warn' | 'crit' | 'ok'

type BannerProps = {
  kind?: BannerKind
  icon?: IconName
  title?: string
  children: ReactNode
  action?: ReactNode
}

export function Banner({ kind = 'info', icon, title, children, action }: BannerProps) {
  const defaultIcon: Record<BannerKind, IconName> = {
    crit: 'alertCircle',
    warn: 'alert',
    ok: 'checkCircle',
    info: 'info',
  }
  const ic = icon ?? defaultIcon[kind]

  return (
    <div className={`banner banner-${kind}`} role={kind === 'crit' ? 'alert' : 'status'}>
      <Icon name={ic} size={18} aria-hidden />
      <div className="grow">
        {title && <div className="banner-title">{title}</div>}
        <div>{children}</div>
      </div>
      {action}
    </div>
  )
}
