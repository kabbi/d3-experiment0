import * as d3 from 'd3';

import renderCharts from './ui/renderCharts';
import renderSideBar from './ui/renderSideBar';
import { SelectionColors } from './constants';
import { getDataSet, getAllBanks } from './utils/data';

getDataSet().then(dataSet => {
  const app = {
    dataSet,
    state: {
      selection: [],
      lastColorIndex: 0,
      hoveredColumn: null,
      hoveredRow: null,
    },
    handlers: {
      onToggleSelection: (bank, flag) => {
        const { selection } = app.state;
        const alreadySelected = selection.find(item => (
          item.value === bank
        ));
        const select = flag != null ? flag : !alreadySelected;
        app.state.selection = select ? (
          selection.concat({
            color: SelectionColors(app.state.lastColorIndex++),
            index: getAllBanks().indexOf(bank),
            value: bank,
          })
        ) : (
          app.state.selection = selection.filter(s => (
            s.value !== bank
          ))
        );
        app.handlers.onSelectionChanged();
      },
      onSelectionChanged: () => {
        renderSideBar(app);
        renderCharts(app);
      },
      onHoverChanged: () => {
        renderCharts(app);
      },
    }
  };

  renderCharts(app);
  renderSideBar(app);

  d3.select(document.body).classed('loading', false);
});
