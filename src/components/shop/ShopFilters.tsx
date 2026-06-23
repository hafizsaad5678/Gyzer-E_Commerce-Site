/**
 * ShopFilters — sidebar filter panel for the shop page.
 * Extracted from shop.tsx to keep that route file focused on data fetching.
 */

type Category = { id: string; slug: string; name: string };

type Props = {
  q: string;
  onQ: (v: string) => void;
  cat: string;
  onCat: (v: string) => void;
  brand: string;
  onBrand: (v: string) => void;
  capacity: string;
  onCapacity: (v: string) => void;
  maxPrice: number;
  onMaxPrice: (v: number) => void;
  sort: string;
  onSort: (v: string) => void;
  categories: Category[];
  allBrands: string[];
  allCapacities: number[];
};

export function ShopFilters({
  q,
  onQ,
  cat,
  onCat,
  brand,
  onBrand,
  capacity,
  onCapacity,
  maxPrice,
  onMaxPrice,
  sort,
  onSort,
  categories,
  allBrands,
  allCapacities,
}: Props) {
  return (
    <div className="surface-card p-5 space-y-5">
      {/* Search */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          Search
        </label>
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Find a geyser..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          Category
        </label>
        <div className="space-y-1.5">
          <FilterButton active={!cat} onClick={() => onCat("")}>
            All
          </FilterButton>
          {categories.map((c) => (
            <FilterButton key={c.id} active={cat === c.slug} onClick={() => onCat(c.slug)}>
              {c.name}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* Brand */}
      {allBrands.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Brand
          </label>
          <div className="space-y-1.5">
            <FilterButton active={!brand} onClick={() => onBrand("")}>
              All brands
            </FilterButton>
            {allBrands.map((b) => (
              <FilterButton key={b} active={brand === b} onClick={() => onBrand(b)}>
                {b}
              </FilterButton>
            ))}
          </div>
        </div>
      )}

      {/* Capacity */}
      {allCapacities.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Capacity
          </label>
          <div className="flex flex-wrap gap-1.5">
            <CapacityChip active={!capacity} onClick={() => onCapacity("")}>
              Any
            </CapacityChip>
            {allCapacities.map((c) => (
              <CapacityChip
                key={c}
                active={capacity === String(c)}
                onClick={() => onCapacity(String(c))}
              >
                {c}L
              </CapacityChip>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          Max price: Rs {maxPrice.toLocaleString()}
        </label>
        <input
          type="range"
          min={10_000}
          max={250_000}
          step={5_000}
          value={maxPrice}
          onChange={(e) => onMaxPrice(Number(e.target.value))}
          className="w-full accent-copper"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Rs 10,000</span>
          <span>Rs 2,50,000</span>
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          Sort by
        </label>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="new">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors",
        active
          ? "bg-secondary text-foreground font-medium"
          : "text-muted-foreground hover:bg-secondary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CapacityChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-copper bg-copper/10 text-copper font-medium"
          : "border-border text-muted-foreground hover:border-copper/50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
