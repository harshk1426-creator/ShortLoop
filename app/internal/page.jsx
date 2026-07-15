import { getSheetData } from '@/lib/sheets';
import Topbar from '@/components/layout/Topbar';
import InternalClient from './InternalClient';

export const revalidate = 60;

export default async function InternalPage() {
  const data = await getSheetData();

  return (
    <div className="sl-theme-dark min-h-screen bg-sl-bg">
      <Topbar variant="internal" />
      <InternalClient data={data} />
    </div>
  );
}
