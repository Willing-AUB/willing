import { Building2 } from 'lucide-react';

import { SERVER_BASE_URL } from '../utils/requestServer';

interface OrganizationProfilePictureProps {
  organizationName: string;
  organizationId: number;
  logoPath?: string | null;
  size?: number;
  className?: string;
}

function getOrganizationInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'O';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export default function OrganizationProfilePicture({
  organizationName,
  organizationId,
  logoPath,
  size = 96,
  className = '',
}: OrganizationProfilePictureProps) {
  const initials = getOrganizationInitials(organizationName);
  const isPng = logoPath?.toLowerCase().endsWith('.png');

  if (logoPath) {
    return (
      <div
        className={`rounded-full overflow-hidden ring-1 ring-base-300 flex items-center justify-center ${className}`}
        style={{ width: size, height: size, backgroundColor: isPng ? 'white' : undefined }}
      >
        <img
          src={`${SERVER_BASE_URL}/organization/${organizationId}/logo`}
          alt={`${organizationName} logo`}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full ${className} flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white`}
      style={{ width: size, height: size }}
    >
      {initials
        ? (
            <span className="text-4xl font-bold">{initials}</span>
          )
        : (
            <Building2 size={size * 0.45} />
          )}
    </div>
  );
}
