/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'methxgrrgzpmkucfrfhg.supabase.co', // Replace with your Supabase storage domain
                pathname: '/storage/v1/object/public/**', // Adjust the path based on your storage bucket structure
            },
        ],
    },
};

module.exports = nextConfig;
