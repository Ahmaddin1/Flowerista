import { NextResponse } from "next/server";
import sanitize from "mongo-sanitize";
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const safeEmail = sanitize(email);
    const safePassword = sanitize(password);

    if (
      typeof safeEmail !== "string" ||
      typeof safePassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
      );
    }

    if (
      safeEmail.length > 50 ||
      safePassword.length > 200
    ) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
      );
    }

    if (!safeEmail || !safePassword) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (safeEmail !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Invalid email" }, { status: 401 });
    }

    console.log(JSON.stringify(process.env.ADMIN_PASSWORD_HASH));
    const isValidPassword = await comparePassword(
      safePassword,
      process.env.ADMIN_PASSWORD_HASH,
    );

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = generateToken({ sub: "admin" });
    const response = NextResponse.json({ success: true });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
