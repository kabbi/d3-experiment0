import * as d3 from 'd3';

import renderExtrema from './renderExtrema';
import renderSelection from './renderSelection';
import getDimensionsAndScales from './getDimensionsAndScales';

import { DataColumns, RatingsColumns, RatingColumnOffset, getRatingColumns }
  from '../utils/data';

const ColumnCount = 4;
const DefaultCellOpacity = 0.1;
const HoverSelectionColor = '#858585';
const MainTitle = 'Изменение оценки банковских услуг';

const makeChart = (appState, columnIndex, index, nodes) => {
  const selector = d3.select(nodes[index]);
  const { small, margin, width, height, x, y } =
    getDimensionsAndScales(selector, appState);

  const svg = selector.append('svg:g')
    .attr('transform', `translate(${margin},${margin})`);

  svg.append('text')
    .classed('chart-label', true)
    .text(small ? getRatingColumns()[columnIndex - 1] : MainTitle)
    .attr('x', 0)
    .attr('y', 0);

  if (!small) {
    const xAxis = d3.axisBottom(x)
      .tickSize(0);
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
      .tickValues(d3.range(1, 6))
      .tickFormat(d3.format('d'))
      .tickSize(0);
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
          .attr('width', x.bandwidth())
          .attr('height', height)
          .attr('x', 0)
          .attr('y', 0);
        columns
          .on('mouseenter', (data, index, nodes) => {
            appState.hoveredColumn = {
              year: data[DataColumns.Year],
              rowIndex: index,
              columnIndex,
            };
            svg.select('.data-area-extremas')
              .call(renderExtrema, appState);
          })
          .on('mouseleave', (_, index, nodes) => {
            appState.hoveredColumn = null;
            svg.select('.data-area-extremas')
              .call(renderExtrema, appState);
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
        .on('mouseenter', (data, cellIndex, cellNodes) => {
          appState.hoveredRow = {
            year: d3.select(cellNodes[cellIndex].parentNode).datum()[DataColumns.Year],
            value: data[columnIndex + RatingColumnOffset] || 0,
          };
          svg.select('.data-area-extremas')
            .call(renderExtrema, appState);
          const hovered = {
            value: data[RatingsColumns.Bank],
            color: HoverSelectionColor
          };
          renderSelection(appState, hovered, columnIndex, index, nodes);
        })
        .on('mouseleave', data => {
          appState.hoveredRow = null;
          svg.select('.data-area-extremas')
            .call(renderExtrema, appState);
          renderSelection(appState, null, columnIndex, index, nodes)
        });

  svg.append('g')
    .classed('data-area-lines', true);
  svg.append('g')
    .classed('data-area-extremas', true)
    .call(renderExtrema, appState);

  const labelMargin = small ? 0 : 15;
  svg.append('text')
    .classed('data-area-label', true)
    .attr('x', labelMargin)
    .attr('y', height - labelMargin);
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
    .classed('__main', data => !data)
    .classed('__small', data => !!data)
    .each(makeChart.bind(null, appState))
  .merge(charts)
    .each(renderSelection.bind(null, appState, null));
};
