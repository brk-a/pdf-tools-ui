import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).end("Method Not Allowed");
    }

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: "Form parse error" });
        }

        let file: formidable.File | undefined;

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

        try {
            const fileBuffer = fs.readFileSync(file.filepath);

            const formData = new FormData();
            formData.append("file", new Blob([fileBuffer]), file.originalFilename || "upload.pdf");

            const backendRes = await fetch("http://localhost:8080/unlock", {
                method: "POST",
                body: formData as any,
            });

            if (!backendRes.ok) {
                const text = await backendRes.text();
                return res.status(backendRes.status).json({ error: text });
            }

            const contentType = backendRes.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const json = await backendRes.json();
                return res.status(200).json(json);
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
