import { getSheetData } from '@/lib/sheets';
import DealershipClient from './DealershipClient';

export default async function DealershipPage() {
  const data = await getSheetData();

  return <DealershipClient data={data} />;
}
