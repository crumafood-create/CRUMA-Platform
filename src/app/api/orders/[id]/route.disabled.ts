import { NextResponse }
from 'next/server';

import { createClient }
from '@/infrastructure/integrations/supabase/server';

interface Props {

  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: Props
) {

  const { id } =
    await params;

  const supabase =
    await createClient();

  const { data, error } =
    await supabase

      .from('orders')

      .select('*')

      .eq('id', id)

      .single();

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
