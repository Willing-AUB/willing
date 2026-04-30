import Card from '../../components/Card';

import type { LucideIcon } from 'lucide-react';

type ReportPersonCardProps = {
  title: string;
  name: string;
  email: string;
  Icon: LucideIcon;
};

function ReportPersonCard({ title, name, email, Icon }: ReportPersonCardProps) {
  return (
    <Card className="border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white">
      <div className="flex items-center gap-2 mb-5 text-base font-bold text-slate-900">
        <Icon size={20} className="text-primary shrink-0" />
        <span>{title}</span>
      </div>
      <p className="text-base font-semibold text-slate-900">{name}</p>
      <p className="text-sm text-slate-500">{email}</p>
    </Card>
  );
}

export default ReportPersonCard;
