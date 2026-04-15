import React from 'react';
import { useTranslation } from 'react-i18next';

const communities = [
  { name: 'GitHub', icon: 'riGithubFill', url: 'https://github.com/AutomaApp/automa' },
  { name: 'Twitter', icon: 'riTwitterLine', url: 'https://twitter.com/AutomaApp' },
  { name: 'Discord', icon: 'riDiscordLine', url: 'https://discord.gg/C6khwwTE84' },
];

const Welcome: React.FC = () => {
  const { t } = useTranslation();

  const links = [
    { name: t('common.docs'), icon: 'riBook3Line', url: 'https://docs.extension.automa.site' },
    { name: t('welcome.marketplace'), icon: 'riCompass3Line', url: 'https://extension.automa.site/workflows' },
    { name: 'YouTube', icon: 'riYoutubeLine', url: 'https://youtube.com/channel/UCL3qU64hW0fsIj2vOayOQUQ' },
    { name: 'Blog', icon: 'riArticleLine', url: 'https://blog.automa.site' },
  ];

  return (
    <div className="mx-auto max-w-xl py-16">
      <h1 className="mb-8 text-3xl font-semibold">{t('welcome.title')}</h1>
      <p>
        Get started by reading the documentation or browsing workflows in the Automa Marketplace.
        <br />
        To learn how to use Automa, watch the tutorials on our YouTube Channel.
      </p>
      <div className="mt-8 flex items-center space-x-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener"
            className="hoverable w-40 flex-1 rounded-lg border-2 p-4 transition"
          >
            <span className="remix-icon" data-icon={link.icon} style={{ fontSize: 28 }} />
            <p className="mt-2">{link.name}</p>
          </a>
        ))}
      </div>
      <div className="mt-8">
        <p>{t('home.communities')}</p>
        <div className="mt-2 flex items-center space-x-2">
          {communities.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener"
              className="hoverable w-40 rounded-lg border-2 p-4 transition"
            >
              <span className="remix-icon" data-icon={link.icon} style={{ fontSize: 28 }} />
              <p className="mt-2">{link.name}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Welcome;