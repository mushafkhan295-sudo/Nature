import { useState, useEffect } from "react";
import { X, Search, BookOpen, Dna, Atom, ExternalLink, Loader2 } from "lucide-react";

interface BioscienceExplorerProps {
  onClose: () => void;
}

export function BioscienceExplorer({ onClose }: BioscienceExplorerProps) {
  const [activeTab, setActiveTab] = useState<"pubmed" | "uniprot" | "pubchem">("uniprot");
  const [query, setQuery] = useState("LHCB1");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [proteins, setProteins] = useState<any[]>([]);
  const [chemical, setChemical] = useState<any>(null);

  // Quick-try example pills
  const examples = [
    { label: "LHCB1 Chlorophyll", tab: "uniprot", query: "organism_name:moss gene:LHCB1" },
    { label: "Chlorophyll a", tab: "pubchem", query: "Chlorophyll a" },
    { label: "Lunularic acid", tab: "pubchem", query: "Lunularic acid" },
    { label: "Bryophyte Ecology", tab: "pubmed", query: "bryophyte desiccation tolerance" },
    { label: "Fern Spore Kinematics", tab: "pubmed", query: "fern spore dispersal catapult" },
  ];

  const handleSearch = async (tab = activeTab, term = query) => {
    setLoading(true);
    try {
      if (tab === "pubmed") {
        const res = await fetch(`/api/science/pubmed?term=${encodeURIComponent(term)}`);
        const data = await res.json();
        setArticles(data.articles || []);
      } else if (tab === "uniprot") {
        const res = await fetch(`/api/science/uniprot?query=${encodeURIComponent(term)}`);
        const data = await res.json();
        setProteins(data.proteins || []);
      } else if (tab === "pubchem") {
        const res = await fetch(`/api/science/pubchem?compound=${encodeURIComponent(term)}`);
        const data = await res.json();
        setChemical(data);
      }
    } catch (err) {
      console.error("Bioscience search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch("uniprot", "organism_name:moss gene:LHCB1");
  }, []);

  const selectExample = (ex: typeof examples[0]) => {
    setActiveTab(ex.tab as any);
    setQuery(ex.query);
    handleSearch(ex.tab as any, ex.query);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl text-white">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight">Botanical Bioscience Explorer</h2>
              <p className="text-xs text-white/50 font-light">NCBI PubMed • UniProt / AlphaFold • PubChem Compound Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Example Pills Bar */}
        <div className="px-5 py-3 bg-black/20 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-white/40 uppercase tracking-wider text-[10px]">Quick Try:</span>
          {examples.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => selectExample(ex)}
              className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-white/80 transition-all whitespace-nowrap cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Search Bar & Tabs */}
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex bg-white/[0.06] p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab("uniprot"); handleSearch("uniprot", query); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light transition-colors flex-1 sm:flex-initial cursor-pointer ${
                activeTab === "uniprot" ? "bg-emerald-500/30 text-white font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>UniProt Proteins</span>
            </button>
            <button
              onClick={() => { setActiveTab("pubchem"); handleSearch("pubchem", query); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light transition-colors flex-1 sm:flex-initial cursor-pointer ${
                activeTab === "pubchem" ? "bg-emerald-500/30 text-white font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>PubChem Chemistry</span>
            </button>
            <button
              onClick={() => { setActiveTab("pubmed"); handleSearch("pubmed", query); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light transition-colors flex-1 sm:flex-initial cursor-pointer ${
                activeTab === "pubmed" ? "bg-emerald-500/30 text-white font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>PubMed Papers</span>
            </button>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search botanical molecules, proteins, or ecological papers..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400/80 transition-colors"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Query</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-white/50 font-light">Querying authoritative biological databases...</p>
            </div>
          ) : (
            <>
              {/* UniProt Tab */}
              {activeTab === "uniprot" && (
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-emerald-400/90 font-light">
                    UniProtKB Annotated Structures ({proteins.length} results)
                  </h3>
                  {proteins.map((p, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                              {p.primaryAccession}
                            </span>
                            <span className="text-xs text-white/50">{p.uniProtkbId}</span>
                          </div>
                          <h4 className="text-sm font-medium text-white mt-1">{p.proteinName}</h4>
                          <p className="text-xs text-white/60 font-light italic">{p.organism}</p>
                        </div>
                        <a
                          href={p.alphaFoldUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                        >
                          <span>AlphaFold 3D</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-xs text-white/40 font-mono">Sequence length: {p.length} aa</div>
                    </div>
                  ))}
                  {proteins.length === 0 && (
                    <div className="text-center py-10 text-xs text-white/50">No proteins found for this query.</div>
                  )}
                </div>
              )}

              {/* PubChem Tab */}
              {activeTab === "pubchem" && chemical && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col md:flex-row gap-6 items-center">
                    {chemical.structureUrl && (
                      <div className="w-48 h-48 bg-white/90 rounded-xl p-2 flex items-center justify-center shrink-0">
                        <img src={chemical.structureUrl} alt={chemical.compound} className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="space-y-3 flex-1">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-emerald-400/90 font-light">PubChem CID: {chemical.cid}</span>
                        <h3 className="text-lg font-medium text-white">{chemical.compound}</h3>
                        <p className="text-xs text-white/60 font-light">{chemical.iupacName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                          <span className="text-white/40 block">Formula</span>
                          <span className="font-mono text-white font-medium">{chemical.formula}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                          <span className="text-white/40 block">Molecular Weight</span>
                          <span className="font-mono text-white font-medium">{chemical.weight} g/mol</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                        <span className="text-white/40 block">Canonical SMILES</span>
                        <span className="font-mono text-white/80 break-all text-[11px]">{chemical.smiles}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PubMed Tab */}
              {activeTab === "pubmed" && (
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-emerald-400/90 font-light">
                    Peer-Reviewed Literature ({articles.length} publications)
                  </h3>
                  {articles.map((art, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-sm font-medium text-white hover:text-emerald-300 transition-colors">
                          <a href={art.url} target="_blank" rel="noreferrer">
                            {art.title}
                          </a>
                        </h4>
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white/40 hover:text-white transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/50 font-light">
                        <span>{art.source}</span>
                        <span>•</span>
                        <span>{art.pubDate}</span>
                        {art.authors && (
                          <>
                            <span>•</span>
                            <span className="italic">{art.authors}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {articles.length === 0 && (
                    <div className="text-center py-10 text-xs text-white/50">No publications found.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
