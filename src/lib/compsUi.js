// Vue components are registered here via require.context (*.vue files).
// React components live alongside them as *.tsx files and are imported directly
// where needed — they do not go through this Vue registration pipeline.
import VTooltip from '../directives/VTooltip';
import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';

const uiComponents = require.context('../components/ui', false, /\.vue$/);
const transitionComponents = require.context(
  '../components/transitions',
  false,
  /\.vue$/
);

function componentsExtractor(app, components) {
  components.keys().forEach((key) => {
    const componentName = key.replace(/(.\/)|\.vue$/g, '');
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
