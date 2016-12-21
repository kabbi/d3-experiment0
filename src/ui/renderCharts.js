import * as d3 from 'd3';

import renderTooltip from './renderTooltip';
import { DataColumns, RatingsColumns, RatingColumnOffset, getRatingColumns }
  from '../utils/data';

const ColumnCount = 4;
const DefaultCellOpacity = 0.1;
const HoverSelectionColor = '#726EA9';
const LineGenerator = d3.line()
  .defined(p => p && !isNaN(p[0]) && !isNaN(p[1]));

const getDimensionsAndScales = (selector, appState) => {
  const svg = selector.node();
  const columnIndex = selector.datum();
  const small = columnIndex !== 0;

  const margin = small ? 10 : 20;
  const yMargin = small ? 10 : 30;

  const svgRect = svg.getBoundingClientRect();
  const width = svgRect.width - 2 * margin;
  const height = svgRect.height - 2 * margin;

  const x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1)
    .domain(appState.dataSet.map(row => row[DataColumns.Year]));
  const y = d3.scaleLinear()
    .rangeRound([yMargin, height - yMargin])
    .domain([5, 1]);

  return {
    svg,
    columnIndex,
    small,
    margin,
    yMargin,
    width,
    height,
    x, y
  };
};

const renderSelection = (appState, hovered, columnIndex, index, nodes) => {
  const selector = d3.select(nodes[index]);
  const { x, y } = getDimensionsAndScales(selector, appState);
  const svg = selector.select('g');
  const data = !hovered ? appState.selection : [
    ...appState.selection, hovered
  ];

  const hasSelection = data.length !== 0;
  svg.select('.data-area')
    .style('opacity', hasSelection ? 0.5 : 1);

  const lines = svg.select('.data-area-lines')
    .selectAll('.data-line')
    .data(data);

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

const makeChart = (appState, columnIndex, index, nodes) => {
  const selector = d3.select(nodes[index]);
  const { small, margin, width, height, x, y } =
    getDimensionsAndScales(selector, appState);

  const svg = selector.append('svg:g')
    .attr('transform', `translate(${margin},${margin})`);

  if (small) {
    svg.append('text')
      .classed('chart-label', true)
      .text(getRatingColumns()[columnIndex - 1])
      .attr('x', 0)
      .attr('y', 0);
  }

  if (!small) {
    const xAxis = d3.axisBottom(x);
    svg.append('g')
      .classed('x axis', true)
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);
  }

  let yAxisPosition = small ? null : 'Left';
  if (small && (index - 1) % ColumnCount === 0) {
    yAxisPosition = 'Left';
  }
  if (small && index % ColumnCount === 0) {
    yAxisPosition = 'Right';
  }
  if (yAxisPosition) {
    const yAxis = d3[`axis${yAxisPosition}`](y)
      .ticks(5);
    if (small) {
      yAxis.tickSize(0);
    }
    const axis = svg.append('g')
      .classed('y axis', true)
      .call(yAxis);
    if (small && yAxisPosition === 'Right') {
      axis.attr('transform', `translate(${width},0)`);
    }
  }

  svg.append('g')
    .classed('data-area', true)
    .selectAll('g')
    .data(appState.dataSet)
    .enter().append('g')
      .classed('data-column', true)
      .call(seletor => {
        const columns = selector.selectAll('.data-column');
        columns.append('rect')
          .classed('highlight', true)
          .style('opacity', 0)
          .attr('width', x.bandwidth())
          .attr('height', height)
          .attr('x', 0)
          .attr('y', 0);
        columns
          .on('mousemove', (column, index, nodes) => {
            d3.select(nodes[index])
              .select('rect.highlight')
              .style('opacity', 0.1);
            renderTooltip(appState, null, column, columnIndex);
          })
          .on('mouseleave', (_, index, nodes) => {
            d3.select(nodes[index])
              .select('rect.highlight')
              .style('opacity', 0.0);
            renderTooltip(appState);
          });
      })
      .attr('transform', data => (
        `translate(${x(data[DataColumns.Year])},0)`
      ))
      .selectAll('rect.data-cell')
      .data(data => (
        data[DataColumns.Ratings].slice(1)
      ))
      .enter().append('rect')
        .classed('data-cell', true)
        .style('opacity', DefaultCellOpacity)
        .attr('width', x.bandwidth())
        .attr('height', small ? 1.5 : 2)
        .attr('y', data => (
          y(data[columnIndex + RatingColumnOffset]) || 0
        ))
        .classed('hide', data => (
          !isFinite(data[columnIndex + RatingColumnOffset])
        ))
        .on('mousemove', (data, cellIndex, cellNodes) => {
          const hovered = {
            value: data[RatingsColumns.Bank],
            color: HoverSelectionColor
          };
          const column = d3.select(cellNodes[cellIndex].parentNode).datum();
          renderSelection(appState, hovered, columnIndex, index, nodes);
          // renderTooltip(appState, hovered, column, columnIndex);
        })
        .on('mouseleave', data => {
          renderSelection(appState, null, columnIndex, index, nodes)
        });

  svg.append('g')
    .classed('data-area-lines', true);
};

export default appState => {
  const columnCount = getRatingColumns().length + 1;
  const charts = d3.select('.chart-column')
    .selectAll('svg.chart')
    .data(d3.range(columnCount));

  charts.enter()
    .append('svg')
    .attr('width', '0')
    .attr('height', '0')
    .classed('chart', true)
    .each(makeChart.bind(null, appState))
  .merge(charts)
    .each(renderSelection.bind(null, appState, null));
};
