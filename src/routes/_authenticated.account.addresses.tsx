import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, Pencil, X, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";

// ─── Query ────────────────────────────────────────────────────────────────────

const addressesOpts = queryOptions({
  queryKey: ["account-addresses"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/account/addresses")({
  loader: ({ context }) => context.queryClient.ensureQueryData(addressesOpts),
  component: Addresses,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Address = {
  id: string;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
};

type EditState = Omit<Address, "id">;

// ─── Component ────────────────────────────────────────────────────────────────

function Addresses() {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery(addressesOpts);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    hasActiveOrders: boolean;
  } | null>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("addresses").insert({
        user_id: u.user!.id,
        label: String(formData.get("label") ?? ""),
        full_name: String(formData.get("full_name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        line1: String(formData.get("line1") ?? ""),
        line2: String(formData.get("line2") ?? "") || null,
        city: String(formData.get("city") ?? ""),
        province: String(formData.get("province") ?? ""),
        postal_code: String(formData.get("postal_code") ?? "") || null,
        country: "Pakistan",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Address added");
      qc.invalidateQueries({ queryKey: ["account-addresses"] });
    },
    onError: () => toast.error("Could not save address"),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditState }) => {
      const { error } = await supabase
        .from("addresses")
        .update({
          label: data.label || null,
          full_name: data.full_name,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          city: data.city,
          province: data.province,
          postal_code: data.postal_code || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Address updated");
      setEditingId(null);
      setEditForm(null);
      qc.invalidateQueries({ queryKey: ["account-addresses"] });
    },
    onError: () => toast.error("Could not update address"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Address removed");
      qc.invalidateQueries({ queryKey: ["account-addresses"] });
    },
    onError: () => toast.error("Could not remove address"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const phone = String(fd.get("phone") ?? "");
    const postal = String(fd.get("postal_code") ?? "");
    if (phone.length < 9) return toast.error("Phone must be 9–11 digits");
    if (postal && postal.length < 4) return toast.error("Postal code must be 4–6 digits");
    addMutation.mutate(fd, {
      onSuccess: () => {
        form.reset();
        setAdding(false);
      },
    });
  }

  function startEdit(a: Address) {
    setEditingId(a.id);
    setEditForm({
      label: a.label ?? "",
      full_name: a.full_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      province: a.province,
      postal_code: a.postal_code ?? "",
      country: a.country ?? "Pakistan",
      is_default: a.is_default ?? false,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function saveEdit() {
    if (!editingId || !editForm) return;
    if (!editForm.full_name || !editForm.phone || !editForm.line1 || !editForm.city || !editForm.province) {
      return toast.error("Please fill in all required fields");
    }
    if (editForm.phone.length < 9) return toast.error("Phone must be 9–11 digits");
    if (editForm.postal_code && editForm.postal_code.length < 4) return toast.error("Postal code must be 4–6 digits");
    editMutation.mutate({ id: editingId, data: editForm });
  }

  async function handleDeleteClick(a: Address) {
    // Check for active (non-terminal) orders that were shipped to this address.
    // Orders store a JSONB snapshot so history is always safe — we just warn if
    // there are pending/processing/shipped orders referencing the same phone.
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("id")
      .not("status", "in", '("delivered","cancelled","refunded")')
      .filter("shipping_address->>phone", "eq", a.phone)
      .limit(1);

    setDeleteTarget({
      id: a.id,
      hasActiveOrders: (activeOrders?.length ?? 0) > 0,
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-display text-2xl">Saved addresses</h2>
        <button
          onClick={() => { setAdding((v) => !v); cancelEdit(); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="surface-card p-6 grid sm:grid-cols-2 gap-3">
          <F label="Label" name="label" placeholder="Home / Office" />
          <F label="Full name" name="full_name" required />
          <F label="Phone" name="phone" required />
          <F label="City" name="city" required />
          <F label="Address line 1" name="line1" required className="sm:col-span-2" />
          <F label="Address line 2" name="line2" className="sm:col-span-2" />
          <F label="Province" name="province" required />
          <F label="Postal code" name="postal_code" />
          <div className="sm:col-span-2 flex gap-2 pt-2">
            <button
              disabled={addMutation.isPending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground disabled:opacity-60"
            >
              {addMutation.isPending ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-md border border-input px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address list */}
      {list.length === 0 && !adding ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-3" />
          No addresses saved yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((a) =>
            editingId === a.id && editForm ? (
              // ── Inline edit form ──────────────────────────────────────────
              <div key={a.id} className="surface-card p-5 sm:col-span-2 grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 flex justify-between items-center mb-1">
                  <span className="text-xs uppercase tracking-wider text-copper font-semibold">
                    Editing address
                  </span>
                  <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <EF label="Label" value={editForm.label ?? ""} onChange={(v) => setEditForm((f) => f && ({ ...f, label: v }))} placeholder="Home / Office" />
                <EF label="Full name *" value={editForm.full_name} onChange={(v) => setEditForm((f) => f && ({ ...f, full_name: v }))} />
                <EF label="Phone *" value={editForm.phone} onChange={(v) => setEditForm((f) => f && ({ ...f, phone: v }))} />
                <EF label="City *" value={editForm.city} onChange={(v) => setEditForm((f) => f && ({ ...f, city: v }))} />
                <EF label="Address line 1 *" value={editForm.line1} onChange={(v) => setEditForm((f) => f && ({ ...f, line1: v }))} className="sm:col-span-2" />
                <EF label="Address line 2" value={editForm.line2 ?? ""} onChange={(v) => setEditForm((f) => f && ({ ...f, line2: v }))} className="sm:col-span-2" />
                <EF label="Province *" value={editForm.province} onChange={(v) => setEditForm((f) => f && ({ ...f, province: v }))} />
                <EF label="Postal code" value={editForm.postal_code ?? ""} onChange={(v) => setEditForm((f) => f && ({ ...f, postal_code: v }))} />
                <div className="sm:col-span-2 flex gap-2 pt-2">
                  <button
                    onClick={saveEdit}
                    disabled={editMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    {editMutation.isPending ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md border border-input px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // ── Address card ──────────────────────────────────────────────
              <div key={a.id} className="surface-card p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs uppercase tracking-wider text-copper font-semibold">
                    {a.label ?? "Address"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(a)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit address"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(a)}
                      disabled={removeMutation.isPending}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="font-medium">{a.full_name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  {a.city}, {a.province}
                  {a.postal_code ? ` ${a.postal_code}` : ""}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{a.phone}</div>
              </div>
            )
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove address?"
        description={
          deleteTarget?.hasActiveOrders
            ? "This address is linked to one or more active orders. Your order history won't be affected (the address is saved inside each order), but this address will be removed from your address book."
            : "This address will be permanently removed from your address book."
        }
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) removeMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

/** Uncontrolled field for the add form (uses FormData).
 *  phone and postal_code get digit-only filtering. */
function F({
  label,
  name,
  required,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const isPhone  = name === "phone";
  const isPostal = name === "postal_code";
  const maxLen   = isPhone ? 11 : isPostal ? 6 : undefined;

  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
        {label}
        {required && <span className="text-copper"> *</span>}
      </label>
      <input
        name={name}
        required={required}
        placeholder={placeholder ?? (isPhone ? "03001234567 (9–11 digits)" : isPostal ? "Postal code (4–6 digits)" : undefined)}
        inputMode={isPhone || isPostal ? "numeric" : undefined}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        onChange={
          isPhone || isPostal
            ? (e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen!);
                e.target.value = digits;
              }
            : undefined
        }
      />
    </div>
  );
}

/** Controlled field for the inline edit form.
 *  phone and postal_code get digit-only filtering. */
function EF({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  fieldName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  fieldName?: string;
}) {
  const isPhone  = fieldName === "phone"  || label.toLowerCase().includes("phone");
  const isPostal = fieldName === "postal" || label.toLowerCase().includes("postal");
  const maxLen   = isPhone ? 11 : isPostal ? 6 : undefined;

  function handleChange(raw: string) {
    if (isPhone || isPostal) {
      onChange(raw.replace(/\D/g, "").slice(0, maxLen!));
    } else {
      onChange(raw);
    }
  }

  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? (isPhone ? "03001234567 (9–11 digits)" : isPostal ? "Postal code (4–6 digits)" : undefined)}
        inputMode={isPhone || isPostal ? "numeric" : undefined}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
