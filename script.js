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

    let indexData = {};
    let invalidApiKey = false;

    for (let index of indices) {
        if (invalidApiKey) {
            console.log("Invalid API key detected, stopping further requests.");
            break;
        }

        // Fetch total_search_requests
        let totalSearchData = await fetchData(
            buildApiUrl(index, startDate, endDate, "total_search_requests"), 
            apiKey, 
            applicationId, 
            index, 
            "total_search_requests"
        );
        if (totalSearchData === null) {
            invalidApiKey = true;
            continue;
        }

        console.log(`Total search requests for index ${index}:`, totalSearchData.counts);

        // Fetch querysuggestions_total_search_requests
        let querySuggestionData = await fetchData(
            buildApiUrl(index, startDate, endDate, "querysuggestions_total_search_requests"), 
            apiKey, 
            applicationId, 
            index, 
            "querysuggestions_total_search_requests"
        );
        if (querySuggestionData === null) {
            invalidApiKey = true;
            continue;
        }

        console.log(`Query suggestions for index ${index}:`, querySuggestionData.counts);

        // Subtract query suggestions counts from total search requests counts
        let adjustedCounts = totalSearchData.counts.map((count, i) => {
            let adjustedCount = count - (querySuggestionData.counts[i] || 0);
            console.log(`Index ${index} - Date: ${totalSearchData.dates[i]}, Total: ${count}, Suggestions: ${querySuggestionData.counts[i] || 0}, Adjusted: ${adjustedCount}`);
            return adjustedCount;
        });

        indexData[index] = { dates: totalSearchData.dates, counts: adjustedCounts };
    }

    if (Object.keys(indexData).length > 0) {
        renderChart(indexData);
    } else {
        console.log("No data to plot.");
    }
}

async function fetchData(apiUrl, apiKey, applicationId, index, metric) {
    const headers = {
        "X-Algolia-API-Key": apiKey,
        "X-Algolia-Application-Id": applicationId
    };

    try {
        const response = await fetch(apiUrl, { headers: headers });
        const data = await response.json();

        console.log(`Full API response for index '${index}':`, data);

        if (data.status === 401 && data.message === 'Invalid credentials') {
            alert("The API key seems invalid, please check your Algolia App ID or Application ID");
            return null; 
        }

        if (data[metric]) {
            let dates = data[metric].map(record => new Date(record.t).toISOString().split('T')[0]);
            let counts = data[metric].map(record => record.v);
            return { dates, counts };
        } else {
            console.log(`Error: '${metric}' key not found in response for index: ${index}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching data for index ${index}:`, error);
        return null;
    }
}

function buildApiUrl(index, startDate, endDate, metric = "total_search_requests") {
    const baseUrl = "https://usage.algolia.com/1/usage";
    const formattedStartDate = startDate.toISOString().split('.')[0] + "Z";
    const formattedEndDate = endDate.toISOString().split('.')[0] + "Z";

    return `${baseUrl}/${metric}/${index}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&granularity=daily`;
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

