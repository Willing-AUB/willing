import { Link } from 'react-router-dom';

import { SERVER_BASE_URL } from '../../utils/requestServer.ts';
import Card from '../Card.tsx';

import type { VolunteerOrganizationSearchResult } from '../../../../server/src/api/types.ts';

type OrganizationCardProps = {
  organization: VolunteerOrganizationSearchResult;
};

function OrganizationCard({ organization }: OrganizationCardProps) {
  const logoUrl = organization.logo_path
    ? `${SERVER_BASE_URL}/organization/${organization.id}/logo`
    : null;

  return (
    <Card className="border border-base-300 bg-base-100 hover:border-secondary hover:shadow-lg transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/organization/${organization.id}`} className="shrink-0">
            <div className="avatar avatar-placeholder">
              {logoUrl
                ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-base-300 bg-base-100 flex items-center justify-center">
                      <img
                        src={logoUrl}
                        alt={`${organization.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )
                : (
                    <div className="bg-primary text-primary-content w-12 h-12 rounded-full flex items-center justify-center">
                      {organization.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
            </div>
          </Link>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">
              <Link to={`/organization/${organization.id}`} className="link link-primary link-hover hover:underline">
                {organization.name}
              </Link>
            </h3>
            <p className="text-sm text-muted truncate">
              {organization.location_name || 'Location not set'}
            </p>
          </div>
        </div>
        <div className="mt-3 text-sm text-base-content">
          <span className="font-medium">Postings</span>
          :
          <span className="ml-1 font-semibold">{organization.posting_count}</span>
        </div>

        <p className="mt-2 text-sm text-base-content/70 line-clamp-3">
          {organization.description || 'No description provided.'}
        </p>
      </div>
    </Card>
  );
}

export default OrganizationCard;
