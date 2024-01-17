document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const numDays = document.getElementById('numDays').value;
    const indices = document.getElementById('indices').value.split(',').map(index => index.trim());
    const apiKey = document.getElementById('apiKey').value;
    const applicationId = document.getElementById('applicationId').value;

    console.log("Form submitted with the following details:");
    console.log("Number of Days:", numDays);
    console.log("Indices:", indices);
    console.log("API Key:", apiKey);
    console.log("Application ID:", applicationId);

    // Make API requests and generate graph
    getAndDisplayData(numDays, indices, apiKey, applicationId);
});

async function getAndDisplayData(numDays, indices, apiKey, applicationId) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - numDays * 24 * 60 * 60 * 1000);

    console.log("Preparing to fetch data from Algolia...");
    console.log("Start Date:", startDate.toISOString());
    console.log("End Date:", endDate.toISOString());

    let indexData = {};

    for (let index of indices) {
        const apiUrl = buildApiUrl(index, startDate, endDate);
        const headers = {
            "X-Algolia-API-Key": apiKey,
            "X-Algolia-Application-Id": applicationId
        };

        console.log(`Fetching data for index ${index} using URL: ${apiUrl}`);

        try {
            const response = await fetch(apiUrl, { headers: headers });
            const data = await response.json();

            console.log(`Response from Algolia for index '${index}':`, data);

            // Check for invalid credentials
            if (data.status === 401 && data.message === 'Invalid credentials') {
                alert("The API key seems invalid, please check your Algolia App ID or Application ID");
                return;
            }

            if (data.total_search_requests) {
                let dates = data.total_search_requests.map(record => new Date(record.t).toISOString().split('T')[0]);
                let counts = data.total_search_requests.map(record => record.v);
                indexData[index] = { dates, counts };
            } else {
                console.log(`Error: 'total_search_requests' key not found in response for index: ${index}.`);
            }
        } catch (error) {
            console.error(`Error fetching data for index ${index}:`, error);
        }
    }

    if (Object.keys(indexData).length > 0) {
        console.log("Rendering chart with the following data:", indexData);
        renderChart(indexData);
    } else {
        console.log("No data to plot.");
    }
}

function buildApiUrl(index, startDate, endDate) {
    const baseUrl = "https://usage.algolia.com/1/usage/total_search_requests";
    const formattedStartDate = startDate.toISOString().split('.')[0] + "Z";
    const formattedEndDate = endDate.toISOString().split('.')[0] + "Z";

    return `${baseUrl}/${index}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&granularity=daily`;
}

let myChart = null; // Global variable to keep track of the chart

function renderChart(data) {
    const ctx = document.getElementById('chartCanvas').getContext('2d');

    // If a chart already exists, destroy it before creating a new one
    if (myChart) {
        myChart.destroy();
    }

    const datasets = Object.keys(data).map(key => {
        return {
            label: key,
            data: data[key].counts,
            // Additional dataset styling here
        };
    });

    console.log("Initializing chart...");

    // Create a new chart and assign it to the global variable
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data[Object.keys(data)[0]].dates,
            datasets: datasets
        },
        options: {
            // Chart.js options here
        }
    });

    // Display the download button when the chart is rendered
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.style.display = 'block';
    }

    console.log("Chart rendered successfully.");
}


function downloadChart() {
    if (myChart) {
        const labels = myChart.data.datasets.map(dataset => dataset.label).join('-');
        const a = document.createElement('a');
        a.href = myChart.toBase64Image();
        a.download = `${labels}-chart.png`;
        a.click();
    } else {
        alert('No chart available to download');
    }
}

