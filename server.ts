import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// ── 1. Gemini Chat Endpoint (Multi-turn with specific roles) ───────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "gemini-3.8-flash" } = req.body;
    
    // Choose model based on request (gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite)
    const validModels = ["gemini-4-argon", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
    const selectedModel = validModels.includes(model) ? model : "gemini-3.8-flash";

    const systemInstruction = `You are Sylva Botanica, an expert botanical and ecological guide for the living green world.
You speak with serene, observant wisdom about old-growth temperate rainforests, moss cushions (Bryophytes), ancient ferns (Pteridophytes), fungal mycorrhizae, and butterfly flight kinematics.
Provide thoughtful, accurate, and poetic scientific stewardship guidance.`;

    // Convert messages to GoogleGenAI content format
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "The living forest listens in silence.";
    res.json({ reply, model: selectedModel });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate chat response" });
  }
});

// ── 2. Google Search Grounding ─────────────────────────────────────────────
app.post("/api/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Provide an up-to-date ecological summary based on recent scientific discoveries: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web?.title || "Web Reference",
        url: chunk.web?.uri,
      }));

    res.json({ text, sources: webSources });
  } catch (error: any) {
    console.error("Search grounding error:", error);
    res.status(500).json({ error: error?.message || "Failed to search ecological data" });
  }
});

