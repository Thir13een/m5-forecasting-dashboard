"use client";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function ScrollArea({ children, className, style }: Props) {
  return (
    <SimpleBar
      className={className}
      style={{ height: "100%", ...style }}
      autoHide={false}
    >
      {children}
    </SimpleBar>
  );
}
