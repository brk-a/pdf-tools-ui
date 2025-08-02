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

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setFoundCode(data.code);

        const fileUrl = data.file_url;
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = `unlocked_${file.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
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
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md
                 flex flex-col gap-6
                 sm:p-8 sm:mt-16"
    >
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Unlock PDF
      </h2>

      <div>
        <label
          htmlFor="file-upload"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Select Locked PDF File
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
                     file:bg-green-50 file:text-green-700
                     hover:file:bg-green-100
                     cursor-pointer"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 text-white font-semibold rounded-md
                    transition
                    ${
                      loading
                        ? "bg-green-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
      >
        {loading ? "Unlocking..." : "Unlock PDF"}
      </button>

      {foundCode && (
        <p className="text-center text-gray-700 text-lg">
          Found code: <strong>{foundCode}</strong>
        </p>
      )}
    </form>
  );
}
