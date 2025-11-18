import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfDay } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = startOfDay(new Date());

    const [total, sent, unsent, todayCount] = await Promise.all([
      prisma.contact.count({ where: { userId: user.id } }),
      prisma.contact.count({ where: { userId: user.id, sent: true } }),
      prisma.contact.count({ where: { userId: user.id, sent: false } }),
      prisma.contact.count({
        where: {
          userId: user.id,
          createdAt: { gte: today },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      sent,
      unsent,
      today: todayCount,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

