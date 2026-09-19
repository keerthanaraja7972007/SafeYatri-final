import { ShieldAlert } from 'lucide-react';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function GeoFencing() {
  return (
    <PlaceholderPage
      title="Smart Safety Zones"
      description="Receive safety awareness when approaching locations that require additional caution during your travels."
      icon={ShieldAlert}
      gradient="gradient-orange-red"
    />
  );
}
