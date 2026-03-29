import VAutofocus from '@/directives/VAutofocus';
import UiTab from '@/components/ui/UiTab.tsx';
import UiTabs from '@/components/ui/UiTabs.tsx';
import UiInput from '@/components/ui/UiInput.tsx';
import UiButton from '@/components/ui/UiButton.tsx';
import UiSelect from '@/components/ui/UiSelect.tsx';
import UiExpand from '@/components/ui/UiExpand.tsx';
import UiSwitch from '@/components/ui/UiSwitch.tsx';
import UiTextarea from '@/components/ui/UiTextarea.tsx';
import UiCheckbox from '@/components/ui/UiCheckbox.tsx';
import UiTabPanel from '@/components/ui/UiTabPanel.tsx';
import UiTabPanels from '@/components/ui/UiTabPanels.tsx';
import TransitionExpand from '@/components/transitions/TransitionExpand.tsx';

export default function (app) {
  app.component('UiTab', UiTab);
  app.component('UiTabs', UiTabs);
  app.component('UiInput', UiInput);
  app.component('UiButton', UiButton);
  app.component('UiSelect', UiSelect);
  app.component('UiSwitch', UiSwitch);
  app.component('UiExpand', UiExpand);
  app.component('UiTextarea', UiTextarea);
  app.component('UiCheckbox', UiCheckbox);
  app.component('UiTabPanel', UiTabPanel);
  app.component('UiTabPanels', UiTabPanels);
  app.component('TransitionExpand', TransitionExpand);

  app.directive('autofocus', VAutofocus);
}
