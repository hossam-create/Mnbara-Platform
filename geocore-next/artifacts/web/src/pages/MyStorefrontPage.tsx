import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Store, Edit3, Eye, TrendingUp, Package } from "lucide-react";

export default function MyStorefrontPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", welcome_msg: "", logo_url: "", banner_url: "", slug: "" });
  const [msg, setMsg] = useState("");

  if (!isAuthenticated) {
    navigate("/login?next=/my-store");
    return null;
  }

  const { data: storefront, isLoading, error } = useQuery({
    queryKey: ["storefront", "mine"],
    queryFn: () => api.get("/stores/me").then((r) => r.data.data),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/stores", data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storefront", "mine"] });
      setMsg("Storefront created! 🎉");
    },
    onError: (err: any) => {
      setMsg(err?.response?.data?.message || "Failed to create storefront.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof form>) => api.put("/stores/me", data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storefront", "mine"] });
      setEditing(false);
      setMsg("Storefront updated!");
    },
    onError: (err: any) => {
      setMsg(err?.response?.data?.message || "Failed to update storefront.");
    },
  });

  const hasStore = !error && storefront;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Store size={24} className="text-[#0071CE]" /> My Storefront
      </h1>
      <p className="text-gray-500 text-sm mb-8">Your public seller page where buyers can discover all your listings.</p>

      {isLoading ? (
        <div className="h-40 bg-white rounded-2xl animate-pulse shadow-sm" />
      ) : hasStore ? (
        <div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            {storefront.banner_url ? (
              <img src={storefront.banner_url} alt="banner" className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-gradient-to-r from-[#0071CE] to-[#003f75]" />
            )}
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-8 mb-4">
                <div className="w-16 h-16 rounded-2xl border-4 border-white shadow bg-[#FFC220] flex items-center justify-center text-2xl font-extrabold text-gray-900 overflow-hidden">
                  {storefront.logo_url ? (
                    <img src={storefront.logo_url} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    storefront.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/stores/${storefront.slug}`}
                    className="flex items-center gap-1.5 text-sm border border-[#0071CE] text-[#0071CE] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Eye size={14} /> Preview
                  </Link>
                  <button
                    onClick={() => {
                      setForm({
                        name: storefront.name || "",
                        description: storefront.description || "",
                        welcome_msg: storefront.welcome_msg || "",
                        logo_url: storefront.logo_url || "",
                        banner_url: storefront.banner_url || "",
                        slug: storefront.slug || "",
                      });
                      setEditing(true);
                    }}
                    className="flex items-center gap-1.5 text-sm bg-[#0071CE] text-white px-3 py-1.5 rounded-lg hover:bg-[#005BA1] transition-colors"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{storefront.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">geocore.com/stores/{storefront.slug}</p>
              {storefront.description && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{storefront.description}</p>
              )}
              {storefront.welcome_msg && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 italic">
                  "{storefront.welcome_msg}"
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-5">
                {[
                  { label: "Total Views", value: storefront.views?.toLocaleString() ?? "0", icon: <Eye size={16} /> },
                  { label: "Active Listings", value: "—", icon: <Package size={16} /> },
                  { label: "Sales", value: "—", icon: <TrendingUp size={16} /> },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-[#0071CE] flex justify-center mb-1">{s.icon}</div>
                    <p className="text-lg font-bold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {editing && (
            <StorefrontForm
              form={form}
              setForm={setForm}
              onSubmit={() => updateMutation.mutate(form)}
              onCancel={() => setEditing(false)}
              loading={updateMutation.isPending}
              submitLabel="Save Changes"
              msg={msg}
            />
          )}
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Store size={36} className="text-[#0071CE]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">You don't have a storefront yet</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
              Create your free seller storefront — a dedicated page with your own URL where buyers can browse all your listings and learn more about you.
            </p>
          </div>

          <StorefrontForm
            form={form}
            setForm={setForm}
            onSubmit={() => createMutation.mutate(form)}
            onCancel={() => {}}
            loading={createMutation.isPending}
            submitLabel="Create My Storefront"
            msg={msg}
            isCreate
          />
        </div>
      )}

      {msg && !editing && (
        <p className={`mt-4 text-center text-sm font-medium ${msg.includes("🎉") || msg.includes("updated") ? "text-green-600" : "text-red-500"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

function StorefrontForm({
  form, setForm, onSubmit, onCancel, loading, submitLabel, msg, isCreate
}: {
  form: any;
  setForm: (f: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
  msg?: string;
  isCreate?: boolean;
}) {
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="font-bold text-gray-800 mb-5">{isCreate ? "Set up your storefront" : "Edit Storefront"}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Store Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handle}
              required
              placeholder="Ahmed Phones"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0071CE]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">URL Slug</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <span className="px-3 py-3 text-xs text-gray-400 bg-gray-50 border-r border-gray-200">stores/</span>
              <input
                name="slug"
                value={form.slug}
                onChange={handle}
                placeholder="ahmed-phones"
                className="flex-1 px-3 py-3 text-sm outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handle}
            rows={3}
            placeholder="Tell buyers about your store — what you sell, your experience, etc."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0071CE] resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Welcome Message</label>
          <input
            name="welcome_msg"
            value={form.welcome_msg}
            onChange={handle}
            placeholder="Welcome to my store! All items come with a 7-day return guarantee."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0071CE]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Logo URL</label>
            <input
              name="logo_url"
              value={form.logo_url}
              onChange={handle}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0071CE]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Banner URL</label>
            <input
              name="banner_url"
              value={form.banner_url}
              onChange={handle}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0071CE]"
            />
          </div>
        </div>

        {msg && (
          <p className={`text-sm font-medium ${msg.includes("🎉") || msg.includes("updated") ? "text-green-600" : "text-red-500"}`}>
            {msg}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onSubmit}
            disabled={loading || !form.name}
            className="flex-1 bg-[#0071CE] hover:bg-[#005BA1] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : submitLabel}
          </button>
          {!isCreate && (
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
