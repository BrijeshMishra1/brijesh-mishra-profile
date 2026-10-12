import { createContext, useContext, type ReactNode } from "react";

/** The id of the tab that is currently open; set once by App. */
export const ActiveTab = createContext<string>("about");

interface Props {
  id: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}

/** One tab panel. All panels stay mounted (state such as filters survives), inactive ones are hidden. */
export function Section({ id, title, kicker, children }: Props) {
  const active = useContext(ActiveTab) === id;
  return (
    <section
      className="panel"
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={!active}
      tabIndex={0}
    >
      <header className="panel__head">
        {kicker ? <p className="eyebrow">{kicker}</p> : null}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}
