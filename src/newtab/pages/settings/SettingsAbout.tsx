import React, { useEffect } from 'react';
import { useMainStore } from '@/stores/main';
import { communities } from '@/utils/shared';
import browser from 'webextension-polyfill';

const extensionVersion = browser.runtime.getManifest().version;

const links = [
  ...communities,
  { name: 'Website', icon: 'riGlobalLine', url: 'https://extension.automa.site' },
  { name: 'Documentation', icon: 'riBook3Line', url: 'https://docs.extension.automa.site' },
  { name: 'Blog', icon: 'riArticleLine', url: 'https://blog.automa.site' },
];

const SettingsAbout: React.FC = () => {
  const store = useMainStore();

  useEffect(() => {
    if (store.contributors) return;

    (async () => {
      try {
        const response = await fetch(
          'https://api.github.com/repositories/412741449/contributors'
        );
        const data = await response.json();
        const contributors = data.reduce(
          (acc: any[], { type, avatar_url, login, html_url }: any) => {
            if (type !== 'Bot') {
              acc.push({ username: login, url: html_url, avatar: avatar_url });
            }
            return acc;
          },
          []
        );
        store.setContributors(contributors);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <div className="max-w-lg">
      <div className="bg-box-transparent mb-2 inline-block rounded-full p-3">
        <img src="/assets/svg/logo.svg" className="w-14" alt="Automa logo" />
      </div>
      <p className="text-2xl font-semibold">Automa</p>
      <p className="mb-2 mt-1">Version: {extensionVersion}</p>
      <p className="text-gray-600 dark:text-gray-200">
        Automa is a chrome extension for browser automation. From auto-fill forms,
        doing a repetitive task, taking a screenshot, to scraping data of the
        website, it&apos;s up to you what you want to do with this extension.
      </p>
      <div className="mt-4 space-x-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name}
            className="hoverable inline-block rounded-lg p-2 transition"
          >
            <span className="remix-icon" data-icon={link.icon} />
          </a>
        ))}
      </div>
      <div className="my-8 border-b dark:border-gray-700" />
      <h2 className="text-xl font-semibold">Contributors</h2>
      <p className="mt-1 text-gray-600 dark:text-gray-200">
        Thanks to everyone who has submitted issues, made suggestions, and
        generally helped make this a better project.
      </p>
      <div className="mt-4 mb-12 grid grid-cols-7 gap-2">
        {(store.contributors || []).map((contributor: any) => (
          <a
            key={contributor.username}
            href={contributor.url}
            target="_blank"
            rel="noopener"
            title={contributor.username}
          >
            <img
              src={contributor.avatar}
              alt={`${contributor.username} avatar`}
              className="w-16 rounded-lg"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default SettingsAbout;