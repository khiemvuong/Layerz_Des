import { randomUUID } from "node:crypto";
import { readSurveyResponses, saveSurveyResponse } from "@/lib/survey-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const province = cleanText(body?.province);
  const district = cleanText(body?.district) || null;
  const otherLocation = cleanText(body?.otherLocation) || null;
  const notificationOptIn = body?.notificationOptIn === true;
  const source = body?.source === "location_change" ? "location_change" : "first_visit";

  if (!province || (province === "Khác" && !otherLocation)) {
    return Response.json({ error: "Vui lòng chọn hoặc nhập khu vực." }, { status: 400 });
  }

  const response = {
    id: randomUUID(),
    province,
    district,
    otherLocation,
    notificationOptIn,
    source,
    createdAt: new Date().toISOString(),
  } as const;

  await saveSurveyResponse(response);
  return Response.json({ ok: true, id: response.id }, { status: 201 });
}

export async function GET(request: Request) {
  const dashboardKey = process.env.DASHBOARD_API_KEY;
  const providedKey = request.headers.get("x-dashboard-key");

  if (!dashboardKey || providedKey !== dashboardKey) {
    return Response.json({ error: "Không có quyền truy cập." }, { status: 401 });
  }

  const responses = await readSurveyResponses();
  const counts = responses.reduce<Record<string, number>>((result, item) => {
    const key = item.otherLocation || item.district || item.province;
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});

  const notificationOptIns = responses.filter((item) => item.notificationOptIn).length;

  return Response.json({ total: responses.length, notificationOptIns, counts, responses });
}
