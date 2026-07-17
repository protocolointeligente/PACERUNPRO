import { NextResponse } from "next/server";

export function legacyAthleteApi(canonicalPath: string) {
  return NextResponse.json(
    {
      error: "Endpoint legado neutralizado.",
      canonicalPath,
    },
    {
      status: 410,
      headers: {
        Link: `<${canonicalPath}>; rel="canonical"`,
      },
    },
  );
}
