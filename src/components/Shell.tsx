import type { ReactNode } from "react";

type ShellProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: ReactNode;
};

export function Shell({ title, showBack, onBack, children }: ShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark">
          <strong>薬剤学習</strong>
          {title ? <span>/ {title}</span> : <span>Clinical Drug Study</span>}
        </div>
        {showBack ? (
          <button type="button" className="nav-back" onClick={onBack}>
            ホームへ
          </button>
        ) : null}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
