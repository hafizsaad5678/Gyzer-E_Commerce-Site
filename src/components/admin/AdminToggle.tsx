/**
 * AdminToggle — pill-shaped boolean toggle for product Active / Featured flags.
 * Extracted from _authenticated.admin.products.tsx.
 */

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function AdminToggle({ checked, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        checked ? "bg-copper" : "bg-muted"
      }`}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
