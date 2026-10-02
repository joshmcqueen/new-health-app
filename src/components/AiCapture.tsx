import { Camera, ImagePlus, Mic, Sparkles, Square, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";
import type { MealType } from "../../shared/schemas";
import { api } from "../api";
import { localDateTime, mealTypeNow } from "../utils";
import { Modal } from "./Modal";

type Mode = "quick_food" | "meal_log";

async function normalizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image`);
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1800;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not process image")), "image/jpeg", 0.88));
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
    throw new Error("This image format could not be converted. Try taking a new photo instead.");
  }
}

export function AiCapture({ mode, date, onClose, onSaved }: { mode: Mode; date?: string; onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mealType, setMealType] = useState<MealType>(mealTypeNow());
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function toggleRecording() {
    if (recording) { recorder.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.ondataavailable = (event) => event.data.size && chunks.current.push(event.data);
      mediaRecorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        setBusy(true);
        try {
          const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("file", blob, blob.type.includes("mp4") ? "recording.m4a" : "recording.webm");
          const result = await api.transcribe(form);
          setDescription((current) => [current, result.text].filter(Boolean).join(" "));
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Transcription failed"); }
        finally { setBusy(false); }
      };
      mediaRecorder.start();
      recorder.current = mediaRecorder;
      setRecording(true);
    } catch { setError("Microphone access requires permission and a secure HTTPS connection."); }
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const normalized = await Promise.all(files.slice(0, 4).map(normalizeImage));
      const form = new FormData();
      form.append("mode", mode);
      form.append("description", description);
      if (mode === "meal_log") {
        const mealDate = date!;
        form.append("date", mealDate);
        form.append("loggedAt", localDateTime(mealDate));
        form.append("mealType", mealType);
      }
      normalized.forEach((file) => form.append("images", file));
      await api.analyzeNutrition(form);
      onSaved();
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={mode === "quick_food" ? "Create with AI" : "Analyze & log"} eyebrow="OpenAI nutrition estimate" onClose={onClose} wide>
      <div className="capture-stack">
        <div className="ai-callout"><WandSparkles size={20} /><div><b>Describe it, photograph it, or both.</b><p>Nutrition labels and quantity details make the estimate stronger.</p></div></div>
        <label><span>Description</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A bowl with ¾ cup Greek yogurt, blueberries, and ⅓ cup granola…" /></label>
        {mode === "meal_log" && <label><span>Meal</span><select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label>}
        <div className="capture-actions">
          <button className={`capture-button ${recording ? "recording" : ""}`} type="button" onClick={toggleRecording} disabled={busy}>{recording ? <Square size={20} /> : <Mic size={20} />}<span>{recording ? "Stop" : "Speak"}</span></button>
          <label className="capture-button"><Camera size={20} /><span>Camera</span><input hidden type="file" accept="image/*" capture="environment" onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 4))} /></label>
          <label className="capture-button"><ImagePlus size={20} /><span>Library</span><input hidden multiple type="file" accept="image/*" onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 4))} /></label>
        </div>
        {files.length > 0 && <div className="file-strip">{files.map((file, index) => <button key={`${file.name}-${index}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remove image">{file.name}</button>)}</div>}
        {error && <p className="error-banner">{error}</p>}
        <button className="primary-button" onClick={submit} disabled={busy || (!description.trim() && !files.length)}><Sparkles size={18} />{busy ? "Working…" : mode === "quick_food" ? "Estimate & save food" : "Estimate & log meal"}</button>
        <p className="estimate-note">AI nutrition values are estimates and can be edited after saving. Photos and audio are discarded after processing.</p>
      </div>
    </Modal>
  );
}
