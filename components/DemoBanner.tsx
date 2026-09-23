import { FlaskConical } from 'lucide-react';

// Thin notice shown on every page when IS_DEMO is on (see app/layout.tsx).
export default function DemoBanner() {
  return (
    <div className="border-b border-blush/60 bg-sand px-4 py-1.5 text-center text-[11px] text-wine">
      <FlaskConical size={12} className="mr-1 inline-block align-[-2px]" />
      Modo demonstração: dados de exemplo, nada é salvo em servidor.
    </div>
  );
}
