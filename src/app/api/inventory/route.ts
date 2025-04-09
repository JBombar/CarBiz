import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '@/types/supabase';

// Define a comprehensive Zod schema matching the actual database columns
const inventoryQuerySchema = z.object({
  // String filters - basic text fields
  make: z.string().optional(),
  model: z.string().optional(),
  fuel_type: z.string().optional(),
  transmission: z.string().optional(),
  body_type: z.string().optional(),
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  engine: z.string().optional(),
  vin: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),

  // Enum filters - validated against allowed values
  condition: z.enum(['new', 'used', 'Any']).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'Any']).optional(),
  listing_type: z.enum(['sale', 'rent', 'both', 'Any']).optional(),
  rental_status: z.enum(['available', 'rented', 'maintenance', 'Any']).optional(),

  // Numeric range filters
  year_from: z.coerce.number().int().optional(),
  year_to: z.coerce.number().int().optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().positive().optional(),
  mileage_min: z.coerce.number().nonnegative().optional(),
  mileage_max: z.coerce.number().nonnegative().optional(),

  // Pagination and sorting
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: z.enum([
    'price', 'year', 'mileage', 'created_at',
    'make', 'model', 'condition', 'status'
  ]).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).passthrough(); // Allow other params to pass through to prevent validation errors

// Define type for validated query parameters
type InventoryQueryParams = z.infer<typeof inventoryQuerySchema>;

// Valid enum values for reference
const VALID_CONDITIONS = ['new', 'used'];
const VALID_STATUSES = ['available', 'reserved', 'sold', 'rented'];
const VALID_LISTING_TYPES = ['sale', 'rent', 'both', 'rental'];
const VALID_RENTAL_STATUSES = ['available', 'rented', 'maintenance'];

// Helper function to create Supabase client
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
          } catch (e) { /* Ignore cookie errors */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (e) { /* Ignore cookie errors */ }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query parameters with the schema
    const result = inventoryQuerySchema.safeParse(params);
    if (!result.success) {
      return NextResponse.json(
        {
          data: [],
          count: 0,
          page: 1,
          limit: 24,
          error: "Invalid query parameters",
          details: result.error.format()
        },
        { status: 400 }
      );
    }

    const validatedParams = result.data;

    // Initialize Supabase query
    const supabase = createSupabaseClient();
    let query = supabase.from('car_listings').select('*', { count: 'exact' });

    // Apply filters - Add wildcards for substring matching on make
    if (validatedParams.make && validatedParams.make !== 'Any') {
      // Modified: Using wildcards to match substrings instead of exact match
      query = query.ilike('make', `%${validatedParams.make.trim()}%`);

      // Log for debugging
      console.log(`Filtering by make with substring match: "%${validatedParams.make.trim()}%"`);
    }

    // Improved model filter with wildcards
    if (validatedParams.model &&
      validatedParams.model !== 'Any' &&
      validatedParams.model.toLowerCase() !== 'any') {
      // Modified: Using wildcards for substring matching on model too
      query = query.ilike('model', `%${validatedParams.model.trim()}%`);

      // Log for debugging
      console.log(`Filtering by model with substring match: "%${validatedParams.model.trim()}%"`);
    }

    // Rest of your filters...
    if (validatedParams.year_from) {
      query = query.gte('year', validatedParams.year_from);
    }

    if (validatedParams.year_to) {
      query = query.lte('year', validatedParams.year_to);
    }

    // Continue with other filters...
    // ...

    // Execute query and get results
    const { data: cars, error, count } = await query
      .order(validatedParams.sortBy, { ascending: validatedParams.sortOrder === 'asc' })
      .range(
        (validatedParams.page - 1) * validatedParams.limit,
        validatedParams.page * validatedParams.limit - 1
      );

    // Improved warning log with more detailed information
    if (!cars || cars.length === 0) {
      // General message when no cars found with any filters
      if (Object.keys(validatedParams).length > 2) { // More than just page & limit params
        console.warn(`No cars found matching filters: ${JSON.stringify(validatedParams)}`);
        console.log(`Database hint: Make sure the database values match filter format. Using substring matching, but still no results.`);
      }
    }

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json(
        {
          data: [],
          count: 0,
          page: validatedParams.page,
          limit: validatedParams.limit,
          error: "Failed to fetch inventory"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: cars || [],
      count: count || 0,
      page: validatedParams.page,
      limit: validatedParams.limit
    });

  } catch (error) {
    console.error('Unexpected error in inventory API:', error);
    return NextResponse.json(
      {
        data: [],
        count: 0,
        page: 1,
        limit: 24,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
} 