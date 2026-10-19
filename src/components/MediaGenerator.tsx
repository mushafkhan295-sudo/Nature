import { useState, useRef } from "react";
import { X, Music, Image as ImageIcon, Video, Sparkles, Loader2, Play, Pause, Save, Upload, Wand2, Check } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface MediaGeneratorProps {
  onClose: () => void;
  defaultTab?: "music" | "image" | "video";
}

export function MediaGenerator({ onClose, defaultTab = "music" }: MediaGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"music" | "image" | "video">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Music state
  const [musicPrompt, setMusicPrompt] = useState("Gentle rain falling on velvet moss cushions with soft wind chimes and distant mountain stream");
  const [musicModel, setMusicModel] = useState<"lyria-3-clip-preview" | "lyria-3-pro-preview">("lyria-3-clip-preview");
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; lyrics?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image state
  const [imagePrompt, setImagePrompt] = useState("Macro photography of dew drops resting on emerald moss cushions with delicate fiddlehead fern in the morning light");
  const [editImageFile, setEditImageFile] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Video state
  const [videoPrompt, setVideoPrompt] = useState("Gentle mountain breeze rustling emerald moss and fern fronds as morning mist slowly rolls across");
  const [videoImageFile, setVideoImageFile] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  // Handle Music Generation (Lyria)
  const handleGenerateMusic = async () => {
    setLoading(true);
    setStatusMessage("Composing bio-acoustic soundscape with Lyria...");
    try {
      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: musicPrompt, model: musicModel }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudio({ url: data.audioUrl, lyrics: data.lyrics });
      } else {
        alert(data.error || "Failed to generate music");
      }
    } catch (err: any) {
      console.error("Music generation error:", err);
      alert("Error generating music: " + err.message);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // Handle Image Generation & Editing (gemini-nano-banana-2.1)
  const handleGenerateImage = async () => {
    setLoading(true);
    setStatusMessage(editImageFile ? "Editing botanical imagery with Gemini Nano Banana 2.1..." : "Synthesizing botanical scene with Gemini Nano Banana 2.1...");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          editImageBase64: editImageFile,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        alert(data.error || "Failed to generate image");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      alert("Error generating image: " + err.message);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // Handle Video Generation (Veo: veo-3.1-fast-generate-preview)
  const handleGenerateVideo = async () => {
    setLoading(true);
    setStatusMessage("Animating living botanical scene with Veo (veo-3.1-fast-generate-preview)...");
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageBase64: videoImageFile,
          aspectRatio: videoAspectRatio,
        }),
      });
      const data = await res.json();
      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
      } else {
        alert(data.error || "Failed to generate video");
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
      alert("Error generating video: " + err.message);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // Save to Firebase Firestore
  const handleSaveToFirebase = async (type: "music" | "image" | "video") => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to save creations to your field journal.");
      return;
    }

    try {
      if (type === "music" && generatedAudio) {
        const path = `users/${user.uid}/soundscapes`;
        await addDoc(collection(db, path), {
          id: `snd_${Date.now()}`,
          userId: user.uid,
          prompt: musicPrompt,
          title: "Forest Bio-Acoustic Soundscape",
          audioUrl: generatedAudio.url.slice(0, 1500), // Firestore doc limit friendly
          modelUsed: musicModel,
          duration: musicModel === "lyria-3-clip-preview" ? 30 : 60,
          createdAt: new Date().toISOString(),
        });
      } else if (type === "image" && generatedImage) {
        const path = `users/${user.uid}/botanical_records`;
        await addDoc(collection(db, path), {
          id: `img_${Date.now()}`,
          userId: user.uid,
          title: "Generative Botanical Specimen",
          prompt: imagePrompt,
          mediaType: "image",
          mediaUrl: generatedImage.slice(0, 1500),
          aspectRatio: "1:1",
          createdAt: new Date().toISOString(),
        });
      } else if (type === "video" && generatedVideo) {
        const path = `users/${user.uid}/botanical_records`;
        await addDoc(collection(db, path), {
          id: `vid_${Date.now()}`,
          userId: user.uid,
          title: "Living Veo Botanical Motion",
          prompt: videoPrompt,
          mediaType: "video",
          mediaUrl: generatedVideo.slice(0, 1500),
          aspectRatio: videoAspectRatio,
          createdAt: new Date().toISOString(),
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  // Helper for file upload preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight">AI Ecological Media Studio</h2>
              <p className="text-xs text-white/50 font-light">Lyria Music • Gemini Nano Banana 2.1 • Veo Video Animation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Tabs */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-black/20">
          <button
            onClick={() => setActiveTab("music")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-light tracking-wider transition-all cursor-pointer ${
              activeTab === "music" ? "bg-emerald-500 text-zinc-950 font-medium shadow-md" : "text-white/70 hover:bg-white/10"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Generate Music (Lyria)</span>
          </button>

          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-light tracking-wider transition-all cursor-pointer ${
              activeTab === "image" ? "bg-emerald-500 text-zinc-950 font-medium shadow-md" : "text-white/70 hover:bg-white/10"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Create & Edit Images</span>
          </button>

          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-light tracking-wider transition-all cursor-pointer ${
              activeTab === "video" ? "bg-emerald-500 text-zinc-950 font-medium shadow-md" : "text-white/70 hover:bg-white/10"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Animate Video (Veo)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. MUSIC TAB */}
          {activeTab === "music" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                  Lyria Model Selection
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMusicModel("lyria-3-clip-preview")}
                    className={`flex-1 p-3 rounded-xl border text-xs text-left transition-colors cursor-pointer ${
                      musicModel === "lyria-3-clip-preview" ? "bg-emerald-500/20 border-emerald-400 text-white" : "border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <div className="font-medium">Lyria Clip (30s)</div>
                    <div className="text-[11px] text-white/50">lyria-3-clip-preview • Ideal for ambient loops</div>
                  </button>
                  <button
                    onClick={() => setMusicModel("lyria-3-pro-preview")}
                    className={`flex-1 p-3 rounded-xl border text-xs text-left transition-colors cursor-pointer ${
                      musicModel === "lyria-3-pro-preview" ? "bg-emerald-500/20 border-emerald-400 text-white" : "border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <div className="font-medium">Lyria Pro (Full Track)</div>
                    <div className="text-[11px] text-white/50">lyria-3-pro-preview • Extended bio-acoustic audio</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                  Bio-Acoustic Prompt
                </label>
                <textarea
                  rows={3}
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="Describe instruments, atmosphere, rain, wind, ambient sound..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleGenerateMusic}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
                  <span>Generate Soundscape</span>
                </button>
              </div>

              {/* Audio Playback Card */}
              {generatedAudio && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-light">
                      Generated Ecological Track ({musicModel})
                    </span>
                    <button
                      onClick={() => handleSaveToFirebase("music")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-black transition-colors text-xs cursor-pointer"
                    >
                      {savedSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
                      <span>{savedSuccess ? "Saved!" : "Save to Journal"}</span>
                    </button>
                  </div>

                  <audio
                    ref={audioRef}
                    src={generatedAudio.url}
                    controls
                    className="w-full h-10 accent-emerald-400 rounded-lg"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {generatedAudio.lyrics && (
                    <p className="text-xs text-white/60 italic font-light">{generatedAudio.lyrics}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. IMAGE TAB */}
          {activeTab === "image" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                  Botanical Image Prompt (Gemini Nano Banana 2.1)
                </label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the botanical specimen or edits..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                  Optional: Upload Base Photo to Edit
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white/80 hover:bg-white/10 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setEditImageFile)}
                    />
                  </label>
                  {editImageFile && (
                    <div className="flex items-center gap-2">
                      <img src={editImageFile} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/20" />
                      <button onClick={() => setEditImageFile(null)} className="text-xs text-red-400 hover:underline">Remove</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleGenerateImage}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>{editImageFile ? "Apply Image Edit" : "Create Image"}</span>
                </button>
              </div>

              {generatedImage && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-light">
                      Synthesized Specimen (gemini-nano-banana-2.1)
                    </span>
                    <button
                      onClick={() => handleSaveToFirebase("image")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-black transition-colors text-xs cursor-pointer"
                    >
                      {savedSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
                      <span>{savedSuccess ? "Saved!" : "Save to Journal"}</span>
                    </button>
                  </div>
                  <img src={generatedImage} alt="Generated Botanical" className="w-full max-h-80 object-contain rounded-xl border border-white/10 bg-black/40" />
                </div>
              )}
            </div>
          )}

          {/* 3. VIDEO TAB (VEO) */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                  Veo Video Motion Prompt (veo-3.1-fast-generate-preview)
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe motion: wind swaying ferns, sunlight rippling across moss, butterflies taking flight..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVideoAspectRatio("16:9")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs text-center transition-colors cursor-pointer ${
                        videoAspectRatio === "16:9" ? "bg-emerald-500/30 border-emerald-400 text-white" : "border-white/10 text-white/60 hover:border-white/20"
                      }`}
                    >
                      16:9 Landscape
                    </button>
                    <button
                      onClick={() => setVideoAspectRatio("9:16")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs text-center transition-colors cursor-pointer ${
                        videoAspectRatio === "9:16" ? "bg-emerald-500/30 border-emerald-400 text-white" : "border-white/10 text-white/60 hover:border-white/20"
                      }`}
                    >
                      9:16 Portrait
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-light uppercase tracking-wider text-white/70 mb-1.5">
                    Photo to Animate
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white/80 hover:bg-white/10 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setVideoImageFile)}
                      />
                    </label>
                    {videoImageFile && (
                      <div className="flex items-center gap-2">
                        <img src={videoImageFile} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/20" />
                        <button onClick={() => setVideoImageFile(null)} className="text-xs text-red-400 hover:underline">Clear</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleGenerateVideo}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-zinc-950 font-normal text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                  <span>Generate Veo Video</span>
                </button>
              </div>

              {generatedVideo && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-light">
                      Veo Animated Scene ({videoAspectRatio})
                    </span>
                    <button
                      onClick={() => handleSaveToFirebase("video")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-black transition-colors text-xs cursor-pointer"
                    >
                      {savedSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
                      <span>{savedSuccess ? "Saved!" : "Save to Journal"}</span>
                    </button>
                  </div>
                  <video src={generatedVideo} controls autoPlay loop className="w-full max-h-80 rounded-xl border border-white/10 bg-black/40" />
                </div>
              )}
            </div>
          )}

          {/* Status feedback bar */}
          {loading && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
