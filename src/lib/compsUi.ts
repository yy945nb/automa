// React components are imported directly where needed.
// This file registers directives for any remaining Vue parts of the app.
import VTooltip from '../directives/VTooltip';
import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';

const uiComponents = require.context('../components/ui', false, /\.tsx$/);
const transitionComponents = require.context(
  '../components/transitions',
  false,
  /\.tsx$/
);

function componentsExtractor(app, components) {
  components.keys().forEach((key) => {
    const componentName = key.replace(/(.\/)|\.tsx$/g, '');
    const component = components(key)?.default ?? {};

    app.component(componentName, component);
  });
}

export default function (app) {
  app.directive('tooltip', VTooltip);
  app.directive('autofocus', VAutofocus);
  app.directive('close-popover', VClosePopover);

  componentsExtractor(app, uiComponents);
  componentsExtractor(app, transitionComponents);
}
