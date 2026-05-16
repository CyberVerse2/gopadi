"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type RevealItemProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  index?: number;
  delay?: number;
  as?: "div" | "li" | "article" | "section" | "aside" | "header" | "footer";
};

export function Reveal({
  children,
  index = 0,
  delay = 0,
  className = "",
  style,
  as = "div",
  ...rest
}: RevealItemProps) {
  const mergedStyle = {
    ...style,
    ["--i" as string]: index,
    ["--reveal-delay" as string]: `${delay}ms`,
  } as CSSProperties;

  const cls = `reveal-item ${className}`.trim();

  if (as === "li") {
    return (
      <li {...(rest as HTMLAttributes<HTMLLIElement>)} className={cls} style={mergedStyle}>
        {children}
      </li>
    );
  }
  if (as === "article") {
    return (
      <article {...(rest as HTMLAttributes<HTMLElement>)} className={cls} style={mergedStyle}>
        {children}
      </article>
    );
  }
  return (
    <div {...rest} className={cls} style={mergedStyle}>
      {children}
    </div>
  );
}

type RevealGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  autoActivate?: boolean;
  threshold?: number;
};

export function RevealGroup({
  children,
  autoActivate = false,
  threshold = 0.12,
  className = "",
  style,
  ...rest
}: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (autoActivate) {
      const raf = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(raf);
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoActivate, threshold]);

  return (
    <div
      ref={ref}
      {...rest}
      className={`reveal-group ${active ? "is-active" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
