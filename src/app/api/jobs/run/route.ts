import { NextResponse } from 'next/server';

import {
  runSystemJobs,
} from '@/app/(admin)/system/actions';

export async function GET(
  request: Request,
) {
  const auth =
    request.headers.get(
      'authorization',
    );

  if (
    auth !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse(
      'Unauthorized',
      {
        status: 401,
      },
    );
  }

  try {
    await runSystemJobs();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      },
    );
  }
}
if (
  process.env.VERCEL_ENV ===
  'production'
) {
  const auth =
    request.headers.get(
      'authorization',
    );

  if (
    auth !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse(
      'Unauthorized',
      {
        status: 401,
      },
    );
  }
}
