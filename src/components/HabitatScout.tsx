import { useState } from "react";
import { X, MapPin, Globe, Search, Loader2, ExternalLink } from "lucide-react";

interface HabitatScoutProps {
  onClose: () => void;
}

export function HabitatScout({ onClose }: HabitatScoutProps) {
  const [activeTab, setActiveTab] = useState<"maps" | "search">("maps");
  const [query, setQuery] = useState("moss gardens and temperate rainforests");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [citations, setCitations] = useState<{ title: string; url: string }[]>([]);

  const handleQuery = async () => {
    setLoading(true);
    setResultText("");
    setCitations([]);
    try {
      const endpoint = activeTab === "maps" ? "/api/maps" : "/api/search";
      const payload = activeTab === "maps" ? { query, location } : { query };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.text) {
        setResultText(data.text);
        setCitations(activeTab === "maps" ? data.locations || [] : data.sources || []);
      } else {
        setResultText(data.error || "No data received.");
      }
    } catch (err: any) {
      console.error("Grounding query error:", err);
      setResultText("Error querying grounded data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              {activeTab === "maps" ? <MapPin className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight">Habitat Scout & Grounding</h2>
              <p className="text-xs text-white/50 font-light">
                {activeTab === "maps" ? "Google Maps Grounding (Gemini 3.8 Flash)" : "Google Search Grounding (Gemini 3.8 Flash)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-black/20">
          <button
            onClick={() => { setActiveTab("maps"); setQuery("moss gardens and temperate rainforests"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-light tracking-wider transition-all cursor-pointer ${
              activeTab === "maps" ? "bg-emerald-500 text-zinc-950 font-medium shadow-md" : "text-white/70 hover:bg-white/10"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps Grounding</span>
          </button>

          <button
            onClick={() => { setActiveTab("search"); setQuery("bryophyte conservation and old growth forest microclimates"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-light tracking-wider transition-all cursor-pointer ${
              activeTab === "search" ? "bg-emerald-500 text-zinc-950 font-medium shadow-md" : "text-white/70 hover:bg-white/10"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Search Grounding</span>
          </button>
        </div>

        {/* Query Input */}
        <div className="p-5 border-b border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                placeholder={activeTab === "maps" ? "e.g., Kyoto moss gardens, Pacific Northwest fern canyon..." : "e.g., Recent studies on old-growth canopy moss moisture..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>

            {activeTab === "maps" && (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Near city / region (optional)"
                className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400"
              />
            )}

            <button
              onClick={handleQuery}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Query</span>
            </button>
          </div>
        </div>

        {/* Result Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-white/50 font-light">
                {activeTab === "maps" ? "Scanning Google Maps spatial data for botanical sanctuaries..." : "Searching real-time web references for ecological insights..."}
              </p>
            </div>
          ) : resultText ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-wrap text-white/90">
                {resultText}
              </div>

              {citations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs uppercase tracking-wider text-emerald-400/90 font-light">
                    {activeTab === "maps" ? "Verified Place References:" : "Grounded Source References:"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {citations.map((c, idx) => (
                      <a
                        key={idx}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/50 flex items-center justify-between text-xs text-white/70 hover:text-white transition-colors"
                      >
                        <span className="truncate pr-2">{c.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-white/40 font-light">
              Enter a query to explore grounded geographical habitats or live scientific search data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
