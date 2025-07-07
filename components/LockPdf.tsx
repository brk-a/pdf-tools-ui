import React, { useState } from "react";

export default function LockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF file");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      alert("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("code", code);

    try {
      const res = await fetch("http://localhost:8080/lock", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to lock PDF");
      }

      // Assuming backend returns the file as a blob (or a URL)
      const blob = await res.blob();

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `locked_${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Lock PDF</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="6-digit code"
        maxLength={6}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Locking..." : "Lock PDF"}
      </button>
    </form>
  );
}
