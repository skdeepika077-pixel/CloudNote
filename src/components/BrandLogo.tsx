interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  uppercase?: boolean;
}

export function BrandLogo({ size = 'md', uppercase = false }: BrandLogoProps) {
  const iconSize = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const textSize =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div
        className={`${iconSize} flex items-center justify-center rounded-xl bg-[#263F79] text-white`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4/6 w-4/6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          <path d="M9.5 13.5h5" />
          <path d="M9.5 16h3.5" />
        </svg>
      </div>
      <span
        className={`${textSize} font-display font-bold tracking-tight text-[#242424] whitespace-nowrap shrink-0 ${
          uppercase ? 'tracking-wider' : ''
        }`}
      >
        {uppercase ? 'CLOUDNOTE' : 'CloudNote'}
      </span>
    </div>
  );
}
