import { NextResponse }
from 'next/server';

import { createClient }
from '@/infrastructure/supabase/server';

export async function GET() {

  const supabase =
    await createClient();

  const { data, error } =
    await supabase

      .from('orders')

      .select('*')

      .limit(20);

  if (error) {

    return NextResponse.json(

      {
        error: error.message
      },

      {
        status: 500
      }
    );
  }

  return NextResponse.json(data);
}
