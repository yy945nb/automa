import React, { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';

interface Contributor {
  username: string;
  url: string;
  avatar: string;
}

const links = [
  { name: 'GitHub', icon: 'ri-github-fill', url: 'https://github.com/AutomaApp/automa' },
  { name: 'Twitter', icon: 'ri-twitter-line', url: 'https://twitter.com/AutomaApp' },
  { name: 'Discord', icon: 'ri-discord-line', url: 'https://discord.gg/C6khwwTE84' },
  { name: 'Website', icon: 'ri-global-line', url: 'https://extension.automa.site' },
  { name: 'Documentation', icon: 'ri-book-3-line', url: 'https://docs.extension.automa.site' },
  { name: 'Blog', icon: 'ri-article-line', url: 'https://blog.automa.site' },
];

export default function SettingsAbout() {
  const extensionVersion = browser.runtime.getManifest().version;
  const [contributors, setContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    async function fetchContributors() {
      try {
        const response = await fetch(
          'https://api.github.com/repositories/412741449/contributors'
        );
        const data = await response.json();
        const parsed: Contributor[] = data.reduce(
          (acc: Contributor[], { type, avatar_url, login, html_url }: any) => {
            if (type !== 'Bot') {
              acc.push({ username: login, url: html_url, avatar: avatar_url });
            }
            return acc;
          },
          []
        );
        setContributors(parsed);
      } catch (error) {
        console.error(error);
      }
    }

    fetchContributors();
  }, []);

  return (
    <div className="max-w-lg">
      <div className="bg-box-transparent mb-2 inline-block rounded-full p-3">
        <img src="/src/assets/svg/logo.svg" className="w-14" alt="Automa logo" />
      </div>
      <p className="text-2xl font-semibold">Automa</p>
      <p className="mb-2 mt-1">Version: {extensionVersion}</p>
      <p className="text-gray-600 dark:text-gray-200">
        Automa is a chrome extension for browser automation. From auto-fill forms, doing a
        repetitive task, taking a screenshot, to scraping data of the website, it&apos;s up to you
        what you want to do with this extension.
      </p>
      <div className="mt-4 space-x-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener"
            title={link.name}
            className="hoverable inline-block rounded-lg p-2 transition"
          >
            <i className={link.icon} />
          </a>
        ))}
      </div>
      <div className="my-8 border-b dark:border-gray-700" />
      <h2 className="text-xl font-semibold">Contributors</h2>
      <p className="mt-1 text-gray-600 dark:text-gray-200">
        Thanks to everyone who has submitted issues, made suggestions, and generally helped make
        this a better project.
      </p>
      {contributors.length > 0 && (
        <div className="mt-4 mb-12 grid grid-cols-7 gap-2">
          {contributors.map((contributor) => (
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
      )}
    </div>
  );
}
