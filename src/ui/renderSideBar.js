import * as d3 from 'd3';
import identity from 'lodash/identity';
import keyBy from 'lodash/keyBy';

import Switchery from '../vendor/switchery';
import '../vendor/switchery.css';

import renderSparkLine from './renderSparkLine';
import { getAllBanks } from '../utils/data';

let switcheryInstance = null;

const appendCheckbox = (selector, app) => {
  const id = (_, index) => `c${index}`;
  selector.append('input')
    .attr('id', id)
    .attr('type', 'checkbox')
    .on('change', (data, index) => {
      app.handlers.onToggleSelection(data, d3.event.target.checked);
    });
  selector.append('label')
    .attr('for', id)
    .text(identity);
};

const appendSparkLine = (selector, app) => {
  selector.append('svg')
    .attr('width', 0)
    .attr('height', 0)
    .call(renderSparkLine, app);
};

export default app => {
  const banks = getAllBanks();
  const selectedByIndex = keyBy(app.state.selection, 'index');
  const items = d3.select('.legend-items')
    .selectAll('.legend-item')
    .data(banks);

  const hasSelection = app.state.selection.length !== 0;

  d3.select('.legend-switch.__all')
    .text(`Всех банков (${banks.length})`);
  d3.select('.legend-switch.__custom')
    .classed('__disabled', !hasSelection);

  items.style('color', (_, index) => {
    const selected = selectedByIndex[index];
    return selected ? selected.color : 'black';
  });
  items.select('input').property('checked', (_, index) => (
    !!selectedByIndex[index]
  ));
  if (switcheryInstance) {
    switcheryInstance[hasSelection ? 'enable' : 'disable']();
    if (switcheryInstance.isChecked() !== hasSelection) {
      switcheryInstance.setPosition(true);
    }
  }

  items.enter()
    .append('div')
    .classed('legend-item', true)
    .call(appendCheckbox, app)
    .call(appendSparkLine, app);

  if (!switcheryInstance) {
    d3.select('.legend-column__toggle')
      .on('change', () => {
        app.state.selection = [];
        app.handlers.onSelectionChanged();
      })
      .call(selection => {
        switcheryInstance = new Switchery(selection.node(), {
          size: 'small',
          color: 'black'
        });
      });

    const header = d3.select('.legend-column_header');
    d3.select('.legend-items')
      .on('scroll', () => {
        const { scrollTop } = d3.event.target;
        header.classed('__flying', scrollTop > 0);
      });
  }
};
