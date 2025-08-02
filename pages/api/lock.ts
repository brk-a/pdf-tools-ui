import type { NextApiRequest, NextApiResponse } from "next";
import { Formidable, File } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js default body parser for multipart
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const form = new Formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Form parse error" });
    }

    let file: File | undefined;
    const code = fields.code as string | undefined;
    
            if (Array.isArray(files.file)) {
                // If multiple files uploaded, take the first one or handle accordingly
                file = files.file[0];
            } else {
                // Single file uploaded
                file = files.file;
            }
    
            if (!file) {
                return res.status(400).json({ error: "Missing file" });
            }

    if (!file || !code) {
      return res.status(400).json({ error: "Missing file or code" });
    }

    try {
      const fileBuffer = fs.readFileSync(file.filepath);

      // Use native FormData from Node.js
      const formData = new FormData();
      formData.append("file", new Blob([fileBuffer]), file.originalFilename || "upload.pdf");
      formData.append("code", code);

      // Native fetch in Node.js 18+
      const backendRes = await fetch("http://localhost:8080/lock", {
        method: "POST",
        body: formData! as any, // TypeScript workaround
      });

      if (!backendRes.ok) {
        const text = await backendRes.text();
        return res.status(backendRes.status).json({ error: text });
      }

      const buffer = await backendRes.arrayBuffer();
      res.setHeader("Content-Type", "application/pdf");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error forwarding request to backend:", error);
      res.status(500).json({ error: "Backend request failed" });
    }
  });
}
