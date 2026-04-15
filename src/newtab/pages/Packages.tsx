import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePackageStore } from '@/stores/package';
import dayjs from '@/lib/dayjs';
import { arraySorter, openFilePicker, parseJSON } from '@/utils/helper';
import dataExporter from '@/utils/dataExporter';

type SortOrder = 'asc' | 'desc';
type SortBy = 'name' | 'createdAt';

interface PackageItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isExternal?: boolean;
  createdAt: number;
  author?: string;
  data?: any;
}

const sorts: SortBy[] = ['name', 'createdAt'];

const Packages: React.FC = () => {
  const { t } = useTranslation();
  const packageStore = usePackageStore();

  const categories = useMemo(
    () => [
      { id: 'all', name: t('common.all') },
      { id: 'user-pkgs', name: t('packages.categories.my') },
      { id: 'installed-pkgs', name: t('packages.categories.installed') },
    ],
    [t]
  );

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');

  const [addShow, setAddShow] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDescription, setAddDescription] = useState('');

  const packages = useMemo(() => {
    const filtered = (packageStore.packages ?? []).filter(
      (item: PackageItem) => {
        let isInCategory = true;
        const matchesQuery = item.name
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase());

        if (activeCat !== 'all') {
          isInCategory =
            activeCat === 'user-pkgs' ? !item.isExternal : !!item.isExternal;
        }

        return isInCategory && matchesQuery;
      }
    );

    return arraySorter({ data: filtered, key: sortBy, order: sortOrder });
  }, [packageStore.packages, query, activeCat, sortBy, sortOrder]);

  // ── actions ─────────────────────────────────────────────
  function duplicatePackage(pkg: PackageItem) {
    const copyPkg = JSON.parse(JSON.stringify(pkg));
    delete copyPkg.id;
    copyPkg.name += ' - copy';
    packageStore.insert(copyPkg);
  }

  function importPackage() {
    openFilePicker(['application/json']).then(([file]: File[]) => {
      if (file.type !== 'application/json') return;
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const pkgJson = parseJSON(fileReader.result as string, null);
        if (!pkgJson || !pkgJson.name || !pkgJson.data) return;
        packageStore.insert(pkgJson);
      };
      fileReader.readAsText(file);
    });
  }

  function exportPackage(pkg: PackageItem) {
    const copyPkg = JSON.parse(JSON.stringify(pkg));
    delete copyPkg.id;
    const blobUrl = dataExporter(
      copyPkg,
      { type: 'json', name: `${pkg.name}.automa-pkg` },
      true
    );
    URL.revokeObjectURL(blobUrl);
  }

  function deletePackage({ id, name }: PackageItem) {
    if (!window.confirm(`Are you sure want to delete "${name}" package?`))
      return;
    packageStore.delete(id);
  }

  function clearNewPackage() {
    setAddName('');
    setAddDescription('');
    setAddShow(false);
  }

  async function addPackage() {
    try {
      await packageStore.insert({
        name: addName.trim() || 'Unnamed',
        description: addDescription,
      });
      clearNewPackage();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="container py-8 pb-4">
      <h1 className="text-2xl font-semibold">{t('common.packages')}</h1>
      <div className="mt-8 flex items-start">
        {/* Sidebar categories */}
        <div className="mr-8 hidden w-60 lg:block">
          <div className="flex items-center">
            <button
              className="btn variant-accent w-full rounded-r-none border-r"
              onClick={() => setAddShow(true)}
            >
              <p>{t('packages.new')}</p>
            </button>
            <button
              className="btn variant-accent icon rounded-l-none"
              onClick={importPackage}
              title={t('packages.import')}
            >
              ▾
            </button>
          </div>
          <ul className="mt-4 space-y-1 text-gray-600 dark:text-gray-200">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className={`cursor-pointer rounded-lg px-4 py-2 ${
                  cat.id === activeCat
                    ? 'bg-box-transparent text-black dark:text-gray-100'
                    : ''
                }`}
                onClick={() => setActiveCat(cat.id)}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center">
            <div className="flex w-full items-center md:w-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search')}
                className="input flex-1"
              />
              <button
                className="btn variant-accent ml-4 lg:hidden"
                onClick={() => setAddShow(true)}
              >
                <span className="remix-icon mr-2 -ml-1" data-icon="riAddLine" />
                <span>{t('common.packages')}</span>
              </button>
            </div>
            <div className="grow" />
            <div className="workflow-sort mt-4 flex items-center lg:mt-0">
              <button
                className="btn icon rounded-r-none border-r border-gray-300 dark:border-gray-700"
                onClick={() =>
                  setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
                }
              >
                <span
                  className="remix-icon"
                  data-icon={
                    sortOrder === 'asc' ? 'riSortAsc' : 'riSortDesc'
                  }
                />
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="select"
              >
                {sorts.map((s) => (
                  <option key={s} value={s}>
                    {t(`sort.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Package grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {packages.map((pkg: PackageItem) => (
              <div
                key={pkg.id}
                className="group flex flex-col rounded-lg border bg-white p-4 hover:ring-2 hover:ring-accent dark:border-gray-700 dark:bg-gray-800 dark:hover:ring-gray-200"
              >
                <div className="flex items-center">
                  {pkg.icon?.startsWith('http') ? (
                    <img
                      src={pkg.icon}
                      className="h-10 w-10 overflow-hidden rounded-lg"
                      alt=""
                    />
                  ) : (
                    <span className="bg-box-transparent rounded-lg p-2">
                      <span
                        className="remix-icon"
                        data-icon={pkg.icon || 'mdiPackageVariantClosed'}
                      />
                    </span>
                  )}
                  <div className="grow" />
                  <div className="relative">
                    {pkg.isExternal ? (
                      <a
                        href={`https://extension.automa.site/packages/${pkg.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer text-gray-600 dark:text-gray-200"
                        title="Open package page"
                      >
                        <span className="remix-icon" data-icon="riExternalLinkLine" />
                      </a>
                    ) : (
                      <>
                        <button
                          className="cursor-pointer text-sm text-gray-600 dark:text-gray-200"
                          onClick={() => duplicatePackage(pkg)}
                          title={t('common.duplicate')}
                        >
                          <span className="remix-icon" data-icon="riFileCopyLine" />
                        </button>
                        <button
                          className="ml-2 cursor-pointer text-sm text-gray-600 dark:text-gray-200"
                          onClick={() => exportPackage(pkg)}
                          title={t('common.export')}
                        >
                          <span className="remix-icon" data-icon="riDownloadLine" />
                        </button>
                      </>
                    )}
                    <button
                      className="ml-2 cursor-pointer text-sm text-red-500 dark:text-red-400"
                      onClick={() => deletePackage(pkg)}
                      title={t('common.delete')}
                    >
                      <span className="remix-icon" data-icon="riDeleteBin7Line" />
                    </button>
                  </div>
                </div>
                <Link
                  to={`/packages/${pkg.id}`}
                  className="mt-4 flex-1 cursor-pointer"
                >
                  <p className="text-overflow font-semibold">{pkg.name}</p>
                  <p className="line-clamp leading-tight text-gray-600 dark:text-gray-200">
                    {pkg.description}
                  </p>
                </Link>
                <div className="mt-2 flex items-center text-gray-600 dark:text-gray-200">
                  <p>{dayjs(pkg.createdAt).fromNow()}</p>
                  {pkg.author && (
                    <p className="text-overflow ml-4 flex-1 text-right">
                      By {pkg.author}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add package modal */}
      {addShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">{t('packages.add')}</h3>
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t('common.name')}
              className="input w-full"
              autoFocus
              onKeyUp={(e) => e.key === 'Enter' && addPackage()}
            />
            <textarea
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder={t('common.description')}
              className="input mt-2 w-full"
              style={{ minHeight: 200 }}
            />
            <div className="mt-6 flex space-x-4">
              <button className="btn flex-1" onClick={clearNewPackage}>
                {t('common.cancel')}
              </button>
              <button
                className="btn variant-accent flex-1"
                onClick={addPackage}
              >
                {t('packages.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
