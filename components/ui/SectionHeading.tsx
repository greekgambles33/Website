import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="font-heading mb-2 text-xs font-bold uppercase tracking-[0.3em] text-lava-500">
          {eyebrow}
        </p>
      )}
      <h2 className="text-ember text-3xl sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-balance text-ash-300">{description}</p>
      )}
    </div>
  );
}
