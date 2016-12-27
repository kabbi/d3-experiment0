import * as d3 from 'd3';
import identity from 'lodash/identity';
import keyBy from 'lodash/keyBy';

import Switchery from '../vendor/switchery';
import '../vendor/switchery.css';

import renderSparkLine from './renderSparkLine';
import { getAllBanks } from '../utils/data';

const colors = d3.scaleOrdinal(d3.schemeCategory10);
let switcheryInstance = null;
let lastColorIndex = 0;

const appendCheckbox = (selector, appState, onUpdateSelection) => {
  const id = (_, index) => `c${index}`;
  selector.append('input')
    .attr('id', id)
    .attr('type', 'checkbox')
    .on('change', (data, index) => {
      const selected = {
        index: index,
        value: data,
        color: colors(lastColorIndex++)
      };
      onUpdateSelection(d3.event.target.checked ? (
        [...appState.selection, selected]
      ) : (
        appState.selection.filter(s => s.index !== index)
      ));
    });
  selector.append('label')
    .attr('for', id)
    .text(identity);
};

const appendSparkLine = (selector, appState) => {
  selector.append('svg')
    .attr('width', 0)
    .attr('height', 0)
    .call(renderSparkLine, appState);
};

export default (appState, onUpdateSelection) => {
  const banks = getAllBanks();
  const selectedByIndex = keyBy(appState.selection, 'index');
  const items = d3.select('.legend-items')
    .selectAll('.legend-item')
    .data(banks);

  const hasSelection = appState.selection.length !== 0;

  d3.select('.legend-switch.__all')
    .classed('__disabled', hasSelection)
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
    .call(appendCheckbox, appState, onUpdateSelection)
    .call(appendSparkLine, appState);

  if (!switcheryInstance) {
    d3.select('.legend-column__toggle')
      .on('change', () => {
        onUpdateSelection([]);
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
