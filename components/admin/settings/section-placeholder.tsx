import { Construction } from "lucide-react";

interface SectionPlaceholderProps {
  title: string;
}

export function SectionPlaceholder({ title }: SectionPlaceholderProps) {
  return (
    <div className="small-card placeholder-card">
      <h3>{title}</h3>
      <div className="sub">Bientôt disponible</div>

      <div className="placeholder-illustration" aria-hidden>
        <Construction />
      </div>

      <p className="placeholder-message">
        Cette section sera activée prochainement. Les autres paramètres restent
        accessibles via la navigation à gauche.
      </p>
    </div>
  );
}
