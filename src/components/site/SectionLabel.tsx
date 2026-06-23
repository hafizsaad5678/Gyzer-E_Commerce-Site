/**
 * SectionLabel — small eyebrow text used above headings throughout the site.
 * Example: "Bestsellers", "Categories", "GET IN TOUCH"
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
 return (
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 {children}
 </div>
 );
}
