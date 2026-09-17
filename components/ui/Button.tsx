import Link from "next/link";
import { BUTTON_BASE_CLASS, BUTTON_VARIANT_STYLES, type ButtonVariant } from "./buttonStyles";

const SIZE_STYLES = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
} as const;

type Size = keyof typeof SIZE_STYLES;

type BaseProps = {
  variant?: ButtonVariant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type LinkButtonProps = BaseProps & {
  href: string;
};

type PlainButtonProps = BaseProps & {
  href?: undefined;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  type?: "button" | "submit";
};

/** A styled trigger that is not a form submit — either a `Link` (href) or a plain button (e.g. to open a Modal/AlertDialog). */
export function Button(props: LinkButtonProps | PlainButtonProps) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = `${BUTTON_BASE_CLASS} ${SIZE_STYLES[size]} ${BUTTON_VARIANT_STYLES[variant]} ${className}`;

  if (props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { onClick, disabled, type = "button" } = props;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={props["aria-label"]}
      className={classes}
    >
      {children}
    </button>
  );
}
