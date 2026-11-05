import React from "react";

export interface PersonProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  sub?: string;
  avatar?: React.ReactNode;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function Person({
  name,
  sub,
  avatar,
  className = "",
  ...props
}: PersonProps) {
  return (
    <div className={`person ${className}`.trim()} {...props}>
      <span className="person__avatar" aria-hidden="true">
        {avatar ?? getInitials(name)}
      </span>
      <span className="person__copy">
        <span className="person__name" title={name}>
          {name}
        </span>
        {sub && <span className="person__sub">{sub}</span>}
      </span>
    </div>
  );
}
