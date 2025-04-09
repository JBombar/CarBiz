import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Helper
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}

// Param validation
const paramSchema = z.object({
  id: z.string().uuid()
});

// For partial updates
const leadUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  message: z.string().optional(),
  status: z.enum(['new', 'contacted', 'closed']).optional(),
  source_type: z.enum(['organic', 'tipper']).optional(),
  source_id: z.string().uuid().nullable().optional()
});

// ============================================================================
// GET /api/leads/:id
// => admin => can see any
// => dealer => can see if it's for listings they own
// => lead creator => can see the lead they created
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch lead
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*, listing:car_listings(dealer_id)')
    .eq('id', id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // check user role
  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  // admin => see any
  if (currentUser.role === 'admin') {
    return NextResponse.json(lead, { status: 200 });
  } 
  // dealer => see leads for listings they own
  if (currentUser.role === 'dealer') {
    if (lead.listing?.dealer_id === user.id) {
      return NextResponse.json(lead, { status: 200 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // normal user => see only leads they created
  if (lead.from_user_id === user.id) {
    return NextResponse.json(lead, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ============================================================================
// PATCH /api/leads/:id
// => admin => can update
// => dealer => can update if lead belongs to their listing
// => user => can update if it's their lead (optional? depends on business rules).
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // parse body
  const body = await req.json();
  const parseBody = leadUpdateSchema.safeParse(body);
  if (!parseBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseBody.error.flatten() }, { status: 400 });
  }
  const validated = parseBody.data;

  // fetch existing lead 
  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('*, listing:car_listings(dealer_id)')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // check user role
  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let allowed = false;
  if (currentUser.role === 'admin') {
    allowed = true; // admin => can update
  } else if (currentUser.role === 'dealer') {
    // dealer => can update if the lead is for their listing
    if (existing.listing?.dealer_id === user.id) {
      allowed = true;
    }
  } else {
    // normal user => can only update if from_user_id = user.id
    // adapt if you only want them to update phone or message, etc.
    if (existing.from_user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // update
  const { data: updated, error: updateError } = await supabase
    .from('leads')
    .update({ 
      ...validated,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update lead', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/leads/:id
// => admin => can delete
// => dealer => can delete if lead belongs to their listing
// => user => can delete if it's their own lead? up to you
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // fetch
  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('*, listing:car_listings(dealer_id)')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // role check
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let allowed = false;
  if (currentUser.role === 'admin') {
    allowed = true;
  } else if (currentUser.role === 'dealer') {
    // dealer => can delete if the lead belongs to their listing
    if (existing.listing?.dealer_id === user.id) {
      allowed = true;
    }
  } else {
    // normal user => can delete if from_user_id = user.id, if that’s your logic
    if (existing.from_user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // delete
  const { error: deleteErr } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete lead', details: deleteErr.message }, { status: 500 });
  }

  // success
  return NextResponse.json({ message: 'Lead deleted' }, { status: 200 });
}
