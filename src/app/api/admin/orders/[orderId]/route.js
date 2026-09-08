import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request, { params }) {
  const token = getTokenFromRequest(request);
  const verified = verifyToken(token);
  
  if (!token || !verified) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderId } = params;
    await connectDB();

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
