import Link from "next/link";
import { BUTTON_BASE_CLASS, BUTTON_VARIANT_STYLES, type ButtonVariant } from "./buttonStyles";

const SIZE_STYLES = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
} as const;

type Size = keyof typeof SIZE_STYLES;

type ButtonProps = {
  variant?: ButtonVariant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  /** Renders as a `Link` when set; otherwise a plain (non-submit) button. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  "aria-label"?: string;
};

/** A styled trigger that is not a form submit — either a `Link` (href) or a plain button (e.g. to open a Modal/AlertDialog). */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  onClick,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = `${BUTTON_BASE_CLASS} ${SIZE_STYLES[size]} ${BUTTON_VARIANT_STYLES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={classes}>
      {children}
    </button>
  );
}
