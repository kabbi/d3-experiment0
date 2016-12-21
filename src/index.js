import * as d3 from 'd3';

import renderCharts from './ui/renderCharts';
import renderSideBar from './ui/renderSideBar';
import { getDataSet } from './utils/data';

getDataSet().then(dataSet => {
  const appState = {
    dataSet,
    selection: []
  };
  renderCharts(appState);
  renderSideBar(appState, newSelection => {
    appState.selection = newSelection;
    renderSideBar(appState);
    renderCharts(appState);
  });

  d3.select(document.body).classed('loading', false);
});
