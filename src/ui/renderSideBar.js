import * as d3 from 'd3';
import identity from 'lodash/identity';
import keyBy from 'lodash/keyBy';

import Switchery from '../vendor/switchery';
import '../vendor/switchery.css';

import { getAllBanks } from '../utils/data';

const colors = d3.scaleOrdinal(d3.schemeCategory10);
let switcheryInstance = null;

export default (appState, onUpdateSelection) => {
  const banks = getAllBanks();
  const selectedByIndex = keyBy(appState.selection, 'index');
  const items = d3.select('.legend-items')
    .selectAll('div')
    .data(banks);

  items.style('color', (_, index) => {
    const selected = selectedByIndex[index];
    return selected ? selected.color : 'black';
  });
  items.select('input').property('checked', (_, index) => (
    !!selectedByIndex[index]
  ));
  if (switcheryInstance) {
    const hasSelection = appState.selection.length !== 0;
    switcheryInstance[hasSelection ? 'enable' : 'disable']();
    if (switcheryInstance.isChecked() !== hasSelection) {
      switcheryInstance.setPosition(true);
    }
  }

  items.enter()
    .append('div')
    .append('label')
      .text(identity)
      .append('input')
      .attr('type', 'checkbox')
      .on('change', (data, index) => {
        const selected = {
          index: index,
          value: data,
          color: colors(appState.selection.length)
        };
        onUpdateSelection(d3.event.target.checked ? (
          [...appState.selection, selected]
        ) : (
          appState.selection.filter(s => s.index !== index)
        ));
      })
      .lower();

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
  }
};
