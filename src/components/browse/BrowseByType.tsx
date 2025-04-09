import Link from 'next/link';
import { 
  HiOutlineTruck, 
  HiOutlineLightningBolt 
} from 'react-icons/hi';
import {
  LuCar,
  LuCarFront,
  LuCarTaxiFront,
} from 'react-icons/lu';
import { PiCarProfileBold, PiVanBold, PiCarSimpleBold } from 'react-icons/pi';
import { TbCarSuv } from 'react-icons/tb';

interface VehicleTypeProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const VehicleTypeCard = ({ icon, label, href }: VehicleTypeProps) => (
  <Link href={href} className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="text-primary text-3xl mb-3">
      {icon}
    </div>
    <span className="text-gray-800 font-medium">{label}</span>
  </Link>
);

export function BrowseByType() {
  const vehicleTypes = [
    { icon: <TbCarSuv size={32} />, label: 'SUV', href: '/search?type=suv' },
    { icon: <LuCar size={32} />, label: 'Sedan', href: '/search?type=sedan' },
    { icon: <PiCarSimpleBold size={32} />, label: 'Hatchback', href: '/search?type=hatchback' },
    { icon: <HiOutlineLightningBolt size={32} />, label: 'Electric', href: '/search?type=electric' },
    { icon: <PiCarProfileBold size={32} />, label: 'Convertible', href: '/search?type=convertible' },
    { icon: <LuCarTaxiFront size={32} />, label: 'Hybrid', href: '/search?type=hybrid' },
    { icon: <LuCarFront size={32} />, label: 'Coupe', href: '/search?type=coupe' },
    { icon: <PiVanBold size={32} />, label: 'Van', href: '/search?type=van' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Browse By Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {vehicleTypes.map((type, index) => (
            <VehicleTypeCard 
              key={index} 
              icon={type.icon} 
              label={type.label} 
              href={type.href} 
            />
          ))}
        </div>
      </div>
    </section>
  );
} 