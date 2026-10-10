"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { upload } from "@vercel/blob/client";
import { addPhoto, deletePhoto } from "@/app/admin/actions";

export type PhotoItem = { id: string; thumbUrl: string; fullUrl: string };
type Pending = { key: string; name: string; state: "waiting" | "uploading" | "failed" };

const CONCURRENCY = 3;

function compress(file: File, maxWidthOrHeight: number, maxSizeMB: number) {
  // JPEG rather than WebP: older iPhone Safari can't encode WebP from a canvas.
  return imageCompression(file, {
    maxWidthOrHeight,
    maxSizeMB,
    fileType: "image/jpeg",
    initialQuality: 0.8,
    useWebWorker: true,
  });
}

export function PhotoField({ jobId, fieldKey, label, initial }: { jobId: string; fieldKey: string; label: string; initial: PhotoItem[] }) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const files = useRef(new Map<string, File>());

  const setItem = (key: string, state: Pending["state"]) =>
    setPending((list) => list.map((p) => (p.key === key ? { ...p, state } : p)));
  const removeItem = (key: string) => {
    files.current.delete(key);
    setPending((list) => list.filter((p) => p.key !== key));
  };

  async function uploadOne(key: string) {
    const file = files.current.get(key);
    if (!file) return;
    setItem(key, "uploading");
    try {
      const [full, thumb] = await Promise.all([compress(file, 2560, 0.6), compress(file, 480, 0.05)]);
      const base = `jobs/${jobId}/${fieldKey}/${key}`;
      const options = {
        access: "private" as const,
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ jobId }),
        contentType: "image/jpeg",
      };
      const [fullBlob, thumbBlob] = await Promise.all([
        upload(`${base}.jpg`, full, options),
        upload(`${base}-thumb.jpg`, thumb, options),
      ]);
      const photo = await addPhoto({
        jobId,
        fieldKey,
        pathname: fullBlob.pathname,
        thumbPathname: thumbBlob.pathname,
        takenAt: file.lastModified, // compression strips EXIF, so keep the capture time here
      });
      setPhotos((list) => [...list, photo]);
      removeItem(key);
    } catch (err) {
      console.error(err);
      setItem(key, "failed");
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const keys = Array.from(list).map((file) => {
      const key = crypto.randomUUID();
      files.current.set(key, file);
      return { key, name: file.name };
    });
    setPending((p) => [...p, ...keys.map((k) => ({ ...k, state: "waiting" as const }))]);

    // A few at a time: 50 parallel uploads on site signal mostly fail.
    let next = 0;
    const worker = async () => {
      while (next < keys.length) await uploadOne(keys[next++].key);
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, worker));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this photo?")) return;
    const before = photos;
    setPhotos((list) => list.filter((p) => p.id !== id));
    try {
      await deletePhoto(id);
    } catch {
      setPhotos(before);
      window.alert("Couldn't delete the photo. Check your connection and try again.");
    }
  }

  const failed = pending.filter((p) => p.state === "failed");
  const inProgress = pending.length - failed.length;

  return (
    <div className="mt-3">
      {photos.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {photos.map((p) => (
            <li key={p.id} className="relative">
              <a href={p.fullUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked images */}
                <img src={p.thumbUrl} alt={`${label} photo`} loading="lazy" className="aspect-square w-full object-cover" />
              </a>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 rounded bg-ink/75 px-1.5 text-sm font-semibold text-white"
                aria-label="Delete photo"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* capture opens the camera directly; the second input opens the photo library */}
        <label className="btn-quiet cursor-pointer px-4 py-2 text-sm">
          Take photo
          <input type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <label className="btn-quiet cursor-pointer px-4 py-2 text-sm">
          Add from library
          <input type="file" accept="image/*" multiple className="sr-only"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <span className="text-sm text-stone" role="status">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
          {inProgress > 0 && `, uploading ${inProgress}…`}
        </span>
      </div>

      {failed.length > 0 && (
        <div role="alert" className="mt-2 flex flex-wrap items-center gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {failed.length} {failed.length === 1 ? "photo" : "photos"} didn&apos;t upload.
          <button type="button" className="font-semibold underline" onClick={() => failed.forEach((f) => uploadOne(f.key))}>
            Retry
          </button>
          <button type="button" className="underline" onClick={() => failed.forEach((f) => removeItem(f.key))}>
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
