import connectDB from './db';
import Order from '@/models/Order';

function getPKTDateBoundary(type) {
  const now = new Date();
  const pktOffset = 5 * 60 * 60 * 1000;
  const pktNow = new Date(now.getTime() + pktOffset);
  
  let boundary;
  
  if (type === 'today') {
    boundary = new Date(pktNow.getFullYear(), pktNow.getMonth(), pktNow.getDate());
  } else if (type === 'week') {
    const day = pktNow.getDay();
    const diff = day === 0 ? 6 : day - 1;
    boundary = new Date(pktNow.getFullYear(), pktNow.getMonth(), pktNow.getDate() - diff);
  } else if (type === 'month') {
    boundary = new Date(pktNow.getFullYear(), pktNow.getMonth(), 1);
  }
  
  return new Date(boundary.getTime() - pktOffset);
}

export async function getDashboardStats() {
  try {
    await connectDB();
    
    const startOfToday = getPKTDateBoundary('today');
    const startOfWeek = getPKTDateBoundary('week');
    const startOfMonth = getPKTDateBoundary('month');
    
    const [
      totalOrdersToday,
      totalOrdersThisWeek,
      totalOrdersThisMonth,
      revenueTodayResult,
      revenueThisWeekResult,
      revenueThisMonthResult,
      pendingOrders,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ orderStatus: 'pending_confirmation' }),
    ]);
    
    return {
      totalOrdersToday,
      totalOrdersThisWeek,
      totalOrdersThisMonth,
      revenueToday: revenueTodayResult[0]?.total || 0,
      revenueThisWeek: revenueThisWeekResult[0]?.total || 0,
      revenueThisMonth: revenueThisMonthResult[0]?.total || 0,
      pendingOrders,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalOrdersToday: 0,
      totalOrdersThisWeek: 0,
      totalOrdersThisMonth: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
      pendingOrders: 0,
    };
  }
}

export async function getRevenueByDay(days = 7) {
  try {
    await connectDB();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Karachi'
            }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    return result;
  } catch (error) {
    console.error('Error fetching revenue by day:', error);
    return [];
  }
}

export async function getOrdersByPaymentMethod() {
  try {
    await connectDB();
    
    const result = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return result;
  } catch (error) {
    console.error('Error fetching orders by payment method:', error);
    return [];
  }
}

export async function getRecentOrders(limit = 10) {
  try {
    await connectDB();
    
    const orders = await Order.find()
      .select('_id customer.name customer.email totalAmount paymentMethod orderStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return orders;
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
}
