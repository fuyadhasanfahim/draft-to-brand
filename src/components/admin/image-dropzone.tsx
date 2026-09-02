"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { IconPhoto, IconX, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/api/blogs";

export function ImageDropzone({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      setUploading(true);
      try {
        const url = await uploadImage(file);
        onChange(url);
        toast.success("Image uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: uploading,
    onDropRejected: (rejections) => {
      const message = rejections[0]?.errors[0]?.message ?? "File rejected";
      toast.error(message);
    },
  });

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <Image
          src={value}
          alt="Cover preview"
          width={1200}
          height={630}
          className="h-44 w-full object-cover"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Remove the cover image"
          title="Remove the cover image"
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background backdrop-blur"
        >
          <IconX size={13} stroke={2} />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      role="button"
      aria-label="Upload a cover image"
      title="Click or drop an image to upload a cover"
      className={cn(
        "flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface text-center transition-colors",
        isDragActive && "border-foreground/40 bg-foreground/5",
        uploading && "cursor-not-allowed opacity-70",
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <IconLoader2 size={22} className="animate-spin text-muted" />
      ) : (
        <IconPhoto size={22} className="text-muted" stroke={1.75} />
      )}
      <p className="text-sm text-muted">
        {uploading
          ? "Uploading…"
          : isDragActive
            ? "Drop the image here"
            : "Drag an image here, or click to choose"}
      </p>
      <p className="text-xs text-muted/70">JPEG, PNG, WebP, AVIF or GIF · up to 5 MB</p>
    </div>
  );
}
