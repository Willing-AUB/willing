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
    <Card
      className="border border-base-300 bg-base-100 hover:shadow-lg transition-all duration-200"
      title={organization.name}
      link={`/organization/${organization.id}`}
      left={(
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
      )}
      right={(
        <span className="badge badge-secondary text-sm py-2">
          {organization.posting_count}
          {' '}
          postings
        </span>
      )}
    >
      <p className="text-sm text-base-content">
        {organization.location_name || 'Location not set'}
      </p>
      <p className="text-sm text-base-content/70 line-clamp-3 mt-1">
        {organization.description || 'No description provided.'}
      </p>
    </Card>
  );
}

export default OrganizationCard;
