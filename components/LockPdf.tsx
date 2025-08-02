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
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md
                 flex flex-col gap-6
                 sm:p-8 sm:mt-16"
    >
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Lock PDF
      </h2>

      <div>
        <label
          htmlFor="file-upload"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Select PDF File
        </label>
        <input
          id="file-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     cursor-pointer"
        />
      </div>

      <div>
        <label
          htmlFor="code-input"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          6-digit code
        </label>
        <input
          id="code-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-md
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-transparent transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 text-white font-semibold rounded-md
                    transition
                    ${
                      loading
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
      >
        {loading ? "Locking..." : "Lock PDF"}
      </button>
    </form>
  );
}
