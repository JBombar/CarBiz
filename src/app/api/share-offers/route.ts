import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// ============================================================================
// Helper Function to Create Supabase Client
// ============================================================================
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        /* Ignored */
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        /* Ignored */
                    }
                },
            },
        }
    );
}

// ============================================================================
// POST /api/share-offers
// ============================================================================
/**
 * Expected JSON body:
 * {
 *   offer_ids: string[],
 *   dealer_id: string,
 *   channels: string[],
 *   shared_with_trust_levels: string[],
 *   shared_with_contacts?: string[],
 *   message?: string
 * }
 */

export async function POST(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        const body = await request.json();
        const {
            offer_ids,
            dealer_id,
            channels,
            shared_with_trust_levels,
            shared_with_contacts = [],
            message = ''
        } = body;

        if (!offer_ids || !dealer_id || !channels || !shared_with_trust_levels) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const inserts = offer_ids.map((offer_id: string) => ({
            offer_id,
            dealer_id,
            channels,
            shared_with_trust_levels,
            shared_with_contacts,
            message,
            status: 'pending'
        }));

        const { data, error } = await supabase
            .from('car_offer_shares')
            .insert(inserts)
            .select();

        if (error) {
            console.error('Error inserting into car_offer_shares:', error);
            return NextResponse.json({ error: 'Failed to share car offers', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, shared: data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in POST /api/share-offers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
