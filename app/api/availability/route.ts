import { NextResponse, type NextRequest } from "next/server";
import { computeSlots } from "@/lib/availability";
import { isValidISODate } from "@/lib/datetime";
import { getService } from "@/lib/services";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = Number(searchParams.get("serviceId"));
  const date = searchParams.get("date") ?? "";
  const excludeIdParam = searchParams.get("excludeId");
  const excludeAppointmentId =
    excludeIdParam && Number.isInteger(Number(excludeIdParam)) && Number(excludeIdParam) > 0
      ? Number(excludeIdParam)
      : undefined;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "A valid service is required." }, { status: 400 });
  }
  if (!isValidISODate(date)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  const service = await getService(serviceId);
  if (!service) {
    return NextResponse.json({ error: "This service is not available." }, { status: 404 });
  }

  const result = await computeSlots(date, service.durationMinutes, { excludeAppointmentId });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
