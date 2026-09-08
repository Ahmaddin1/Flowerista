import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

const VALID_STATUSES = [
  "pending_confirmation",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function PATCH(request, { params }) {
  const { orderId } = await params;
  const token = getTokenFromRequest(request);
  const verified = verifyToken(token);

  if (!token || !verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const { status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    await connectDB();

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: status,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedStatus: status });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
