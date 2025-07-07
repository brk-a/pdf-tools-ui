import React, { useState } from "react";

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [foundCode, setFoundCode] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setFoundCode(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a locked PDF file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/unlock", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to unlock PDF");
      }

      // Assuming backend returns JSON with file blob URL and code
      // If backend returns file blob directly, adjust accordingly
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setFoundCode(data.code);

        // To download file from URL returned by backend
        const fileUrl = data.file_url;
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = `unlocked_${file.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        // If backend returns file blob directly
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `unlocked_${file.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Unlock PDF</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button type="submit" disabled={loading}>
        {loading ? "Unlocking..." : "Unlock PDF"}
      </button>
      {foundCode && <p>Found code: <strong>{foundCode}</strong></p>}
    </form>
  );
}
