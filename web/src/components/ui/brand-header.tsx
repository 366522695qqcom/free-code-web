import { cn } from "@/lib/utils";

export interface BrandHeaderProps {
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Free Code 品牌头部：▌ Free Code [副标]
 * 用于 login 页、侧边栏顶部、Provider 页、Chat 空状态等。
 */
export function BrandHeader({
  subtitle,
  size = "md",
  className,
}: BrandHeaderProps) {
  const headingClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  }[size];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-brand text-lg leading-none select-none">▌</span>
        <h1 className={cn("font-display font-semibold tracking-tight", headingClass)}>
          Free Code
        </h1>
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground pl-6">{subtitle}</p>
      )}
    </div>
  );
}
