import VAutofocus from '@/directives/VAutofocus';
import UiCard from '@/components/ui/UiCard.tsx';
import UiInput from '@/components/ui/UiInput.tsx';
import UiList from '@/components/ui/UiList.tsx';
import UiListItem from '@/components/ui/UiListItem.tsx';
import UiButton from '@/components/ui/UiButton.tsx';
import UiSelect from '@/components/ui/UiSelect.tsx';
import UiSpinner from '@/components/ui/UiSpinner.tsx';
import UiTextarea from '@/components/ui/UiTextarea.tsx';
import UiPopover from '@/components/ui/UiPopover.tsx';
import TransitionExpand from '@/components/transitions/TransitionExpand.tsx';

export default function (app) {
  app.component('UiCard', UiCard);
  app.component('UiList', UiList);
  app.component('UiInput', UiInput);
  app.component('UiButton', UiButton);
  app.component('UiSelect', UiSelect);
  app.component('UiPopover', UiPopover);
  app.component('UiSpinner', UiSpinner);
  app.component('UiTextarea', UiTextarea);
  app.component('UiListItem', UiListItem);
  app.component('TransitionExpand', TransitionExpand);

  app.directive('autofocus', VAutofocus);
}
