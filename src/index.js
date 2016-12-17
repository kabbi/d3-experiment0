import * as d3 from 'd3';
import { identity } from 'lodash';

import Switchery from './vendor/switchery';
import './vendor/switchery.css';

import { makeChart, updateChart } from './chart';
import { RatingsColumns, getAllBanks, getDataSet, getRatingColumns }
  from './utils/data';

const colors = d3.scaleOrdinal(d3.schemeCategory20b);

const renderDataSet = (dataSet, selection) => {
  d3.select('.chart-column')
    .selectAll('.main-chart')
    .data(['main'])
    .each((_, index, rows) => {
      updateChart({
        selector: d3.select(rows[index]),
        columnIndex: index + 1,
        selection
      });
    })
    .enter()
      .append('div')
      .attr('class', 'main-chart')
      .lower()
      .each((_, index, rows) => {
        makeChart({
          selector: d3.select(rows[index]),
          columnIndex: RatingsColumns.Total,
          dataSet
        });
      });
  d3.select('.secondary-charts')
    .selectAll('.secondary-chart')
    .data(getRatingColumns())
    .each((_, index, rows) => {
      updateChart({
        selector: d3.select(rows[index]),
        columnIndex: index + 1,
        selection
      });
    })
    .enter()
      .append('div')
      .attr('class', 'secondary-chart')
      .append('small')
      .text(identity)
      .each((_, index, rows) => {
        makeChart({
          selector: d3.select(rows[index]),
          columnIndex: index + 1,
          small: true,
          dataSet,
          index
        });
      });
};

getDataSet().then(dataSet => {
  const selection = [];
  renderDataSet(dataSet, selection);

  const toggleAll = d3.select('.legend-column__toggle')
    .on('click', () => {
      selection.splice(0);
      renderDataSet(dataSet, selection);
    })
    .call(selection => {
      new Switchery(selection.node(), {
        size: 'small',
        color: 'black'
      });
    });

  const banks = getAllBanks();
  d3.select('.legend-items')
    .selectAll('div')
    .data(banks)
    .enter()
      .append('div')
      .append('label')
        .text(identity)
        .style('color', (_, index) => (
          colors(index / banks.length)
        ))
        .append('input')
        .attr('type', 'checkbox')
        .on('change', (data, index) => {
          const selected = {
            color: colors(index / banks.length),
            value: data,
            index
          };
          if (d3.event.target.checked) {
            selection.push(selected);
          } else {
            const pos = selection.findIndex(s => s.index === index);
            selection.splice(pos, 1);
          }
          toggleAll.property('checked', selection.length !== 0);
          toggleAll.property('disabled', selection.length === 0);
          toggleAll.dispatch('change');
          renderDataSet(dataSet, selection);
        })
        .lower();
})
