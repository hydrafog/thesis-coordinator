import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconOnly?: boolean;
  action?: string;
  dataId?: string;
  label?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant,
      size,
      icon,
      iconOnly = false,
      action,
      dataId,
      label,
      className = "",
      type = "button",
      disabled = false,
      title,
      ...props
    },
    ref,
  ) {
    const variantClass = variant ? `btn--${variant}` : "";
    const sizeClass = size && size !== "md" ? `btn--${size}` : "";
    const iconOnlyClass = iconOnly ? "btn--icon" : "";

    const classes = ["btn", variantClass, sizeClass, iconOnlyClass, className]
      .filter(Boolean)
      .join(" ");

    const resolvedLabel =
      label ?? (typeof children === "string" ? children : undefined);
    const titleText =
      title || (iconOnly && resolvedLabel ? resolvedLabel : undefined);

    return (
      <button
        ref={ref}
        className={classes}
        type={type}
        disabled={disabled}
        title={titleText}
        data-action={action}
        data-id={dataId}
        {...props}
      >
        {icon}
        {iconOnly ? (
          <span className="sr-only">{resolvedLabel ?? children}</span>
        ) : (
          (children ?? (label ? <span>{label}</span> : null))
        )}
      </button>
    );
  },
);
