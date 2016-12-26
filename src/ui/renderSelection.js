import * as d3 from 'd3';

import getDimensionsAndScales from './getDimensionsAndScales';
import { RatingsColumns } from '../utils/data';

const LineGenerator = d3.line()
  .defined(p => p && !isNaN(p[0]) && !isNaN(p[1]));

export default (appState, hovered, columnIndex, index, nodes) => {
  const selector = d3.select(nodes[index]);
  const { x, y } = getDimensionsAndScales(selector, appState);
  const svg = selector.select('g');
  const data = !hovered ? appState.selection : [
    ...appState.selection, hovered
  ];

  const hasSelection = data.length !== 0;
  svg.select('.data-area')
    .classed('__dim', hasSelection)
    .style('opacity', hasSelection ? 0.4 : 1);

  const label = svg.select('.data-area-label');
  label.text(hovered ? hovered.value : '');

  const lines = svg.select('.data-area-lines')
    .selectAll('.data-line')
    .data(data, data => data.value);

  lines.enter()
    .append('path')
    .classed('data-line', true)
    .attr('stroke', data => data.color)
    .attr('fill', 'none')
    .attr('d', data => {
      const points = [];
      for (const [ year, ratingRows ] of appState.dataSet) {
        const ratingsRow = ratingRows.find(row => (
          row[RatingsColumns.Bank] === data.value
        ));
        if (!ratingsRow) {
          points.push(null);
          continue;
        }
        const xValue = x(year);
        const yValue = y(ratingsRow[columnIndex + 1]);
        points.push([xValue, yValue]);
        points.push([xValue + x.bandwidth(), yValue]);
      }
      return LineGenerator(points);
    });

  lines.exit()
    .remove();
};
