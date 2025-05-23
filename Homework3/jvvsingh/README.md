# Data Science Salaries Dashboard

## Intoduction
This project presents an interactive dashboard for the exploration and analysis of data science job salaries. The dashboard utilizes D3.js to visualize salary data by job title, year, experience level, and other attributes. It demonstrates advanced visualization and interaction techniques to support data-driven insights.
----------------------------------------------------------------------------------------------------------------------------------------
## Table of Contents
1. [Overview](#overview)
2. [Dashboard Operation Instructions](#dashboard-operation-instructions)
3. [Features](#features)
4. [References](#references)
------------------------------------------------------------------------------------------------------------------------------------------
## Overview
The Data Science Salaries Dashboard is designed for users to interactively explore trends and patterns in data science compensation. The dashboard integrates multiple coordinated views, each supporting both overview and focus+context paradigms. The visualizations are fully interactive, allowing users to filter and highlight data across all charts.
-----------------------------------------------------------------------------------------------------------------------------------------
## Dashboard Operation Instructions
The dashboard provides the following interactive features:
### 1. Bar Chart (Average Salary by Job Title)
- **Click a bar to select a job title**: This selection is highlighted across all charts.
- The line/area chart will update to display only the salary trend for the selected job title.
### 2. Scatter Plot (Salary vs. Experience Level)
- **Drag to brush**: Click and drag your mouse to select a group of data points.
- Selected points are highlighted, and corresponding job titles and records are highlighted in the bar chart and parallel coordinates.
### 3. Year Selector and Line/Area Chart
- **Click a year button at the top** or **click a dot in the line chart** to filter all charts to that year.
- The dashboard updates to reflect only the data for the selected year.
### 4. Stream Graph (Job Titles Over Time)
- **Click a colored area** to select a job title. All other charts will update to focus on that job title.
### 5. Parallel Coordinates Chart
- **Click a line** to select a record’s job title. All charts will update to focus on that job title.
### 6. Tooltips and Animation
- **Hover over any chart element** to display a tooltip with detailed information.
- All charts animate smoothly when data or selection changes.

------------------------------------------------------------------------------------------------------------------------------------------
## Features
- **Multiple Coordinated Views:** Bar chart, scatter plot, parallel coordinates, line/area chart, and stream graph, all linked and interactive.
- **Advanced Visualization:** Parallel coordinates and stream graph provide high-dimensional and temporal overviews.
- **Interaction Techniques:** Implements selection, brushing, and animated transitions.
- **Focus+Context:** Overview and detail views are coordinated for effective data exploration.
- **Accessibility:** Tooltips and legends provide clear context for all users.
-----------------------------------------------------------------------------------------------------------------------------------------
## References

1. [D3.js Documentation](https://d3js.org/)
2. [Kaggle: Data Science Job Salaries Dataset](https://www.kaggle.com/datasets/ruchi798/data-science-job-salaries)
3. [Programming Historian: Creating a Dashboard for Interactive Data Visualization](https://programminghistorian.org/en/lessons/interactive-data-visualization-dashboard)
4. [The IET: A Guide to Technical Report Writing](https://www.theiet.org/media/5182/technical-report-writing.pdf)[5]
5. [Technical Writing Standards | USU Engineering Writing Center](https://engineering.usu.edu/students/ewc/writing-resources/technical-writing-standards)[1]
6. [adoc Studio: Technical Writing Guide](https://www.adoc-studio.app/blog/technical-writing-guide)[2]
7. [Draft.dev: Technical Writing Style Guides](https://draft.dev/learn/technical-writer-style-guides)[3]
8. [Ohio State: Writing Common Technical Documents](https://ohiostate.pressbooks.pub/feptechcomm/chapter/5-technical-documents/)[8]
9. [Stanford CS: Tips for Writing Technical Papers](https://cs.stanford.edu/people/widom/paper-writing.html)[6]
10. [D3 Graph Gallery: Interactive and Animated Charts](https://d3-graph-gallery.com/)
--------------------------------------------------------------------------------------------------------------------------------------