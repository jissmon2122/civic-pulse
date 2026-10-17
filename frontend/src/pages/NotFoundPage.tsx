import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Map } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EmptyIllustration } from '../components/illustrations/DaylightIllustrations';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <EmptyIllustration message="404 — We couldn't find the civic page you were looking for." />
      <div className="flex items-center gap-3 mt-4">
        <Link to="/">
          <Button variant="primary" size="sm" leftIcon={<Home size={15} />}>
            Back to Home
          </Button>
        </Link>
        <Link to="/explorer">
          <Button variant="outline" size="sm" leftIcon={<Map size={15} />}>
            Browse Map
          </Button>
        </Link>
      </div>
    </div>
  );
};
