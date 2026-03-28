import { Pin } from 'lucide-react';
import { Link } from 'react-router-dom';

import Card from '../Card.tsx';

import type { Crisis } from '../../../../server/src/db/tables/index.ts';

type CrisisCardProps = {
  crisis: Crisis;
};

function CrisisCard({ crisis }: CrisisCardProps) {
  return (
    <Card className="border border-base-300 bg-base-100 hover:border-primary hover:shadow-lg transition-all duration-200">
      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div className="pr-8">
            <h3 className="text-xl font-bold truncate text-primary mb-2 inline-flex items-center gap-1">
              {crisis.name}
              {crisis.pinned && <Pin size={16} className="text-primary font-bold" />}
            </h3>
            <p className="text-sm text-muted whitespace-normal break-words">
              {crisis.description || 'No crisis description provided.'}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Link
            to={`/volunteer/crises/${crisis.id}/postings`}
            className="link link-primary"
          >
            View postings
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default CrisisCard;
