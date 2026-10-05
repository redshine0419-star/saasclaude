import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { QueueClient } from './QueueClient';

export default async function PlatformQueuePage() {
  const applications = await prisma.application.findMany({
    orderBy: [{ status: 'asc' }, { queueOrder: 'asc' }],
  });

  const apps = applications.map((a) => ({
    id: a.id,
    queueOrder: a.queueOrder,
    academyName: a.academyName,
    directorName: a.directorName,
    subject: a.subject,
    area: a.area,
    phone: a.phone,
    currentUrl: a.currentUrl,
    wantsPhotoShoot: a.wantsPhotoShoot,
    uploadedFiles: a.uploadedFiles,
    status: a.status,
    expectedStartDate: a.expectedStartDate?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="queue" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
          background: '#F4F2EE',
          minHeight: '100vh',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>베타 대기열</h1>
              <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
                신청 순서대로 제작을 진행합니다. 총 {applications.length}건
              </div>
            </div>
          </div>

          <QueueClient apps={apps} />
        </div>
      </main>
    </div>
  );
}
