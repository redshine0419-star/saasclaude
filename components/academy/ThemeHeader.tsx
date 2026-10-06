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
}

export default function ThemeHeader({ theme, name, slug, activePage, phone, kakaoChannelUrl, address, hours, accentColor }: Props) {
  if (theme === 'result') {
    return <SiteHeaderResult name={name} slug={slug} phone={phone} kakaoChannelUrl={kakaoChannelUrl} accentColor={accentColor ?? null} />;
  }
  if (theme === 'bright') {
    return <SiteHeaderBright name={name} slug={slug} phone={phone} kakaoChannelUrl={kakaoChannelUrl} />;
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
    />
  );
}
