import Image from "next/image";

interface CategoryImageProps {
  src: string;
  alt: string;
  variant?: "card" | "hero" | "thumb";
  className?: string;
  priority?: boolean;
}

const variantStyles = {
  card: "relative h-40 w-full overflow-hidden rounded-t-2xl",
  hero: "relative h-48 sm:h-64 w-full overflow-hidden rounded-2xl mb-6",
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
        className="object-cover"
        priority={priority}
      />
      {variant !== "thumb" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      )}
    </div>
  );
}
