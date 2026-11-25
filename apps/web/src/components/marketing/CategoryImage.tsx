import Image from "next/image";

interface CategoryImageProps {
  src: string;
  alt: string;
  variant?: "card" | "hero" | "thumb";
  className?: string;
  priority?: boolean;
}

const variantStyles = {
  card: "relative h-48 w-full overflow-hidden bg-brand-100",
  hero: "relative h-56 sm:h-[22rem] w-full overflow-hidden rounded-[1.75rem] bg-brand-100",
  thumb: "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg",
};

export function CategoryImage({
  src,
  alt,
  variant = "card",
  className = "",
  priority = false,
}: CategoryImageProps) {
  return (
    <div className={`${variantStyles[variant]} ${className}`.trim()}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={
          variant === "thumb"
            ? "48px"
            : variant === "hero"
              ? "(max-width: 768px) 100vw, 768px"
              : "(max-width: 768px) 100vw, 400px"
        }
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        priority={priority}
      />
      {variant !== "thumb" && (
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/25 via-transparent to-transparent" />
      )}
    </div>
  );
}
