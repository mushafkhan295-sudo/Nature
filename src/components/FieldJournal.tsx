import { useState, useEffect } from "react";
import { X, BookOpen, Plus, Trash2, LogIn, LogOut, Check, Loader2, Music, Image as ImageIcon, Video, Leaf } from "lucide-react";
import { auth, db, signInWithPopup, signOut, googleProvider, handleFirestoreError, OperationType, type User } from "../lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";

interface FieldJournalProps {
  onClose: () => void;
}

export function FieldJournal({ onClose }: FieldJournalProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"observations" | "media">("observations");

  // Observations state
  const [observations, setObservations] = useState<any[]>([]);
  const [soundscapes, setSoundscapes] = useState<any[]>([]);
  const [botanicalRecords, setBotanicalRecords] = useState<any[]>([]);

  // New Observation form state
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    species: "",
    habitatType: "Moss Cushion / Forest Floor",
    locationName: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currUser) => {
      setUser(currUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!user) {
      setObservations([]);
      setSoundscapes([]);
      setBotanicalRecords([]);
      return;
    }

    const obsPath = `users/${user.uid}/observations`;
    const unsubObs = onSnapshot(
      collection(db, obsPath),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setObservations(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, obsPath);
      }
    );

    const sndPath = `users/${user.uid}/soundscapes`;
    const unsubSnd = onSnapshot(
      collection(db, sndPath),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSoundscapes(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, sndPath);
      }
    );

    const recPath = `users/${user.uid}/botanical_records`;
    const unsubRec = onSnapshot(
      collection(db, recPath),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBotanicalRecords(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, recPath);
      }
    );

    return () => {
      unsubObs();
      unsubSnd();
      unsubRec();
    };
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign-in error:", err);
      alert("Sign in failed: " + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Sign-out error:", err);
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title) return;
    setSaving(true);
    const path = `users/${user.uid}/observations`;
    try {
      await addDoc(collection(db, path), {
        id: `obs_${Date.now()}`,
        userId: user.uid,
        title: form.title,
        species: form.species,
        habitatType: form.habitatType,
        locationName: form.locationName,
        notes: form.notes,
        createdAt: new Date().toISOString(),
      });
      setIsAdding(false);
      setForm({
        title: "",
        species: "",
        habitatType: "Moss Cushion / Forest Floor",
        locationName: "",
        notes: "",
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (collectionName: string, docId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/${collectionName}/${docId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight">Ecosystem Field Journal</h2>
              <p className="text-xs text-white/50 font-light">Firebase Auth & Firestore Persistent Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-white/[0.06] py-1 px-3 rounded-full border border-white/10">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] flex items-center justify-center font-bold">
                    {user.displayName?.[0] || "U"}
                  </div>
                )}
                <span className="text-xs text-white/80 max-w-[120px] truncate">{user.displayName || user.email}</span>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="text-white/40 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-normal hover:bg-emerald-300 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Barrier Prompt if signed out */}
        {!user && !loading && (
          <div className="p-8 text-center space-y-4 bg-emerald-950/20 border-b border-white/5">
            <Leaf className="w-10 h-10 text-emerald-400/80 mx-auto" />
            <h3 className="text-base font-light text-white">Identify as a Botanical Steward</h3>
            <p className="text-xs text-white/60 max-w-md mx-auto font-light leading-relaxed">
              Sign in with your Google Account via Firebase Authentication to record real-time field observations,
              save Lyria ecological soundscapes, and keep an archival record of your generative botanical studies.
            </p>
            <button
              onClick={handleSignIn}
              className="px-6 py-2.5 rounded-full bg-emerald-400 text-zinc-950 text-xs uppercase tracking-wider font-medium hover:bg-emerald-300 transition-colors shadow-lg cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        )}

        {/* Tab switcher */}
        {user && (
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/20">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("observations")}
                className={`px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                  activeTab === "observations"
                    ? "bg-emerald-500/30 text-white font-medium border border-emerald-500/50"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Field Observations ({observations.length})
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                  activeTab === "media"
                    ? "bg-emerald-500/30 text-white font-medium border border-emerald-500/50"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Saved Media ({soundscapes.length + botanicalRecords.length})
              </button>
            </div>

            {activeTab === "observations" && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-zinc-950 text-xs font-normal hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Observation</span>
              </button>
            )}
          </div>
        )}

        {/* Add Observation Form */}
        {isAdding && user && (
          <form onSubmit={handleAddObservation} className="p-5 bg-white/[0.04] border-b border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1">Observation Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Polytrichum commune Sporophyte Colony"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1">Species / Genus</label>
                <input
                  type="text"
                  value={form.species}
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                  placeholder="e.g., Sphagnum palustre"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1">Habitat Type</label>
                <input
                  type="text"
                  value={form.habitatType}
                  onChange={(e) => setForm({ ...form, habitatType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1">Location / Site</label>
                <input
                  type="text"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  placeholder="e.g., Olympic Rain Forest West Basin"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1">Stewardship Field Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Microclimate conditions, humidity, spore discharge velocity..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-1.5 rounded-full text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-1.5 rounded-full bg-emerald-500 text-zinc-950 text-xs font-medium hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Observation</span>
              </button>
            </div>
          </form>
        )}

        {/* Content list */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {user && activeTab === "observations" && (
            <>
              {observations.map((obs) => (
                <div key={obs.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-emerald-400 font-light">{obs.habitatType}</span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-xs text-white/50">{new Date(obs.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-medium text-white">{obs.title}</h4>
                    {obs.species && <p className="text-xs text-emerald-300/80 font-mono italic">{obs.species}</p>}
                    {obs.notes && <p className="text-xs text-white/70 font-light pt-1">{obs.notes}</p>}
                    {obs.locationName && (
                      <p className="text-[11px] text-white/40 pt-1">Site: {obs.locationName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteItem("observations", obs.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Delete observation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {observations.length === 0 && (
                <div className="text-center py-12 text-xs text-white/50 font-light">
                  No field observations logged yet. Click "Log Observation" to create your first record.
                </div>
              )}
            </>
          )}

          {user && activeTab === "media" && (
            <div className="space-y-4">
              {/* Soundscapes */}
              {soundscapes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider text-emerald-400/90 font-light flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Saved Lyria Soundscapes ({soundscapes.length})</span>
                  </h4>
                  {soundscapes.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-white block">{s.title || "Soundscape"}</span>
                        <span className="text-[11px] text-white/60 block truncate max-w-md font-light italic">"{s.prompt}"</span>
                        <span className="text-[10px] text-white/40 font-mono">{s.modelUsed} • {new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteItem("soundscapes", s.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botanical Records */}
              {botanicalRecords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider text-emerald-400/90 font-light flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Saved Media Specimens ({botanicalRecords.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {botanicalRecords.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-white">{r.title}</span>
                          <button
                            onClick={() => handleDeleteItem("botanical_records", r.id)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {r.mediaUrl && (
                          <div className="w-full h-32 rounded-lg overflow-hidden bg-black/40">
                            {r.mediaType === "video" ? (
                              <video src={r.mediaUrl} controls className="w-full h-full object-cover" />
                            ) : (
                              <img src={r.mediaUrl} alt={r.prompt} className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-white/60 line-clamp-2 font-light italic">"{r.prompt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {soundscapes.length === 0 && botanicalRecords.length === 0 && (
                <div className="text-center py-12 text-xs text-white/50 font-light">
                  No saved media in your journal. Use the AI Ecological Media Studio to compose soundscapes or synthesize imagery!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
