"use client";

import {
  IconCheck,
  IconEdit,
  IconEye,
  IconTrash,
  IconUndo
} from "@/components/task-action-icons";
import type { UIComponentNode } from "@/lib/types";
import type { ReactNode } from "react";

function taskActionButtonContent(nodeName: string, text?: string): ReactNode | null {
  const t = text?.trim() || "";
  if (/ViewTaskButton/i.test(nodeName)) {
    return (
      <>
        <IconEye className="h-3.5 w-3.5" />
        <span className="sr-only">View</span>
      </>
    );
  }
  if (/EditTaskButton/i.test(nodeName)) {
    return (
      <>
        <IconEdit className="h-3.5 w-3.5" />
        <span className="sr-only">Edit</span>
      </>
    );
  }
  if (/CompleteTaskButton/i.test(nodeName)) {
    const undo = /undo/i.test(t);
    return (
      <>
        {undo ? <IconUndo className="h-3.5 w-3.5" /> : <IconCheck className="h-3.5 w-3.5" />}
        <span className="sr-only">{undo ? "Undo" : "Done"}</span>
      </>
    );
  }
  if (/DeleteTaskButton/i.test(nodeName)) {
    return (
      <>
        <IconTrash className="h-3.5 w-3.5" />
        <span className="sr-only">Delete</span>
      </>
    );
  }
  return null;
}

function LiveNode({ node, path }: { node: UIComponentNode; path: string }) {
  const children = node.children ?? [];
  const text = typeof node.props?.text === "string" ? node.props.text : undefined;
  const placeholder =
    typeof node.props?.placeholder === "string" ? node.props.placeholder : undefined;
  const classes = node.tailwindClasses?.trim() || "";

  if (children.length > 0) {
    return (
      <div className={classes} data-node={node.name}>
        {children.map((child, idx) => (
          <LiveNode
            key={`${path}/${child.name}-${idx}`}
            node={child}
            path={`${path}/${idx}`}
          />
        ))}
      </div>
    );
  }

  if (/button/i.test(node.name)) {
    const actionContent = taskActionButtonContent(node.name, text);
    if (actionContent) {
      return (
        <button type="button" className={classes} data-node={node.name}>
          {actionContent}
        </button>
      );
    }
    return (
      <button type="button" className={classes} data-node={node.name}>
        {text ?? node.name}
      </button>
    );
  }

  if (/input/i.test(node.name)) {
    const isPassword = /password/i.test(node.name);
    return (
      <input
        readOnly
        aria-readonly
        className={classes}
        data-node={node.name}
        placeholder={placeholder ?? (isPassword ? "Password" : " ")}
        type={isPassword ? "password" : "text"}
      />
    );
  }

  if (/checkbox/i.test(node.name)) {
    return (
      <input
        readOnly
        aria-readonly
        type="checkbox"
        className={classes}
        data-node={node.name}
      />
    );
  }

  return (
    <div className={classes} data-node={node.name}>
      {text ?? "\u00A0"}
    </div>
  );
}

export function LiveComponentPreview({ root }: { root: UIComponentNode }) {
  return (
    <div className="live-preview-root min-h-0 w-full overflow-auto">
      <LiveNode node={root} path="root" />
    </div>
  );
}
