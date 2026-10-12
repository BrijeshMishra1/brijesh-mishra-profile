import type { ReactNode } from "react";

interface Props {
  id: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}

export function Section({ id, title, kicker, children }: Props) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <header className="section__head">
        {kicker ? <p className="eyebrow">{kicker}</p> : null}
        <h2 id={`${id}-title`}>{title}</h2>
      </header>
      {children}
    </section>
  );
}
