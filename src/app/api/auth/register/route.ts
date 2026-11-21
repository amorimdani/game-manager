import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, SESSION_COOKIE, signSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const password = body.password;

    if (!email || !name || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Informe nome, e-mail válido e senha com no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
      },
      select: { id: true, email: true, name: true },
    });

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({ user }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
