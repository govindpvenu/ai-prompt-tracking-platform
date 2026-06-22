import { cn } from '../lib/utils'

export const Logo = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <svg
            className={cn('text-foreground h-6 w-auto', className)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke={uniColor ? 'currentColor' : 'url(#paint_logo)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M12 6V2H8" />
            <path d="M15 11v2" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
            <path d="M9 11v2" />

            {!uniColor && (
                <defs>
                    <linearGradient
                        id="paint_logo"
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="22"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9B99FE" />
                        <stop offset="1" stopColor="#2BC8B7" />
                    </linearGradient>
                </defs>
            )}
        </svg>
    )
}

export const LogoIcon = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <svg
            className={cn('size-6', className)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke={uniColor ? 'currentColor' : 'url(#paint_logo_icon)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M12 6V2H8" />
            <path d="M15 11v2" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
            <path d="M9 11v2" />

            {!uniColor && (
                <defs>
                    <linearGradient
                        id="paint_logo_icon"
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="22"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9B99FE" />
                        <stop offset="1" stopColor="#2BC8B7" />
                    </linearGradient>
                </defs>
            )}
        </svg>
    )
}