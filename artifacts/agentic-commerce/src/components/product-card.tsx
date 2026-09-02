import { ArrowUpRight, Bot, CircleCheck, Plus, Sparkles } from 'lucide-react';

export type Product = {
  id: string;
  name: string;
  maker: string;
  category: string;
  humanPrice: number;
  agentPrice: number;
  inventory: string;
  inventoryTone: 'plenty' | 'limited' | 'watch';
  trend: number;
  art: 'orb' | 'bag' | 'speaker' | 'light' | 'desk' | 'camera';
  note: string;
};

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
  added: boolean;
  index: number;
};

const artLabels: Record<Product['art'], string> = {
  orb: 'amber glass orb on a sculptural plinth',
  bag: 'cobalt modular carry bag',
  speaker: 'red geometric desktop speaker',
  light: 'lime architectural reading light',
  desk: 'graphite aluminum desk object',
  camera: 'coral pocket camera',
};

export function ProductCard({ product, onAdd, added, index }: ProductCardProps) {
  return (
    <article
      className="group flex min-h-[440px] flex-col border-b border-[hsl(var(--border))] pb-5 animate-rise-in"
      style={{ animationDelay: `${index * 90}ms` }}
      data-testid={`card-product-${product.id}`}
    >
      <div
        className={`product-art art-${product.art} relative mb-5 flex min-h-[260px] items-end overflow-hidden rounded-[1.25rem] border border-[hsl(var(--foreground)/.08)] p-4 transition-transform duration-500 group-hover:-translate-y-1`}
        aria-label={artLabels[product.art]}
        role="img"
        data-testid={`img-product-${product.id}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--foreground)/.62)]">
          {product.category} / 0{index + 1}
        </span>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--card)/.88)] text-[hsl(var(--foreground))] backdrop-blur-sm transition-colors hover:bg-[hsl(var(--accent))]"
          aria-label={`Add ${product.name} to cart`}
          data-testid={`button-add-${product.id}`}
        >
          {added ? <CircleCheck size={17} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
        </button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{product.maker}</p>
          <h3 className="font-display text-[1.15rem] font-semibold leading-tight tracking-[-.03em]">{product.name}</h3>
        </div>
        <ArrowUpRight size={17} className="mt-1 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <p className="mt-2 max-w-[29ch] text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{product.note}</p>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[hsl(var(--border))] pt-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Human</p>
          <p className="mt-1 text-sm font-bold">${product.humanPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]"><Bot size={11} /> Agent</p>
          <p className="mt-1 text-sm font-bold text-[hsl(var(--primary))]">${product.agentPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">Trend</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-bold"><Sparkles size={12} className="text-[hsl(var(--accent-foreground))]" />{product.trend}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.1em]">
        <span className={`h-1.5 w-1.5 rounded-full ${product.inventoryTone === 'plenty' ? 'bg-[hsl(var(--chart-3))]' : product.inventoryTone === 'limited' ? 'bg-[hsl(var(--chart-2))]' : 'bg-[hsl(var(--destructive))]'}`} />
        <span className="text-[hsl(var(--muted-foreground))]" data-testid={`status-inventory-${product.id}`}>{product.inventory}</span>
      </div>
    </article>
  );
}