import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// TODO: import browser from 'webextension-polyfill'
// TODO: import dayjs from '@/lib/dayjs'

interface ModalType {
  title: string;
  body: string;
  button: string;
  url: string;
}

type ModalTypeKey = 'testimonial' | 'survey';

const modalTypes: Record<ModalTypeKey, ModalType> = {
  testimonial: {
    title: 'Hi There 👋',
    body: 'Thank you for using Automa, and if you have a great experience. Would you like to give us a testimonial?',
    button: 'Give Testimonial',
    url: 'https://testimonial.to/automa',
  },
  survey: {
    title: "How do you think we're doing?",
    body: 'To help us make Automa as best it can be, we need a few minutes of your time to get your feedback.',
    button: 'Take Survey',
    url: 'https://extension.automa.site/survey',
  },
};

const AppSurvey: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(true);
  const [type, setType] = useState<ModalTypeKey>('survey');

  const activeModal = useMemo(() => modalTypes[type], [type]);

  const closeModal = useCallback(() => {
    let value: string | boolean;
    if (type === 'survey') {
      value = new Date().toString();
    } else {
      value = true;
    }
    setShow(false);
    localStorage.setItem(`has-${type}`, String(value));
  }, [type]);

  useEffect(() => {
    const checkModal = async () => {
      try {
        // TODO: replace with actual browser.storage.local.get('isFirstTime')
        // const { isFirstTime } = await browser.storage.local.get('isFirstTime');
        // if (isFirstTime) { setShow(false); return; }
        const isFirstTime = false; // stub

        if (isFirstTime) {
          setShow(false);
          return;
        }

        const survey = localStorage.getItem('has-survey');
        if (!survey) return;

        // TODO: replace with dayjs().diff(survey, 'day')
        const daysDiff = Math.floor(
          (Date.now() - new Date(survey).getTime()) / (1000 * 60 * 60 * 24)
        );
        const showTestimonial =
          daysDiff >= 2 && !localStorage.getItem('has-testimonial');

        setShow(showTestimonial);
        if (showTestimonial) setType('testimonial');
      } catch (error) {
        console.error(error);
      }
    };

    checkModal();
  }, []);

  if (!show) return null;

  return (
    <div className="group fixed bottom-8 right-8 w-72 rounded-lg border-2 bg-white p-4 shadow-2xl dark:bg-gray-800">
      <button
        className="absolute -right-2 -top-2 scale-0 rounded-full bg-white shadow-md transition group-hover:scale-100"
        onClick={closeModal}
      >
        <i className="ri-close-line text-gray-600"></i>
      </button>
      <h2 className="text-lg font-semibold">{activeModal.title}</h2>
      <p className="mt-1 text-gray-700 dark:text-gray-100">{activeModal.body}</p>
      <div className="mt-4 space-y-2">
        <a
          href={activeModal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-accent px-4 py-2 text-center text-white"
        >
          {activeModal.button}
        </a>
      </div>
    </div>
  );
};

export default AppSurvey;
