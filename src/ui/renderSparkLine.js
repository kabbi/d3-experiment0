import * as d3 from 'd3';

import { DataColumns, RatingsColumns } from '../utils/data';

const LineGenerator = d3.line()
  .defined(p => p && !isNaN(p[0]) && !isNaN(p[1]));

export default (selector, appState) => {
  if (selector.size() === 0) {
    return;
  }

  const svgRect = selector.node().getBoundingClientRect();
  const { width, height } = svgRect;

  const x = d3.scaleBand()
    .rangeRound([0, width])
    .domain(appState.dataSet.map(row => (
      row[DataColumns.Year]
    )));
  const y = d3.scaleLinear()
    .rangeRound([0, height])
    .domain([5, 1]);

  selector.append('path')
    .style('opacity', 0.5)
    .attr('stroke', 'currentColor')
    .attr('fill', 'none')
    .attr('d', data => {
      const points = [];
      for (const [ year, ratingRows ] of appState.dataSet) {
        const ratingsRow = ratingRows.find(row => (
          row[RatingsColumns.Bank] === data
        ));
        if (!ratingsRow) {
          points.push(null);
          continue;
        }
        const xValue = x(year);
        const yValue = y(ratingsRow[RatingsColumns.Total]);
        points.push([xValue, yValue]);
        points.push([xValue + x.bandwidth(), yValue]);
      }
      return LineGenerator(points);
    });
};
