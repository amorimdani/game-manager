import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { getUploadDir } from "@/lib/uploads";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo de imagem obrigatório." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Formato inválido. Use PNG, JPG, WEBP ou GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Imagem excede o limite de 5 MB." },
        { status: 400 }
      );
    }

    const dir = getUploadDir();
    await fs.mkdir(dir, { recursive: true });

    const filename = `${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ url: `/api/uploads/${filename}` }, { status: 201 });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      { error: "Falha no upload da imagem." },
      { status: 500 }
    );
  }
}
