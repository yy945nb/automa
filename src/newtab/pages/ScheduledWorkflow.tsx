import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import cloneDeep from 'lodash.clonedeep';
import browser from 'webextension-polyfill';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { readableCron } from '@/lib/cronstrue';
import { findTriggerBlock, objectHasKey } from '@/utils/helper';
import {
  registerWorkflowTrigger,
  workflowTriggersMap,
} from '@/utils/workflowTrigger';
import SharedWorkflowTriggers from '@/components/newtab/shared/SharedWorkflowTriggers';

interface TriggerRow {
  id: number;
  name: string;
  nextRun: string;
  schedule: string;
  scheduleDetail: string;
  active: boolean;
  type: string;
  workflowId: string;
  triggerId: string | null;
  path?: string | null;
  location?: string;
}

const scheduledTypes = ['interval', 'date', 'specific-day', 'cron-job'];

export default function ScheduledWorkflow() {
  const { t } = useTranslation();
  const userStore = useUserStore();
  const workflowStore = useWorkflowStore();
  const teamWorkflowStore = useTeamWorkflowStore();
  const hostedWorkflowStore = useHostedWorkflowStore();

  const [query, setQuery] = useState('');
  const [triggers, setTriggers] = useState<TriggerRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<{
    id: string;
    name: string;
    query: string;
    triggers: any[];
  }>({ id: '', name: '', query: '', triggers: [] });

  const triggersDataRef = useRef<Record<number, any>>({});
  const rowIdRef = useRef(0);

  const tableHeaders = useMemo(() => [
    { value: 'name', filterable: true, text: t('common.name'), attrs: { className: 'w-3/12', style: { minWidth: 200 } } },
    { value: 'schedule', text: t('scheduledWorkflow.schedule.title'), attrs: { className: 'w-4/12', style: { minWidth: 200 } } },
    { value: 'nextRun', text: t('scheduledWorkflow.nextRun') },
    { value: 'location', text: 'Location' },
    { value: 'active', align: 'center', text: t('scheduledWorkflow.active') },
    { value: 'action', text: '', sortable: false, align: 'right' },
  ], [t]);

  const filteredTriggers = useMemo(() =>
    triggers.filter(({ name }) =>
      name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    ), [triggers, query]);

  function scheduleText(data: any) {
    const text = { schedule: '', scheduleDetail: '' };
    switch (data.type) {
      case 'specific-day': {
        let rows = '';
        const days = data.days.map((item: any) => {
          const day = t(`workflow.blocks.trigger.days.${item.id}`);
          rows += `<tr><td>${day}</td><td>${item.times.join(', ')}</td></tr>`;
          return day;
        });
        text.scheduleDetail = `<table><tbody>${rows}</tbody></table>`;
        text.schedule = data.days.length >= 6
          ? t('scheduledWorkflow.schedule.types.everyDay')
          : t('scheduledWorkflow.schedule.types.general', { time: days.join(', ') });
        break;
      }
      case 'interval':
        text.schedule = t('scheduledWorkflow.schedule.types.interval', { time: data.interval });
        break;
      case 'date':
        text.schedule = dayjs(`${data.date}, ${data.time}`).format('DD MMM YYYY, hh:mm:ss A');
        break;
      case 'cron-job':
        text.schedule = readableCron(data.expression);
        break;
    }
    return text;
  }

  async function getTriggersData(triggerData: any, { id, name }: { id: string; name: string }): Promise<TriggerRow[]> {
    try {
      const alarms = await browser.alarms.getAll();
      const getTrigger = async (trigger: any): Promise<TriggerRow | null> => {
        if (!trigger || !scheduledTypes.includes(trigger.type)) return null;
        rowIdRef.current += 1;
        const rowId = rowIdRef.current;
        const triggerObj: TriggerRow = {
          name, id: rowId, nextRun: '-', schedule: '', scheduleDetail: '',
          active: false, type: trigger.type, workflowId: id, triggerId: trigger.id || null,
        };
        const alarm = alarms.find((a: any) =>
          trigger.id ? a.name.includes(trigger.id) : a.name.includes(id)
        );
        if (alarm) {
          triggerObj.active = true;
          triggerObj.nextRun = dayjs(alarm.scheduledTime).format('DD MMM YYYY, hh:mm:ss A');
        }
        triggersDataRef.current[rowId] = { ...trigger, workflow: { id, name } };
        Object.assign(triggerObj, scheduleText(trigger));
        return triggerObj;
      };

      if (triggerData?.triggers) {
        const result = await Promise.all(
          triggerData.triggers.map((trig: any) => {
            const d = { ...trig, ...trig.data };
            delete d.data;
            return getTrigger(d);
          })
        );
        return result.filter(Boolean) as TriggerRow[];
      }
      const result = await getTrigger(triggerData);
      return result ? [result] : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async function refreshSchedule(id: number) {
    const triggerData = triggersDataRef.current[id] ? cloneDeep(triggersDataRef.current[id]) : null;
    if (!triggerData) return;
    const handler = (workflowTriggersMap as any)[triggerData.type];
    if (!handler) return;
    if (triggerData.id) {
      triggerData.workflow.id = `trigger:${triggerData.workflow.id}:${triggerData.id}`;
    }
    await registerWorkflowTrigger(triggerData.workflow.id, { data: triggerData });
    const [triggerObj] = await getTriggersData(triggerData, triggerData.workflow);
    if (!triggerObj) return;
    setTriggers(prev => prev.map(t => t.id === id ? { ...t, ...triggerObj } : t));
  }

  async function getWorkflowTrigger(workflow: any, { location, path }: { location: string; path: string | null }) {
    if (workflow.isDisabled) return;
    let { trigger } = workflow;
    if (!trigger) {
      const drawflow = typeof workflow.drawflow === 'string' ? JSON.parse(workflow.drawflow) : workflow.drawflow;
      trigger = findTriggerBlock(drawflow)?.data;
    }
    const triggersList = await getTriggersData(trigger, workflow);
    if (triggersList.length > 0) {
      const withMeta = triggersList.map(td => ({ ...td, path, location }));
      setTriggers(prev => [...prev, ...withMeta]);
    }
  }

  async function iterateWorkflows({ workflows, path, location }: { workflows: any[]; path: (w: any) => string | null; location: string }) {
    await Promise.allSettled(workflows.map(w => getWorkflowTrigger(w, { path: path(w), location })));
  }

  function onSelectedWorkflow(item: any) {
    if (!item.drawflow?.nodes) return;
    const triggerBlock = findTriggerBlock(item.drawflow);
    if (!triggerBlock) return;
    let { triggersList } = triggerBlock.data;
    if (!triggersList) {
      triggersList = [{ data: { ...triggerBlock.data }, type: triggerBlock.data.type, id: nanoid(5) }];
    }
    setSelectedWorkflow({ id: item.id, name: item.name, query: '', triggers: [...triggersList] });
  }

  function clearAddWorkflowSchedule() {
    setShowModal(false);
    setSelectedWorkflow({ id: '', name: '', query: '', triggers: [] });
  }

  async function updateWorkflowTrigger() {
    try {
      const { triggers: wfTriggers, id, name } = selectedWorkflow;
      const workflowData = workflowStore.getById(id);
      if (!workflowData?.drawflow?.nodes) return;
      const triggerBlockIndex = workflowData.drawflow.nodes.findIndex((n: any) => n.label === 'trigger');
      if (triggerBlockIndex === -1) return;
      const copyNodes = [...workflowData.drawflow.nodes];
      copyNodes[triggerBlockIndex] = { ...copyNodes[triggerBlockIndex], data: { ...copyNodes[triggerBlockIndex].data, triggers: cloneDeep(wfTriggers) } };
      await workflowStore.update({ id, data: { trigger: { triggers: wfTriggers }, drawflow: { ...workflowData.drawflow, nodes: copyNodes } } });

      setTriggers(prev => prev.filter(t => {
        if (selectedWorkflow.id === t.workflowId) {
          delete triggersDataRef.current[t.id];
          return false;
        }
        return true;
      }));

      await registerWorkflowTrigger(id, { data: { triggers: wfTriggers } });
      const newTriggers = await getTriggersData({ triggers: wfTriggers }, { id, name });
      if (newTriggers.length > 0) {
        const withMeta = newTriggers.map(td => ({ ...td, location: 'Local', path: `/workflows/${id}` }));
        setTriggers(prev => [...prev, ...withMeta]);
      }
      clearAddWorkflowSchedule();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await iterateWorkflows({
          location: 'Local',
          path: ({ id }: any) => `/workflows/${id}`,
          workflows: workflowStore.getWorkflows,
        });
        await iterateWorkflows({
          location: 'Hosted',
          workflows: hostedWorkflowStore.toArray,
          path: ({ id }: any) => `/workflows/${id}/hosted`,
        });
        const teamsObj: Record<string, string> = {};
        if (userStore.user?.teams) {
          userStore.user.teams.forEach((team: any) => { teamsObj[team.id] = team.name; });
        }
        Object.keys(teamWorkflowStore?.workflows || {}).forEach(teamId => {
          const teamName = teamsObj[teamId] ?? '(unknown)';
          iterateWorkflows({
            location: `Team: ${teamName.slice(0, 24)}`,
            workflows: teamWorkflowStore.getByTeam(teamId),
            path: ({ id }: any) => teamsObj[teamId] ? `/teams/${teamId}/workflows/${id}` : null,
          });
        });
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <div className="container pt-8 pb-4">
      <h1 className="mb-12 text-2xl font-semibold capitalize">
        {t('scheduledWorkflow.title', { count: 2 })}
      </h1>
      <div className="flex items-center">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('common.search')}
          className="ui-input"
        />
        <div className="grow" />
        <button className="ui-button ml-4" style={{ minWidth: 210 }} onClick={() => setShowModal(true)}>
          Schedule workflow
        </button>
      </div>
      <div className="scroll w-full overflow-x-auto">
        <table className="mt-8 w-full">
          <thead>
            <tr>
              {tableHeaders.map(h => (
                <th key={h.value} className={h.attrs?.className} style={h.attrs?.style}>
                  {h.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTriggers.map(item => (
              <tr key={item.id}>
                <td>
                  {item.path ? (
                    <Link to={item.path} className="block h-full w-full" style={{ minHeight: 20 }}>
                      {item.name}
                    </Link>
                  ) : (
                    <span>{item.name}</span>
                  )}
                </td>
                <td title={item.scheduleDetail}>{item.schedule}</td>
                <td>{item.nextRun}</td>
                <td>{item.location}</td>
                <td className="text-center">
                  {item.active && <span className="inline-block text-green-500 dark:text-green-400">✓</span>}
                </td>
                <td className="text-right">
                  <button onClick={() => refreshSchedule(item.id)} className="hoverable rounded-lg p-2" title={t('scheduledWorkflow.refresh')}>
                    ↻
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => clearAddWorkflowSchedule()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{selectedWorkflow.name || 'Schedule workflow'}</span>
              {selectedWorkflow.id && (
                <button className="ui-button" onClick={updateWorkflowTrigger}>
                  {t('common.save')}
                </button>
              )}
            </div>
            {!selectedWorkflow.id ? (
              <div className="mt-2">
                <input
                  value={selectedWorkflow.query}
                  onChange={e => setSelectedWorkflow(prev => ({ ...prev, query: e.target.value }))}
                  className="ui-input w-full"
                  placeholder="Search workflow"
                  autoComplete="off"
                />
                <ul className="mt-2 max-h-60 overflow-auto">
                  {(workflowStore.getWorkflows as any[])
                    .filter((w: any) => w.name.toLowerCase().includes(selectedWorkflow.query.toLowerCase()))
                    .map((w: any) => (
                      <li key={w.id} className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => onSelectedWorkflow(w)}>
                        {w.name}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <>
                <p className="font-semibold">{selectedWorkflow.name}</p>
                <SharedWorkflowTriggers
                  triggers={selectedWorkflow.triggers}
                  onTriggersChange={(val: any) => setSelectedWorkflow(prev => ({ ...prev, triggers: val }))}
                  exclude={['context-menu', 'on-startup', 'visit-web', 'keyboard-shortcut']}
                  className="mt-4"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
