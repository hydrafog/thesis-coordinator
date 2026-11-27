import React from "react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  text: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  text,
  action,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div className={`empty ${className}`.trim()} role="status" {...props}>
      <p className="empty__title">{title}</p>
      <p className="empty__text">{text}</p>
      {action}
    </div>
  );
}
