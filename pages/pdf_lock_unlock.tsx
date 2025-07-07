import React, { useState } from "react";

function LockPdf() {
  const [file, setFile] = React.useState<File | null>(null);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF file");
    if (!/^\d{6}$/.test(code)) return alert("Please enter a valid 6-digit code");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("code", code);

    try {
      const res = await fetch("/api/lock", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to lock PDF");

      const blob = await res.blob();
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
        placeholder="6-digit code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Locking..." : "Lock PDF"}
      </button>
    </form>
  );
}

function UnlockPdf() {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [foundCode, setFoundCode] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setFoundCode(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a locked PDF file");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/unlock", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to unlock PDF");

      // Expecting backend to return file blob and code in headers or JSON
      // Here, assume JSON with file as base64 or URL and code
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setFoundCode(data.code);

        // Download file from URL returned by backend
        const a = document.createElement("a");
        a.href = data.file_url;
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
      {foundCode && (
        <p>
          Found code: <strong>{foundCode}</strong>
        </p>
      )}
    </form>
  );
}

export default function PdfToolPage() {
  const [tab, setTab] = useState<"lock" | "unlock">("lock");

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>PDF Lock/Unlock Tool</h1>
      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("lock")} disabled={tab === "lock"}>
          Lock PDF
        </button>
        <button onClick={() => setTab("unlock")} disabled={tab === "unlock"} style={{ marginLeft: 10 }}>
          Unlock PDF
        </button>
      </nav>
      {tab === "lock" ? <LockPdf /> : <UnlockPdf />}
    </div>
  );
}
