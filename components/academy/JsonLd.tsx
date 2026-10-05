import type { AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
};

export default function JsonLd({ tenant }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    name: tenant.name,
    ...(tenant.address && { address: { '@type': 'PostalAddress', streetAddress: tenant.address } }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(tenant.hours && { openingHours: tenant.hours }),
    ...(tenant.subjects && { knowsAbout: tenant.subjects }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
