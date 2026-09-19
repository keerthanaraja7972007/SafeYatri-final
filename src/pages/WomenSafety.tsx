import { ShieldCheck } from 'lucide-react';
import PlaceholderPage from '@/components/PlaceholderPage';

export default function WomenSafety() {
  return (
    <PlaceholderPage
      title="Women Safety Mode"
      description="Enable additional safety considerations when planning and navigating your journey for a more secure travel experience."
      icon={ShieldCheck}
      gradient="gradient-green-cyan"
    />
  );
}
