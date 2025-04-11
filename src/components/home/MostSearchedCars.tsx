import { createClient } from '@/utils/supabase/client';
import { MostSearchedCarsClient } from './MostSearchedCarsClient';

// Get Supabase client for server-side
export async function MostSearchedCars() {
  let cars = [];
  let error = null;

  try {
    // Create a new server-side Supabase client
    const supabase = createClient();

    // Call the get_most_viewed_cars RPC function
    const { data, error: supabaseError } = await supabase
      .rpc('get_most_viewed_cars', { limit_count: 10 });

    if (supabaseError) throw supabaseError;

    // Filter cars to keep only those with essential fields AND "available" status
    if (data && Array.isArray(data)) {
      cars = data.filter(car =>
        car &&
        car.id &&
        car.make &&
        car.model &&
        car.year &&
        car.status &&
        car.status.toLowerCase() === 'available'  // Only show available cars
      );

      // Add console log for debugging
      console.log(`Found ${cars.length} available cars from get_most_viewed_cars`);
    }

    // Remove the second verification step that checks existence in inventory
    // as the RPC function should already return valid cars

  } catch (e) {
    console.error('Error fetching most viewed cars:', e);
    error = e instanceof Error ? e.message : 'Failed to load popular cars';
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-10">Most Searched Cars</h2>

        {error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">Failed to load popular cars. Please try again later.</div>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">No popular vehicles found at the moment.</div>
          </div>
        ) : (
          <MostSearchedCarsClient cars={cars} />
        )}
      </div>
    </section>
  );
} 