import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import ContentPageLayout from '../components/layout/ContentPageLayout';

export default function GenericContentPage() {
  const { t } = useTranslation('trust_safety');
  const { pageId } = useParams();

  // Mapping of page IDs to translation keys
  const pageKey = `pages.${pageId}`;

  // Fallback title if translation is missing (or use the key itself to debug)
  const title = t(`${pageKey}.title`, { defaultValue: pageId?.replace(/-/g, ' ').toUpperCase() });
  const content = t(`${pageKey}.content`, { defaultValue: 'Content coming soon...' });

  return (
    <ContentPageLayout title={title}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </ContentPageLayout>
  );
}
