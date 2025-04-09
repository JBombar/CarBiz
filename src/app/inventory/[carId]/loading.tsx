// Handle loading state
export function Loading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="h-10 w-32 bg-muted rounded mb-6"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="aspect-[16/9] bg-muted rounded-lg"></div>
                        <div className="h-10 bg-muted rounded mt-8"></div>
                        <div className="h-64 bg-muted rounded mt-4"></div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="h-96 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
} 