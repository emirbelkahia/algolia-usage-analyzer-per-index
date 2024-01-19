# algolia-usage-analyzer-per-index

Overview
--------
This repository contains a web-based tool for visualizing data retrieved from the Algolia API. The application allows users to fetch and display search request data from Algolia indices over a specified period. It includes functionalities for data processing, chart rendering, and error handling.

Features
--------
- Form Submission: Users can input parameters: application ID and API Keys for credentials, Number of days and name of indices to perform the analysis
- Data Fetching: The application makes API requests to the Algolia Usage API to fetch search request data per index.
- Chart Rendering: Displays the fetched data as a bar chart using Chart.js.
- Error Handling: Includes checks for invalid API keys and issues with data fetching.
- Chart Downloading: Users can download the generated chart as a PNG image.

Installation
-------------
Recommended utilisation is to go here and use directly: https://emirbelkahia.github.io/algolia-usage-analyzer-per-index/

Usage
-----
Enter the required parameters in the form:
- Algolia API Key (requires an Algolia paid account with a quota)
- Algolia Application ID
- Number of days for data retrieval
- Comma-separated list of indices

Submit the form to fetch and visualize the data.
Optionally, download the generated chart.

Technical Details
------------------
The main JavaScript file (script.js) handles the logic for form submission, API requests, data processing, and chart rendering.
Data for each index is fetched separately, including total search requests and query suggestions.
Query suggestion counts are subtracted from total search requests for a more accurate count.
The application is built to handle multiple indices and aggregate their data on a single chart.

Dependencies
------------
Chart.js for chart rendering.
A valid Algolia account with API Key and Application ID.

License
-------
This project is open source and available under the MIT License.
