import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionCustomProps {
  title: string;
  subtitle: string;
  content: string[];
  id: string;
}

export default function AccordionCustom({ title, subtitle, content, id }: AccordionCustomProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      <button
        onClick={toggleAccordion}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
        data-testid={`accordion-${id}`}
      >
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div 
        className={`accordion-content ${isExpanded ? 'expanded' : ''}`}
        style={{
          maxHeight: isExpanded ? 'fit-content' : '0px',
        }}
      >
        <div className="px-6 pb-4 text-muted-foreground">
          <ul className="space-y-2">
            {content.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
