import * as d3 from 'd3';
import flatten from 'lodash/flatten';

import getDimensionsAndScales from './getDimensionsAndScales';
import { RatingsColumns, RatingColumnOffset } from '../utils/data';

const greater = (a, b) => a > b;
const less = (a, b) => a < b;

const getExtrema = (app, columnIndex, compare, filterByYear, filterByBank) => {
  let value = null;
  for (const [ year, ratingRows ] of app.dataSet) {
    if (filterByYear && year !== filterByYear) {
      continue;
    }
    for (const row of ratingRows.slice(1)) {
      const current = row[columnIndex + RatingColumnOffset];
      if (isNaN(current)) {
        continue;
      }
      if (filterByBank && filterByBank !== row[RatingsColumns.Bank]) {
        continue;
      }
      if (!value || compare(current, value[1])) {
        value = [ year, current ];
      }
    }
  }
  return value;
};

export default (selector, app) => {
  const svg = d3.select(selector.node().parentNode.parentNode);
  const { x, y, columnIndex } = getDimensionsAndScales(svg, app);

  const selection = selector.selectAll('text')
    .data([{
      id: 'global-max',
      value: getExtrema(app, columnIndex, greater),
      baseline: 'after'
    }, {
      id: 'global-min',
      value: getExtrema(app, columnIndex, less),
      baseline: 'before'
    }, ...(!app.state.hoveredColumn ? [] : [{
      id: 'hovered-column-max',
      value: getExtrema(app, columnIndex, greater, app.state.hoveredColumn.year),
      baseline: 'after'
    }, {
      id: 'hovered-column-min',
      value: getExtrema(app, columnIndex, less, app.state.hoveredColumn.year),
      baseline: 'before'
    }]), ...(!app.state.hoveredRow ? [] : [{
      id: 'hovered-row',
      value: [app.state.hoveredRow.year, app.state.hoveredRow.value],
      baseline: 'after'
    }]), ...flatten(
      app.state.selection.map(selected => [{
        id: `selection-${selected.index}-max`,
        value: getExtrema(app, columnIndex, greater, null, selected.value),
        color: selected.color,
        baseline: 'after'
      }, {
        id: `selection-${selected.index}-min`,
        value: getExtrema(app, columnIndex, less, null, selected.value),
        color: selected.color,
        baseline: 'before'
      }])
    )], data => (
      data.id
    ));

  selection.enter()
    .append('text')
    .text(({ value: [ _, current ]}) => current)
    .style('fill', ({ color }) => color || 'black')
    .attr('x', ({ value: [ year ] }) => x(year))
    .attr('y', ({ baseline, value: [ _, current ]}) => (
      y(current) + (baseline === 'before' ? 2 : 0)
    ))
    .attr('dominant-baseline', ({ baseline }) => (
      `text-${baseline}-edge`
    ));

  selection.exit()
    .remove();
};
