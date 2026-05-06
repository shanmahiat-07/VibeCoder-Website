import { RefreshCcw } from 'lucide-react';
import temporaryUnavailable from '@/assets/images/unavailable.svg';
import { CustomErrorView } from '../../components/custom-error-view/custom-error-view';

export const ServiceUnavailablePage = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <CustomErrorView
      image={temporaryUnavailable}
      title="Page temporarily unavailable"
      description="Scheduled maintenance is in progress."
      buttonText="Reload page"
      buttonIcon={<RefreshCcw />}
      onButtonClick={handleReload}
    />
  );
};
