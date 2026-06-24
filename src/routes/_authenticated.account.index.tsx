import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const profileOpts = queryOptions({
 queryKey: ["account-profile"],
 queryFn: async () => {
 const { data: u } = await supabase.auth.getUser();
 const email = u.user?.email ?? "";
 const { data } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
 return { email, profile: data ?? { full_name: "", phone: "" } };
 },
});

export const Route = createFileRoute("/_authenticated/account/")({
 loader: ({ context }) => context.queryClient.ensureQueryData(profileOpts),
 component: Profile,
});

function Profile() {
 const { data } = useSuspenseQuery(profileOpts);
 const { email, profile } = data;
 const qc = useQueryClient();
 const [loading, setLoading] = useState(false);
 const [fullName, setFullName] = useState(profile.full_name ?? "");
 const [phone, setPhone] = useState(
 // strip anything that isn't a digit on load so existing bad values are cleaned
 (profile.phone ?? "").replace(/\D/g, "").slice(0, 11),
 );
 const [phoneErr, setPhoneErr] = useState<string | null>(null);

 function handlePhone(raw: string) {
 const digits = raw.replace(/\D/g, "").slice(0, 11);
 setPhone(digits);
 if (digits && digits.length < 9) {
 setPhoneErr("Phone must be 9–11 digits");
 } else {
 setPhoneErr(null);
 }
 }

 async function save(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 if (phone && phone.length < 9) {
 return toast.error("Phone number must be 9–11 digits");
 }
 setLoading(true);
 const { data: u } = await supabase.auth.getUser();
 const { error } = await supabase.from("profiles").upsert({
 id: u.user!.id,
 full_name: fullName.trim(),
 phone: phone || null,
 });
 setLoading(false);
 if (error) return toast.error("Could not save");
 toast.success("Profile updated");
 qc.invalidateQueries({ queryKey: ["account-profile"] });
 }

 return (
 <div className="surface-card p-6 md:p-8 max-w-xl">
 <h2 className="text-display text-2xl mb-1">Your profile</h2>
 <p className="text-sm text-muted-foreground mb-6">
 Keep this up to date so we can reach you about your orders.
 </p>
 <form onSubmit={save} className="space-y-4">
 <Field label="Full name" name="full_name" value={fullName} onChange={setFullName} />

 {/* Phone — controlled, digits only */}
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 Phone
 </label>
 <input
 name="phone"
 value={phone}
 onChange={(e) => handlePhone(e.target.value)}
 placeholder="03001234567 (9–11 digits)"
 inputMode="numeric"
 className={`w-full rounded-md border px-3 py-2.5 text-sm bg-background ${
 phoneErr ? "border-destructive" : "border-input"
 }`}
 />
 {phoneErr && <p className="text-xs text-destructive mt-1">{phoneErr}</p>}
 <p className="text-[10px] text-muted-foreground mt-1">Digits only, e.g. 03001234567</p>
 </div>

 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 Email
 </label>
 <input
 value={email}
 readOnly
 className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground"
 />
 </div>
 <button
 disabled={loading}
 className="rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-2.5 text-sm font-medium disabled:opacity-60"
 >
 {loading ? "Saving…" : "Save changes"}
 </button>
 </form>
 </div>
 );
}

function Field(props: {
 label: string;
 name: string;
 value?: string;
 onChange?: (val: string) => void;
 defaultValue?: string;
 placeholder?: string;
}) {
 return (
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 {props.label}
 </label>
 <input
 name={props.name}
 value={props.value}
 defaultValue={props.value === undefined ? props.defaultValue : undefined}
 onChange={props.onChange ? (e) => props.onChange!(e.target.value) : undefined}
 placeholder={props.placeholder}
 className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
 />
 </div>
 );
}