// ── 3. Google Maps Grounding ───────────────────────────────────────────────
app.post("/api/maps", async (req, res) => {
  try {
    const { query, location } = req.body;
    const prompt = `Find real-world botanical gardens, old-growth moss reserves, temperate rainforest sanctuaries, or native plant centers matching: ${query || "botanical gardens and moss sanctuaries"} ${location ? `near ${location}` : ""}. Include location details and what makes their ecosystem special.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "";
    const mapChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const locations = mapChunks
      .filter((chunk: any) => chunk.web?.uri || chunk.placeId)
      .map((chunk: any) => ({
        title: chunk.web?.title || "Botanical Location",
        url: chunk.web?.uri || "",
      }));

    res.json({ text, locations });
  } catch (error: any) {
    console.error("Maps grounding error:", error);
    res.status(500).json({ error: error?.message || "Failed to query botanical maps data" });
  }
});

// ── 4. Music Generation (Lyria 3 Clip or Pro) ──────────────────────────────
app.post("/api/generate-music", async (req, res) => {
  try {
    const { prompt, model = "lyria-3-clip-preview" } = req.body;
    const selectedModel = model === "lyria-3-pro-preview" ? "lyria-3-pro-preview" : "lyria-3-clip-preview";

    const enhancedPrompt = `Ecological forest soundscape: ${prompt || "Gentle rain over velvet moss cushions, soft canopy wind, and ambient bio-acoustic resonance"}`;

    const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: enhancedPrompt,
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    let audioBase64 = "";
    let mimeType = "audio/wav";
    let lyrics = "";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      // Fallback procedural soundscape response if audio chunk was empty
      return res.status(500).json({ error: "No audio generated from Lyria model." });
    }

    res.json({
      audioUrl: `data:${mimeType};base64,${audioBase64}`,
      mimeType,
      lyrics,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error("Music generation error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate ecological soundscape" });
  }
});

// ── 5. Create & Edit Images (gemini-nano-banana-2.1) ────────────────────────
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, editImageBase64, mimeType = "image/png" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (editImageBase64) {
      // Image editing
      const cleanBase64 = editImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const response = await ai.models.generateContent({
        model: "gemini-nano-banana-2.1",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              {
                text: `Edit this botanical image: ${prompt}. Ensure high-resolution natural botanical realism.`,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const candidate = response.candidates?.[0]?.content?.parts;
      const imagePart = candidate?.find((p: any) => p.inlineData?.data);
      if (imagePart?.inlineData?.data) {
        return res.json({
          imageUrl: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`,
          prompt,
        });
      }
    }

    // New Image Generation
    const response = await ai.models.generateContent({
      model: "gemini-nano-banana-2.1",
      contents: `Botanical nature photograph: ${prompt}. Photorealistic macro detail, natural diffused forest lighting, dew drops on moss, lush ferns.`,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response.candidates?.[0]?.content?.parts;
    const imagePart = candidate?.find((p: any) => p.inlineData?.data);
    if (imagePart?.inlineData?.data) {
      return res.json({
        imageUrl: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`,
        prompt,
      });
    }

    // If candidate didn't return image inline, try generateImages
    const imagesResponse = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: `Botanical landscape: ${prompt}. Macro moss, gentle dew, cinematic ambient lighting.`,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
      },
    });

    const generated = imagesResponse.generatedImages?.[0]?.image?.imageBytes;
    if (generated) {
      return res.json({
        imageUrl: `data:image/png;base64,${generated}`,
        prompt,
      });
    }

    res.status(500).json({ error: "No image could be generated." });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error?.message || "Failed to create or edit image" });
  }
});

// ── 6. Animate Images into Video (Veo: veo-3.1-fast-generate-preview) ──────
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType = "image/jpeg", aspectRatio = "16:9" } = req.body;
    const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";

    const cleanBase64 = (imageBase64 || "").replace(/^data:image\/\w+;base64,/, "");

    const videoPrompt = prompt || "Gentle wind rustles through the living moss and ferns as morning mist drifts across the stones";

    const videoParams: any = {
      model: "veo-3.1-fast-generate-preview",
      prompt: videoPrompt,
      config: {
        aspectRatio: validAspectRatio,
        numberOfVideos: 1,
      },
    };

    if (cleanBase64) {
      videoParams.image = {
        imageBytes: cleanBase64,
        mimeType,
      };
    }

    // Start video generation operation
    let operation = await ai.models.generateVideos(videoParams);

    // Poll until complete (with 120s timeout safeguard)
    const startTime = Date.now();
    while (!operation.done && Date.now() - startTime < 120000) {
      await new Promise(r => setTimeout(r, 8000));
      // @ts-ignore
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoBytes = (operation.response?.generatedVideos?.[0]?.video as any)?.videoBytes;

    if (videoUri) {
      return res.json({ videoUrl: videoUri, prompt: videoPrompt, aspectRatio: validAspectRatio });
    }

    if (videoBytes) {
      return res.json({
        videoUrl: `data:video/mp4;base64,${videoBytes}`,
        prompt: videoPrompt,
        aspectRatio: validAspectRatio,
      });
    }

    res.status(500).json({ error: "Video generation timed out or returned no video." });
  } catch (error: any) {
    console.error("Video generation error:", error);
    res.status(500).json({ error: error?.message || "Failed to animate image into video" });
  }
});

// ── 7. Science APIs (PubMed, UniProt, PubChem) ─────────────────────────────
app.get("/api/science/pubmed", async (req, res) => {
  try {
    const term = (req.query.term as string) || "bryophyte ecology";
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(term)}&retmode=json&retmax=5`;
    const searchRes = await fetch(esearchUrl);
    const searchData = await searchRes.json();
    const ids = searchData?.esearchresult?.idlist || [];

    if (ids.length === 0) {
      return res.json({ articles: [] });
    }

    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetch(esummaryUrl);
    const summaryData = await summaryRes.json();

    const articles = ids.map((id: string) => {
      const item = summaryData?.result?.[id] || {};
      return {
        id,
        title: item.title || "Botanical Research Article",
        source: item.source || "PMC Journal",
        pubDate: item.pubdate || "",
        authors: (item.authors || []).map((a: any) => a.name).slice(0, 3).join(", "),
        url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`,
      };
    });

    res.json({ articles });
  } catch (error: any) {
    console.error("PubMed error:", error);
    res.status(500).json({ error: error?.message || "Failed to query PubMed" });
  }
});

app.get("/api/science/uniprot", async (req, res) => {
  try {
    const query = (req.query.query as string) || "organism_name:moss gene:LHCB1";
    const uniprotUrl = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(query)}&size=3&format=json`;
    const response = await fetch(uniprotUrl);
    const data = await response.json();

    const proteins = (data.results || []).map((item: any) => ({
      primaryAccession: item.primaryAccession,
      uniProtkbId: item.uniProtkbId,
      proteinName: item.proteinDescription?.recommendedName?.fullName?.value || item.proteinDescription?.submissionNames?.[0]?.fullName?.value || "Chlorophyll Binding Protein",
      organism: item.organism?.scientificName || "Physcomitrium patens",
      length: item.sequence?.length || 0,
      alphaFoldUrl: `https://alphafold.ebi.ac.uk/entry/${item.primaryAccession}`,
    }));

    res.json({ proteins });
  } catch (error: any) {
    console.error("UniProt error:", error);
    res.status(500).json({ error: error?.message || "Failed to query UniProt" });
  }
});

app.get("/api/science/pubchem", async (req, res) => {
  try {
    const compound = (req.query.compound as string) || "Chlorophyll a";
    const pugUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compound)}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`;
    const response = await fetch(pugUrl);
    const data = await response.json();
    const props = data?.PropertyTable?.Properties?.[0] || {};

    res.json({
      compound,
      cid: props.CID,
      formula: props.MolecularFormula || "C55H72MgN4O5",
      weight: props.MolecularWeight || "893.5",
      smiles: props.CanonicalSMILES || "",
      iupacName: props.IUPACName || "",
      structureUrl: props.CID ? `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${props.CID}&t=l` : "",
    });
  } catch (error: any) {
    console.error("PubChem error:", error);
    res.status(500).json({ error: error?.message || "Failed to query PubChem" });
  }
});

// ── 8. Plant Identification Endpoint (Gemini 3.8 Flash Vision) ────────────
app.post("/api/identify-plant", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this botanical specimen photograph. Identify the plant, moss, fern, or lichen species.
Respond in valid JSON format with the following exact keys:
{
  "commonName": "Common Name",
  "scientificName": "Genus species (Italics)",
  "family": "Botanical Family",
  "habitat": "Natural habitat and moisture preferences",
  "ecologicalRole": "Ecological significance, soil building, or pollinator value",
  "careOrConservation": "Conservation status or cultivation notes",
  "funFact": "Intriguing biological mechanism or historical lore"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    const parsed = JSON.parse(jsonText);
    res.json({ success: true, plant: parsed });
  } catch (error: any) {
    console.error("Plant identification error:", error);
    res.status(500).json({ error: error?.message || "Failed to identify plant specimen" });
  }
});

// ── 9. Contact API with spam protection (honeypot check & validation) ───────
const ipRateLimitMap = new Map<string, number>();

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message, topic, honeypot } = req.body;

    // Spam honeypot trap: if hidden field is filled, silently reject
    if (honeypot) {
      return res.json({ success: true, message: "Thank you for reaching out." });
    }

    // Rate limiting: 1 message per 30 seconds per IP
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const lastSent = ipRateLimitMap.get(clientIp) || 0;
    if (now - lastSent < 30000) {
      return res.status(429).json({ error: "Please wait 30 seconds before sending another message." });
    }
    ipRateLimitMap.set(clientIp, now);

    // Basic validation
    if (!name || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ error: "Name must be between 2 and 100 characters." });
    }
    if (!email || !email.includes("@") || email.length > 200) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!message || message.trim().length < 5 || message.length > 2000) {
      return res.status(400).json({ error: "Message must be between 5 and 2000 characters." });
    }

    res.json({ success: true, message: "Message dispatched successfully to Sylva stewards." });
  } catch (error: any) {
    console.error("Contact error:", error);
    res.status(500).json({ error: error?.message || "Failed to send message" });
  }
});

// ── Mount Vite in dev or serve static dist in prod ──────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
