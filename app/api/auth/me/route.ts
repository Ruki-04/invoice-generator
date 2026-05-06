import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const username = await getCurrentUser();
  if (!username) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: username });
}
