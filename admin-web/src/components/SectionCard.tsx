import type { ReactNode } from "react";
import "./SectionCard.css";

type SectionCardProps = Readonly<{
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}>;

function SectionCard({
  title,
  description,
  actions,
  children,
  bodyClassName = "",
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className="section-card">
      {hasHeader && (
        <div className="section-card__header">
          <div className="section-card__heading">
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>

          {actions && <div className="section-card__actions">{actions}</div>}
        </div>
      )}

      <div className={`section-card__body ${bodyClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}

export default SectionCard;
