import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "../../../i18n";

interface SectionProps {
  title: string;
  children: ReactNode;
  onSeeAll?: () => void;
}

export function Section({ title, children, onSeeAll }: SectionProps) {
  const { t } = useTranslation();

  return (
    <section className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="flex items-center justify-between group cursor-pointer" onClick={onSeeAll}>
        <h2 className="text-2xl font-bold text-light transition-colors group-hover:text-secondary">
          {title}
        </h2>
        {onSeeAll && (
          <div className="flex items-center gap-1 text-light/50 group-hover:text-secondary transition-colors text-sm font-medium">
            {t.home.seeAll} <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Horizontal scroll container for items */}
      <div className="flex overflow-x-auto pb-6 snap-x snap-mandatory gap-6 pr-8">
        {children}
      </div>
    </section>
  );
}
