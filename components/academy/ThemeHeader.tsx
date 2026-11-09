import SiteHeader from './SiteHeader';
import SiteHeaderResult from './SiteHeaderResult';
import SiteHeaderBright from './SiteHeaderBright';

interface Props {
  theme: string;
  name: string;
  slug: string;
  activePage: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
  address?: string | null;
  hours?: string | null;
  accentColor?: string | null;
  /** 홈페이지 공개 자료가 있으면 메뉴에 '자료실'을 넣는다 */
  hasResources?: boolean;
}

export default function ThemeHeader({ theme, name, slug, activePage, phone, kakaoChannelUrl, address, hours, accentColor, hasResources }: Props) {
  if (theme === 'result') {
    return <SiteHeaderResult name={name} slug={slug} phone={phone} kakaoChannelUrl={kakaoChannelUrl} accentColor={accentColor ?? null} hasResources={hasResources} activePage={activePage} />;
  }
  if (theme === 'bright') {
    return <SiteHeaderBright name={name} slug={slug} phone={phone} kakaoChannelUrl={kakaoChannelUrl} hasResources={hasResources} activePage={activePage} />;
  }
  return (
    <SiteHeader
      name={name}
      slug={slug}
      activePage={activePage}
      phone={phone}
      kakaoChannelUrl={kakaoChannelUrl}
      address={address ?? null}
      hours={hours ?? null}
      hasResources={hasResources}
    />
  );
}
