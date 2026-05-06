import { ArrowRight } from 'lucide-react';
import notFound from '@/assets/images/not_found.svg';
import { CustomErrorView } from '../../components/custom-error-view/custom-error-view';

export const NotFoundPage = () => {
  return (
    <CustomErrorView
      image={notFound}
      title="Page not found"
      description="The page may have moved or no longer exists."
      buttonText="Take me back"
      buttonIcon={<ArrowRight />}
      buttonLink="/"
    />
  );
};
