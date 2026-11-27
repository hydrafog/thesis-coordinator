"use client";

import React, { useState } from "react";
import { Icon } from "./icon";

export interface PanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function Panel({
  id,
  title,
  children,
  defaultCollapsed = false,
  className = "",
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const toggleLabel = `${collapsed ? "Expand" : "Collapse"} ${title}`;

  return (
    <section
      className={`panel ${className}`.trim()}
      data-collapsed={collapsed}
      aria-labelledby={`panel-title-${id}`}
    >
      <div className="panel__head">
        <h2 className="panel__title" id={`panel-title-${id}`}>
          {title}
        </h2>
        <button
          className="btn btn--ghost btn--icon btn--sm"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-controls={`panel-body-${id}`}
          aria-label={toggleLabel}
        >
          <Icon name="up-line" small />
        </button>
      </div>
      <div className="panel__body" id={`panel-body-${id}`} hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}
