import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { ProductCard, type Product } from '@/components/product-card';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Check, Command, Menu, Search, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 550);
    return () => window.clearTimeout(timer);
  }, []);

  const products: Product[] = [
    { id: 'halo-orb', name: 'Halo Orb 02', maker: 'Lumen Objects', category: 'Atmosphere', humanPrice: 184, agentPrice: 165.60, inventory: '12 in the wild', inventoryTone: 'plenty', trend: 91, art: 'orb', note: 'A warm, low-tech light for high-focus corners.' },
    { id: 'roam-pack', name: 'Roam Pack 16L', maker: 'Field Notes Studio', category: 'Carry', humanPrice: 228, agentPrice: 205.20, inventory: '4 left in this color', inventoryTone: 'limited', trend: 88, art: 'bag', note: 'The small bag that makes a long day feel possible.' },
    { id: 'common-tone', name: 'Common Tone', maker: 'Sonder Audio', category: 'Sound', humanPrice: 310, agentPrice: 279, inventory: 'Restock watch', inventoryTone: 'watch', trend: 94, art: 'speaker', note: 'A compact speaker tuned for rooms, not spec sheets.' },
    { id: 'arc-light', name: 'Arc Reading Light', maker: 'North / East', category: 'Desk', humanPrice: 96, agentPrice: 86.40, inventory: '28 available', inventoryTone: 'plenty', trend: 76, art: 'light', note: 'A calm pool of light with a slightly strange silhouette.' },
    { id: 'index-tray', name: 'Index Tray', maker: 'Object / Office', category: 'Desk', humanPrice: 72, agentPrice: 64.80, inventory: '19 available', inventoryTone: 'plenty', trend: 83, art: 'desk', note: 'A landing place for the small things you actually use.' },
    { id: 'pocket-35', name: 'Pocket 35', maker: 'Still Life Co.', category: 'Image', humanPrice: 449, agentPrice: 404.10, inventory: '7 in stock', inventoryTone: 'limited', trend: 97, art: 'camera', note: 'A point-and-shoot with a point of view.' },
  ];

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    const underHundred = search.includes('under') && search.includes('100');
    const focusMode = search.includes('focus') || search.includes('concentration');
    const smallMode = search.includes('small') || search.includes('mighty');
    return products.filter((product) =>
      (underHundred && product.humanPrice < 100)
      || (focusMode && ['Atmosphere', 'Desk'].includes(product.category))
      || (smallMode && ['Halo Orb 02', 'Index Tray', 'Pocket 35'].includes(product.name))
      || [product.name, product.maker, product.category, product.note].some((field) => field.toLowerCase().includes(search)),
    );
  }, [query]);

  const addToCart = (product: Product) => {
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setCartOpen(true);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query);
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const choosePrompt = (prompt: string) => {
    setQuery(prompt);
    setSubmittedQuery(prompt);
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="paper-grain min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[hsl(var(--border)/.75)] bg-[hsl(var(--background)/.84)] backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <a href="/" className="group flex items-center gap-3" data-testid="link-home">
            <span className="flex h-9 w-9 items-center justify-center bg-[hsl(var(--accent))] text-[hsl(var(--primary))] transition-transform group-hover:rotate-6"><Command size={19} strokeWidth={3} /></span>
            <span className="font-display text-lg font-bold leading-[.82] tracking-[-.07em]">NEXUS<br /><span className="text-[hsl(var(--muted-foreground))]">MARKET</span></span>
          </a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            <a href="#discover" className="font-mono text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-foreground" data-testid="link-discover">Discover</a>
            <a href="#protocol" className="font-mono text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-foreground" data-testid="link-protocol">The protocol</a>
            <a href="#journal" className="font-mono text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-foreground" data-testid="link-journal">Field notes</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))] lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chart-3))]" />Agents online 24/7</span>
            <button type="button" onClick={() => setCartOpen(true)} className="relative flex h-10 items-center gap-2 rounded-full border border-[hsl(var(--foreground))] px-3.5 font-mono text-[10px] uppercase tracking-[.12em] transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]" aria-label={`Open cart with ${cart.length} items`} data-testid="button-open-cart"><ShoppingBag size={15} /><span className="hidden sm:inline">List</span><span data-testid="text-cart-count">{cart.length.toString().padStart(2, '0')}</span></button>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--border))] md:hidden" aria-label="Toggle navigation menu" data-testid="button-toggle-menu">{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
          </div>
        </div>
        {menuOpen && <nav className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-4 md:hidden" aria-label="Mobile navigation"><div className="flex flex-col gap-4"><a href="#discover" onClick={() => setMenuOpen(false)} className="font-mono text-xs uppercase tracking-[.15em]" data-testid="mobile-link-discover">Discover</a><a href="#protocol" onClick={() => setMenuOpen(false)} className="font-mono text-xs uppercase tracking-[.15em]" data-testid="mobile-link-protocol">The protocol</a><a href="#journal" onClick={() => setMenuOpen(false)} className="font-mono text-xs uppercase tracking-[.15em]" data-testid="mobile-link-journal">Field notes</a></div></nav>}
      </header>

      <main>
        <section className="relative flex min-h-[760px] items-end overflow-hidden bg-[hsl(var(--primary))] pt-28 text-[hsl(var(--primary-foreground))] lg:min-h-[850px]">
          <div className="absolute right-[-15%] top-[14%] h-[480px] w-[480px] rounded-full bg-[hsl(var(--accent))] lg:right-[5%] lg:h-[640px] lg:w-[640px]" />
          <div className="absolute right-[18%] top-[31%] h-[300px] w-[230px] rotate-[18deg] rounded-[10rem] border-[18px] border-[hsl(var(--primary))] bg-[hsl(var(--secondary))] shadow-[30px_30px_0_hsl(var(--primary)/.16)] lg:right-[24%] lg:h-[410px] lg:w-[305px]" />
          <div className="absolute bottom-[10%] right-[9%] hidden w-[260px] rotate-[-8deg] border border-[hsl(var(--primary)/.45)] bg-[hsl(var(--accent)/.82)] p-4 text-[hsl(var(--primary))] lg:block"><div className="mb-10 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.14em]"><span>Live shelf / 004</span><span>04:28:11</span></div><p className="font-display text-2xl font-bold leading-none tracking-[-.06em]">Things with<br />a point of view.</p><div className="mt-12 flex justify-between border-t border-[hsl(var(--primary)/.3)] pt-2 font-mono text-[9px] uppercase tracking-[.12em]"><span>Curated by NEXUS</span><span>↗</span></div></div>
          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-16 lg:px-10 lg:pb-20">
            <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary-foreground)/.66)] animate-rise-in"><span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> A considered selection / updated daily</div>
            <h1 className="max-w-[850px] font-display text-[clamp(4.2rem,11vw,10.8rem)] font-bold leading-[.8] tracking-[-.09em] animate-rise-in">THE INTERNET&apos;S<br /><span className="text-[hsl(var(--accent))]">CONCEPT STORE.</span></h1>
            <div className="mt-12 flex max-w-[760px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><p className="max-w-[370px] text-sm leading-relaxed text-[hsl(var(--primary-foreground)/.68)]">A sharp shelf for curious people and the agents shopping on their behalf. No endless scroll. Just good calls.</p><a href="#discover" className="group flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.16em]" data-testid="link-browse-drop">Browse today&apos;s drop <ArrowDownRight size={16} className="transition-transform group-hover:translate-y-1" /></a></div>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-8 w-[calc(100%-2.5rem)] max-w-[1150px] rounded-[1.25rem] border border-[hsl(var(--foreground))] bg-[hsl(var(--card))] p-5 shadow-[12px_12px_0_hsl(var(--accent))] sm:p-8 lg:-mt-16 lg:p-10" aria-labelledby="search-heading">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]"><Bot size={14} />Ask the shelf</div><h2 id="search-heading" className="max-w-[500px] font-display text-3xl font-bold leading-[.95] tracking-[-.06em] sm:text-4xl">Tell us what you&apos;re<br /><span className="text-[hsl(var(--muted-foreground))]">in the mood for.</span></h2></div><div className="w-full lg:max-w-[480px]"><form onSubmit={submitSearch} className="relative"><label htmlFor="commerce-search" className="sr-only">Search products by mood, object, or maker</label><Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input id="commerce-search" value={query} onChange={(event) => { setQuery(event.target.value); setSubmittedQuery(event.target.value); }} placeholder="Try “a better desk” or “gift under $100”" className="h-14 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-12 pr-28 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))]" data-testid="input-product-search" /><button type="submit" className="absolute right-1.5 top-1.5 flex h-11 items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 font-mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5" data-testid="button-submit-search">Find <ArrowRight size={14} /></button></form><div className="mt-3 flex flex-wrap gap-2">{['something for focus', 'under $100', 'small but mighty'].map((prompt) => <button type="button" key={prompt} onClick={() => choosePrompt(prompt)} className="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--primary))] hover:text-foreground" data-testid={`button-prompt-${prompt.replaceAll(' ', '-')}`}>{prompt}</button>)}</div></div></div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[hsl(var(--border))] pt-4 font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-1.5 text-foreground"><Sparkles size={12} /> Human-readable</span><span>+</span><span className="flex items-center gap-1.5 text-foreground"><Bot size={12} /> Agent-legible</span><span className="hidden sm:inline">/ Every object carries a clean signal</span></div>
        </section>

        <section id="discover" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 lg:px-10 lg:py-32" aria-labelledby="discover-heading">
          <div className="mb-12 flex flex-col justify-between gap-6 border-b border-[hsl(var(--border))] pb-7 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">01 / Current selection</p><h2 id="discover-heading" className="font-display text-4xl font-bold tracking-[-.07em] sm:text-6xl">Good objects, <span className="text-[hsl(var(--muted-foreground))]">now.</span></h2></div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]" data-testid="status-grid">{submittedQuery ? `${filteredProducts.length} matches for “${submittedQuery}”` : `${products.length} objects / 06 signals`}</div></div>
          {isLoading ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading product grid" data-testid="status-loading-grid">{[1, 2, 3].map((item) => <div key={item} className="min-h-[440px] animate-pulse border-b border-[hsl(var(--border))]"><div className="mb-5 h-[260px] rounded-[1.25rem] bg-[hsl(var(--muted))]" /><div className="h-5 w-2/3 rounded bg-[hsl(var(--muted))]" /><div className="mt-3 h-3 w-1/3 rounded bg-[hsl(var(--muted))]" /></div>)}</div> : filteredProducts.length > 0 ? <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" data-testid="grid-products">{filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} onAdd={addToCart} added={cart.some((item) => item.id === product.id)} />)}</div> : <div className="flex min-h-[330px] flex-col items-center justify-center border border-dashed border-[hsl(var(--border))] px-6 text-center" data-testid="status-empty-search"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--accent))]"><Search size={22} /></div><h3 className="font-display text-2xl font-bold tracking-[-.05em]">That signal is quiet.</h3><p className="mt-2 max-w-[320px] text-sm text-[hsl(var(--muted-foreground))]">Try a broader mood, object, or maker name. The shelf has opinions, not infinite inventory.</p><button type="button" onClick={() => { setQuery(''); setSubmittedQuery(''); }} className="mt-6 rounded-full border border-[hsl(var(--foreground))] px-4 py-2 font-mono text-[10px] uppercase tracking-[.12em] transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]" data-testid="button-clear-search">Clear search</button></div>}
        </section>

        <section id="protocol" className="scroll-mt-20 bg-[hsl(var(--secondary))] px-5 py-24 lg:px-10 lg:py-32" aria-labelledby="protocol-heading"><div className="mx-auto max-w-[1440px]"><div className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:items-end"><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--foreground)/.65)]">02 / The NEXUS protocol</p><h2 id="protocol-heading" className="max-w-[480px] font-display text-5xl font-bold leading-[.88] tracking-[-.08em] sm:text-7xl">One shelf.<br />Two ways<br /><span className="text-[hsl(var(--chart-4))]">to shop.</span></h2></div><div className="grid gap-0 border-t border-[hsl(var(--foreground)/.3)] sm:grid-cols-2"><div className="border-b border-[hsl(var(--foreground)/.3)] py-7 sm:border-r sm:pr-8"><div className="mb-9 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--secondary))]"><Sparkles size={17} /></div><h3 className="font-display text-2xl font-bold tracking-[-.05em]">For humans</h3><p className="mt-3 max-w-[260px] text-sm leading-relaxed text-[hsl(var(--foreground)/.68)]">A point of view you can feel. Short descriptions, honest stock, and prices without the performance.</p></div><div className="border-b border-[hsl(var(--foreground)/.3)] py-7 sm:pl-8"><div className="mb-9 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--chart-4))] text-[hsl(var(--foreground))]"><Bot size={17} /></div><h3 className="font-display text-2xl font-bold tracking-[-.05em]">For agents</h3><p className="mt-3 max-w-[260px] text-sm leading-relaxed text-[hsl(var(--foreground)/.68)]">Clear attributes, agent pricing, and live inventory signals. The right context to make a confident call.</p></div></div></div><div className="mt-20 flex flex-col justify-between gap-5 border-t border-[hsl(var(--foreground)/.3)] pt-5 font-mono text-[10px] uppercase tracking-[.13em] text-[hsl(var(--foreground)/.65)] sm:flex-row"><span>Humans browse. Agents compose.</span><span className="flex items-center gap-2">Structured commerce for an unstructured world <ArrowRight size={14} /></span></div></div></section>

        <section id="journal" className="mx-auto max-w-[1440px] scroll-mt-20 px-5 py-24 lg:px-10 lg:py-32" aria-labelledby="journal-heading"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">03 / Field notes</p><h2 id="journal-heading" className="font-display text-5xl font-bold leading-[.88] tracking-[-.08em] sm:text-7xl">The good<br /><span className="text-[hsl(var(--muted-foreground))]">stuff.</span></h2></div><div className="grid gap-0 border-t border-[hsl(var(--border))]">{[['01', 'Why we price for the person doing the buying', 'A small argument for making the right thing easier to choose.', '6 min read'], ['02', 'A field guide to the almost invisible desk', 'Objects that change the atmosphere without taking over the room.', '4 min read'], ['03', 'What your shopping agent should know about taste', 'The difference between a filter and a point of view.', '8 min read']].map(([number, title, excerpt, duration]) => <button type="button" key={number} onClick={() => choosePrompt(title)} className="group grid grid-cols-[38px_1fr_auto] items-start gap-4 border-b border-[hsl(var(--border))] py-6 text-left transition-colors hover:bg-[hsl(var(--muted)/.5)] sm:grid-cols-[52px_1fr_auto] sm:gap-6" data-testid={`button-field-note-${number}`}><span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{number}</span><span><strong className="block max-w-[480px] font-display text-xl font-semibold leading-tight tracking-[-.04em]">{title}</strong><span className="mt-2 block max-w-[420px] text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{excerpt}</span></span><span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))] sm:flex">{duration}<ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span></button>)}</div></div></section>
      </main>

      <footer className="bg-[hsl(var(--primary))] px-5 py-8 text-[hsl(var(--primary-foreground))] lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="font-display text-2xl font-bold tracking-[-.06em]">NEXUS MARKET</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--primary-foreground)/.54)]">A storefront for considered decisions</p></div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--primary-foreground)/.54)]">© 2025 / Made for the next cart</p></div></footer>

      {cartOpen && <div className="fixed inset-0 z-50 flex justify-end bg-[hsl(var(--primary)/.35)]" role="dialog" aria-modal="true" aria-labelledby="cart-heading" data-testid="dialog-cart"><button type="button" className="absolute inset-0 cursor-default" aria-label="Close cart" onClick={() => setCartOpen(false)} data-testid="button-close-cart-backdrop" /><aside className="relative flex h-full w-full max-w-[440px] flex-col bg-[hsl(var(--card))] p-6 shadow-[-20px_0_40px_hsl(var(--primary)/.14)] sm:p-8"><div className="flex items-start justify-between border-b border-[hsl(var(--border))] pb-6"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">Your considered list</p><h2 id="cart-heading" className="font-display text-4xl font-bold tracking-[-.07em]">The list<span className="text-[hsl(var(--accent-foreground))]">.</span></h2></div><button type="button" onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--border))]" aria-label="Close cart" data-testid="button-close-cart"><X size={16} /></button></div>{cart.length ? <><div className="flex-1 divide-y divide-[hsl(var(--border))] overflow-y-auto" data-testid="list-cart-items">{cart.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 py-5"><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">{product.maker}</p><p className="mt-1 font-display text-lg font-semibold tracking-[-.04em]">{product.name}</p></div><div className="text-right"><p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">Agent price</p><p className="mt-1 text-sm font-bold">${product.agentPrice.toFixed(2)}</p><button type="button" onClick={() => setCart((current) => current.filter((item) => item.id !== product.id))} className="mt-2 font-mono text-[9px] uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))] underline underline-offset-4 hover:text-foreground" data-testid={`button-remove-${product.id}`}>Remove</button></div></div>)}</div><div className="border-t border-[hsl(var(--border))] pt-5"><div className="flex justify-between font-mono text-[10px] uppercase tracking-[.12em]"><span>Agent total</span><span data-testid="text-cart-total">${cart.reduce((total, item) => total + item.agentPrice, 0).toFixed(2)}</span></div><div className="mt-4 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Check size={14} className="text-[hsl(var(--chart-3))]" />Ready to hand to your shopping agent</div></div></> : <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--muted))]"><ShoppingBag size={21} /></div><h3 className="font-display text-2xl font-bold tracking-[-.05em]">Nothing saved yet.</h3><p className="mt-2 max-w-[250px] text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">Add something with a point of view and it will wait here.</p></div>}</aside></div>}
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;