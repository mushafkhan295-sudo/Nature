import { useState } from "react";
import { X, LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  auth,
  db,
  signInWithPopup,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Sync user profile in Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          id: user.uid,
          displayName: user.displayName || "Botanical Steward",
          email: user.email,
          photoURL: user.photoURL || "",
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSuccess("Welcome to Sylva, " + (user.displayName || "Steward") + "!");
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err?.message || "Google sign-in was interrupted.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !name) {
      setError("Please provide your name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        await updateProfile(user, { displayName: name });
        // Save user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          displayName: name,
          email: user.email,
          photoURL: "",
          createdAt: new Date().toISOString(),
        });
        setSuccess("Account created successfully. Welcome, " + name + "!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Welcome back to Sylva!");
      }
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div
        className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 text-white relative border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-light block">
            Stewardship Authentication
          </span>
          <h2 id="auth-modal-title" className="text-2xl font-light tracking-tight text-white">
            {isSignUp ? "Join the Sylva Sanctuary" : "Sign In to Your Journal"}
          </h2>
          <p className="text-xs text-white/60 font-light">
            Synchronize your observations, botanical creations, and favorites.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Google Sign-In Quick Action */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] uppercase tracking-widest text-white/40">or email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-light uppercase tracking-wider text-white/70 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Linnea Forest"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-light uppercase tracking-wider text-white/70 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="steward@domain.com"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-light uppercase tracking-wider text-white/70 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSignUp ? (
              <UserPlus className="w-3.5 h-3.5" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            <span>{isSignUp ? "Create Steward Account" : "Sign In with Email"}</span>
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-white/60 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Register as a Steward"}
          </button>
        </div>
      </div>
    </div>
  );
}
